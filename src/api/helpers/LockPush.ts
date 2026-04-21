import DeviceBusiness from '../business/DeviceBusiness'
import UtilInstance from './Util'
import ParametrosGeneralesBusiness from '../business/ParametrosGeneralesBusiness'
import EWeLinkInstance from './EWeLink'
import Constants from './Constants'
import axios from 'axios'
import * as crypto from 'crypto'

class LockPush {
    constructor() {}

    /**
     * Intento de push del código al dispositivo tipo Lock (WeLock).
     */
    async pushCodeToLock(opts: { idDevice: number, idApartment?: number, code: string, days?: number }) {
        try {
            const { idDevice, code, days } = opts
            console.log('[LockPush] pushCodeToLock -> device:', idDevice, 'código_dummy_frontend:', code)

            // 1. Obtener datos del dispositivo
            const deviceBusiness = new DeviceBusiness(BigInt(1), 1, false)
            const deviceDB = await deviceBusiness.getById(BigInt(idDevice))
            if (!deviceDB || (deviceDB as any).error) {
                console.log('[LockPush] Dispositivo no encontrado en BD:', idDevice)
                return { pushed: false, reason: 'device_not_found' }
            }

            const device: any = deviceDB
            const deviceType = (device.type || device.tdevice || '').toString().toLowerCase()
            const idDeviceStr = idDevice.toString()

            // ---------------------------------------------------------
            // MANEJO SONOFF / EWELINK (LUCES) - MANTENIDO INTACTO
            // ---------------------------------------------------------
            if (deviceType.includes(Constants.type_device_sonoff) || deviceType.includes('sonoff')) {
                console.log('[LockPush] Detected eWeLink/Sonoff device, attempting eWeLink push')
                const paramBus = new ParametrosGeneralesBusiness(BigInt(1), 1, false)
                const tokenParam: any = await paramBus.getByCode('TOKEN-EWELINK')
                if ((tokenParam as any).error) {
                    console.log('[LockPush] No eWeLink token found in parametros generales')
                    return { pushed: false, reason: 'no_ewelink_token' }
                }

                const token = (tokenParam && tokenParam.data && tokenParam.data.data && tokenParam.data.data.accessToken) ? tokenParam.data.data.accessToken : tokenParam.valor
                const idDeviceEwe = device.codigo || (device.info_extra && (device.info_extra.deviceid || device.info_extra.deviceId)) || null
                if (!idDeviceEwe) {
                    console.log('[LockPush] No eWeLink device identifier found on device.codigo or device.info_extra')
                    return { pushed: false, reason: 'no_ewelink_deviceid' }
                }

                try {
                    const res = await EWeLinkInstance.setStatus(token, idDeviceEwe.toString())
                    console.log('[LockPush] eWeLink result:', res)
                    const pushed = (res && (res as any).error === 0) ? true : false
                    return { pushed, reason: pushed ? 'ok' : 'ewelink_error', info: res }
                } catch (err) {
                    console.error('[LockPush] Error pushing to eWeLink:', err)
                    return { pushed: false, reason: 'exception', error: err }
                }
            }

            // ---------------------------------------------------------
            // MANEJO WELOCK (CÓDIGOS OFFLINE MATEMÁTICOS)
            // ---------------------------------------------------------
            if (!deviceType.includes('ttlock') && !deviceType.includes('lock') && !deviceType.includes('welock')) {
                return { pushed: false, reason: 'unsupported_device_type', deviceType }
            }

            // A. Extraer el Lock ID (deviceNumber) de la base de datos
            const info = device.info_extra || {}
            let lockId: any = info.lockId || info.lock_id || device.codigo || device.ref_dispositivo || null

            // Mantener lógica de override antigua por si se necesita probar sin cambiar la BD
            const lockIdByDevice = process.env[`WELOCK_DEVICE_${idDeviceStr}`] || process.env[`TTLOCK_LOCKID_DEVICE_${idDeviceStr}`]
            if (lockIdByDevice) {
                lockId = lockIdByDevice
                console.log('[LockPush] lockId override por variables .env:', idDeviceStr, '->', lockId)
            } else if (process.env.WELOCK_LOCKID_MAP || process.env.TTLOCK_LOCKID_MAP) {
                try {
                    const mapStr = process.env.WELOCK_LOCKID_MAP || process.env.TTLOCK_LOCKID_MAP || '{}'
                    const lockIdMap: any = JSON.parse(mapStr)
                    if (lockIdMap && lockIdMap[idDeviceStr]) {
                        lockId = lockIdMap[idDeviceStr]
                    }
                } catch (e) {
                    console.log('[LockPush] Mapa de IDs inválido en .env')
                }
            }

            if (!lockId) {
                console.log('[LockPush] No hay identificador de cerradura (lockId/codigo).')
                return { pushed: false, reason: 'no_lock_identifier' }
            }

            // B. Traer las credenciales WeLock (Fallbacks directos en caso de que no existan en el .env)
            const WL_APP_ID = process.env.WELOCK_APP_ID || 'WELOCK2202161033';
            const WL_SECRET = process.env.WELOCK_SECRET || '349910dfcdfac75df0fd1cf2cbb02adb';

            try {
                // 1. Obtener Token de Autorización WeLock
                const authRes = await axios.post('https://api.we-lock.com/API/Auth/Token', {
                    appID: WL_APP_ID, 
                    secret: WL_SECRET
                });

                if (authRes.data.code !== 0) {
                    console.error('[LockPush] Error Auth WeLock:', authRes.data)
                    return { pushed: false, reason: 'auth_error' };
                }
                const token = authRes.data.data.accessToken;

                // 2. Obtener el nombre Bluetooth (Obligatorio para la API de contraseñas offline)
                const libraryRes = await axios.post('https://api.we-lock.com/API/Device/DeviceLibrary',
                    { appID: WL_APP_ID },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                
                const targetDevice = libraryRes.data.data.find((d: any) => d.deviceNumber === lockId.toString());
                if (!targetDevice || !targetDevice.bluetooth || targetDevice.bluetooth.length === 0) {
                    console.error(`[LockPush] La cerradura ${lockId} no se encuentra en la cuenta WeLock.`)
                    return { pushed: false, reason: 'device_not_found_in_welock' };
                }
                // Cogemos el nombre Bluetooth principal de esa cerradura
                const bleName = targetDevice.bluetooth[0].deviceName;

                // 3. Formatear fechas (WeLock EXIGE que los minutos terminen en 00, 15, 30 o 45)
                const pad = (n: number) => n < 10 ? '0' + n : n;
                const formatWeLockMinutes = (d: Date) => pad(Math.floor(d.getMinutes() / 15) * 15);
                const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${formatWeLockMinutes(d)}`;

                const startDate = new Date();
                const endDate = new Date();
                // Usamos los días de vigencia que llegan de la página web (o 30 por defecto)
                const validDays = Number(days) > 0 ? Number(days) : 30; 
                endDate.setDate(startDate.getDate() + validDays);

                // 4. Solicitar el Código Offline Matemático
                console.log(`[LockPush] Solicitando PIN offline para la cerradura ${lockId} (Bluetooth: ${bleName})...`);
                
                const pwdRes = await axios.post('https://api.we-lock.com/API/Device/DeviceTempPassword', {
                    appID: WL_APP_ID,
                    deviceNumber: lockId.toString(),
                    deviceBleName: bleName,
                    startingTime: formatDate(startDate),
                    endTime: formatDate(endDate),
                    tempType: 0 // 0 = Modo Continuo (Válido a cualquier hora dentro de la fecha seleccionada)
                }, { headers: { 'Authorization': `Bearer ${token}` } });

                // 5. Evaluar respuesta final
                if (pwdRes.data.code === 0) {
                    const generatedPin = pwdRes.data.data;
                    console.log('[LockPush] ¡Éxito! Código WeLock Offline Generado:', generatedPin);
                    
                    // IMPORTANTE: Devolvemos un mensaje formateado para que el frontend lo muestre claro
                    return { 
                        pushed: true, 
                        reason: 'ok', 
                        info: { pin: generatedPin },
                        msg: `<span style="font-size: 16px;">Válido hasta: ${formatDate(endDate)}</span><br/><br/><strong style="font-size: 24px; color: #28a745;">PIN OFFLINE: ${generatedPin}</strong>`
                    }
                } else {
                    console.error('[LockPush] WeLock rechazó la creación del PIN:', pwdRes.data);
                    return { pushed: false, reason: 'api_error', info: pwdRes.data }
                }

            } catch (apiError: any) {
                console.error('[LockPush] Error de red conectando a la API WeLock:', apiError?.response?.data || apiError.message);
                return { pushed: false, reason: 'api_request_failed' }
            }

        } catch (err) {
            console.error('[LockPush] Exception general:', err)
            return { pushed: false, reason: 'exception', error: err }
        }
    }
}

const LockPushInstance = new LockPush()
Object.freeze(LockPushInstance)

export default LockPushInstance