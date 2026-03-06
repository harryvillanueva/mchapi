import { deviceTypeMovil, deviceWeLink, resulteWeLink } from '../types/GlobalTypes'
import axios from "axios"
import UtilInstance from './Util'

class ServerTCP {
    private _isDev

    constructor() {
        this._isDev = process.argv.slice(2)[0] === 'dev'
    }

    async getStateMoviles(): Promise<Array<deviceTypeMovil>> {
        let _hostTCP = ( this._isDev ) ? process.env.POSTGRES_DEV_TCP : process.env.POSTGRES_PROD_TCP
        let pathTCP = `${_hostTCP}/devices/all`

        let result: Array<deviceTypeMovil> = []
        
        try {
            let _config = {
                url: `${pathTCP}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const responseOne = await axios(_config)
            result = responseOne.data as Array<deviceTypeMovil>
            // console.log(responseOne.data)

        } catch (error) {}

        return result
    }
}

const ServerTCPInstance = new ServerTCP()
Object.freeze(ServerTCPInstance)

export default ServerTCPInstance