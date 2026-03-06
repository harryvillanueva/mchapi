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
import { IDeviceReportDetails } from "@/api/models/IDeviceReportDetails";
import DeviceReportDetailsBusiness from "@/api/business/DeviceReportDetailsBusiness";

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
    /*const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
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
    }*/
    res.json({ data: 'PENDIENTE NO IMPLEMENTAR' })
})
.patch(async (req: NextApiRequest , res : NextApiResponse <IResponse |IErrorResponse>)=>{
    // el id -> idreporte
    // el idrd -> idreportedetalle

    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)
    let el : DeviceReportDetailsBusiness = new DeviceReportDetailsBusiness (idUserLogin , filterState, true)

    let data: IDeviceReportDetails= {
        state : req.body.state || '',
        id_piso : BigInt(parseInt(req.body.id_piso as string) ||0),
        id_device : BigInt(parseInt(req.body.id_device as string) || 0)
    }

    let dataDB : IDeviceReportDetails | IErrorResponse = await el.updateID_reporte(BigInt(parseInt(req.query.idrd as string)), BigInt(parseInt(req.query.id as string)) , data)
   
    if(!dataDB) {
        res.status(404).json({error : "data not found"})
        return
    }

    if (({...dataDB} as IErrorResponse).error){
        // 409: conflicto con los datos enviados
        res.status(409).json(dataDB as IErrorResponse)
        return
    }

    res.json({ data : dataDB})

    })

export default handler