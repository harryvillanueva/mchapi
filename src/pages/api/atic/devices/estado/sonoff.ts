import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IDevice } from '@/api/models/IDevice'
import EWeLinkInstance from '@/api/helpers/EWeLink'
import ParametrosGeneralesBusiness from '@/api/business/ParametrosGeneralesBusiness'
import { IParametrosGenerales } from '@/api/models/IParametrosGenerales'

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
    .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: ParametrosGeneralesBusiness = new ParametrosGeneralesBusiness(idUserLogin, filterState, false)
            
        // Obtiene el token de acceso de eWeLink
        let dataDB: IParametrosGenerales | IErrorResponse = await el.getByCode('TOKEN-EWELINK')
        dataDB = dataDB as IParametrosGenerales
        
        const token = (dataDB && dataDB.data && dataDB.data.data && dataDB.data.data.accessToken) ? dataDB.data.data.accessToken : dataDB.valor
        const response = await EWeLinkInstance.getListDevice(token)

        let result = response.map(el => ({id: el.deviceid, status: el.online ? 'Online' : 'Offline'}))

        res.json({ data: result })
    })

export default handler