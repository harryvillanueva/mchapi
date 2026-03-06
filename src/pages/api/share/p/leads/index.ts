import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import LeadBusiness from '@/api/business/LeadBusiness'
import { ILead } from '@/api/models/ILead'

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

        let estatus = (req.query.estatus && (req.query.estatus.toString() == '1' || req.query.estatus.toString() == '0')) ? parseInt(req.query.estatus as string) : -2
        let dataFilter = {
                ns_start: req.query.ns_start || '1900-01-01',
                ns_end: req.query.ns_end || '2900-01-01',
                idresponsable: parseInt(req.query.idresponsable as string) || -2,
                tipo_lead: req.query.tipo_lead as string || '-2',
                estatus,
                telefono: req.query.telefono as string || '',
                persona: req.query.persona as string || '',
                search_all: req.query.search_all as string || '',
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0, // inicia en 0 ... n-1
        }

        let el: LeadBusiness = new LeadBusiness(idUserLogin, filterState, false, { filter: dataFilter })
        let dataDB: Array<ILead> | IErrorResponse = await el.getAllWithPagination()
        
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
        if ( (dataDB as Array<ILead>).length === 0 ) {
            res.status(204).json({ error: 'data not found' })
            return
        }
        
        res.json({ data: dataDB })
    })

export default handler