import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ControlHorarioLimpiezaBusiness from '@/api/business/ControlHorarioLimpiezaBusiness'
import { IControlHorarioLimpieza } from '@/api/models/IControlHorarioLimpieza'
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
    .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin, filterState, false)
        
        let dataDB: IFichajeOficina | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
       
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
    .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin, filterState, true)

        let data: IFichajeOficina = {
            fecha: req.body.fecha || '',
            entrada: req.body.entrada || '',
            salida: req.body.salida || undefined,
            idusuario: req.body.idusuario || BigInt(1), // por conveniencia
            observacion: req.body.observacion || '',
            token: '',
            usuario: '',
            tipo_ejecucion: '',
            idusuario_ultimo_cambio: BigInt(0) // por conveniencia
        }
        let dataDB: IFichajeOficina | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)
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
    .delete(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin, filterState, true)
        
        let dataDB: IFichajeOficina | IErrorResponse = await el.delete(BigInt(parseInt(req.query.id as string)))
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