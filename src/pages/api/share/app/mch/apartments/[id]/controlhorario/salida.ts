import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import ControlHorarioLimpiezaBusiness from '@/api/business/ControlHorarioLimpiezaBusiness'
import { IControlHorarioLimpieza } from '@/api/models/IControlHorarioLimpieza'

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
    .patch(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState, usernameLogin} = UtilInstance.getDataRequest(req)
        let el: ControlHorarioLimpiezaBusiness = new ControlHorarioLimpiezaBusiness(idUserLogin, filterState, true)
        let idApartment = BigInt((req.query.id)? parseInt(req.query.id as string): 0)
        
        // Data save on DB
        let data: IControlHorarioLimpieza = {
            // id: BigInt( (req.body.id) ? parseInt(req.body.id as string): 0 ),
            idpiso: idApartment,
            idusuario: idUserLogin // Para evitar el error, se toma el usarioLogin
        }

        let dataDB: IControlHorarioLimpieza | IErrorResponse = await el.ficharSalida(data)
        
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