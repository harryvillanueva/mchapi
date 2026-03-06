import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import SucesoPropietarioBusiness from '@/api/business/SucesoPropietarioBusiness'
import { ISucesoPropietario } from '@/api/models/ISucesoPropietario'

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

        let el: SucesoPropietarioBusiness = new SucesoPropietarioBusiness(idUserLogin, filterState, false)
        let dataDB: Array<ISucesoPropietario> | IErrorResponse = await el.getByGrupoId(BigInt(parseInt(req.query.id as string)))

        // If es null
        if ( !dataDB ) {
                res.status(404).json({ error: 'data not found' })
                return
        }
        // Si hay error query
        if ( ({ ...dataDB } as IErrorResponse).error ) {
                let _d = dataDB as IErrorResponse
                if (_d.code === 403) res.status(403).json(_d)
                else res.status(404).json(_d)
                return
        }
        // Si la lista es vacia
        if ( ( dataDB as Array<ISucesoPropietario> ).length === 0 ) {
                res.status(404).json({ error: 'data not found' })
                return
        }
        res.json({ data: dataDB })
    })

export default handler