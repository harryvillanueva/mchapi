import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import { ITelefonillo } from '@/api/models/ITelefonillo'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IDevice } from '@/api/models/IDevice'
import { errors } from 'jose'
import Error from 'next/error'
import { ifError } from 'assert'
import DeviceDataAccess from '@/api/data/DeviceDataAccess'
import { IDataAccess } from '@/api/helpers/IDataAccess'
import { ErrorFieldType } from '@/api/types/GlobalTypes'
import Constants from '@/api/helpers/Constants'
//testes
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
    .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
        const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
        let el: DeviceDataAccess = new DeviceDataAccess(idUserLogin, filterState, false)
        let dataDB: IDevice | IErrorResponse | undefined = undefined

        let data: IDevice = {
            nombre: req.body.nombre || '',
            codigo: req.body.codigo || '',
            idtipodispositivo: req.body.idtipodispositivo || 0,
            type: req.body.type || '',
            idpiso: req.body.id_piso || undefined
        }

        // If es null
        if (!dataDB) {
            res.status(404).json({ error: 'Data not found' })
            return
        }
        // Si hay error query
        if (dataDB == undefined) {
            res.status(404).json(dataDB as IErrorResponse)
            return
        }
        res.json({ data: dataDB })
    })
    .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
        const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
        let el: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, true)
        let data: IDevice = {
            nombre: req.body.nombre || '',
            codigo: req.body.codigo || '',
            idtipodispositivo: req.body.idtipodispositivo || 0,
            type: req.body.type || '',
            idpiso: req.body.idpiso || undefined,
            descripcion: req.body.descripcion || null

        }
        // let dataDB = await el.insertTelefonillo(data as ITelefonillo)
        let dataDB: IDevice | IErrorResponse | undefined = undefined
        console.log('hola1', req.body)
        switch (data.type) {

            case 'telefonillo':
                dataDB = await el.insertTelefonillo({ ...data, ip_arduino: req.body.ip_arduino }) as IErrorResponse | IDevice;
                // console.log(dataDB)
                // if( _resultDBT && !((_resultDBT as IErrorResponse).error) ) { dataDB = _resultDBT as IDevice}
                // else  dataDB = _resultDBT as IErrorResponse
                break

            case 'lock':
                dataDB = await el.insertLock({
                    ...data,
                    codigo_permanente: req.body.codigo_permanente, bateria: req.body.bateria || 0,
                    mac: req.body.mac
                }) as IErrorResponse | IDevice;
                break
            case 'ttlock':
                dataDB = await el.insertTTLock({
                    ...data,
                    codigo_permanente: req.body.codigo_permanente, bateria: req.body.bateria || 0,
                    mac: req.body.mac
                }) as IErrorResponse | IDevice;
                break

            case 'camara':
                dataDB = await el.insertCam({ ...data, iddispositivo: req.body.iddispositivo }) as IErrorResponse | IDevice;
                break

            case 'movil':
                dataDB = await el.insertMovil({
                    ...data,
                    version_app: req.body.version_app || '',
                    ip: req.body.ip || '',
                    macwifi: req.body.macwifi || '',
                }) as IErrorResponse | IDevice;
                break

            case 'sonoff':
                dataDB = await el.insertSonoff({ ...data, iddispositivo: req.body.iddispositivo }) as IErrorResponse | IDevice;
                break

            case 'router':
                dataDB = await el.insertRouter({
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

        if (dataDB == undefined) {

            let error: IErrorResponse = {
                error: Constants.error_type_custom as ErrorFieldType,
                data: [
                    {
                        type: "CUSTOM",
                        code: "",
                        field: "type",
                        label: "dispositivo",
                        msg: "El Type no esta correctamente ingresado"
                    }
                ]
            }
            res.status(404).json({ ...error })
            // res.status(404).json(dataDB as IErrorResponse)
            return
        }

        if (!dataDB) {
            res.status(204).json({ error: 'data not found' })
            return
        }
        if (({ ...dataDB } as IErrorResponse).error) {
            // 409: conflicto con los datos enviados
            res.status(409).json(dataDB as IErrorResponse)
            return
        }

        res.json({ data: { ...(dataDB) } })



    })
export default handler