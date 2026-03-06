import type { NextApiRequest } from 'next'
import crypto from 'crypto'
import { ApiType, CodeRoleType, DataRequestType, ErrorFieldType, StatusDataType, jornadaType } from '../types/GlobalTypes'
import Constants from './Constants'
import { IAuthUser } from '../modelsextra/IAuthUser'
import jwt, { verify } from "jsonwebtoken"
import { serialize } from "cookie"
import { IError } from '../modelsextra/IError'
import ApiAccess from '../helpers/Api.json'
import ValidationsInstance from './Validations'

import { uuid } from 'uuidv4'

import CryptoJS from "crypto-js"

class Util {
      constructor() { }

      /**
       * Obtiene la fecha actual en formato 'YEAR-MOTH-DAY HH-MM-SS' [2023-01-27 09:50:00] para POSTGRESSQL
       * @returns {fecha: 2023-01-27, hora: 09:50:00, timestamp: 454345987}
       */
      getDateCurrent(): { fecha: string, hora: string, timestamp: number } {
            let [dateCurrent, timeCurrent] = (this.getDateCurrentString().trim()).split(',').map(el => el.trim())
            let [dayCurrent, monthCurrent, yearCurrent] = dateCurrent.split('/')
            const date_string = `${yearCurrent}-${monthCurrent}-${dayCurrent} ${timeCurrent}`
            const timestamp = new Date(date_string).getTime() / 1000
            return { fecha: `${yearCurrent}-${monthCurrent}-${dayCurrent}`, hora: `${timeCurrent}`, timestamp }
      }

      /**
       * Obtiene la fecha con su respectivo timestamp
       * @param fecha string [YEAR-MOTH-DAY]
       * @param hora string [HH-MM-SS]
       * @returns {fecha: 2023-01-27, hora: 09:50:00, timestamp: 454345987}
       */
      getDateCustom(fecha: string, hora: string): { fecha: string, hora: string, timestamp: number } {
            return { fecha, hora, timestamp: (new Date(`${fecha} ${hora}`).getTime() / 1000) }
      }

      actionAddAndDismissDays(fecha: string, days: number): { fecha: string } {
            let _currentFecha = new Date()
            let _fecha = (ValidationsInstance.checkFormatDateSQL(fecha)) ? new Date(fecha) : _currentFecha
            let _fechaResult = new Date(_fecha.getTime() + (86400000 * days))

            let [dateCurrent] = (this.getDateCurrentString(_fechaResult).trim()).split(',').map(el => el.trim())
            let [dayCurrent, monthCurrent, yearCurrent] = dateCurrent.split('/')

            return { fecha: `${yearCurrent}-${monthCurrent}-${dayCurrent}` }
      }

      getDateToken(unixTimestamp: number): string {
            return (unixTimestamp) ? UtilInstance.getDateCurrentString(new Date(Math.trunc(unixTimestamp))) : '';
      }

      //   getDateCurrentString: ( dCurrent = new Date() ) => {
      //       try {
      //           return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Madrid' }).format(dCurrent)
      //       } catch(err){
      //           return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Madrid' }).format(new Date())
      //       }
      //   },

      /**
       * Obtiene la fecha actual en formato: DAY/MONTH/YEAR HH:MM:SS. [27/01/2023 17:50:33]
       * @param dCurrent 
       * @returns 
       */
      getDateCurrentString(dCurrent = new Date()): string {
            try {
                  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Madrid' }).format(dCurrent)
            } catch (err) {
                  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Madrid' }).format(new Date())
            }
      }

      /**
       * Obtiene la fecha actual en formato 'YEAR-MOTH-DAY HH-MM-SS' [2023-01-27 09:50:00] para POSTGRESSQL
       * @returns [2023-01-27 09:50:00]
       */
      getDateCurrentForSQL(): string {
            let [dateCurrent, timeCurrent] = (this.getDateCurrentString().trim()).split(',').map(el => el.trim())
            let [dayCurrent, monthCurrent, yearCurrent] = dateCurrent.split('/')
            return `${yearCurrent}-${monthCurrent}-${dayCurrent} ${timeCurrent}`
      }

      /**
       * Obtiene la fecha actual en formato 'YEAR-MOTH-DAY HH-MM-SS' [2023-01-27 09:50:00] y su timestamp en NUMBER para POSTGRESSQL
       * @returns 
       */
      getDateTimestampCurrentForSQL(): { date_string: string, timestamp: number } {
            let [dateCurrent, timeCurrent] = (this.getDateCurrentString().trim()).split(',').map(el => el.trim())
            let [dayCurrent, monthCurrent, yearCurrent] = dateCurrent.split('/')
            const date_string = `${yearCurrent}-${monthCurrent}-${dayCurrent} ${timeCurrent}`
            const timestamp = new Date(date_string).getTime() / 1000
            return { date_string, timestamp }
      }

      /**
       * Data no cambia para tipo de datos timestamp DB
       * @param val 
       * @returns 
       */
      noParse(val: any): any {
            return val
      }

