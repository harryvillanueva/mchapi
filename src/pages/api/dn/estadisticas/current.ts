import type {NextApiResponse , NextApiRequest} from 'next';
import nc from 'next-connect';
import MiddlewareInstance from '@/api/helpers/Middleware';
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse';
import { IResponse } from '@/api/modelsextra/IResponse';
import UtilInstance from '@/api/helpers/Util';
import EstadisticaDnBusiness from '@/api/business/EstadisticaDnBusiness';
import { IEstadisticaDn } from '@/api/models/IEstadisticaDn';

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
.get(async (req, res : NextApiResponse <IResponse | IErrorResponse>)=>{
    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)
    let el : EstadisticaDnBusiness = new EstadisticaDnBusiness(idUserLogin , filterState, true)
    let dataDB : Array<IEstadisticaDn> | IErrorResponse = await el.getEstadisticaCurrent()

    if( !dataDB){
        res.status(204).json({ error : "data not found"})
        return
    }
    if( ({ ...dataDB } as IErrorResponse).error) {
        res.status(209).json(dataDB as IErrorResponse)
        return
    }

    res.json({ data : dataDB})
})

export default handler