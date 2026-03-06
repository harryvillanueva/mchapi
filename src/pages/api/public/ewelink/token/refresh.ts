import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ParametrosGeneralesBusiness from '@/api/business/ParametrosGeneralesBusiness';
import { IParametrosGenerales } from '@/api/models/IParametrosGenerales';
import EWeLinkInstance from '@/api/helpers/EWeLink'

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
        
        let response = {}

        if ( dataDB ) {
            try {
                // dataDB.data can be either an object or a JSON string depending on how it was stored
                let parsedData: any = dataDB.data
                if ( typeof parsedData === 'string' ) {
                    try { parsedData = JSON.parse(parsedData) } catch (e) { /* keep as string */ }
                }

                const _refreshToken = parsedData && parsedData.data && parsedData.data.refreshToken ? parsedData.data.refreshToken as string : null
                if ( _refreshToken ) {
                    console.log('🟨 [EWELINK] Attempting refresh with refreshToken (masked):', `${_refreshToken.toString().slice(0,8)}...`)
                    response = await EWeLinkInstance.refreshToken(_refreshToken)
                } else {
                    console.log('🔴 [EWELINK] refreshToken not found in parsed DB data:', typeof dataDB.data)
                    response = { error: 404, msg: 'refreshToken not found in DB' }
                }
            } catch (err) {
                console.error('🔴 [EWELINK] Error refreshing token:', err)
                response = { error: 500, msg: 'Error refreshing token', data: err }
            }
        }

        // NOTE: This endpoint does NOT update the DB automatically. It returns the refresh response
        // so you can manually inspect and update `tbl_parametros_generales` if needed.

        res.json({ data: response })
    })

export default handler