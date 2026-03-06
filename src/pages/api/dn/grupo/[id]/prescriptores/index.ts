import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import GrupoPrescriptorBusiness from '@/api/business/GrupoPrescriptorBusiness'
import { IGrupoPrescriptor } from '@/api/models/IGrupoPrescriptor'

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
        let el: GrupoPrescriptorBusiness = new GrupoPrescriptorBusiness(idUserLogin, filterState, false)
        
        let dataDB: IGrupoPrescriptor | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
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
        let el: GrupoPrescriptorBusiness = new GrupoPrescriptorBusiness(idUserLogin, filterState, true)

        let data: IGrupoPrescriptor = {
            nombre: req.body.nombre || '',
            whatsapp: req.body.whatsapp || '',
            nro_visitas: req.body.nro_visitas || 0,
            nro_reservas: req.body.nro_reservas || 0,
            valor: req.body.valor || 0,
            prescriptores: req.body.prescriptores || [],
            prescriptores_to_lead: req.body.prescriptores_to_lead || [],
            comentario_suceso: req.body.comentario_suceso || '',
            flag_vr: req.body.flag_vr || '',
            valor_propietario: req.body.valor_propietario || 0,
            next_step: req.body.next_step || undefined,

            acceso_intranet: req.body.acceso_intranet || '',
        }

        let dataDB: IGrupoPrescriptor | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)
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