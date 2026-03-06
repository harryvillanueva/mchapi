import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import FichajeOficinaBLL from '@/api/business/FichajeOficinaBLL'
import { IFichajeOficina } from '@/api/models/IFichajeOficina'

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
    // SIN USO
    // .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
    //     const {idUserLogin, filterState, usernameLogin} = UtilInstance.getDataRequest(req)
    //     let el: FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin, filterState, true)
        
    //     // Data save on DB
    //     let data: IFichajeOficina = {
    //         usuario: usernameLogin,
    //         token: req.body.qr || UtilInstance.getUUID(),
    //         ip: req.body.ip || undefined,
    //         tipo_ejecucion: 'automatico',
    //         estado: 1,
    //         observacion: '',
    //         idusuario: idUserLogin,
    //         idusuario_ultimo_cambio: idUserLogin
    //     }

    //     let dataDB: IFichajeOficina | IErrorResponse = await el.fichar(data)
        
    //     if ( !dataDB ) {
    //             res.status(404).json({ error: 'data not found' })
    //             return
    //     }
    //     if ( ({ ...dataDB } as IErrorResponse).error ) {
    //             // 409: conflicto con los datos enviados
    //             res.status(409).json(dataDB as IErrorResponse)
    //             return
    //     }
        
    //     res.json({ data: dataDB })
    // })

export default handler