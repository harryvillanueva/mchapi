import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import { ILogsApartment } from '@/api/models/ILogsApartment'
import ActionsLogApartmentBusiness from '@/api/business/ActionsLogApartmentBusiness'
import { IActionsLogApartment } from '@/api/models/IActionsLogApartment'
import { ICode } from '@/api/models/ICode'
import { IKey } from '@/api/models/IKey'
import Constants from '@/api/helpers/Constants'
import { TypeExecLogType } from '@/api/types/GlobalTypes'
import MiddlewareInstance from '@/api/helpers/Middleware'

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
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState, usernameLogin} = UtilInstance.getDataRequest(req)
            let el: ActionsLogApartmentBusiness = new ActionsLogApartmentBusiness(idUserLogin, filterState, true)
            let idApartment = BigInt((req.query.id)? parseInt(req.query.id as string): 0)
            let idDevice = BigInt((req.query.iddevice)? parseInt(req.query.iddevice as string): 0)
            const { date_string: timeStampCurrent, timestamp } = UtilInstance.getDateTimestampCurrentForSQL()

            // data of log
            const logDataIn = ( req.body.log_data || {} ) as ILogsApartment
            const log_data: ILogsApartment = {
                  dispositivo_ejecucion: 'Movil', 
                  accion: logDataIn.accion || null,
                  resultado: logDataIn.resultado || null,
                  timestamp: timestamp,
                  data: logDataIn.data || null,
                  idusuario: idUserLogin,
                  fecha: timeStampCurrent,
                  usuario: logDataIn.usuario || usernameLogin,
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
                  key_data: key_data || null,
                  registrar_es: req.body.registrar_es || false
            }
            // key_data: req.body.key_data || null

            let dataDB: IActionsLogApartment | IErrorResponse = await el.insert(data)
            
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  // 409: conflicto con los datos enviados
                  res.status(409).json(dataDB as IErrorResponse)
                  return
            }
            
            res.json({ data: dataDB })
      })

export default handler