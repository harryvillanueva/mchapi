import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import { IUser } from '@/api/models/IUser'
import UserBusiness from '@/api/business/UserBusiness'
import UtilInstance from '@/api/helpers/Util'

const handler = nc(
      {
            onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
                  console.error(err.stack);
                  res.status(500).end("Something broke!");
            },
            onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
              res.status(404).end("Page is not found");
            }
      })
      .use(MiddlewareInstance.verifyToken)
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: UserBusiness = new UserBusiness(idUserLogin, filterState, false)
            
            let dataDB: IUser | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  let _d = dataDB as IErrorResponse
                  if (_d.code === 403) res.status(403).json(_d)
                  else res.status(404).json(_d)
                  return
            }
            res.json({ data: dataDB })
      })
      .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: UserBusiness = new UserBusiness(idUserLogin, filterState, true)
            let estado = (req.body.estado && (req.body.estado == 1 || req.body.estado == 0)) ? req.body.estado : -2

            let data: IUser = {
                  username: req.body.username || '',
                  email: req.body.email || '',
                  nombre: req.body.nombre || '',
                  apellido: req.body.apellido || '',
                  estado: estado,
                  idrol: req.body.idrol || '',
                  idusuario: idUserLogin
            }
            let dataDB: IUser | IErrorResponse = await el.updateDN(BigInt(parseInt(req.query.id as string)), data)
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  // 409: conflicto con los datos enviados
                  // Ademas del 409 verificar el estatus del error y enviar que no esta autorizado
                  res.status(409).json(dataDB as IErrorResponse)
                  return
            }
            res.json({ data: dataDB })
      })
      // .delete(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
      //       const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
      //       let el: UserBusiness = new UserBusiness(idUserLogin, filterState, false)
            
      //       let dataDB: IUser | IErrorResponse = await el.delete(BigInt(parseInt(req.query.id as string)))
      //       if ( !dataDB ) {
      //             res.status(404).json({ error: 'data not found' })
      //             return
      //       }
      //       if ( ({ ...dataDB } as IErrorResponse).error ) {
      //             // No conflicto, verificar el status del error y ver si el usuario puede eliminar el registro
      //             res.status(409).json(dataDB as IErrorResponse)
      //             return
      //       }
      //       res.json({ data: dataDB })
      // })

export default handler