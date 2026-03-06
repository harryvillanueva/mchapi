import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import VacacionesBusiness from '@/api/business/VacacionesBusiness'
import IVacaciones from '@/api/models/IVacaciones'


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
            m_start: req.query.m_start as string || '',
            m_end: req.query.m_end as string || '',
            iduser: parseInt(req.query.iduser as string) || 0,
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0, // inicia en 0 ... n-1
        }

        let el: VacacionesBusiness = new VacacionesBusiness(idUserLogin, filterState, false, { filter: dataFilter })

        let dataDB: Array<IVacaciones> | IErrorResponse = await el.getAllWithPagination()
        
        if ( !dataDB ) {
                res.status(204).json({ error: 'data not found' })
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