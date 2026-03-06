import type { NextApiRequest , NextApiResponse } from "next";
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
.get(async (req, res : NextApiResponse <IResponse | IErrorResponse>)=>{
    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)

    let dataFilter = {
        limit : parseInt(req.query.limit as string) || 50,
        offset : parseInt(req.query.offset as string) || 0,
        search_all : req.query.search_all as string || ''
    }

    let el : ArticuloBusiness = new ArticuloBusiness(idUserLogin, filterState , false , {filter : dataFilter})
    let dataDB : Array<IArticulo> | IErrorResponse = await el.getArticuloPag()


     // Si es null
        
     if(!dataDB){
        res.status(404).json({ error : "data not found"})
        return
    }
    // Si hay error query

   if(({...dataDB} as IErrorResponse).error){
    res.status(409).json(dataDB as IErrorResponse)
    return
   }

  res.json({data: dataDB})
})

export default handler