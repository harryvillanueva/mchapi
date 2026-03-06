import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import { IGrupoPrescriptor } from '@/api/models/IGrupoPrescriptor'
import GrupoPropietarioBusiness from '@/api/business/GrupoPropietarioBusiness'
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
    .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: GrupoPropietarioBusiness = new GrupoPropietarioBusiness(idUserLogin, filterState, true)

        let data: IGrupoPropietario = {
            nombre: req.body.nombre || '',
            whatsapp: req.body.whatsapp || '',
            propietarios: req.body.propietarios || [],
            comentario_suceso: req.body.comentario_suceso || '',

            administrador: req.body.administrador || '',
            presidente: req.body.presidente || '',
            vecinos: req.body.vecinos || '',
            portero: req.body.portero || '',
            otros: req.body.otros || '',
            acceso_intranet: req.body.acceso_intranet || '',
        }

        // console.log(data)

        let dataDB: IGrupoPropietario | IErrorResponse = await el.updateDelete(BigInt(parseInt(req.query.id as string)), data)
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