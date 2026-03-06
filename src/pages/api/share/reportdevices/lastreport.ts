import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ApartmentBusiness from '@/api/business/ApartmentBusiness'
import { IApartment } from '@/api/models/IApartment'
import DeviceReportBusiness from '@/api/business/DeviceReportBusiness'
import { IDeviceReport } from '@/api/models/IDeviceReport'

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

            let el: DeviceReportBusiness = new DeviceReportBusiness(idUserLogin, filterState, false)
            let dataDB: IDeviceReport | IErrorResponse = await el.getLastReport()

            // If es null
            if ( !dataDB ) {
                  res.status(204).json({ error: 'data not found' })
                  return
            }
            // Si hay error query
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  let _d = dataDB as IErrorResponse
                  if (_d.code === 203) res.status(403).json(_d)
                  else res.status(204).json(_d)
                  return
            }
            res.json({ data: dataDB })
      })
      
export default handler