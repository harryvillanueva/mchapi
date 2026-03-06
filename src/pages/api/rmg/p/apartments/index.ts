import type { NextApiRequest , NextApiResponse} from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import InfoPisoComercialBusiness from '@/api/business/InfoPisoComercialBusiness'
import UtilInstance from '@/api/helpers/Util'
import { IInfoPisoComercial } from '@/api/models/IInfoPisoComercial'

const handler = nc(
    {
        onError : (err , req : NextApiRequest , res : NextApiResponse , next) =>{
            console.error(err.stack);
            res.status(500).end("Something broke!")
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
        search_all: req.query.search_all as string || '',
        nro_habitaciones: req.query.ds_nro_dormitorios as string || '',
        capacidad_maxima: req.query.cp_ocupacion_maxima as string || '',
        nro_camas: req.query.ds_nro_camas as string || '',
        nro_banios: req.query.bs_nro_banios as string || '',
        total: req.query.total as string || '',
        total_start: req.query.total_start as string || '',
        total_end: req.query.total_end as string || '',
        estado_general: parseInt(req.query.estado_general as string) || -2,
        limit : parseInt(req.query.limit as string) || 50,
        offset : parseInt(req.query.offset as string) || 0 //inicia en 0 ... n-1
    } 

    let el: InfoPisoComercialBusiness = new InfoPisoComercialBusiness(idUserLogin , filterState , false , {filter : dataFilter})
    let dataDB : Array <IInfoPisoComercial> | IErrorResponse | undefined = undefined
    dataDB = await el.getPagination()

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
  if ( (dataDB as Array<IInfoPisoComercial>).length === 0 ) {
        res.status(204).json({ error: 'data not found' })
        return
  }
  res.json({ data: dataDB })
})

export default handler