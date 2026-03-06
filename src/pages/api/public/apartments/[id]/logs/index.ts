import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import LogsApartmentBusiness from '@/api/business/LogsApartmentBusiness'
import { ILogsApartment } from '@/api/models/ILogsApartment'

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
            const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
            let infoExtra = { idApartment: BigInt((req.query.id)? parseInt(req.query.id as string): 0) }
            
            let el: LogsApartmentBusiness = new LogsApartmentBusiness(idUserLogin, filterState, false, infoExtra)
            let dataDB: Array<ILogsApartment> | IErrorResponse = await el.getAllByApartment()

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
            if ( (dataDB as Array<ILogsApartment>).length === 0 ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            res.json({ data: dataDB })
      })
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            // const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            // let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, true)
            // let data: IApartment = {
            //       pais: req.body.pais,
            //       ciudad: req.body.ciudad,
            //       codigo_postal: req.body.codigo_postal,
            //       direccion: req.body.direccion,
            //       nro_edificio: req.body.nro_edificio,
            //       nro_piso: req.body.nro_piso,
            //       id_dispositivo_ref: req.body.id_dispositivo_ref,
            //       ubicacion_mapa: req.body.ubicacion_mapa,
            //       observaciones: req.body.observaciones,
            //       idusuario: idUserLogin,
            //       propietarios: req.body.propietarios
            // }
            // let dataDB: IApartment | IErrorResponse = await el.insert(data)
            // if ( !dataDB ) {
            //       res.status(404).json({ error: 'data not found' })
            //       return
            // }
            // if ( ({ ...dataDB } as IErrorResponse).error ) {
            //       // 409: conflicto con los datos enviados
            //       res.status(409).json(dataDB as IErrorResponse)
            //       return
            // }
            
            // res.json({ data: dataDB })
            res.json({ data: {} })
      })

export default handler