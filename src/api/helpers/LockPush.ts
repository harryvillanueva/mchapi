import DeviceBusiness from '../business/DeviceBusiness'
import UtilInstance from './Util'
import ParametrosGeneralesBusiness from '../business/ParametrosGeneralesBusiness'
import EWeLinkInstance from './EWeLink'
import Constants from './Constants'
import axios from 'axios'

class LockPush {
    constructor() {}

    /**
     * Intento de push del código al dispositivo tipo Lock (TTLock/WeLock).
     * Si no hay configuración de TTLock, se limita a dejar un log.
     */
    async pushCodeToLock(opts: { idDevice: number, idApartment?: number, code: string }) {
        try {
            const { idDevice, code } = opts
            console.log('[LockPush] pushCodeToLock -> device:', idDevice, 'code:', code)

            // Obtener datos del dispositivo
            const deviceBusiness = new DeviceBusiness(BigInt(1), 1, false)
            const deviceDB = await deviceBusiness.getById(BigInt(idDevice))
            if (!deviceDB || (deviceDB as any).error) {
                console.log('[LockPush] Device not found in DB for id:', idDevice)
                return { pushed: false, reason: 'device_not_found' }
            }

            const device: any = deviceDB

            // Detectar tipo de dispositivo
            const deviceType = (device.type || device.tdevice || '').toString().toLowerCase()

            // Manejo para dispositivos Sonoff / eWeLink
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

            // Detectar si es TTLock / external lock
            if (!deviceType.includes('ttlock') && !deviceType.includes('lock') && !deviceType.includes('welock')) {
                console.log('[LockPush] Device type not supported for push:', deviceType)
                return { pushed: false, reason: 'unsupported_device_type', deviceType }
            }

            // Necesitamos identificador del lock en la nube (lockId / mac / serial)
            const info = device.info_extra || {}
            const lockId = info.lockId || info.lock_id || device.codigo || device.ref_dispositivo || null
            if (!lockId) {
                console.log('[LockPush] No lock identifier found on device.info_extra or device.codigo')
                return { pushed: false, reason: 'no_lock_identifier' }
            }

            // Comprobar variables de entorno para integración TTLock
            const TT_CLIENT_ID = process.env.TTLOCK_CLIENT_ID || ''
            const TT_CLIENT_SECRET = process.env.TTLOCK_CLIENT_SECRET || ''
            if (!TT_CLIENT_ID || !TT_CLIENT_SECRET) {
                console.log('[LockPush] TTLock credentials are not configured. Set TTLOCK_CLIENT_ID and TTLOCK_CLIENT_SECRET')
                return { pushed: false, reason: 'no_credentials' }
            }

            // Placeholder: aquí deberíamos implementar el flujo de autenticación y la llamada a la API TTLock
            // Para no enviar peticiones inesperadas, hacemos un log detallado y retornamos un status indicando que
            // falta completar la integración con las credenciales y los endpoints de TTLock.
            console.log('[LockPush] Credentials present. To complete integration: implement TTLock OAuth + addPass API call')
            console.log('[LockPush] Would push to lockId:', lockId, 'with code:', code)

            return { pushed: false, reason: 'not_implemented', info: { lockId } }
        } catch (err) {
            console.error('[LockPush] Exception:', err)
            return { pushed: false, reason: 'exception', error: err }
        }
    }

    // Implementación futura: obtener token de TTLock
    async getTTLockToken(clientId: string, clientSecret: string) {
        // TODO: Implementar OAuth 2.0 con TTLock y devolver access_token
        return null
    }
}

const LockPushInstance = new LockPush()
Object.freeze(LockPushInstance)

export default LockPushInstance