      /**
       * Cambiar formato de BigInt<string> a Integer
       * @param val 
       * @returns 
       */
      parseInteger(val: any): number {
            return parseInt(val, 10)
      }

      /**
       * 
       * @param data 
       * @returns 
       */
      encryptDataHash256(data: string): string {
            let hash = crypto.createHash('sha256');
            let originalValue = hash.update(data, 'utf-8');

            return originalValue.digest('hex');
      }

      /**
       * Indica si el usuario tiene rol, ademas indicia si tiene 1 o varios
       * retorna arreglo 2 dimensiones:
       * Posicion 1 -> indica si el usuario tiene role
       * Posicion 2 -> Indica cuantos roles tiene: 0[Ninguno], 1[Unico rol], 2[Varios]
       * @param role 
       * @returns 
       */
      checkRoleUser(role: CodeRoleType): { existrole: boolean, nrorole: number } {
            if (Constants.code_rol_default === role) return { existrole: true, nrorole: 2 }
            else if (Constants.getRoles().includes(role)) return { existrole: true, nrorole: 1 }

            return { existrole: false, nrorole: 0 }
      }

      checkAuthorization(value: CodeRoleType, roles: Array<CodeRoleType>): boolean {
            return roles.includes(value)
      }

      /**
       * old [08/09/2023]
       * @param user 
       * @returns 
       */
      createTokenOLD(user: IAuthUser): string {
            let secret: string = process.env.SECRET ? process.env.SECRET : Constants.token_key_secret_default
            let roles = user.roles?.map(el => el.id).join('|')
            let token = jwt.sign({
                  roles: roles,
                  iduser: user.id,
                  username: user.username,
                  exp: Math.floor(Date.now() / 1000) + Constants.token_life_time
            }, secret)
            return token
      }

      /**
       * 
       * @param user 
       * @returns 
       */
      createToken(user: IAuthUser): { token: string, exp: number } {
            let secret: string = process.env.SECRET ? process.env.SECRET : Constants.token_key_secret_default
            let roles = user.roles?.map(el => el.id).join('|')
            let exp = Math.floor(Date.now() / 1000) + Constants.token_life_time
            // let exp = Math.floor(Date.now() / 1000) + 20
            let token = jwt.sign({
                  roles: roles,
                  iduser: user.id,
                  username: user.username,
                  exp: exp
            }, secret)
            return { token, exp }
      }

      /**
       * 
       * @param token 
       * @returns 
       */
      checkToken(token: string): { status: boolean, error?: string, iduser: BigInt, roles: string, username: string, exp: number } {
            const secret = process.env.SECRET ? process.env.SECRET : Constants.token_key_secret_default
            let dataToken: any
            try {
                  dataToken = verify(token, secret)
                  // console.log('dataToken: ', dataToken)
            } catch (err: any) {
                  return { status: false, iduser: BigInt(0), roles: '', error: 'Error, token expirada o invalida', username: '', exp: 0 }
            }

            return { status: true, iduser: dataToken.iduser, roles: dataToken.roles, username: (dataToken.username || ''), exp: dataToken.exp }
      }

      /**
       * 
       * @param roles 
       * @param url 
       * @param method 
       * @returns 
       */
      checkAuthorizationAPI(roles: string, url: string, method: string): { isOk: boolean, filterstatusdb: StatusDataType } {
            try {
                  let dataApi: Array<ApiType> = []
                  let lroles = roles.toString().split('|')
                  for (let i = 0; i < lroles.length; i++) dataApi = [...dataApi, ...UtilInstance.getPathApi(lroles[i] as CodeRoleType)]
                  url = url.split('/').map(el => (isNaN(parseInt(el)) ? el : '[id]')).join('/')
                  url = url.split('/').map((el, index) => {
                        if (index < 3) return el
                        return (Constants.getRoles().includes(el as CodeRoleType)) ? '[id]' : el
                  }).join('/')
                  url = url.split('?')[0] ? url.split('?')[0] : url // permite pasar filtros busqueda por GET https://data/dd?name=44&ddd=34 [GET]
                  let _d = dataApi.filter(el => el.path === url && el.method === method)
                  if (_d.length !== 0) return { isOk: true, filterstatusdb: _d[0].filterstatus as StatusDataType }
            } catch (err) { }
            return { isOk: false, filterstatusdb: Constants.code_status_no_valid as StatusDataType }
      }

