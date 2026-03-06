import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import ControlHorarioLimpiezaBusiness from '@/api/business/ControlHorarioLimpiezaBusiness'
import { IControlHorarioLimpieza } from '@/api/models/IControlHorarioLimpieza'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IDevice } from '@/api/models/IDevice'

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



    
    // .use(MiddlewareInstance.verifyToken)
    

    



// getById()

.get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false)
    
    let dataDB: IDevice | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
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