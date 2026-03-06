import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IControlHorarioLimpieza } from "../models/IControlHorarioLimpieza"
import UtilInstance from "../helpers/Util"
import { IModel } from "../helpers/IModel"

class ControlHorarioLimpiezaDataAccess implements IDataAccess<IControlHorarioLimpieza> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        // Metodo para Marina, usando una serie filtros
        const queryData  = {
                name: 'get-control-horario-limpieza',
                text: ` SELECT chl.*
                        FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                        WHERE chl.estado >= $1
                        ORDER BY chl.fecha ASC
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    async getById(id: BigInt): Promise<IControlHorarioLimpieza | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id',
            text: `
                SELECT chl.id, chl.idpiso, usu.id as idusuario, 
                usu.nombre_completo as full_name, 
                p.etiqueta as etiqueta_piso,
                chl.fecha,
                chl.observacion,
                REPLACE(REPLACE(REPLACE(REPLACE(to_char( chl.fecha, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS f_fecha,
                COALESCE(to_char(chl.entrada, 'YYYY-MM-DD HH24:MI'), '') as entrada,
                COALESCE(to_char(chl.salida, 'YYYY-MM-DD HH24:MI'), '') as salida,
                COALESCE(to_char(chl.entrada, 'HH24:MI'), '') as h_entrada,
                COALESCE(to_char(chl.salida, 'HH24:MI'), '') as h_salida
                FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = chl.idusuario)
                INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = chl.idpiso)
                WHERE chl.estado >= $2 AND 
                chl.id = $1
                    `,
            values: [ id, this.filterStatus ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>

        return lData[0]
    }

    async insert(data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                name: 'insert-control-horario',
                text: `INSERT INTO ${Constants.tbl_control_horario_limpieza_sql}(
                        fecha, 
                        entrada, 
                        salida, 
                        idusuario, 
                        idpiso,
                        idusuario_ultimo_cambio,
                        fecha_ultimo_cambio,
                        estado,
                        observacion,
                        tipo_ejecucion)
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                values: [   data.fecha, 
                            data.entrada, 
                            data.salida, 
                            data.idusuario, 
                            data.idpiso,
                            this.idUserLogin,
                            timeStampCurrent,
                            data.estado,
                            data.observacion,
                            'Manual'
                        ]
            }
            let lData = (await client.query(queryData)).rows as Array<IControlHorarioLimpieza | IErrorResponse>

            return lData
        })

        return ( responseD[0] ) as IControlHorarioLimpieza | IErrorResponse
    }

    async update(id: BigInt, data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                name: 'update-control-horario',
                text: `UPDATE ${Constants.tbl_control_horario_limpieza_sql} SET
                        fecha = $1, 
                        entrada = $2, 
                        salida = $3, 
                        idusuario = $4, 
                        idpiso = $5,
                        idusuario_ultimo_cambio = $6,
                        fecha_ultimo_cambio = $7,
                        estado = $8,
                        observacion = $9
                        WHERE id = $10 AND estado >= $11 RETURNING *`,
                values: [   
                        data.fecha, 
                        data.entrada, 
                        data.salida, 
                        data.idusuario, 
                        data.idpiso,
                        this.idUserLogin,
                        timeStampCurrent,
                        data.estado,
                        data.observacion,
                        id,
                        this.filterStatus
                ]
            }
            let lData = (await client.query(queryData)).rows as Array<IControlHorarioLimpieza | IErrorResponse>

            return lData
        })

        return ( responseD[0] ) as IControlHorarioLimpieza | IErrorResponse
    }

    async delete(id: BigInt): Promise<IControlHorarioLimpieza | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            
            const queryData = {
                    name: 'delete-controlhorario',
                    text: `UPDATE ${Constants.tbl_control_horario_limpieza_sql} SET
                        estado = $1,
                        idusuario_ultimo_cambio = $2,
                        fecha_ultimo_cambio = $3
                        WHERE id = $4 AND estado >= $5 RETURNING *`,
                    values: [   Constants.code_status_delete,
                                this.idUserLogin,
                                timeStampCurrent, 
                                id,
                                this.filterStatus
                        ]
            }

            let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
            
            return lData
        })

        return ( responseD[0] ) as IControlHorarioLimpieza | IErrorResponse
    }

    // async getByIdUser(idUser: BigInt): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
    //     const queryData  = {
    //             name: 'get-control-horario-limpieza',
    //             text: ` SELECT chl.*
    //                     FROM ${Constants.tbl_control_horario_limpieza_sql} chl
    //                     WHERE chl.estado >= $1 AND chl.idusuario = $2
    //                     ORDER BY chl.fecha ASC, chl.entrada ASC
    //                     `,
    //             values: [
    //                         this.filterStatus,
    //                         idUser
    //                     ]
    //     }

    //     let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
    //     if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

    //     return lData as Array<IControlHorarioLimpieza>
    // }

    /**
     * Se deberia enviar como parametros adicionales: idPiso y rango de fechas
     * @returns 
     */
    async getMyControlHorario(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        const queryData  = {
                name: 'get-control-horario-limpieza',
                text: ` SELECT chl.*
                        FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                        WHERE chl.estado >= $1 AND 
                        chl.idusuario = $2
                        ORDER BY chl.fecha ASC, chl.entrada ASC
                        `,
                values: [
                            this.filterStatus,
                            this.idUserLogin
                        ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    /**
     * Se deberia enviar como parametros adicionales: idPiso
     * @returns 
     */
    async getMyControlHorarioCurrent(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        const queryData  = {
            name: 'get-control-horario-limpieza',
            text: ` SELECT chl.*
                    FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                    WHERE chl.estado >= $1 AND 
                    chl.idusuario = $2
                    ORDER BY chl.fecha ASC, chl.entrada ASC
                    `,
            values: [
                        this.filterStatus,
                        this.idUserLogin
                    ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    /**
     * Obtiene un listado de los fichajes del día actual, que tiene pendiente por marcar salida.
     * Que siempre deberia solo retornar un solo registro
     * Consulta para personal de Limpieza
     * @returns 
     */
    async getMyFichajeLimpiezaToday(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        const { fecha: dateCurrent } = UtilInstance.getDateCurrent()
        
        const queryData  = {
            name: 'get-control-horario-limpieza',
            text: ` SELECT chl.id,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( chl.entrada, 'DD/mon/YYYY HH24:MI:SS'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS entrada,
                    to_char( chl.entrada, 'HH24:MI:SS') as hora_entrada,
                    chl.salida,
                    chl.idusuario,
                    chl.estado,
                    chl.exec_entrada_lock,
                    chl.exec_salida_lock,
                    chl.fecha,
                    chl.fecha_ultimo_cambio,
                    chl.idpiso,
                    chl.idusuario_ultimo_cambio,
                    chl.tipo_ejecucion,
                    p.etiqueta as etiqueta_piso
                    FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                    INNER JOIN  ${Constants.tbl_piso_sql} p ON p.id = chl.idpiso
                    WHERE chl.estado = 1 AND 
                    chl.idusuario = $1 AND
                    chl.fecha = $2
                    ORDER BY chl.fecha DESC, chl.entrada DESC
                    `,
            values: [
                        this.idUserLogin,
                        dateCurrent
                    ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    /**
     * Obtiene un listado de los fichajes del día actual, que tiene pendiente por marcar salida.
     * Que siempre deberia solo retornar un solo registro
     * Consulta para personal de Limpieza
     * @returns 
     */
    async getMyFichajeLimpiezaByUserAndDate(idUser: BigInt, fecha: string): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        // const { fecha: dateCurrent } = UtilInstance.getDateCurrent()
        
        const queryData  = {
            name: 'get-control-horario-limpieza',
            text: ` SELECT chl.id,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( chl.entrada, 'DD/mon/YYYY HH24:MI:SS'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS entrada,
                    to_char( chl.entrada, 'HH24:MI:SS') as hora_entrada,
                    chl.salida,
                    chl.idusuario,
                    chl.estado,
                    chl.exec_entrada_lock,
                    chl.exec_salida_lock,
                    chl.fecha,
                    chl.fecha_ultimo_cambio,
                    chl.idpiso,
                    chl.idusuario_ultimo_cambio,
                    chl.tipo_ejecucion,
                    p.etiqueta as etiqueta_piso
                    FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                    INNER JOIN  ${Constants.tbl_piso_sql} p ON p.id = chl.idpiso
                    WHERE chl.estado = 1 AND 
                    chl.idusuario = $1 AND
                    chl.fecha = $2
                    ORDER BY chl.fecha DESC, chl.entrada DESC
                    `,
            values: [
                        idUser,
                        fecha
                    ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    /**
     * El usuario ficha entrada desde la app
     * NO TOCAR
     * @param data 
     * @returns 
     */
    async ficharEntrada(data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        const { fecha: dateCurrent } = UtilInstance.getDateCurrent()

        const queryData = {
            name: 'insert-device',
            text: `INSERT INTO ${Constants.tbl_control_horario_limpieza_sql}(
                        fecha,
                        entrada,
                        idusuario,
                        idpiso,
                        idusuario_ultimo_cambio,
                        fecha_ultimo_cambio
                        )
                        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
            values: [
                dateCurrent,
                timeStampCurrent,
                this.idUserLogin,
                data.idpiso,
                this.idUserLogin,
                timeStampCurrent
            ]
        }
        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData [0]
    }

    /**
     * Usuario ficha salida, desde la app
     * NO TOCAR
     * @param data 
     * @returns 
     */
    async ficharSalida(data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        const { fecha: dateCurrent } = UtilInstance.getDateCurrent()

        const queryData = {
            name: 'insert-device',
            text: `UPDATE ${Constants.tbl_control_horario_limpieza_sql} SET
                        salida = $1,
                        estado = $2,
                        idusuario_ultimo_cambio = $3,
                        fecha_ultimo_cambio = $4
                    WHERE id = $5 AND
                        fecha = $6  AND 
                        idusuario = $7 AND
                        idpiso = $8 AND
                        estado = $9
                        RETURNING *`,
            values: [
                timeStampCurrent,
                0,
                this.idUserLogin,
                timeStampCurrent,
                data.id,
                dateCurrent,
                this.idUserLogin,
                data.idpiso,
                1
            ]
        }
        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData [0]
    }

    /**
     * La información resultante es agrupada por usuario responsable [LIMPIEZA]
     * @returns 
     */
    async getAllReport(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'

        const queryData  = {
            name: 'get-control-horario-limpieza-report',
            text: ` SELECT ul.id as idusuario, ul.nombre_completo as full_name, ch.str_lhorario
                    FROM (
                        SELECT usu.id, usu.nombre_completo 
                        FROM ${Constants.tbl_usuario_sql} usu
                        INNER JOIN ${Constants.tbl_usuario_x_rol_sql} uxr ON (usu.id = uxr.idusuario AND uxr.idrol = 'limpieza')
                        WHERE usu.estado = 1
                    ) ul
                    LEFT JOIN (
                        SELECT usu.id,
                        STRING_AGG(COALESCE(to_char(chl.entrada, 'YYYY-MM-DD HH24:MI'), '') || 'TO' || COALESCE(to_char(chl.salida, 'YYYY-MM-DD HH24:MI'),''), '|') as str_lhorario
                        FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                        INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = chl.idusuario)
                        WHERE chl.estado >= $1 AND 
                        chl.fecha BETWEEN $2 AND $3 AND
                        chl.entrada IS NOT NULL AND
                        chl.salida IS NOT NULL
                        GROUP BY usu.id, usu.nombre_completo
                    ) ch ON (ch.id = ul.id)
                    ORDER BY ul.nombre_completo
                    `,
            values: [
                        this.filterStatus,
                        filter_m_start,
                        filter_m_end
                    ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    /**
     * La información resultante es agrupada por usuario responsable [LIMPIEZA]
     * @returns 
     */
    async getAllReportByUser(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let filter_iduser = this.infoExtra.filter.iduser || 0

        const queryData  = {
            name: 'get-control-horario-limpieza-report-by-user',
            text: ` SELECT usu.id as idusuario, 
                    usu.nombre_completo as full_name, 
                    p.etiqueta as etiqueta_piso,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( chl.fecha, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha,
                    COALESCE(to_char(chl.entrada, 'YYYY-MM-DD HH24:MI'), '') as entrada,
                    COALESCE(to_char(chl.salida, 'YYYY-MM-DD HH24:MI'), '') as salida,
                    COALESCE(to_char(chl.entrada, 'HH24:MI'), '') as h_entrada,
                    COALESCE(to_char(chl.salida, 'HH24:MI'), '') as h_salida
                    FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                    INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = chl.idusuario)
                    INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = chl.idpiso)
                    WHERE chl.estado >= 0 AND 
                    chl.fecha BETWEEN $2 AND $3 AND
                    usu.id = $1
                    ORDER BY usu.nombre_completo ASC, chl.entrada ASC, p.etiqueta ASC
                    `,
            values: [
                        filter_iduser,
                        filter_m_start,
                        filter_m_end
                    ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }

    /**
     * Retorna los datos de control de limpieza
     * @returns 
     */
    async getAllWithPagination(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let filter_iduser = this.infoExtra.filter.iduser || 0
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        let search_all = this.infoExtra.filter.search_all  || ''

        const queryData  = {
            name: 'get-control-horario-limpieza-report-by-user',
            text: ` SELECT chl.id, usu.id as idusuario, chl.estado, 
                    usu.nombre_completo as full_name, 
                    p.etiqueta as etiqueta_piso,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( chl.fecha, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha,
                    COALESCE(to_char(chl.entrada, 'YYYY-MM-DD HH24:MI'), '') as entrada,
                    COALESCE(to_char(chl.salida, 'YYYY-MM-DD HH24:MI'), '') as salida,
                    COALESCE(to_char(chl.entrada, 'HH24:MI'), '') as h_entrada,
                    COALESCE(to_char(chl.salida, 'HH24:MI'), '') as h_salida
                    FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                    INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = chl.idusuario)
                    INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = chl.idpiso)
                    WHERE chl.estado >= 0 AND 
                    chl.fecha BETWEEN $2 AND $3 AND
                    (chl.idusuario = $1 OR  $1 = 0) AND
                    ( 
                        UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(p.etiqueta,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        $6 = ''
                    )
                    ORDER BY chl.entrada DESC, usu.nombre_completo ASC, p.etiqueta ASC
                    LIMIT $4 OFFSET $5
                    `,
            values: [
                        filter_iduser,
                        filter_m_start,
                        filter_m_end,
                        limit,
                        offset,
                        search_all === '' ? '' : `%${search_all}%`
                    ]
        }

        let lData: Array<IControlHorarioLimpieza | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IControlHorarioLimpieza | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IControlHorarioLimpieza>
    }
}

export default ControlHorarioLimpiezaDataAccess