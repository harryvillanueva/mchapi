import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ResponsableLeadBusiness from '@/api/business/ResponsableLeadBusiness'
import { IResponsableLead } from '@/api/models/IResponsableLead'
import { StatusDataType } from '@/api/types/GlobalTypes'
import Constants from '@/api/helpers/Constants'

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
            let el: ResponsableLeadBusiness = new ResponsableLeadBusiness(idUserLogin, filterState, false)
            let dataDB: Array<IResponsableLead> | IErrorResponse = await el.get()

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
            if ( (dataDB as Array<IResponsableLead>).length === 0 ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            res.json({ data: dataDB })
      })
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: ResponsableLeadBusiness = new ResponsableLeadBusiness(idUserLogin, filterState, true)
            let idResponsable = parseInt(req.body.idusuario_resp as string) || 0 // Permite NULL
            let estado = (req.body.estado ? parseInt(req.body.estado) : 1) as StatusDataType
            let data: IResponsableLead = {
                  codigo: req.body.codigo || '',
                  nombre: req.body.nombre || '',
                  observacion: req.body.observacion || '',
                  estado: estado,
                  idusuario_resp: idResponsable > 0 ? BigInt(idResponsable): undefined,
                  tipo_lead: req.body.tipo_lead || Constants.code_lead_todos
            }
            let dataDB: IResponsableLead | IErrorResponse = await el.insert(data)
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