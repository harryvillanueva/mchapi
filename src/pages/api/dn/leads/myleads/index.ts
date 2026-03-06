import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import LeadBusiness from '@/api/business/LeadBusiness'
import { ILead } from '@/api/models/ILead'

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
                  ns_start: req.query.ns_start || undefined,
                  ns_end: req.query.ns_end || undefined,
                  idresponsable: parseInt(req.query.idresponsable as string) || -2,
                  tipo_lead: req.query.tipo_lead as string || '-2',
                  telefono: req.query.telefono as string || '',
                  persona: req.query.persona as string || '',
                  search_all: req.query.search_all as string || ''
            }
            let el: LeadBusiness = new LeadBusiness(idUserLogin, filterState, false, { filter: dataFilter })
            let dataDB: Array<ILead> | IErrorResponse = await el.getMyLeads()

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
            if ( (dataDB as Array<ILead>).length === 0 ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            res.json({ data: dataDB })
      })

export default handler