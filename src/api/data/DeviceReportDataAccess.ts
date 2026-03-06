import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IDeviceReport } from "../models/IDeviceReport"
import { IModel } from "../helpers/IModel"
import UtilInstance from "../helpers/Util"
import { error } from "console"
import { IDeviceReportDetails } from "../models/IDeviceReportDetails"

class DeviceReportDataAccess implements IDataAccess<IDeviceReport> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    /**
     * Por el momento, vamos a mostrar los últimos 10 registros ordenados DESC
     * @returns 
     */
    async get(): Promise<Array<IDeviceReport> | IErrorResponse> {
        const queryData  = {
                name: 'get-reporte-devices',
                text: ` SELECT rd.*
                        FROM ${Constants.tbl_reporte_atic_sql} rd
                        ORDER BY rd.id DESC
                        `,
                values: []
        }

        let lData: Array<IDeviceReport | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDeviceReport | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IDeviceReport>
    }

    async getById(id: BigInt): Promise<IDeviceReport | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IDeviceReport): Promise<IDeviceReport | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: IDeviceReport): Promise<IDeviceReport | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<IDeviceReport | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Crea el reporte con el respectivo estado de los dispositivos
     * @returns 
     */
    async insertBulk(data: IDeviceReport): Promise<IDeviceReport | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                name: 'insert-device-report',
                text: `INSERT INTO ${Constants.tbl_reporte_atic_sql}(
                        fecha, 
                        tipo
                        )
                        VALUES($1,$2) RETURNING *`,
                values: [   timeStampCurrent, 
                            data.tipo
                        ]
            }
            let lData = (await client.query(queryData)).rows as Array<IDeviceReport | IErrorResponse>
            let reportDB = lData[0]

            // Verificamos que haya un listado de dispositivos
            if ( reportDB && data.ldetalle && data.ldetalle!.length !== 0 ) {
                const idDataDB = (reportDB as IDeviceReport).id!
                // Asocia el estado de los dispositivos a reporte
                for (let i = 0; i < data.ldetalle!.length; i++) {
                    const queryData = {
                        name: 'insert-details-report',
                        text: `INSERT INTO ${Constants.tbl_detalle_reporte_atic_sql} ( 
                                    id_reporte, 
                                    id_piso, 
                                    id_device, 
                                    state,
                                    fecha_ultimo_cambio
                                )
                                VALUES($1,$2,$3,$4,$5) RETURNING *`,
                        values: [ 
                                    idDataDB,
                                    data.ldetalle![i].id_piso,
                                    data.ldetalle![i].id_device, 
                                    data.ldetalle![i].state,
                                    timeStampCurrent
                                ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<IDeviceReportDetails | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lData = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            } else throw new Error('No hay dispositivos')

            return lData
        })

        return ( responseD[0] ) as IDeviceReport | IErrorResponse
    }

    /**
     * Retorna el reporte de los dispositivos
     * @returns 
     */
    async getAllWithPagination(): Promise<Array<IDeviceReport> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1

        const queryData  = {
            name: 'get-devices-state-report',
            text: ` 
                    SELECT rd.id,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( rd.fecha, 'DD/mon/YYYY HH24:MI:SS'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha,
                    rd.tipo
                    FROM ${Constants.tbl_reporte_atic_sql} rd
                    WHERE date(rd.fecha) BETWEEN $1 AND $2
                    ORDER BY rd.fecha DESC
                    LIMIT $3 OFFSET $4
                    `,
            values: [
                        filter_m_start,
                        filter_m_end,
                        limit,
                        offset
                    ]
        }

        let lData: Array<IDeviceReport | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDeviceReport | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IDeviceReport>
    }

    /**
     * Retorna el último reporte creado, caso contrario retorna undefine
     * Metodo para crear el último reporte y crear una copia de los estados de los dispositivos,
     * especialmente de la bateria de las manijas
     */
    async getLastReport(): Promise<IDeviceReport | IErrorResponse> {
        const queryData  = {
                name: 'get-last-report',
                text: ` SELECT rd.*,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( rd.fecha, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS onlydate
                        FROM ${Constants.tbl_reporte_atic_sql} rd
                        ORDER BY rd.id DESC
                        `,
                values: []
        }

        let lData: Array<IDeviceReport | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDeviceReport | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData[0]
    }
}

export default DeviceReportDataAccess
