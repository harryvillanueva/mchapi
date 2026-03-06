import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IDevice } from '@/api/models/IDevice'
import Constants from '@/api/helpers/Constants'
import { ILock } from '@/api/models/ILock'
import { IMovil } from '@/api/models/IMovil'
import { IRouter } from '@/api/models/IRouter'
import { ISwitchOnOff } from '@/api/models/ISwitchOnOff'
import { ITelefonillo } from '@/api/models/ITelefonillo'
import { IModel } from '@/api/helpers/IModel'

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
      // .use(MiddlewareInstance.verifyToken)
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false)
            let idApartment = BigInt((req.query.id)? parseInt(req.query.id as string): 0)
            let idDevice = BigInt((req.query.iddevice)? parseInt(req.query.iddevice as string): 0)

            console.log(idApartment, idDevice)
            
            let dataDB: IDevice | IErrorResponse = await el.getDeviceByIdAndIdPiso(idDevice, idApartment)

            console.log(dataDB)
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

            // let data_son = ({ ...dataDB } as IDevice).data_son![0] || {}
            // let dataResult: IModel = { ...(dataDB as IDevice), data_son: undefined }
            // switch( ({ ...dataDB } as IDevice).type ) {
            //       case Constants.type_device_lock:
            //             dataResult = ({ ...dataResult, ...(data_son as ILock)} as ILock)
            //             break
            //       case Constants.type_device_movil:
            //             dataResult = ({ ...dataResult, ...(data_son as IMovil)} as IMovil)
            //             break
            //       case Constants.type_device_router:
            //             dataResult = ({ ...dataResult, ...(data_son as IRouter)} as IRouter)
            //             break
            //       case Constants.type_device_sonoff:
            //             dataResult = ({ ...dataResult } as ISwitchOnOff)
            //             break
            //       case Constants.type_device_telefonillo:
            //             dataResult = ({ ...dataResult, ...(data_son as ITelefonillo)} as ITelefonillo)
            //             break
            //       default:
            //             dataResult = ({ ...dataDB } as IDevice)
            // }

            // res.json({ data: dataResult }
            res.json({data : dataDB})
      })

export default handler