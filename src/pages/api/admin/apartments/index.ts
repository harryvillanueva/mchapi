import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ApartmentBusiness from '@/api/business/ApartmentBusiness'
import { IApartment } from '@/api/models/IApartment'

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
            let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false)
            let dataDB: Array<IApartment> | IErrorResponse = await el.get()

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
            if ( (dataDB as Array<IApartment>).length === 0 ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            res.json({ data: dataDB })
      })
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, true)
            let data: IApartment = {
                  pais: req.body.pais,
                  ciudad: req.body.ciudad,
                  codigo_postal: req.body.codigo_postal,
                  direccion: req.body.direccion,
                  nro_edificio: req.body.nro_edificio,
                  nro_piso: req.body.nro_piso,
                  id_dispositivo_ref: req.body.id_dispositivo_ref,
                  ubicacion_mapa: req.body.ubicacion_mapa,
                  observaciones: req.body.observaciones,
                  idusuario: idUserLogin,
                  etiqueta: req.body.etiqueta,
                  propietarios: req.body.propietarios
            }
            let dataDB: IApartment | IErrorResponse = await el.insert(data)
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