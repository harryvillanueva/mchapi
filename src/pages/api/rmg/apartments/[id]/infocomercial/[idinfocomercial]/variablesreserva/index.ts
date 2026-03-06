import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import InfoPisoComercialBusiness from '@/api/business/InfoPisoComercialBusiness'
import { IInfoPisoComercial } from '@/api/models/IInfoPisoComercial'

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
      .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: InfoPisoComercialBusiness = new InfoPisoComercialBusiness(idUserLogin, filterState, true)
            // 2 -> Borrador
            let estado_general = (req.body.estado_general === undefined || req.body.estado_general === '' ? 2 : parseInt(req.body.estado_general))
            let idPiso = parseInt(req.body.idpiso as string) || 0 // Permite NULL

            let data: IInfoPisoComercial = {
                id: BigInt(req.body.id || 0),
                nombre_comercial: req.body.nombre_comercial || '',
                link_nombre_comercial: req.body.link_nombre_comercial || '',
                estado_general,
                link_tour_virtual: req.body.link_tour_virtual || '',
                link_calendario_disponibilidad: req.body.link_calendario_disponibilidad || '',
                link_repositorio: req.body.link_repositorio || '',
                tiene_anuncio: req.body.tiene_anuncio || false,
                anuncio_usuario: req.body.anuncio_usuario || '',
                anuncio_contrasenia: req.body.anuncio_contrasenia || '',
                anuncio_plataforma: req.body.anuncio_plataforma || '',
                anuncio_link: req.body.anuncio_link || '',
                idpiso: BigInt(idPiso),

                plataformas: [],
                variablesreserva: req.body.variablesreserva || []
            }

            let dataDB: IInfoPisoComercial | IErrorResponse = await el.updateVariableReserva(data.id || BigInt(0), data)
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