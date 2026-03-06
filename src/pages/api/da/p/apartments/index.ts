import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import ApartmentBusiness from "@/api/business/ApartmentBusiness";
import UtilInstance from "@/api/helpers/Util";
import { IApartment } from "@/api/models/IApartment";


const handler = nc(
    {
        onError : (err , req : NextApiRequest , res : NextApiResponse , next)=>{
            console.error(err.stack);
            res.status(500).end("Soemthing broke!")
        },
        onNoMatch: (req: NextApiRequest , res : NextApiResponse)=>{
            res.status(404).end("Page is not found");
        }
    }
)
.use(MiddlewareInstance.verifyToken)
.get(async (req , res : NextApiResponse <IResponse | IErrorResponse>)=>{
    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)

    let dataFilter = {
        search_all : req.query.search_all as string || '',
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0, // inicia en 0 ... n-1
    }

    let el : ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false , {filter : dataFilter})
    let dataDB : Array <IApartment> | IErrorResponse
    dataDB = await el.getAllDAPagination()


     // If es null
     if ( !dataDB ) {
        res.status(404).json({ error: 'data not found' })
        return
  }
  // Si hay error query
  if ( ({ ...dataDB } as IErrorResponse).error ) {
        let _d = dataDB as IErrorResponse
        if (_d.code === 403) res.status(403).json(_d)
        else res.status(404).json(_d)
        return
  }
  // Si la lista es vacia
  if ( (dataDB as Array<IApartment>).length === 0 ) {
        res.status(204).json({ error: 'data not found' })
        return
  }
  res.json({ data: dataDB })
})

export default handler