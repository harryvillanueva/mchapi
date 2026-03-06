import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
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
    .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, true)

        let idPiso = parseInt(req.query.id as string) || 0
        
        let lDispositivos = req.body.lDispositivos || []

        let dataDB: IApartment | IErrorResponse = await el.AsociarDispositivos(BigInt(idPiso),lDispositivos)
        if ( !dataDB ) {
              res.status(404).json({ error: 'data not found' })
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