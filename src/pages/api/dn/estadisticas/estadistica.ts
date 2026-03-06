import type {NextApiResponse , NextApiRequest} from 'next';
import nc from 'next-connect';
import MiddlewareInstance from '@/api/helpers/Middleware';
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse';
import { IResponse } from '@/api/modelsextra/IResponse';
import UtilInstance from '@/api/helpers/Util';
import LeadBusiness from '@/api/business/LeadBusiness';
import { IResponseGeneral } from '@/api/modelsextra/IResponseGeneral';
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
    // SIN USO TEMPORAL
    const {idUserLogin , filterState} = UtilInstance.getDataRequest(req);

    let dataFilter = {
        m_start : req.query.m_start as string || '',
        m_end : req.query.m_end as string || ''
    }

    let el : LeadBusiness = new LeadBusiness(idUserLogin , filterState, true, {filter : dataFilter})
    
    let dataDB : IResponseGeneral | IErrorResponse = await el.leadEstadistica()

    if( !dataDB){
        res.status(404).json({ error : "data not found"})
        return
    }
    if( ({ ...dataDB } as IErrorResponse).error){
        res.status(409).json(dataDB as IErrorResponse)
        return
    }

    res.json({ data : dataDB})
})
.post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
    let el: EstadisticaDnBusiness = new EstadisticaDnBusiness(idUserLogin, filterState, true)
    
    const fecha_filter = req.body.fecha_filter || undefined
    const tipo_filter = req.body.tipo_filter || []
    
    let dataDB: Array<IEstadisticaDn> | IErrorResponse = await el.insertAutomaticBulk(fecha_filter, tipo_filter)

    if ( !dataDB ) {
          res.status(204).json({ error: 'data not found' })
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