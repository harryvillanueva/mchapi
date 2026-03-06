import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'

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
    .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        // Data save on DB
        let { qr = '' } = req.body

        let msgdescifrado = UtilInstance.decryptMsg(qr)
        let isvalid = UtilInstance.tokenFicharValido(msgdescifrado)
        
        res.json({ data: {
            qr,
            msgdescifrado,
            isvalid
        } })
    })

export default handler