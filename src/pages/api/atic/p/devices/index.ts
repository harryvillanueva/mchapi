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
import { timeStamp } from 'console'

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

    // 
    .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState, usernameLogin} = UtilInstance.getDataRequest(req)

        let dataFilter = {
            search_all: req.query.search_all as string || '',
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0, // inicia en 0 ... n-1
        }

        let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false, { filter: dataFilter })

        let dataDB: Array<IDevice> | IErrorResponse = await el.getAllWithPagination()
        
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
    let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, true)

    // quitar campos no necesarios"
    let data: IDevice = {
        
        codigo: req.body.codigo || '',
        nombre: req.body.nombre || '',
        ubicacion: req.body.ubicacion || '',
        descripcion: req.body.descripcion || '',
        estado: req.body.estado || '',
        fecha_creacion: req.body.fecha_creacion || '',
        fecha_ultimo_cambio: req.body.fecha_ultimo_cambio || '',
        idpiso: req.body.idpiso || 0,
        idtipodispositivo: req.body.idtipodispositivo || 0,
        propietario: req.body.propietario || '',
       
    }


    let dataDB: IDevice | IErrorResponse = await el.insertDevice(data)
    if ( !dataDB ) {
            res.status(204).json({ error: 'data not found' })
            console.log("no DB")
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