 
import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import MiddlewareInstance from '@/api/helpers/Middleware'
import KeyBusiness from '@/api/business/KeyBusiness'
import { IKey } from '@/api/models/IKey'

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

        let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, false, { filter: dataFilter })

        let dataDB: Array<IKey> | IErrorResponse = await el.get()
        
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

    .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, true)
        let data: IKey = {
            ubicacion: req.body.ubicacion || '',
            tipo_tarjeta: req.body.tipo_tarjeta || '',
            idqr:req.body.idqr || '',
            qr: req.body.qr || '' ,
            imagenqr:req.body.imagenqr || null,
            pisos_str:req.body.pisos_str || '',
            observacion: req.body.observacion || null
        }
        let dataDB: IKey | IErrorResponse = await el.insertKey(data)
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