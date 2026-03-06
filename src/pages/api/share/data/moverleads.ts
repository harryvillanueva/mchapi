import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import DataBusiness from '@/api/business/DataBusiness'
import { IData } from '@/api/modelsextra/IData'
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

            let dataFilter = {
                  ns_start: req.query.ns_start || '1900-01-01',
                  ns_end: req.query.ns_end || '2900-01-01',
                  idresponsable_source: parseInt(req.query.idresponsable_source as string) || -2,
                  tipo_lead: req.query.tipo_lead as string || '-2',
                  tipo: req.query.tipo as string || 'NA',
                  idtipointeres: parseInt(req.query.idtipointeres as string) || -2,
                  idresponsable_target: parseInt(req.query.idresponsable_target as string) || -2,
                  nro_datos_mover: parseInt(req.query.nro_datos_mover as string) || 0,
            }

            let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: dataFilter })
            let dataDB = await el.moverLeads()
            
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

export default handler