import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IResponsableLead } from '@/api/models/IResponsableLead'
import GrupoPrescriptorBusiness from '@/api/business/GrupoPrescriptorBusiness'
import { IGrupoPrescriptor } from '@/api/models/IGrupoPrescriptor'
import GrupoPropietarioBusiness from '@/api/business/GrupoPropietarioBusiness'

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
        const {idUserLogin, filterState, usernameLogin} = UtilInstance.getDataRequest(req)

        let dataFilter = {
                search_all: req.query.search_all as string || '',
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0, // inicia en 0 ... n-1
        }

        let el: GrupoPropietarioBusiness = new GrupoPropietarioBusiness(idUserLogin, filterState, false, { filter: dataFilter })
        let dataDB: Array<IGrupoPrescriptor> | IErrorResponse = await el.getAllWithPagination()
        
        if ( !dataDB ) {
                res.status(204).json({ error: 'data not found' })
                return
        }
        if ( ({ ...dataDB } as IErrorResponse).error ) {
                // 409: conflicto con los datos enviados
                res.status(409).json(dataDB as IErrorResponse)
                return
        }
        // Si la lista es vacia
        if ( (dataDB as Array<IResponsableLead>).length === 0 ) {
            res.status(204).json({ error: 'data not found' })
            return
        }
        
        res.json({ data: dataDB })
    })

export default handler