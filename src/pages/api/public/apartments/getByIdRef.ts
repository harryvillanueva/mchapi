import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import UtilInstance from '@/api/helpers/Util'
import { IApartment } from '@/api/models/IApartment'
import { IResponse } from '@/api/modelsextra/IResponse'
import ApartmentBusiness from '@/api/business/ApartmentBusiness'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'

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
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            console.log(req.query.idRef)
            let dataFilter = {
                  idRef: req.query.idRef || ""
            }
            let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false, { filter: dataFilter })
            let dataDB: IApartment | IErrorResponse = await el.getByIdReferencial()

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
            res.json({ data: dataDB })
      })

export default handler