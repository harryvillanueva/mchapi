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
    .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
        console.log('🔵 [FICHAR] Inicio del endpoint de fichaje')
        const {idUserLogin, filterState, usernameLogin} = UtilInstance.getDataRequest(req)
        console.log('🔵 [FICHAR] Usuario:', usernameLogin, 'ID:', idUserLogin.toString())

        let el: FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin, filterState, true)

        // Data save on DB
        let data: IFichajeOficina = {
            usuario: usernameLogin,
            token: req.body.qr || UtilInstance.getUUID(),
            ip: req.body.ip || undefined,
            tipo_ejecucion: 'automatico',
            estado: 1,
            observacion: '',
            idusuario: idUserLogin,
            idusuario_ultimo_cambio: idUserLogin
        }

        console.log('🔵 [FICHAR] Llamando a el.fichar()...')
        let dataDB: IFichajeOficina | IErrorResponse = await el.fichar(data)
        console.log('🔵 [FICHAR] Respuesta de el.fichar() recibida')

        if ( !dataDB ) {
                console.log('🔴 [FICHAR] Error: data not found')
                res.status(404).json({ error: 'data not found' })
                return
        }
        if ( ({ ...dataDB } as IErrorResponse).error ) {
                // 409: conflicto con los datos enviados
                console.log('🔴 [FICHAR] Error de integridad:', dataDB)
                res.status(409).json(dataDB as IErrorResponse)
                return
        }

        console.log('🟢 [FICHAR] Fichaje exitoso')
        res.json({ data: dataDB })
    })

export default handler