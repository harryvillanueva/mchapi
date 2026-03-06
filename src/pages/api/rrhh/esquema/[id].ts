import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import UtilInstance from "@/api/helpers/Util";
import FichajeOficinaBLL from "@/api/business/FichajeOficinaBLL";
import { IUser } from "@/api/models/IUser";
import { StatusDataType } from "@/api/types/GlobalTypes";

const handler = nc (
    {
        onError: (err , req : NextApiRequest , res : NextApiResponse , next) =>{
            console.error(err.stack);
            res.status(500).end("Something broke!");
        },
        onNoMatch: (req: NextApiRequest , res : NextApiResponse) =>{
            res.status(404).end("Page is not found");
        }
    })
    .use(MiddlewareInstance.verifyToken)
    .patch(async (req : NextApiRequest , res : NextApiResponse <IResponse | IErrorResponse>) =>{

        const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)

        let el : FichajeOficinaBLL = new FichajeOficinaBLL(idUserLogin , filterState , true)
        let _estado = ((req.body.estado && (req.body.estado.toString() == '1' || req.body.estado.toString() == '0')) ? parseInt(req.body.estado as string) : -2) as StatusDataType


        let data : IUser = {
            email : req.body.email || '',
            nombre : req.body.nombre || '',
            apellido : req.body.apellido || '',
            estado : _estado,
            username : req.body.username || '',
            nombre_completo : req.body.nombre_completo || '',
            cumpleanyos : req.body.cumpleanyos || '',
            correo_personal : req.body.correo_personal || '',
            detalles : req.body.detalles || '',
            alta_ss : req.body.alta_ss || '',
            etapa : req.body.etapa || '',
            idrol : req.body.idrol || '',
            idusuario : idUserLogin || '',
            jornada : req.body.jornada || '',
            horario : req.body.horario || ''
          
      }
        
        console.log(data)
        let dataDB : IUser | IErrorResponse = await el.updateJornada(BigInt(parseInt(req.query.id as string)), data)

        if ( !dataDB ) {
            res.status(204).json({ error: 'data not found' })
            return
    }
    if ( ({ ...dataDB } as IErrorResponse).error ) {
            // 409: conflicto con los datos enviados
            res.status(409).json(dataDB as IErrorResponse)
            return
    }

    // Por conveniencia solo se esta retornando el ID del usuario
    
    res.json({ data: {...dataDB, id: parseInt(req.query.id as string)} })
    })

export default handler