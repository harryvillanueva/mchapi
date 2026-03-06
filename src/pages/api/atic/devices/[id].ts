import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect';
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IResponse } from "@/api/modelsextra/IResponse";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import UtilInstance from "@/api/helpers/Util";
import DeviceBusiness from "@/api/business/DeviceBusiness";
import { IDevice } from "@/api/models/IDevice";
import { StatusDataType } from "@/api/types/GlobalTypes";
import DeviceDataAccess from "@/api/data/DeviceDataAccess";


const handler = nc({

    onError: (err , req: NextApiRequest , res: NextApiResponse, next)=>{
        console.error(err.stack);
        res.status(500).end("Something broke!");
    },
    onNoMatch: (req: NextApiRequest , res : NextApiResponse) =>{
        res.status(404).end("Page is not found");
    }
})
.use(MiddlewareInstance.verifyToken)
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
.patch(async (req: NextApiRequest , res : NextApiResponse <IResponse |IErrorResponse>)=>{

    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)
    let el : DeviceBusiness  = new DeviceBusiness(idUserLogin , filterState, true);

    let _estado = ((req.body.estado && (req.body.estado.toString() == '1' || req.body.estado.toString() == '0')) ? parseInt(req.body.estado as string) : -2) as StatusDataType

    let data: IDevice = {
        //idpiso: req.body.idpiso || 0,
        idpiso: BigInt(parseInt(req.body.idpiso as string) || 0),
        idtipodispositivo: BigInt(parseInt(req.body.idtipodispositivo as string) || 0),
        // idtipodispositivo: req.body.iddispositivo || 0,
        codigo : req.body.codigo || "",
        nombre : req.body.nombre || "",
        ubicacion : req.body.ubicacion || "",
        ref_dispositivo : req.body.ref_dispositivo || "",
        etiqueta_dispositivo : req.body.etiqueta_dispositivo || "",
        descripcion : req.body.descripcion || "",
        estado : _estado,
        marca : req.body.marca || "",
        modelo : req.body.modelo || "",
        ubicacion_piso: req.body.ubicacion_piso || undefined
    }




    let dataDB : IDevice | IErrorResponse = await el.updateDevice(BigInt(parseInt(req.query.id as string)), data)

    if(!dataDB) {
        res.status(404).json({error : "data not found"})
        return
    }

    if (({...dataDB} as IErrorResponse).error){
        // 409: conflicto con los datos enviados
        res.status(409).json(dataDB as IErrorResponse)
        return
    }

    res.json({ data : 'ffff'})

    })
.delete(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>)=>{
  
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el: DeviceBusiness = new DeviceBusiness(idUserLogin,  filterState, true);

    let dataDB: IDevice | IErrorResponse = await el.deleteDeviceById(BigInt(parseInt(req.query.id as string)))
   
    if(!dataDB){
        res.status(404).json({error : "data not found"})
        return
    }
    if(({...dataDB} as IErrorResponse).error){
        let d = dataDB as IErrorResponse
        if(d.code === 403) res.status(403).json(d)
        else res.status(404).json(d)
        return
    }
    res.json({ data : dataDB})
})

export default handler