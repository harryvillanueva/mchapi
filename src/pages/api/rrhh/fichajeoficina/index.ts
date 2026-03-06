import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import FichajeOficinaBLL from '@/api/business/FichajeOficinaBLL'
import { IFichajeOficina } from '@/api/models/IFichajeOficina'

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
.post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el: FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin, filterState, true)
    
    let data: IFichajeOficina = {
        fecha: req.body.fecha || '',
        entrada: req.body.entrada || '',
        salida: req.body.salida || undefined,
        idusuario: req.body.idusuario || BigInt(0),
        observacion: req.body.observacion || '',
        token: '',
        usuario: '',
        tipo_ejecucion: '',
        idusuario_ultimo_cambio: BigInt(0)
    }

    let dataDB: IFichajeOficina | IErrorResponse = await el.insert(data)
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