import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType, TypeDeviceType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IDeviceReport } from "../models/IDeviceReport"
import { IModel } from "../helpers/IModel"
import UtilInstance from "../helpers/Util"
import { error } from "console"
import { IDeviceReportDetails } from "../models/IDeviceReportDetails"

class DeviceReportDetailsDataAccess implements IDataAccess<IDeviceReportDetails> {
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
    async get(): Promise<Array<IDeviceReportDetails> | IErrorResponse> {
        // const queryData  = {
        //         name: 'get-reporte-devices',
        //         text: ` SELECT rd.*
        //                 FROM ${Constants.tbl_reporte_atic_sql} rd
        //                 ORDER BY rd.id DESC
        //                 `,
        //         values: []
        // }

        // let lData: Array<IDeviceReport | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDeviceReport | IErrorResponse>
        
        // if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        // return lData as Array<IDeviceReport>
        throw new Error("Method not implemented.")
    }

    async getById(id: BigInt): Promise<IDeviceReportDetails | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IDeviceReportDetails): Promise<IDeviceReportDetails | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id : BigInt ,data: IDeviceReportDetails): Promise<IDeviceReportDetails | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async updateID_reporte(id: BigInt, id_reporte : BigInt , data: IDeviceReportDetails): Promise<IDeviceReportDetails | IErrorResponse> {
        
        let responseD = await this.client.execQueryPool(async(client) : Promise <Array<IModel | IErrorResponse>> =>{

            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            
            let queryData = {
                name : 'update-device-report-details',
                text : `UPDATE ${Constants.tbl_detalle_reporte_atic_sql} SET
                        state = $1, 
                        fecha_ultimo_cambio = $2, 
                        id_piso = $3
                        WHERE id = $4 AND id_reporte = $5 RETURNING *`,
                values : [
                    data.state, 
                    timeStampCurrent,
                    data.id_piso,
                    id,
                    id_reporte
                ]
            }

            let lData = (await client.query(queryData)).rows as Array<IDeviceReportDetails | IErrorResponse>
            console.log(data,"id", id , "idReporte" , id_reporte)
            if(lData && lData.length === 0 ){
                console.log("aaaaaaaa", lData)
                const queryInsert = {
                    name : "insert-device-report-dataAccess",
                    text : `INSERT INTO ${Constants.tbl_detalle_reporte_atic_sql}
                            (id_reporte , id_piso , id_device , state , fecha_ultimo_cambio)
                            VALUES ($1,$2,$3,$4,$5) RETURNING *`,
                    values : [
                        id_reporte,
                        data.id_piso,
                        data.id_device,
                        data.state,
                        timeStampCurrent
                    ]
                }
            let lData2 = (await client.query(queryInsert)).rows as Array<IDeviceReportDetails | IErrorResponse>
                console.log("ldata2", lData2)
            }
            return lData
        } )
        return (responseD[0]) as IDeviceReportDetails | IErrorResponse
    }

    async delete(id: BigInt): Promise<IDeviceReportDetails | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Retorna el reporte de los dispositivos
     * NO PERTENE AL METODO
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
     * Retorna los detalles de un reporte
     * @param idReport 
     * @returns 
     */
    async getAllByIdReport(idReport: BigInt, lTypeDeviceCodes?: Array<TypeDeviceType>): Promise<Array<IDeviceReportDetails> | IErrorResponse> {
        let _lTypesDevicesCodes = lTypeDeviceCodes || []
        
        const queryData  = {
            name: 'get-details-report-by-idreport',
            text: ` 
                    SELECT rdd.*
                    FROM ${Constants.tbl_detalle_reporte_atic_sql} rdd
                    INNER JOIN ${Constants.tbl_piso_sql} p on p.id = rdd.id_piso AND p.estado = 1
                    INNER JOIN ${Constants.tbl_dispositivo_sql} d ON d.id = rdd.id_device AND d.estado = 1
                    INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} td ON td.id = d.idtipodispositivo
                    WHERE rdd.id_reporte = $1 AND
                    (td.codigo = ANY($2::character varying[]) OR $3 = 0)
                    ORDER BY rdd.id
                    `,
            values: [
                        idReport,
                        _lTypesDevicesCodes,
                        _lTypesDevicesCodes.length
                    ]
        }

        let lData: Array<IDeviceReportDetails | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDeviceReportDetails | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IDeviceReportDetails>
    }
}

export default DeviceReportDetailsDataAccess
