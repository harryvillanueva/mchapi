import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import ControlHorarioLimpiezaBusiness from '@/api/business/ControlHorarioLimpiezaBusiness'
import { IControlHorarioLimpieza } from '@/api/models/IControlHorarioLimpieza'
import ApartmentBusiness from '@/api/business/ApartmentBusiness'
import { IApartment } from '@/api/models/IApartment'

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
            nro_habitaciones: req.query.ds_nro_dormitorios as string || '',
            capacidad_maxima: req.query.cp_ocupacion_maxima as string || '',
            nro_banios: req.query.bs_nro_banios as string || '',
            total_start: req.query.total_start as string || '',
            total_end: req.query.total_end as string || '',
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0, // inicia en 0 ... n-1
        }

        let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false, { filter: dataFilter })

        let dataDB: Array<IApartment> | IErrorResponse = await el.getAllWithPaginationColaborador()
        
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