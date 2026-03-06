import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ParametrosGeneralesBusiness from '@/api/business/ParametrosGeneralesBusiness';
import { IParametrosGenerales } from '@/api/models/IParametrosGenerales';
import { IDevice } from '@/api/models/IDevice';
import DeviceBusiness from '@/api/business/DeviceBusiness';
import EWeLinkInstance from '@/api/helpers/EWeLink';

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
    // .use(MiddlewareInstance.verifyToken)
    .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: ParametrosGeneralesBusiness = new ParametrosGeneralesBusiness(idUserLogin, filterState, false)
        let elDevice: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false)
            
        // Obtiene el token de acceso de eWeLink
        let dataDB: IParametrosGenerales | IErrorResponse = await el.getByCode('TOKEN-EWELINK')
        dataDB = dataDB as IParametrosGenerales

        // Obtener codigo del dispositivo
        let dataDeviceDB: IDevice | IErrorResponse = await elDevice.getSOnOffById(BigInt(parseInt(req.query.id as string)))
        dataDeviceDB = dataDeviceDB as IDevice
        // console.log(dataDeviceDB)
        
        const token = (dataDB && dataDB.data && dataDB.data.data && dataDB.data.data.accessToken) ? dataDB.data.data.accessToken : dataDB.valor
        const response = await EWeLinkInstance.getCurrentStatus(token, dataDeviceDB.codigo)
        // const response = await EWeLinkInstance.getLastStatus(dataDB.valor, dataDeviceDB.codigo)
        // console.log(response)

        res.json({ data: response })
    })
    .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
        console.log('🟦 [SONOFF] POST /api/public/devices/[id]/sonoff/status - ID:', req.query.id)
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: ParametrosGeneralesBusiness = new ParametrosGeneralesBusiness(idUserLogin, filterState, false)
        let elDevice: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false)

        // Obtiene el token de acceso de eWeLink
        console.log('🟦 [SONOFF] Obteniendo token eWeLink...')
        let dataDB: IParametrosGenerales | IErrorResponse = await el.getByCode('TOKEN-EWELINK')

        if ((dataDB as IErrorResponse).error) {
            console.log('🔴 [SONOFF] Error obteniendo token eWeLink:', dataDB)
            return res.json({ data: { error: 500, msg: 'No se pudo obtener token eWeLink' } })
        }

        dataDB = dataDB as IParametrosGenerales
        console.log('🟦 [SONOFF] Token eWeLink obtenido')

        // Obtener codigo del dispositivo
        console.log('🟦 [SONOFF] Obteniendo dispositivo ID:', req.query.id)
        let dataDeviceDB: IDevice | IErrorResponse = await elDevice.getSOnOffById(BigInt(parseInt(req.query.id as string)))

        if ((dataDeviceDB as IErrorResponse).error) {
            console.log('🔴 [SONOFF] Error obteniendo dispositivo:', dataDeviceDB)
            return res.json({ data: { error: 404, msg: 'Dispositivo no encontrado' } })
        }

        dataDeviceDB = dataDeviceDB as IDevice
        console.log('🟦 [SONOFF] Dispositivo encontrado:', dataDeviceDB.nombre, 'Código:', dataDeviceDB.codigo)

        console.log('🟦 [SONOFF] Cambiando estado del dispositivo...')
        const token = (dataDB && dataDB.data && dataDB.data.data && dataDB.data.data.accessToken) ? dataDB.data.data.accessToken : dataDB.valor
        const response = await EWeLinkInstance.setStatus(token, dataDeviceDB.codigo)
        console.log('🟦 [SONOFF] Respuesta:', response)

        res.json({ data: response })
    })

export default handler