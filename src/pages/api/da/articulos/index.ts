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
    onError : (err, req : NextApiRequest, res : NextApiResponse , next)=>{
        console.error(err.stack);
        res.status(500).end("Something broke!");
    },
    onNoMatch: (req : NextApiRequest , res : NextApiResponse)=>{
        res.status(404).end("Page is not found")
    }
}
)
.use(MiddlewareInstance.verifyToken)
.get(async (req, res : NextApiResponse<IResponse | IErrorResponse>)=>{
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let dataFilter = {
        search_all: req.query.search_all as string || ""
    }

    let el: ArticuloBusiness = new ArticuloBusiness(idUserLogin, filterState, false ,{filter : dataFilter})
    let dataDB : Array <IArticulo> | IErrorResponse = await el.get();


    //Si es null
    if(!dataDB){
        res.status(404).json({error : "data not found"})
        return
    }

    // Si hay error query
    if(({...dataDB} as IErrorResponse).error){
        let _d = dataDB as IErrorResponse
        if(_d.code === 403) res.status(403).json(_d)
        else res.status(404).json(_d)
    return
    }

    // Si la lista esta vacia
    if((dataDB as Array<IArticulo>).length === 0){
        res.status(404).json({error : "data not found"})
        return
    }
})
.post(async (req, res: NextApiResponse<IResponse| IErrorResponse>)=>{


    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el: ArticuloBusiness = new ArticuloBusiness (idUserLogin, filterState, true)
    let _estado = ((req.body.estado && (req.body.estado.toString() == '1' || req.body.estado.toString() == '0')) ? parseInt(req.body.estado as string) : -2) as StatusDataType

    let data : IArticulo ={
        tag : req.body.tag || "",
        mobiliario : req.body.mobiliario || "",
        descripcion : req.body.descripcion || "",
        precio: req.body.precio || 0.00,
        fecha_compra : req.body.fecha_compra || "",
        meses_antiguedad : req.body.meses_antiguedad || 0,
        depreciacion : req.body.depreciacion || 0.00 , 
        valor_depreciacion: req.body.valor_depreciacion || 0.00,
        propietario: req.body.propietario || "" , 
        notas : req.body.notas || "",
        url_imagen: req.body.url_imagen || "",
        stock : req.body.stock || 0,
        total: req.body.total || 0,
        estado : _estado
    }

    let dataDB : IArticulo | IErrorResponse = await el.insert(data)

    if(!dataDB){
        res.status(404).json({ error : "data not found"})
        return
    }
    if (({...dataDB} as IErrorResponse).error){
        res.status(409).json(dataDB as IErrorResponse)
        return
    }
    res.json({ data : dataDB })
})

export default handler