      /**
       * 
       * @param role 
       * @returns 
       */
      getPathApi(role: CodeRoleType): any {
            switch (role) {
                  case Constants.code_rol_admin:
                        return ApiAccess.admin || []
                  case Constants.code_rol_propietario:
                        return ApiAccess.propietario || []
                  case Constants.code_rol_rrhh:
                        return ApiAccess.rrhh || []
                  case Constants.code_rol_crm:
                        return ApiAccess.crm || []
                  case Constants.code_rol_superadmin:
                        return ApiAccess.superadmin || []
                  case Constants.code_rol_dn:
                        return ApiAccess.dn || []
                  case Constants.code_rol_atic:
                        return ApiAccess.atic || []
                  case Constants.code_rol_oficina:
                        return ApiAccess.oficina || []
                  case Constants.code_rol_dn_master:
                        return ApiAccess.dnmaster || []
                  case Constants.code_rol_ceo:
                        return ApiAccess.ceo || []
                  case Constants.code_rol_colaborador:
                        return ApiAccess.colaborador || []
                  case Constants.code_rol_rmg:
                        return ApiAccess.rmg || []
                  case Constants.code_rol_rrhh_master:
                        return ApiAccess.rrhhmaster || []
                  case Constants.code_rol_limpieza:
                        return ApiAccess.limpieza || []
                  case Constants.code_rol_da:
                        return ApiAccess.da || []
                  case Constants.code_rol_ade:
                        return ApiAccess.ade || []
                  case Constants.code_rol_mantenimiento:
                        return ApiAccess.mantenimiento || []
                  case Constants.code_rol_crmmaster:
                        return ApiAccess.crmmaster || []
                  case Constants.code_rol_aticmaster:
                        return ApiAccess.aticmaster || []
                  case Constants.code_rol_rmgmaster:
                        return ApiAccess.rmgmaster || []
                  case Constants.code_rol_damaster:
                        return ApiAccess.damaster || []
                  case Constants.code_rol_ademaster:
                        return ApiAccess.ademaster || []
                  default:
                        return []
            }
      }

      /**
       * 
       * @param token 
       * @returns 
       */
      getSerialize(token: string): string {
            return serialize('session_token', token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production', //SSL en caso de de estar en produccion
                  sameSite: 'strict', //Solo peticiones desde el mismo dominio 'strict'
                  maxAge: 1000 * Constants.token_life_time * 30,
                  path: '/'
            })
      }

      /**
       * Catch errors of MYSQL
       * @param code 
       * @param detail 
       * @returns 
       */
      getErrorSql(code: string, detail: string, msg?: string): IError | undefined {
            code = code || ''
            detail = detail || ''
            if (detail.trim().length === 0 || code.trim().length === 0) return undefined
            const indexI = detail.indexOf('(')
            const indexII = detail.indexOf(')')
            // if ( indexI === -1 || indexII === -1 ) return undefined -----> SE COMENTO PARA FORZAR UN ERROR EN INVENTARIO STOCK 
            const field = detail.substring(indexI + 1, indexII)



            let error: IError = { type: Constants.error_type_sql as ErrorFieldType, code, field } as IError



            switch (code.trim()) {
                  case Constants.error_field_duplicate_sql:
                        return { ...error, msg: 'Ya existe el registro' }
                  case Constants.error_field_no_existe_key_sql:
                        return { ...error, msg: 'No existe el registro en db' }
                  case Constants.error_field_not_null_sql:
                        return { ...error, msg: 'El campo no permite null' }
                  case Constants.error_field_stock_no_disponible_sql:   /// ERROR DEFINIDO EN CONSTANTS 
                        return { ...error, msg: 'Sin stock' }
                  case Constants.error_field_cantidad_no_disponible_sql:
                        return { ...error, msg: 'Sin cantidad en el inventario' }
                  default:
                        return { ...error, field: field ? field : 'desconocido', msg: msg ? msg : 'desconocido' }
            }
      }

      /**
       * 
       * @param req 
       * @returns 
       */
      getDataRequest(req: NextApiRequest): DataRequestType {
            const idUserLogin = BigInt((req.headers.iduser) ? parseInt(req.headers.iduser as string) : Constants.code_public_id_superadmin)
            const filterState = ((req.headers.filterStatus) ? req.headers.filterStatus : Constants.code_public_status_superadmin) as StatusDataType
            const usernameLogin = (req.headers.username) ? (req.headers.username as string).trim() : Constants.code_public_username_superadmin
            return { idUserLogin, filterState, usernameLogin }
      }

      /**
       * https://coolkit-technologies.github.io/eWeLink-API/#/en/DeveloperGuideV2
       * @param appsecret 
       * @param message 
       * @returns 
       */
      createSign(appsecret: string, message: string): string {
            let _theSign = crypto.createHmac('sha256', appsecret).update(message, 'utf8').digest('base64')
            console.log(appsecret, message)
            console.log(_theSign)
            return _theSign
      }

      /**
       * Retorna un número aleatorio entre un rango de valores
       * @param min 
       * @param max 
       * @returns 
       */
      getAleatorio(min: number, max: number): number {
            let _min = Math.ceil(min)
            let _max = Math.floor(max)
            return Math.floor(Math.random() * (max - min) + min)
      }

      getUUID(): string {
            return uuid()
      }

      decryptMsg(texto: string): string {
            const _keyEncript = "iot$@2024rbjX)"
            return (CryptoJS.AES.decrypt(texto || '', _keyEncript).toString(CryptoJS.enc.Utf8)) || ''
      }

      tokenFicharValido(textoDesencriptado: string): boolean {
            const _msg = "iotmch2024atic$@"
            return textoDesencriptado.includes(_msg)
      }

}

const UtilInstance = new Util()
Object.freeze(UtilInstance)

export default UtilInstance