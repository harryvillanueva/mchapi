import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ApartmentBusiness from '@/api/business/ApartmentBusiness'
import { IApartment } from '@/api/models/IApartment'
import { StatusDataType } from '@/api/types/GlobalTypes'
import { ITelefonillo } from '@/api/models/ITelefonillo'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IDevice } from '@/api/models/IDevice'
import KeyBusiness from '@/api/business/KeyBusiness'
import { IKey } from '@/api/models/IKey'

const handler = nc(
      {
            onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
                  console.error(err.stack);
                  res.status(500).end("Something broke!");
            },
            onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
                  res.status(404).end("Page is not found");
            }
      })
      .use(MiddlewareInstance.verifyToken)
      .get(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const { idUserLogin, filterState } = UtilInstance.getDataRequest(req);
            let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, false);

            const keyId: bigint = BigInt(parseInt(req.query.id as string));
            let dataDB: IKey | IErrorResponse = await el.getById(keyId);

            if (!dataDB) {
                  res.status(404).json({ error: 'Data not found' });
                  return;
            }

            if ((dataDB as IErrorResponse).error) {
                  let _d = dataDB as IErrorResponse;
                  if (_d.code === 403) {
                        res.status(403).json(_d);
                  } else {
                        res.status(404).json(_d);
                  }
                  return;
            }

            res.json({ data: dataDB });
      })
      .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
            let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, true)
            let data: IKey = {
                  ubicacion: req.body.ubicacion || '',
                  tipo_tarjeta: req.body.tipo_tarjeta || '',
                  idqr: req.body.idqr || '', 
                  qr: req.body.qr || '' ,
                  imagenqr:req.body.imagenqr || null ,
                  estado: req.body.estado , 
                  observacion:req.body.observacion  || null
                }
                let dataDB: IKey | IErrorResponse = await el.updateKey(BigInt(parseInt(req.query.id as string)),data)
            
        
            if (!dataDB) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if (({ ...dataDB } as IErrorResponse).error) {
                  // 409: conflicto con los datos enviados
                  res.status(409).json(dataDB as IErrorResponse)
                  return
            }

            res.json({ data: dataDB })
      })
      .delete(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const { idUserLogin, filterState } = UtilInstance.getDataRequest(req);
            let el: KeyBusiness = new KeyBusiness(idUserLogin, filterState, true);

            const keyid: bigint = BigInt(parseInt(req.query.id as string));
            let dataDB: IKey | IErrorResponse = await el.delete(keyid);

            if (!dataDB) {
                  res.status(404).json({ error: 'Data not found' });
                  return;
            }

            if ((dataDB as IErrorResponse).error) {
                  let _d = dataDB as IErrorResponse;
                  if (_d.code === 403) {
                        res.status(403).json(_d);
                  } else {
                        res.status(404).json(_d);
                  }
                  return;
            }

            res.json({ data: dataDB });
      });



export default handler