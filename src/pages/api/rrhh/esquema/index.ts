import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import UtilInstance from "@/api/helpers/Util";
import FichajeOficinaBLL from "@/api/business/FichajeOficinaBLL";
import { IFichajeOficina } from "@/api/models/IFichajeOficina";

const handler = nc (
    {
        onError: (err , req : NextApiRequest , res : NextApiResponse , next)=>{
            console.error(err.stack);
            res.status(500).end("Something broke!");
        },
        onNoMatch: (req: NextApiRequest , res : NextApiResponse) =>{
            res.status(404).end("Page is not found");
        }

    })
    .use(MiddlewareInstance.verifyToken)
    .get(async (req, res : NextApiResponse <IResponse | IErrorResponse>)=>{
        const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)
        
        let dataFilter = {
            search_all : req.query.search_all as string || '',
            m_start : req.query.m_start as string || '',
            m_end : req.query.m_end as string || ''
        }

        let el : FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin , filterState , false, {filter : dataFilter})

        let dataDB : Array <IFichajeOficina> |IErrorResponse = await el.getJornada()

        // Si es null
        if(!dataDB){
            res.status(204).json({error : "data not found"})
            return
        }

        if(({...dataDB} as IErrorResponse).error){
            let _d = dataDB as IErrorResponse
            if(_d.code === 403) res.status(403).json(_d)
            else res.status(404).json(_d)
            return
      }
      
      //Si el array esta vacio

      if((dataDB as Array <IFichajeOficina>).length === 0){
            res.status(204).json({ error : 'data not found'})
            return
      }
      res.json({data : dataDB})
    })

export default handler