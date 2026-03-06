import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import GrupoProrpietarioBusiness from '@/api/business/GrupoPropietarioBusiness'
import { IGrupoPropietario } from '@/api/models/IGrupoPropietario'

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
        let el: GrupoProrpietarioBusiness = new GrupoProrpietarioBusiness(idUserLogin, filterState, false)
        
        let dataDB: IGrupoPropietario | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
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
    .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) =>{
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: GrupoProrpietarioBusiness = new GrupoProrpietarioBusiness(idUserLogin,filterState, true)

        let data: IGrupoPropietario = {
            nombre: req.body.nombre || '',
            whatsapp: req.body.whatsapp || '',
            nro_llamadas: req.body.nro_llamadas || 0,
            propietarios: req.body.propietarios || [],
            propietarios_to_lead: req.body.propietarios_to_lead || [],
            comentario_suceso: req.body.comentario_suceso || '',
            next_step: req.body.next_step || undefined,

            administrador: req.body.administrador || '',
            presidente: req.body.presidente || '',
            vecinos: req.body.vecinos || '',
            portero: req.body.portero || '',
            otros: req.body.otros || '',
            acceso_intranet: req.body.acceso_intranet || '',
        }

        let dataDB: IGrupoPropietario | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)
        if (!dataDB ){
            res.status(404).json({ error: 'data not found'})
            return
        }
        if ( ({ ...dataDB} as IErrorResponse).error){
            res.status(409).json(dataDB as IErrorResponse)
            return
        }

        res.json({data: dataDB})
    })

export default handler