import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import UtilInstance from "@/api/helpers/Util";
import InventarioBusiness from "@/api/business/InventarioBusiness";
import { IInventario } from "@/api/models/IInventario";
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
    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)

    let el : InventarioBusiness = new InventarioBusiness(idUserLogin, filterState, true)

    let data: IInventario ={
        id_piso : BigInt(parseInt(req.body.id_piso as string) || 0),
        id_articulo : BigInt(parseInt(req.body.id_articulo as string) || 0),
        cantidad : req.body.cantidad || 0
    }

    let dataDB : IInventario | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)

    if(!dataDB){
        res.status(404).json({error : "data not found"})
        return
    }
    if(({...dataDB} as IErrorResponse).error){
        res.status(409).json(dataDB as IErrorResponse)
        return
    }
    res.json({ data : dataDB})
})
.delete(async (req: NextApiRequest , res : NextApiResponse<IResponse | IErrorResponse>)=>{
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el : InventarioBusiness = new InventarioBusiness (idUserLogin, filterState, true)

    let dataDB : IInventario | IErrorResponse = await el.delete(BigInt(parseInt(req.query.id as string)))

    if(!dataDB){
        res.status(404).json({ error : "data not found"})
        return
    }
    if(({...dataDB} as IErrorResponse).error){
        res.status(409).json(dataDB as IErrorResponse)
        return
    }
    res.json({data : dataDB})
})

export default handler