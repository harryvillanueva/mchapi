import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import SolicitudPrecioBLL from '@/api/business/SolicitudPrecioBLL'
import { ISolicitudPrecio } from '@/api/models/ISolicitudPrecio'

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
        let el: SolicitudPrecioBLL = new SolicitudPrecioBLL(idUserLogin, filterState, false)
        
        let dataDB: ISolicitudPrecio | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
       
        if ( !dataDB ) {
            res.status(204).json({ error: 'data not found' })
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

export default handler