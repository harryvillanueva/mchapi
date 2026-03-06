import type { NextApiRequest, NextApiResponse } from 'next'
import { NextHandler } from 'next-connect'
import UtilInstance from './Util'
import { IErrorResponse } from '../modelsextra/IErrorResponse'

class Middleware {

      constructor() {}

        verifyToken(req: NextApiRequest, res: NextApiResponse<IErrorResponse>, next: NextHandler): void {
                  // Añadir cabeceras CORS para permitir llamadas desde el cliente (preflight y headers personalizados)
                  try {
                        res.setHeader('Access-Control-Allow-Origin', '*')
                        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
                        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token, idlogin, x-idlogin, filterStatus, x-filterStatus')
                        if ((req.method || '').toUpperCase() === 'OPTIONS') {
                              res.status(200).end()
                              return
                        }
                  } catch (e) {
                        // ignore header errors
                  }

                  // Permitir acceso a cualquier usuario. Si llega un token en headers
                  // (Authorization: Bearer ... o token) intentamos obtener datos reales
                  // del token; si falla, dejamos valores por defecto para desarrollo.
                  req.headers.filterStatus = '1';

                  try {
                        const authHeader = req.headers.authorization || req.headers.token as string | undefined
                        let token: string | undefined = undefined

                        if (authHeader) {
                              if ((authHeader as string).toLowerCase().startsWith('bearer ')) {
                                    token = (authHeader as string).substring(7).replace(/['"]+/g, '')
                              } else {
                                    token = (authHeader as string).replace(/['"]+/g, '')
                              }
                        }

                        if (token) {
                              const { status, iduser, username } = UtilInstance.checkToken(token)
                              if (status && iduser) {
                                    req.headers.iduser = iduser!.toString()
                                    req.headers.username = username!.toString()
                                    console.debug('verifyToken: token valid, iduser=', req.headers.iduser)
                                    next()
                                    return
                              }

                              // Si la verificación formal falla, intentar decodificar el JWT SIN verificar la firma
                              // (inseguro, pero permite aceptar tokens emitidos por otro servicio).
                              try {
                                    const parts = token.split('.')
                                    if (parts.length >= 2) {
                                          const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
                                          const maybeId = payload.iduser || payload.id || payload.sub || payload.iat && payload.iat // no-op
                                          if (maybeId) {
                                                const resolvedId = payload.iduser || payload.id || payload.sub
                                                const resolvedName = payload.username || payload.user || payload.email || payload.name
                                                if (resolvedId) req.headers.iduser = String(resolvedId)
                                                if (resolvedName) req.headers.username = String(resolvedName)
                                                console.warn('verifyToken: token signature invalid — using decoded payload to set iduser=', req.headers.iduser)
                                                next()
                                                return
                                          }
                                    }
                              } catch (e) {
                                    console.warn('verifyToken: failed to decode token payload', e)
                              }
                        }

                        // Si no hay token válido, permitir que el cliente envíe directamente el idlogin
                        try {
                              const idloginHeader = req.headers.idlogin || req.headers['x-idlogin']
                              if (idloginHeader) {
                                    req.headers.iduser = String(idloginHeader)
                                    console.debug('verifyToken: using idlogin header, iduser=', req.headers.iduser)
                                    next()
                                    return
                              }
                        } catch (e) {
                              // ignore
                        }
                  } catch (err) {
                        console.error('verifyToken parse error', err)
                  }

                  // Fallback: mantener comportamiento anterior (desarrollo)
                  req.headers.iduser = '1';
                  req.headers.username = 'test';
                  next();
      }

        validateToken(req: NextApiRequest, res: NextApiResponse<IErrorResponse>, next: NextHandler): void {            
                  let token:string | undefined
                  if (req.cookies && req.cookies.session_token) {
                        token = (req.cookies.session_token as string).replace(/['"]+/g, '')
                  } else if (req.headers.authorization && (req.headers.authorization as string).toLowerCase().startsWith('bearer ')) {
                        token = (req.headers.authorization as string).substring(7).trim()
                  } else {
                        if (!req.headers.token) {
                              res.status(400).json({ error: 'Send token on headers' })
                              return
                        }
                        token = (req.headers.token as string).replace(/['"]+/g, '')
                  }

                  req.headers.token = token!
                  const { status, error, iduser, username, roles, exp } = UtilInstance.checkToken(token!)
                  if (!status) {
                          res.status(401).json({ error: `${error}` })
                          return
                  }
                  if (exp) req.headers.exp = exp!.toString();
                  if (iduser) req.headers.iduser = iduser!.toString()
                  if (username) req.headers.username = username!.toString()
                  next()
        }
}

const MiddlewareInstance = new Middleware()
Object.freeze(MiddlewareInstance)

export default MiddlewareInstance