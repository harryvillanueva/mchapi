import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ParametrosGeneralesBusiness from '@/api/business/ParametrosGeneralesBusiness';
import { IParametrosGenerales } from '@/api/models/IParametrosGenerales';

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
        
        let _infoExtra = {}
        if ( dataDB ) {
            let _atExpiredTime = dataDB.data.data.atExpiredTime as number
            let _rtExpiredTime = dataDB.data.data.rtExpiredTime as number

            let _atExpiredTimeStr = UtilInstance.getDateToken(_atExpiredTime)
            let _rtExpiredTimeStr = UtilInstance.getDateToken(_rtExpiredTime)
            _infoExtra = { expiracion_token: _atExpiredTimeStr, expiracion_token_refresh: _rtExpiredTimeStr}
        }

        res.json({ data: { ...dataDB, ..._infoExtra } })
    })

export default handler