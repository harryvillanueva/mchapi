import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ResponsableLeadBusiness from '@/api/business/ResponsableLeadBusiness'
import { IResponsableLead } from '@/api/models/IResponsableLead'
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
            
            let dataDB: IResponsableLead | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
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
      .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: ResponsableLeadBusiness = new ResponsableLeadBusiness(idUserLogin, filterState, true)
            let estado = (req.body.estado && (req.body.estado == 1 || req.body.estado == 0)) ? req.body.estado : -2
            let idResponsable = parseInt(req.body.idusuario_resp as string) || 0 // Permite NULL

            let data: IResponsableLead = {
                  codigo: req.body.codigo || '',
                  nombre: req.body.nombre || '',
                  observacion: req.body.observacion || '',
                  estado: estado,
                  idusuario_resp: idResponsable > 0 ? BigInt(idResponsable): undefined,
                  tipo_lead: req.body.tipo_lead || Constants.code_lead_todos
            }
            
            let dataDB: IResponsableLead | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  // 409: conflicto con los datos enviados
                  // Ademas del 409 verificar el estatus del error y enviar que no esta autorizado
                  res.status(409).json(dataDB as IErrorResponse)
                  return
            }
            res.json({ data: dataDB })
      })

export default handler