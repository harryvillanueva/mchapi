import type { NextApiRequest, NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import UtilInstance from "@/api/helpers/Util";
import ArticuloBusiness from "@/api/business/ArticuloBusiness";
import { IArticulo } from "@/api/models/IArticulo";
import { StatusDataType } from "@/api/types/GlobalTypes";


const handler = nc(

    {
        onError : (err , req : NextApiRequest , res : NextApiResponse , next) =>{
            console.log(err.stack);
            res.status(500).end("something broke!") ; 
        },
        onNoMatch : (req : NextApiRequest, res : NextApiResponse)=>{
            res.status(404).end("Page is not found");
        }
    }
)
.use(MiddlewareInstance.verifyToken)
.patch(async (req : NextApiRequest , res : NextApiResponse <IResponse | IErrorResponse>)=>{

    
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)

    let el : ArticuloBusiness = new ArticuloBusiness(idUserLogin, filterState, true)

    let _estado = ((req.body.estado && (req.body.estado.toString() == '1' || req.body.estado.toString() == '0')) ? parseInt(req.body.estado as string) : -2) as StatusDataType

    let data : IArticulo = {
       tag : req.body.tag || "", 
       mobiliario : req.body.mobiliario || "",
       descripcion : req.body.descripcion || "",
       precio : req.body.precio || 0.00,
       fecha_compra : req.body.fecha_compra || '',
       meses_antiguedad : req.body.meses_antiguedad || 0,
       depreciacion: req.body.depreciacion || 0.00,
       valor_depreciacion : req.body.valor_depreciacion || 0.00,
       propietario : req.body.propietario || "",
       notas : req.body.notas || "",
       url_imagen: req.body.url_imagen || "",
       stock : req.body.stock || 0,
       total : req.body.total || 0,
       estado : _estado
    }
    
    let dataDB: IArticulo | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)

    
    if(!dataDB){
        res.status(404).json({error : "data not found"})
        return
    }
    if(({...dataDB} as IErrorResponse).error){
        res.status(409).json(dataDB as IErrorResponse)
        return
    }
    res.json({ data : dataDB})
}
)
.delete(async (req : NextApiRequest, res : NextApiResponse<IResponse |IErrorResponse>) =>{
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el : ArticuloBusiness = new ArticuloBusiness(idUserLogin, filterState, true)
    

    let dataDB : IArticulo| IErrorResponse = await el.delete(BigInt(parseInt(req.query.id as string)))

    if( !dataDB){
        res.status(404).json({error : "data not found"})
        return
    }
    if(({...dataDB} as IErrorResponse).error){
        res.status(409).json(dataDB as IErrorResponse)
        return
    }
    res.json({data : dataDB})
})

export default handler