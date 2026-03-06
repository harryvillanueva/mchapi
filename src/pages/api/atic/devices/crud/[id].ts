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
            let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false);

            const deviceId: bigint = BigInt(parseInt(req.query.id as string));
            let dataDB: IDevice | IErrorResponse = await el.getById(deviceId);

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
            let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, true)
            let data: IDevice = {
                  nombre: req.body.nombre || '',
                  codigo: req.body.codigo || '',
                  idtipodispositivo: BigInt(0), // No se va a Actualizar hacia el Front
                  estado: req.body.estado,
                  type: req.body.type || '',
                  idpiso: req.body.idpiso || undefined,
                  descripcion: req.body.descripcion || null
            }
            let dataDB: IDevice | IErrorResponse | undefined = undefined

            switch (data.type) {

                  case 'telefonillo':
                        dataDB = await el.updateTelefonillo(BigInt(parseInt(req.query.id as string)), { ...data, ip_arduino: req.body.ip_arduino }) as IErrorResponse | IDevice;

                        // if( _resultDBT && !((_resultDBT as IErrorResponse).error) ) { dataDB = _resultDBT as IDevice}
                        // else  dataDB = _resultDBT as IErrorResponse
                        break

                  case 'lock':
                        dataDB = await el.updateLock(BigInt(parseInt(req.query.id as string)), { ...data, codigo_permanente: req.body.codigo_permanente, bateria: req.body.bateria || undefined, mac: req.body.mac }) as IErrorResponse | IDevice;

                        break

                  case 'camara':
                        dataDB = await el.updateCam(BigInt(parseInt(req.query.id as string)), { ...data, iddispositivo: req.body.iddispositivo }) as IErrorResponse | IDevice;
                        break

                  case 'movil':
                        dataDB = await el.updateMovil(BigInt(parseInt(req.query.id as string)), {
                              ...data,
                              version_app: req.body.version_app,
                              ip: req.body.ip, // Incluir el campo ip aquí
                              macwifi: req.body.macwifi, // Incluir el campo macwifi
                        }) as IErrorResponse | IDevice;

                        break

                  case 'sonoff':
                        dataDB = await el.updateSonoff(BigInt(parseInt(req.query.id as string)), { ...data, iddispositivo: req.body.iddispositivo }) as IErrorResponse | IDevice;
                        break

                  case 'router':
                        dataDB = await el.updateRouter(BigInt(parseInt(req.query.id as string)), {
                              ...data,
                              iddispositivo: req.body.iddispositivo,
                              tipo_conexion: req.body.tipo_conexion,
                              nombre_red: req.body.nombre_red,
                              password_red: req.body.password_red,
                              proveedor: req.body.proveedor
                        }) as IErrorResponse | IDevice;

                        break

                  default: dataDB = undefined

            }

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
            let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, true);

            const deviceId: bigint = BigInt(parseInt(req.query.id as string));
            let dataDB: IDevice | IErrorResponse = await el.deleteDeviceById(deviceId);

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