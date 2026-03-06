import DbConnection from "../helpers/DbConnection";
import { IDataAccess } from "../helpers/IDataAccess";
import UtilInstance from "../helpers/Util";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import Constants from "../helpers/Constants";
import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";
import IVacaciones from "../models/IVacaciones";

class VacacionesDataAccess implements IDataAccess<IVacaciones>{
    public client : DbConnection

    constructor(
        public idUserLogin : BigInt,
        public filterStatus : StatusDataType,
        public isTransactions : boolean,
        public infoExtra? : any){
            this.client = new DbConnection(isTransactions)
        }



    async get(): Promise <Array <IVacaciones> | IErrorResponse>{

        if (!this.infoExtra) this.infoExtra = { filter : {} }
        else if(!this.infoExtra!.filter) this.infoExtra = {filter : {} }

        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        

        const queryData = {
            name : 'get-vacaciones',
            text: `SELECT sv.id , sv.idusuario, usu.nombre_completo, sv.estado,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( sv.fecha_inicio, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha_inicio,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( sv.fecha_final, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha_final,
                                (
                            CASE 
                                when sv.estado = 0 THEN 'En espera'
                                when sv.estado = 1 THEN 'Aprobada'
                                when sv.estado = 2 THEN 'Rechazada' 
                            END
                            ) as estado
                            FROM tbl_solicitud_vacaciones sv
                            LEFT JOIN tbl_usuario usu ON usu.id = sv.idusuario
                            WHERE sv.fecha_inicio BETWEEN $1 AND $2
                            ORDER BY sv.estado ASC

                    `,
            values : [
                filter_m_start,
                filter_m_end
            ]
        }

        let lData : Array <IVacaciones | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IVacaciones | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IVacaciones>
    }


    async getWithPagination(): Promise <Array<IVacaciones> | IErrorResponse>{
        if (!this.infoExtra) this.infoExtra = { filter : {} }
        else if ( !this.infoExtra!.filter ) this.infoExtra = { filter : {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let limit = this.infoExtra.filter.limit || 50
        let offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1
        let _search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name : 'get-vacaciones',
            text: `
                    SELECT sr.id , sr.idusuario, usu.nombre_completo,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( sr.fecha_inicio, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha_inicio,
 					REPLACE(REPLACE(REPLACE(REPLACE(to_char( sr.fecha_final, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha_final,
                    (
                    CASE 
                        when sr.estado_solicitud = 0 THEN 'En espera'
                        when sr.estado_solicitud = 1 THEN 'Aprobada'
                        when sr.estado_solicitud = 2 THEN 'Rechazada' 
                    END
                    ) as estado_solicitud
                    FROM tbl_solicitud_rrhh sr
                    INNER JOIN tbl_usuario usu ON usu.id = sr.idusuario
                    WHERE sr.fecha_inicio BETWEEN $1 AND $2
                    AND sr.estado = 1 AND
                    (
                    UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                    UNACCENT(lower( replace(trim(
                                                    (
                                                        CASE 
                                                        when sr.estado_solicitud = 0 THEN 'En espera'
                                                        when sr.estado_solicitud = 1 THEN 'Aprobada'
                                                        when sr.estado_solicitud = 2 THEN 'Rechazada' 
                                                        END
                                                    )
                                                        ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                    $3 = ''  
                    )
                    ORDER BY sr.estado_solicitud ASC, sr.fecha_inicio  asc
                    LIMIT $4 OFFSET $5

                    `,
            values : [
                filter_m_start,
                filter_m_end,
                _search_all === '' ? '' : `%${_search_all}%`,
                limit,
                offset
            ]
        }

        let lData : Array <IVacaciones | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IVacaciones | IErrorResponse>

        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IVacaciones>
    }



    async getById(id: BigInt): Promise<IVacaciones| IErrorResponse> {
        
        const queryData = {
            name : 'get-vacaciones-x-id',
            text: `SELECT sv.id, sv.idusuario, sv.descripcion, usu.nombre_completo, sv.fecha_inicio, sv.fecha_final ,sv.fecha_creacion, sv.estado_solicitud
            FROM ${Constants.tbl_solicitud_rrhh_sql} sv
            INNER JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = sv.idusuario)
            WHERE sv.id = $1`,
            values : [
                id
            ]
        }

        let lData : Array <IVacaciones | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IVacaciones | IErrorResponse>
        
        return lData[0]
    }


    async getSolicitudxUser(): Promise<Array<IVacaciones> | IErrorResponse>{
        
                const queryData = {
                    name : 'get-vacaciones-x-id',
                    text: `SELECT sv.id, sv.idusuario, usu.nombre_completo, sv.fecha_inicio, sv.fecha_final ,sv.fecha_creacion,
                    (
                    CASE 
                        when sv.estado_solicitud = 0 THEN 'En espera'
                        when sv.estado_solicitud = 1 THEN 'Aprobada'
                        when sv.estado_solicitud = 2 THEN 'Rechazada' 
                    END
                    ) as estado_solicitud
                    FROM ${Constants.tbl_solicitud_rrhh_sql} sv
                    INNER JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = sv.idusuario)
                    WHERE sv.idusuario = $1 AND sv.estado = 1`,
                    values : [
                    this.idUserLogin
                    ]
                }

                let lData: Array<IVacaciones | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IVacaciones | IErrorResponse>
        
                if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse
        
                return lData as Array<IVacaciones>
    }



    async getByIdxUser(id: BigInt): Promise<IVacaciones| IErrorResponse> {
        
        const queryData = {
            name : 'get-vacaciones-x-id',
            text: `SELECT sv.id, sv.idusuario, sv.descripcion, usu.nombre_completo, sv.fecha_inicio, sv.fecha_final
            FROM ${Constants.tbl_solicitud_rrhh_sql} sv
            INNER JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = sv.idusuario)
            WHERE sv.id = $1`,
            values : [
                id
            ]
        }

        let lData : Array <IVacaciones | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IVacaciones | IErrorResponse>
        
        return lData[0]
    }



    async insert(data: IVacaciones): Promise<IVacaciones | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise <Array<IModel | IErrorResponse>> =>{

            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            const queryData = {
                name : 'insert-solicitud-vacaciones',
                text: `INSERT INTO ${Constants.tbl_solicitud_rrhh_sql}(
                    idusuario,
                    fecha_inicio,
                    fecha_final,
                    estado,
                    fecha_ultimo_cambio,
                    descripcion,
                    fecha_creacion,
                    estado_solicitud
                )
                VALUES ($1,$2,$3,$4,$5, $6,$7 ,$8) RETURNING *`,
                values : [
                    this.idUserLogin,
                    data.fecha_inicio,
                    data.fecha_final,
                    this.filterStatus,
                    timeStampCurrent,
                    data.descripcion,
                    timeStampCurrent,
                    0
                ]
            }

            let lData = (await client.query(queryData)).rows as Array<IVacaciones | IErrorResponse>


            return lData
        })

