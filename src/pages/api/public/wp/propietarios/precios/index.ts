import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import SolicitudPrecioBLL from '@/api/business/SolicitudPrecioBLL'
import { ISolicitudPrecio } from '@/api/models/ISolicitudPrecio'
import EmailServiceInstance from '@/api/helpers/EmailService'
import TemplateEmails from '@/api/helpers/TemplateEmails'
import ValidationsInstance from '@/api/helpers/Validations'
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
      // .use(MiddlewareInstance.verifyToken)
      // .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
      //       const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
      //       let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false)
      //       let dataDB: Array<IApartment> | IErrorResponse = await el.get()

      //       // If es null
      //       if ( !dataDB ) {
      //             res.status(404).json({ error: 'data not found' })
      //             return
      //       }
      //       // Si hay error query
      //       if ( ({ ...dataDB } as IErrorResponse).error ) {
      //             let _d = dataDB as IErrorResponse
      //             if (_d.code === 403) res.status(403).json(_d)
      //             else res.status(404).json(_d)
      //             return
      //       }
      //       // Si la lista es vacia
      //       if ( (dataDB as Array<IApartment>).length === 0 ) {
      //             res.status(404).json({ error: 'data not found' })
      //             return
      //       }
      //       res.json({ data: dataDB })
      // })
      .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: SolicitudPrecioBLL = new SolicitudPrecioBLL(idUserLogin, filterState, true)

            let data: ISolicitudPrecio = {
                  limite_precio: parseFloat(req.body.limite_precio as string) || -1.0,
                  porcentaje_limite_precio: parseFloat(req.body.porcentaje_limite_precio as string) || -1.0,
                  username_wp: req.body.username_wp || '',
                  idpropietario: req.body.idpropietario || undefined,
                  idusuario: idUserLogin,
                  idpiso: BigInt(req.body.idpiso || 0) // por el momento todas las solicitudes apunta a oficina
            }
            let dataDB: ISolicitudPrecio | IErrorResponse = await el.insertWP(data)
            if ( !dataDB ) {
                  res.status(204).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  // 409: conflicto con los datos enviados
                  res.status(209).json(dataDB as IErrorResponse)
                  return
            }

            // Si todo esta OK se envia correo a propietario, copia a rmg
            // validar correo electronico [username_wp], si es OK se envia el correo
            if ( ValidationsInstance.checkEmail(data.username_wp || '') ) {
                  EmailServiceInstance.changeMailOptions('', 'Solicitud de límite de precio', TemplateEmails.getHtmlSendSolicituLimitePrecio(`${(dataDB as ISolicitudPrecio).piso}`, `${data.limite_precio}`, `${data.porcentaje_limite_precio}`));
                  // agregar el correo de rmg: Constants.email_rmg
                  EmailServiceInstance.sendEmail(`${data.username_wp},${Constants.email_rmg}`)
            }
            
            res.json({ data: dataDB })
      })

export default handler