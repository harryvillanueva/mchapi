import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import DataBusiness from '@/api/business/DataBusiness'
import { IData } from '@/api/modelsextra/IData'
import UtilInstance from '@/api/helpers/Util'
import DataTagSelectBusiness from '@/api/business/DataTagSelectBusiness'
import { IDataTagSelect } from '@/api/modelsextra/IDataTagSelect'

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

            let dataFilter = {
                tipo: req.query.tipo as string || 'NA',
            }

            let dataDB: Array<IDataTagSelect> | IErrorResponse | undefined = undefined
            if (dataFilter.tipo === 'pisos') {
                  let el: DataTagSelectBusiness = new DataTagSelectBusiness(idUserLogin, filterState, false)
                  dataDB = await el.getAllPisos()
            } else if (dataFilter.tipo === 'typedevices') {
                  let el: DataTagSelectBusiness = new DataTagSelectBusiness(idUserLogin, filterState, false)
                  dataDB = await el.getAllTypeDevices()
            } else if (dataFilter.tipo === 'personal_oficina') {
                  let el: DataTagSelectBusiness = new DataTagSelectBusiness(idUserLogin, filterState, false)
                  dataDB = await el.getPersonasOficina()
            }
            
            if ( !dataDB ) {
                  res.status(204).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  let _d = dataDB as IErrorResponse
                  if (_d.code === 403) res.status(403).json(_d)
                  else res.status(204).json(_d)
                  return
            }
            res.json({ data: dataDB })
      })

export default handler