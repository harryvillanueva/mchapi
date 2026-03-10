import { deviceWeLink, resulteWeLink } from '../types/GlobalTypes'
import axios from "axios"
import UtilInstance from './Util'

class EWeLink {
    public region = 'eu'
    public domain = 'eu-apia.coolkit.cc'
    public familyId = '60ec2a2e860d94000952f43a'
    public appId = 'nEbQNXDsW1em0jN3Z2t9MMOrBoLBfTgD' // hola soy jaqui debes de borrar la app id antes en ewelink dev de ahi creas una nueva app y cambias estos parametros luego debes autentificar como en el tutorial
    public appSecret = 'X3RgnRo7lpSXqtpiUdzZg0hrlu96zcVg'

    constructor() {}

    /**
     * https://coolkit-technologies.github.io/eWeLink-API/#/en/PlatformOverview
     * @param length 
     * @returns 
     */
    randomWord(length: number): string {
        let str = ""
        let arr = [
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l','m', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L','M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ]

        for (let i = 0; i < length; i++) {
            let pos = Math.round(Math.random() * (arr.length - 1))
            str += arr[pos]
        }

        return str;
    }

    async getListDeviceOLD(token: string): Promise<Array<deviceWeLink>> {
        let pathOne = `https://${EWeLinkInstance.domain}/v2/device/thing?familyid=${EWeLinkInstance.familyId}&beginIndex=-999999`
        let pathTwo = `https://${EWeLinkInstance.domain}/v2/device/thing?familyid=${EWeLinkInstance.familyId}&beginIndex=-16`
        //thingStore/getAllDevice
        // let pathThree = 
        
        let result: Array<deviceWeLink> = []
        try {
            let _config = {
                url: `${pathOne}`,
                method: 'GET',
                headers: {
                    'X-CK-Nonce': `${EWeLinkInstance.randomWord(8)}`,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
            const responseOne = await axios(_config)

            console.log(responseOne.data.total)

            _config = {
                url: `${pathTwo}`,
                method: 'GET',
                headers: {
                    'X-CK-Nonce': `${EWeLinkInstance.randomWord(8)}`,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
            const responseTwo = await axios(_config)

            let data = [...(responseOne.data.data.thingList as Array<any>), ...(responseTwo.data.data.thingList as Array<any>)]
            data.forEach(el => {
                let data: deviceWeLink = {
                    name: el.itemData.name,
                    deviceid: el.itemData.deviceid,
                    online: el.itemData.online,
                    params: {
                        switch: el.itemData.params.switch,
                        pulse: el.itemData.params.pulse
                    }
                }
                result.push(data)
            })
        } catch (error) {}

        // console.log(result)

        return result
    }


    async getListDevice(token: string): Promise<Array<deviceWeLink>> {
        let _numPage = 30
        let _index = -999999

        let result: Array<deviceWeLink> = []
        try {
            let data: Array<any> = []
            let _cont = 1
            while ( true ) {
                let _path = `https://${EWeLinkInstance.domain}/v2/device/thing?familyid=${EWeLinkInstance.familyId}&num=${_numPage}&beginIndex=${_index}`
                const maskedToken = token ? `${token.toString().slice(0,8)}...` : 'null'
                console.log('🟨 [EWELINK] Llamando a eWeLink API:', _path)
                console.log('🟨 [EWELINK] Usando token (masked):', maskedToken)
                let _config = {
                    url: `${_path}`,
                    method: 'GET',
                    headers: {
                        'X-CK-Nonce': `${EWeLinkInstance.randomWord(8)}`,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }

                let _responseEwelink = await axios(_config)
                console.log('🟨 [EWELINK] Respuesta de eWeLink:', _responseEwelink.status, _responseEwelink.data)

                // Protecciones si la respuesta no tiene la estructura esperada
                const respData = _responseEwelink.data && _responseEwelink.data.data ? _responseEwelink.data.data : {}
                const _total = respData && typeof respData.total !== 'undefined' ? Number(respData.total) : 0
                const _listData = Array.isArray(respData.thingList) ? respData.thingList : []
                const _nroPages = _total > 0 ? Math.ceil(_total / _numPage) : 0
                console.log('🟨 [EWELINK] Total:', _total, 'Páginas:', _nroPages)

                // Si no hay lista, evitamos errores y rompemos el bucle
                if (!_listData || _listData.length === 0) {
                    // añadimos lo que venga (vacío) y salimos
                    data = [ ...data, ..._listData ]
                    break
                }

                data = [ ...data, ..._listData ]

                if ( _nroPages === 1 || _nroPages === 0 ) break
                else {
                    if ( _cont >= _nroPages ) break
                    _cont++
                    // proteger acceso al índice
                    if (_listData.length >= _numPage && _listData[_numPage-1] && typeof _listData[_numPage-1].index !== 'undefined') {
                        _index = _listData[_numPage-1].index // last element
                    } else if (_listData.length > 0 && typeof _listData[_listData.length-1].index !== 'undefined') {
                        _index = _listData[_listData.length-1].index
                    } else {
                        break
                    }
                }
            }

            data.forEach(el => {
                try {
                    let data: deviceWeLink = {
                        name: el.itemData.name,
                        deviceid: el.itemData.deviceid,
                        online: el.itemData.online,
                        params: {
                            switch: el.itemData.params.switch,
                            pulse: el.itemData.params.pulse
                        }
                    }
                    result.push(data)
                } catch (err) {
                    // Ignorar elementos malformados
                }
            })
        } catch (error) {
            console.error('🔴 [EWELINK] Error en getListDevice:', error)
            if (axios.isAxiosError(error)) {
                console.error('🔴 [EWELINK] Respuesta del servidor:', error.response?.status, error.response?.data)
            }
        }

        return result
    }

    /**
     * Retorna información de la última conexion a los servidores de eWeLink
     * Si el SonOff esta fuera de linea, retorna un switch: off
     * Al intentar cambiar el estado, si el error es 4002, el dispositivo esta desconectado
     * @param token 
     * @param idDevice 
     * @returns 
     */
    async getLastStatus(token: string, idDevice: string): Promise<resulteWeLink> {
        let path = `https://${EWeLinkInstance.domain}/v2/device/thing/status?type=1&id=${idDevice}&params=switch|pulse`

        let result: resulteWeLink = {
            error: -1,
            msg: 'Error desconocido!!'
        }

        try {
            const _config = {
                url: `${path}`,
                method: 'GET',
                headers: {
                    'X-CK-Nonce': `${EWeLinkInstance.randomWord(8)}`,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            const response = await axios(_config)
            result = response.data as resulteWeLink
        } catch (error) {}

        return result
    }

    async getCurrentStatus(token: string, idDevice: string): Promise<resulteWeLink> {
        let result: resulteWeLink = {
            error: -1,
            msg: 'Error desconocido!!'
        }

        try {
            console.log('🟨 [EWELINK] Obteniendo lista de dispositivos de eWeLink...')
            const lDeviceEWeLink: Array<deviceWeLink> = await EWeLinkInstance.getListDevice(token)
            console.log('🟨 [EWELINK] Total dispositivos encontrados:', lDeviceEWeLink.length)
            console.log('🟨 [EWELINK] Dispositivos:', lDeviceEWeLink.map(d => ({ name: d.name, deviceid: d.deviceid, online: d.online })))
            console.log('🟨 [EWELINK] Buscando dispositivo con ID:', idDevice)

            let data = lDeviceEWeLink.find( el => el.deviceid === idDevice )
            if ( data ) {
                console.log('🟢 [EWELINK] Dispositivo encontrado:', data.name)
                result = {
                    error: 0,
                    msg: '',
                    data: { ...data }
                }
            } else {
                console.log('🔴 [EWELINK] Dispositivo NO encontrado en lista de eWeLink')
            }
        } catch (error) {
            console.error('🔴 [EWELINK] Error obteniendo dispositivos:', error)
        }

        return result
    }

  async setStatus(token: string, idDevice: string): Promise<resulteWeLink> {
        let result: resulteWeLink = { error: -1, msg: 'Error desconocido!!' };
        
        // 1. OBTENER EL ESTADO ACTUAL PARA SABER SI HAY QUE APAGAR O ENCENDER
        const statusDevice = await EWeLinkInstance.getCurrentStatus(token, idDevice);
        if (statusDevice.error !== 0) return statusDevice;

        let path = `https://${EWeLinkInstance.domain}/v2/device/thing/status`;
        
        const headers: Record<string, string> = {
            'X-CK-Appid': 'nEbQNXDsW1em0jN3Z2t9MMOrBoLBfTgD',
            'X-CK-Nonce': `${Math.random().toString(36).substring(2, 10)}`,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. CONFIGURAR LA ORDEN CONTRARIA (Toggle)
        let data1CH: any = { type: 1, id: idDevice, params: {} };
        let dataMultiCH: any = { type: 1, id: idDevice, params: {} };

        // Extraemos params de forma segura engañando a TypeScript con 'any'
        const currentParams: any = statusDevice.data?.params || {};

        if (currentParams.switches) {
            // Dispositivo Multicanal
            let currentState = currentParams.switches[0].switch;
            let targetState = currentState === 'on' ? 'off' : 'on';
            dataMultiCH.params.switches = [{ outlet: 0, switch: targetState }];
            
            // Lógica forzada de "pulso" para portales
            data1CH.params.switch = 'on'; 
        } else {
            // Dispositivo 1 Canal (La luz normal)
            let currentState = currentParams.switch || 'off';
            let targetState = currentState === 'on' ? 'off' : 'on';
            data1CH.params.switch = targetState;
            dataMultiCH.params.switches = [{ outlet: 0, switch: targetState }];
        }

        try {
            console.log(`[EWELINK] Solicitando cambio de estado...`);
            let response = await axios({ url: path, method: 'POST', headers, data: JSON.stringify(data1CH) });
            let _result = response.data as resulteWeLink;
            
            // Si rechaza con 4002, reintentamos con el formato multicanal
            if (_result.error === 4002) {
                console.log(`[EWELINK] Rechazado. Reintentando formato multicanal...`);
                headers['X-CK-Nonce'] = `${Math.random().toString(36).substring(2, 10)}`;
                response = await axios({ url: path, method: 'POST', headers, data: JSON.stringify(dataMultiCH) });
                _result = response.data as resulteWeLink;
            }
            
            result = { ...result, error: _result.error, msg: _result.msg, data: _result.data };

        } catch (error) {
            console.error('🔴 [EWELINK] Error crítico:', error instanceof Error ? error.message : error);
        }

        return result;
    }

    async refreshToken(refreshToken: string): Promise<resulteWeLink> {
        let path = `https://${EWeLinkInstance.domain}/v2/user/refresh`

        let result: resulteWeLink = {
            error: -1,
            msg: 'Error desconocido!!'
        }

        let data = { rt: refreshToken }

        try {
            const _config = {
                url: `${path}`,
                method: 'POST',
                headers: {
                    'X-CK-Appid': `${EWeLinkInstance.appId}`,
                    'X-CK-Nonce': `${EWeLinkInstance.randomWord(8)}`,
                    'Authorization': `Sign ${UtilInstance.createSign(EWeLinkInstance.appSecret, JSON.stringify(data))}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
            };
            const response = await axios(_config)
            console.log(response.data)
            let _result = response.data as resulteWeLink
            // if ( _result.error === 4002 ) _result.msg = 'Dispositivo desconectado'
            // result = { ...result, error: _result.error, msg: _result.msg }
            result = { ..._result }
        } catch (error) {}

        return result
    }
}

const EWeLinkInstance = new EWeLink()
Object.freeze(EWeLinkInstance)

export default EWeLinkInstance