        return (responseD[0]) as IVacaciones | IErrorResponse

    }

    async update(id: BigInt, data: IVacaciones): Promise<IVacaciones | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client) : Promise <Array<IModel | IErrorResponse>> =>{

            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let queryData = {
                name : 'update-solicitud-vacaciones',
                text: `
                    UPDATE ${Constants.tbl_solicitud_rrhh_sql} SET
                    fecha_inicio = $1, 
                    fecha_final = $2,
                    fecha_ultimo_cambio = $3,
                    idrrhh = $4,
                    descripcion = $5,
                    estado_solicitud = $6
                    WHERE id = $7
                    RETURNING *
                `,
                values : [
                    data.fecha_inicio,
                    data.fecha_final,
                    timeStampCurrent,
                    this.idUserLogin,
                    data.descripcion,
                    data.estado_solicitud,
                    id
                ]
            }

            let lData = (await client.query(queryData)).rows as Array <IVacaciones | IErrorResponse>

            return lData
        })
        return (responseD[0]) as IVacaciones | IErrorResponse

    }



    async updateByUser(id: BigInt, data: IVacaciones): Promise<IVacaciones | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client) : Promise <Array<IModel | IErrorResponse>> =>{

            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let queryData = {
                name : 'update-solicitud-vacaciones',
                text: `
                    UPDATE ${Constants.tbl_solicitud_rrhh_sql} SET
                    fecha_inicio = $1, 
                    fecha_final = $2,
                    fecha_ultimo_cambio = $3,
                    descripcion = $4
                    WHERE id = $5
                    RETURNING *
                `,
                values : [
                    data.fecha_inicio,
                    data.fecha_final,
                    timeStampCurrent,
                    data.descripcion,
                    id
                ]
            }

            let lData = (await client.query(queryData)).rows as Array <IVacaciones | IErrorResponse>

            return lData
        })
        return (responseD[0]) as IVacaciones | IErrorResponse

    }

    async delete(id: BigInt): Promise<IVacaciones | IErrorResponse> {

        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

        const queryData = {
            name : 'delete-solicitud-vacaciones',
            text: ` UPDATE ${Constants.tbl_solicitud_rrhh_sql} SET
                    estado = $1,
                    fecha_ultimo_cambio = $2,
                    idrrhh = $3
                    WHERE id = $4 RETURNING *`,

            values : [
                Constants.code_status_delete,
                timeStampCurrent,
                this.idUserLogin,
                id
            ]
        }

        let lData: Array<IVacaciones | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IVacaciones | IErrorResponse>

        return lData[0]   
     }
}
export default VacacionesDataAccess