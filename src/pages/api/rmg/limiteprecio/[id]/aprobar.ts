import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import SolicitudPrecioBLL from '@/api/business/SolicitudPrecioBLL'
import { ISolicitudPrecio } from '@/api/models/ISolicitudPrecio'
import EmailServiceInstance from '@/api/helpers/EmailService'
import Constants from '@/api/helpers/Constants'
import TemplateEmails from '@/api/helpers/TemplateEmails'

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
        let el: SolicitudPrecioBLL = new SolicitudPrecioBLL(idUserLogin, filterState, true)

        let data: ISolicitudPrecio = {
            limite_precio: isNaN(parseFloat(req.body.limite_precio as string)) ? -1.0 : parseFloat(req.body.limite_precio as string),
            porcentaje_limite_precio: isNaN(parseFloat(req.body.porcentaje_limite_precio as string)) ? -1.0 : parseFloat(req.body.porcentaje_limite_precio as string),
            observacion: req.body.observacion || '',
            estado_solicitud: 2, // Aprobado
            username_wp: '', // Ignorado
            idpropietario: undefined, // Ignorado
            idusuario: idUserLogin, // Ignorado
            idpiso: BigInt(0) // Ignorado
        }
        let dataDB: ISolicitudPrecio | IErrorResponse = await el.aprobarSolicitudRMG(BigInt(parseInt(req.query.id as string)), data)
        if ( !dataDB ) {
                res.status(204).json({ error: 'data not found' })
                return
        }
        if ( ({ ...dataDB } as IErrorResponse).error ) {
                // 409: conflicto con los datos enviados
                res.status(409).json(dataDB as IErrorResponse)
                return
        }

        // Si todo esta OK se envia correo a propietario, copia a rmg
        EmailServiceInstance.changeMailOptions('', 'Solicitud de límite de precio [ APROBADA ]', TemplateEmails.getHtmlResponseSolicituLimitePrecio(`${(dataDB as ISolicitudPrecio).piso}`, `${data.limite_precio}`, `${data.porcentaje_limite_precio}`, 'APROBADO', `${data.observacion}`))
        EmailServiceInstance.sendEmail(`${(dataDB as ISolicitudPrecio).username_wp}`)
          
        
        res.json({ data: dataDB })
    })

export default handler