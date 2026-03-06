import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import KeyBusiness from '@/api/business/KeyBusiness'
//import cors from 'cors'

import { IKey } from '@/api/models/IKey'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
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
      // .use(MiddlewareInstance.verifyToken)
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let dataFilter = {
                  search_all: req.query.search_all as string || '', 
                  limit : parseInt(req.query.limit as string) || 200,
                  offset : parseInt(req.query.offset as string) ||0
            }
            let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, false)
            let dataDB: Array<IKey> | IErrorResponse = await el.get()

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
            if ( (dataDB as Array<IKey>).length === 0 ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            res.json({ data: dataDB })
      })
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, true)

            let data: IKey = {
                  ubicacion: req.body.ubicacion,
                  tipo_tarjeta: req.body.tipo_tarjeta,
                  idqr: `M${req.body.idqr}`,
                  qr: req.body.qr
            }
            
            let dataDB: IKey | IErrorResponse = await el.insert(data)
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