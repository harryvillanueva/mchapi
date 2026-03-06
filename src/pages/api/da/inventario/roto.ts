import type { NextApiRequest , NextApiResponse } from "next";
import nc from 'next-connect'
import MiddlewareInstance from "@/api/helpers/Middleware";
import { IErrorResponse } from "@/api/modelsextra/IErrorResponse";
import { IResponse } from "@/api/modelsextra/IResponse";
import UtilInstance from "@/api/helpers/Util";
import InventarioBusiness from "@/api/business/InventarioBusiness";
import { IInventario } from "@/api/models/IInventario";
import { StatusDataType } from "@/api/types/GlobalTypes";
import { IGrupoInventario } from "@/api/models/IGrupoInventario";
import { IResponseGeneral } from "@/api/modelsextra/IResponseGeneral";


const handler = nc({

    onError : (err, req : NextApiRequest, res : NextApiResponse , next)=>{
        console.error(err.stack);
        res.status(500).end("Something broke!");
    },
    onNoMatch:(req : NextApiRequest , res : NextApiResponse)=>{
        res.status(404).end("Page is not found")
    }
}
)
.use(MiddlewareInstance.verifyToken)
.patch(async (req: NextApiRequest , res : NextApiResponse <IResponse | IErrorResponse>)=>{
    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)
    let el : InventarioBusiness = new InventarioBusiness(idUserLogin, filterState, true)

   
    let data: IGrupoInventario={
        id_piso : BigInt(parseInt(req.body.id_piso as string) || 0),
        l_articulos : req.body.l_articulos || [],
        id_piso_mover : BigInt(parseInt(req.body.id_piso_mover) || 0)
    }
    
    let dataDB : IResponseGeneral | IErrorResponse = await el.updateRoto(data)
    if ( !dataDB ) {
        res.status(404).json({ error: 'data not found' })
        return
}
if ( ({ ...dataDB } as IErrorResponse).error ) {
        // 409: conflicto con los datos enviados
        res.status(409).json(dataDB as IErrorResponse)
        return
}

res.json({ data: dataDB })
})

export default handler