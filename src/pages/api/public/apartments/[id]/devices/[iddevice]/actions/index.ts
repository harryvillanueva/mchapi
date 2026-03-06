import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '../../../../../../../../api/helpers/Util'
import { ILogsApartment } from '@/api/models/ILogsApartment'
import ActionsLogApartmentBusiness from '@/api/business/ActionsLogApartmentBusiness'
import { IActionsLogApartment } from '@/api/models/IActionsLogApartment'
import { ICode } from '@/api/models/ICode'
import { IKey } from '@/api/models/IKey'
import Constants from '@/api/helpers/Constants'
import { ResultType, TypeExecLogType } from '@/api/types/GlobalTypes'
import LockPushInstance from '../../../../../../../../api/helpers/LockPush'

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
      // Añadir cabeceras CORS para permitir peticiones desde el cliente
      .use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE,PATCH,POST,PUT')
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Token, x-user-id')
            next()
      })
      .options((req, res) => {
            // Responder preflight
            res.status(200).end()
      })
      // .use(MiddlewareInstance.verifyToken)
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            // Obtener ID de usuario desde header personalizado o desde token
            const userIdFromHeader = req.headers['x-user-id'] as string
            const {idUserLogin: idUserFromToken, filterState} = UtilInstance.getDataRequest(req)
            const idUserLogin = userIdFromHeader ? BigInt(parseInt(userIdFromHeader)) : idUserFromToken
            let el: ActionsLogApartmentBusiness = new ActionsLogApartmentBusiness(idUserLogin, filterState, true)
            let idApartment = BigInt((req.query.id)? parseInt(req.query.id as string): 0)
            let idDevice = BigInt((req.query.iddevice)? parseInt(req.query.iddevice as string): 0)
            const { date_string: timeStampCurrent, timestamp } = UtilInstance.getDateTimestampCurrentForSQL()

            // data of log
            const logDataIn = ( req.body.log_data || {} ) as ILogsApartment

            // Cambio de resultado, por nuevo formato de estado en resultado [NEW SERVER TCP]
            let _resultado: ResultType = 'Fallido'
            if ( !isNaN(parseInt(logDataIn.resultado)) ) {
                  _resultado = (parseInt(logDataIn.resultado) === 1 ? 'Correcto':'Fallido') as ResultType
            }

            const log_data: ILogsApartment = {
                  dispositivo_ejecucion: 'Web', 
                  accion: logDataIn.accion || null,
                  resultado: _resultado || null,
                  timestamp: timestamp,
                  data: logDataIn.data || null,
                  idusuario: idUserLogin,
                  fecha: timeStampCurrent,
                  usuario: logDataIn.usuario || '',
                  tipo_ejecucion: (logDataIn.tipo_ejecucion || Constants.log_type_execute_automatico) as TypeExecLogType,
                  observacion: logDataIn.observacion || null,
                  idpiso: idApartment, 
                  iddispositivo: idDevice
            }

            // data of code
            const codeDataIn = ( req.body.code_data || {} ) as ICode
            const code_data: ICode = {
                  codigo: codeDataIn.codigo || '',
                  dias: codeDataIn.dias || 0,
                  timestamp_inicio: codeDataIn.timestamp_inicio || 0,
                  timestamp_fin: codeDataIn.timestamp_fin || 0,
                  fecha_vig_inicio: codeDataIn.fecha_vig_inicio || '',
                  fecha_vig_fin: codeDataIn.fecha_vig_fin || '',
                  idusuario: idUserLogin,
                  idmanija: idDevice,
                  estado: 1,
                  idtipocodigo: codeDataIn.idtipocodigo ? codeDataIn.idtipocodigo : BigInt(0),
                  codigo_tipocodigo: codeDataIn.codigo_tipocodigo || ''
            }

            // data of key
            const keyDataIn = ( req.body.key_data || {} ) as IKey
            const key_data: IKey = {
                  id: keyDataIn.id,
                  ubicacion: keyDataIn.ubicacion || '',
                  tipo_tarjeta: keyDataIn.tipo_tarjeta || '',
                  idqr: keyDataIn.idqr || '',
                  qr: keyDataIn.qr || '',
                  type_action: keyDataIn.type_action 
            }
            
            // Data save on DB
            let data: IActionsLogApartment = {
                  log_data: log_data || null,
                  code_data: code_data || null,
                  key_data: key_data || null
            }
            // key_data: req.body.key_data || null

            let dataDB: IActionsLogApartment | IErrorResponse = await el.insert(data)

            if (!dataDB) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            // Si hay error, loguear detalle en consola y devolver 409
            if (({ ...dataDB } as IErrorResponse).error) {
                  const err = dataDB as IErrorResponse;
                  if (err.data && Array.isArray(err.data) && err.data.length > 0) {
                        console.error('❌ [VALIDACION] Detalle de error:', JSON.stringify(err.data, null, 2));
                  }
                  res.status(409).json(dataDB as IErrorResponse);
                  return;
            }

            // Intentar push del código al dispositivo (si existe integración)
            try {
                  const codeToPush = (dataDB as IActionsLogApartment).code_data?.codigo || (code_data.codigo || '')
                  const idDeviceNum = Number(idDevice)
                  const idApartmentNum = Number(idApartment)
                  if (codeToPush && idDeviceNum) {
                        // no bloqueamos la respuesta ante fallo en el push
                        LockPushInstance.pushCodeToLock({ idDevice: idDeviceNum, idApartment: idApartmentNum, code: codeToPush })
                        .then((r: any) => console.log('[LOCKPUSH] Resultado push:', r))
                        .catch((e: any) => console.error('[LOCKPUSH] Error push:', e))
                  } else {
                        console.log('[LOCKPUSH] No hay código o idDevice para intentar push')
                  }
            } catch (e) {
                  console.error('[LOCKPUSH] Error lanzando push:', e)
            }

            res.json({ data: dataDB })
      })

export default handler