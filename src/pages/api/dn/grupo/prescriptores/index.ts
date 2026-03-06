import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import GrupoPrescriptorBusiness from '@/api/business/GrupoPrescriptorBusiness'
import { IGrupoPrescriptor } from '@/api/models/IGrupoPrescriptor'

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

        let dataFilter = {
            search_all: req.query.search_all as string || ''
        }

        let el: GrupoPrescriptorBusiness = new GrupoPrescriptorBusiness(idUserLogin, filterState, false, { filter: dataFilter })
        let dataDB: Array<IGrupoPrescriptor> | IErrorResponse = await el.get()

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
        if ( ( dataDB as Array<IGrupoPrescriptor> ).length === 0 ) {
                res.status(404).json({ error: 'data not found' })
                return
        }
        res.json({ data: dataDB })
    })
    // .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
    //     const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    //     let el: SucesosDnBusiness = new SucesosDnBusiness(idUserLogin, filterState, true)
    //     let data: ISucesosDnUser = {
    //             descripcion: req.body.descripcion || '',
    //             idusu_suceso: BigInt(parseInt(req.query.id as string) || 0),
    //             idrol: req.body.idrol || '',
    //             nombres_suceso: req.body.nombres_suceso || '',
    //             telefono_suceso: req.body.telefono_suceso || '',
    //             correo_suceso: req.body.correo_suceso || '',
    //             ref_lead: req.body.ref_lead || '',
    //             type_action: req.body.type_action || ''
    //     }

    //     let dataDB: ISucesosDn | IErrorResponse = await el.insert(data)
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