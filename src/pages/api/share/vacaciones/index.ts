import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import UtilInstance from "@/api/helpers/Util";
import VacacionesBusiness from "@/api/business/VacacionesBusiness";
import IVacaciones from "@/api/models/IVacaciones";


const handler = nc (
    {
        onError: (err, req : NextApiRequest , res : NextApiResponse , next) =>{
            console.error(err.stack);
            res.status(500).end("Something broke!");
        },
        onNoMatch: (req: NextApiRequest, res: NextApiResponse)=>{
            res.status(404).end("Page is not found");
        }
    }
)
.use(MiddlewareInstance.verifyToken)
.get(async (req, res : NextApiResponse <IResponse | IErrorResponse>)=>{

    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)

    let el : VacacionesBusiness = new VacacionesBusiness(idUserLogin, filterState , false)

    let dataDB : Array <IVacaciones> | IErrorResponse = await el.getSolicitudxUser()


      // Si es null

      if(!dataDB){
        res.status(204).json({error : "data not found"})
    }

    if(( { ...dataDB } as IErrorResponse).error){
        let _d = dataDB as IErrorResponse
        if(_d.code === 403) res.status(403).json(_d)
        else res.status(404).json(_d)
        return
    }

            
            if((dataDB as Array <IVacaciones>).length === 0){
                res.status(204).json({ error : 'data not found'})
                return
        }
        res.json({data : dataDB})

})
.post(async (req , res : NextApiResponse <IResponse | IErrorResponse>)=>{

    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)

    let el : VacacionesBusiness = new VacacionesBusiness(idUserLogin, filterState,true)

    let data : IVacaciones = {
        fecha_inicio : req.body.fecha_inicio || '',
        fecha_final : req.body.fecha_final || '',
        descripcion : req.body.descripcion || ''
        }

    let dataDB : IVacaciones | IErrorResponse = await el.insert(data)

    if(!dataDB){
        res.status(204).json({ error : 'data not found' })
        return
    }

    if( ({ ...dataDB } as IErrorResponse).error ){
        //409 : conflicto con los datos enviados

        res.status(409).json(dataDB as IErrorResponse)
        return
    }

    res.json({data : dataDB})
})

export default handler