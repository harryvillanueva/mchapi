import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import KeyBusiness from '@/api/business/KeyBusiness'
//import cors from 'cors'

import { ILock } from '@/api/models/ILock'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IResponse } from '@/api/modelsextra/IResponse'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
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
      //.use(cors())
      .use(MiddlewareInstance.verifyToken)
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, false)
            let dataDB: Array<ILock> | IErrorResponse = await el.getLockXKey(parseInt(req.query.id as string))

            // If es null
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            // Si hay error query
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  let _d = dataDB as IErrorResponse
                  if (_d.code === 403) res.status(403).json(_d)
                  else res.status(404).json(_d)
                  return
            }
            // Si la lista es vacia
            if ( (dataDB as Array<ILock>).length === 0 ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            res.json({ data: dataDB })
      })

export default handler