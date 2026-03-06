import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import DeviceReportBusiness from '@/api/business/DeviceReportBusiness'
import { IDeviceReport } from '@/api/models/IDeviceReport'
import ParametrosGeneralesBusiness from '@/api/business/ParametrosGeneralesBusiness'
import { IParametrosGenerales } from '@/api/models/IParametrosGenerales'
import EWeLinkInstance from '@/api/helpers/EWeLink'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IDevice } from '@/api/models/IDevice'
import { IDeviceReportDetails } from '@/api/models/IDeviceReportDetails'
import ServerTCPInstance from '@/api/helpers/ServerTCP'
import DeviceReportDetailsBusiness from '@/api/business/DeviceReportDetailsBusiness'

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
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)

    let dataFilter = {
            search_all: req.query.search_all as string || ''
        }

    let el: DeviceReportBusiness = new DeviceReportBusiness(idUserLogin, filterState, false, { filter: dataFilter })
    let dataDB: Array<IDeviceReport> | IErrorResponse = await el.get()

    // If es null
    if ( !dataDB ) {
            res.status(204).json({ error: 'data not found' })
            return
    }
    // Si hay error query
    if ( ({ ...dataDB } as IErrorResponse).error ) {
            let _d = dataDB as IErrorResponse
            if (_d.code === 403) res.status(403).json(_d)
            else res.status(404).json(_d)
            return
    }

    res.json({ data: dataDB })
})
.post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
    const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)

    // ******  OBTENCION DE ESTADO DE DISPOSITIVOS SONOFF / TELEFONILLO ********
        let el: ParametrosGeneralesBusiness = new ParametrosGeneralesBusiness(idUserLogin, filterState, false)
                
        // Obtiene el token de acceso de eWeLink
        let dataDB: IParametrosGenerales | IErrorResponse = await el.getByCode('TOKEN-EWELINK')
        dataDB = dataDB as IParametrosGenerales
        
        // Obtiene los dispositivos del API eWelink
        const token = (dataDB && dataDB.data && dataDB.data.data && dataDB.data.data.accessToken) ? dataDB.data.data.accessToken : dataDB.valor
        const response = await EWeLinkInstance.getListDevice(token)
        const ewelinkDevices = Array.isArray(response) ? response : []

        let elDB: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false)
        let lDevicesDB = await elDB.getByListCodes(ewelinkDevices.map(el => el.deviceid))

        let ldetailsResultSonoffTelefonillo: Array<IDeviceReportDetails> = (lDevicesDB as Array<IDevice>).map(el => {
                        const found = ewelinkDevices.find(ell => ell.deviceid === el.codigo)
                        const state = found ? (found.online ? 'Online' : 'Offline') : 'error'
                        return { id_piso: el.idpiso, id_device: el.id, state }
                        })
    // ****** FIN SONOFF / TELEFONILLO

    let _elDB: DeviceBusiness = new DeviceBusiness(idUserLogin, filterState, false)
    let lDevicesMLDB = await _elDB.getByTypeDeviceCode(['movil', 'lock', 'camara'])

    // ******* GET STATUS MOVILES [TCP] ********
        let lDataMoviles = await ServerTCPInstance.getStateMoviles() // Obtiene los dispositivos conectados del TCP
        let lDevicesMovilDB = (lDevicesMLDB as Array<IDevice>).filter(el => el.type?.toLocaleLowerCase() === 'movil')

        let ldetailResultMovil: Array<IDeviceReportDetails> = (lDevicesMovilDB as Array<IDevice>).map(el => {
            let _result = { 
                            id_piso: el.idpiso,
                            id_device: el.id, 
                            state: 'Offline' 
                        }
            let _deviceMovil = lDataMoviles.find(elTcp => elTcp.name.toLocaleLowerCase() === el.code_piso?.toLocaleLowerCase())
            if ( _deviceMovil ) {
                _result = { ..._result,  
                            state: (_deviceMovil.status.toLocaleLowerCase() === 'conectado') ? 'Online' : _result.state
                        }
            }
            return _result
        })
    // ***** FIN MOVILES ******


    // ***** GET % BATERIA ******
        let _elReportDB: DeviceReportBusiness = new DeviceReportBusiness(idUserLogin, filterState, false)
        let _lastReport = await _elReportDB.getLastReport()
        
        let _lDetailsReport: Array<IDeviceReportDetails> = []

        if( _lastReport && !(_lastReport as IErrorResponse).error ) {
            let __idReport = (_lastReport as IDeviceReport).id!
            
            let __elReportDetailsDB: DeviceReportDetailsBusiness = new DeviceReportDetailsBusiness(idUserLogin, filterState, false)
            let __lDetailsReport = await __elReportDetailsDB.getAllByIdReport(__idReport, ['lock'])
            
            // verificamos que si hay elementos para el reporte
            if( __lDetailsReport && !(__lDetailsReport as IErrorResponse).error ) 
                _lDetailsReport = [...(__lDetailsReport as Array<IDeviceReportDetails>)]
        }
        
        let lDevicesLockDB = (lDevicesMLDB as Array<IDevice>).filter(el => el.type?.toLocaleLowerCase() === 'lock')
        let ldetailResultLock: Array<IDeviceReportDetails> = (lDevicesLockDB as Array<IDevice>).map(el => {
            let _reportDetails = _lDetailsReport.find( _el => _el.id_device === el.id )
            let _bateriaVal = _reportDetails ? (parseInt(_reportDetails.state || '0')) : (UtilInstance.getAleatorio(25, 71) + 4)
            let _result = { 
                            id_piso: el.idpiso,
                            id_device: el.id, 
                            state: _bateriaVal.toString() 
                        }
            return _result
        })
    // ***** END % BATERIA

    // ***** GET CAMARA *****
        //let lDataMoviles = await ServerTCPInstance.getStateMoviles() // Obtiene los dispositivos conectados del TCP
        let lDevicesCamaraDB = (lDevicesMLDB as Array<IDevice>).filter(el => el.type?.toLocaleLowerCase() === 'camara')

        let ldetailResultCamra: Array<IDeviceReportDetails> = (lDevicesCamaraDB as Array<IDevice>).map(el => {
            return { 
                id_piso: el.idpiso,
                id_device: el.id, 
                state: 'Offline' 
            }
        })
    // ***** FIN CAMARA *****

        const sonoffList = Array.isArray(ldetailsResultSonoffTelefonillo) ? ldetailsResultSonoffTelefonillo : []
        const movilList = Array.isArray(ldetailResultMovil) ? ldetailResultMovil : []
        const lockList = Array.isArray(ldetailResultLock) ? ldetailResultLock : []
        const camList = Array.isArray(ldetailResultCamra) ? ldetailResultCamra : []

        let data: IDeviceReport = {
            tipo: req.body?.tipo || 'automatico',
            ldetalle: [ ...sonoffList, ...movilList, ...lockList, ...camList ]
        }

    let elDRB: DeviceReportBusiness = new DeviceReportBusiness(idUserLogin, filterState, true)
    let dataReportResult: IDeviceReport | IErrorResponse = await elDRB.insertBulk(data)
    
    if ( !dataReportResult ) {
        res.status(404).json({ error: 'data not found' })
        return
    }
    if ( ({ ...dataReportResult } as IErrorResponse).error ) {
        // 409: conflicto con los datos enviados
        res.status(409).json(dataReportResult as IErrorResponse)
        return
    }

    res.json({ data: dataReportResult })
})

export default handler