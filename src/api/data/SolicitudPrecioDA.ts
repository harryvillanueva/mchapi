import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import UtilInstance from "../helpers/Util"
import { IModel } from "../helpers/IModel"
import { ISolicitudPrecio } from "../models/ISolicitudPrecio"
import { IUser } from "../models/IUser"
import { IApartment } from "../models/IApartment"
import { IInfoPisoComercial } from "../models/IInfoPisoComercial"
import { IVariablesReserva } from "../models/IVariablesReserva"

class SolicitudPrecioDA implements IDataAccess<ISolicitudPrecio> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ISolicitudPrecio> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getById(id: BigInt): Promise<ISolicitudPrecio | IErrorResponse> {
        const queryData = {
            name: 'get-solicitud-limite-precio-x-id',
            text: `
                SELECT sp.id, 
                sp.limite_precio,
                sp.porcentaje_limite_precio,
                sp.fecha_creacion,
                REPLACE(REPLACE(REPLACE(REPLACE(to_char( sp.fecha_creacion, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS f_fecha_creacion,
                sp.estado_solicitud,
                (
                    CASE
                        WHEN sp.estado_solicitud = 1 THEN 'Pendiente'
                        WHEN sp.estado_solicitud = 2 THEN 'Aprobado'
                        WHEN sp.estado_solicitud = 3 THEN 'Rechazado'
                        WHEN sp.estado_solicitud is NULL THEN 'Desconocido'
                    END
                ) as lbl_estado_solicitud,
                COALESCE(usu.nombre_completo, 'Desconocido') as propietario,
                p.etiqueta as piso,
                sp.observacion
                FROM tbl_solicitud_precio sp
                LEFT JOIN tbl_usuario usu ON usu.id = sp.idpropietario
                INNER JOIN tbl_piso p ON p.id = sp.idpiso
                WHERE sp.id = $1 AND sp.estado = 1
            `,
            values: [ id ]
        }

        let lData: Array<ISolicitudPrecio | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ISolicitudPrecio | IErrorResponse>

        return lData[0]
    }

    async insert(data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
        //     const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        //     const queryData = {
        //         name: 'insert-control-horario',
        //         text: `INSERT INTO ${Constants.tbl_control_horario_limpieza_sql}(
        //                 fecha, 
        //                 entrada, 
        //                 salida, 
        //                 idusuario, 
        //                 idpiso,
        //                 idusuario_ultimo_cambio,
        //                 fecha_ultimo_cambio,
        //                 estado,
        //                 observacion,
        //                 tipo_ejecucion)
        //                 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        //         values: [   data.fecha, 
        //                     data.entrada, 
        //                     data.salida, 
        //                     data.idusuario, 
        //                     data.idpiso,
        //                     this.idUserLogin,
        //                     timeStampCurrent,
        //                     data.estado,
        //                     data.observacion,
        //                     'Manual'
        //                 ]
        //     }
        //     let lData = (await client.query(queryData)).rows as Array<ISolicitudPrecio | IErrorResponse>

        //     return lData
        // })

        // return ( responseD[0] ) as ISolicitudPrecio | IErrorResponse
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
        //     const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        //     let queryData = {
        //         name: 'update-control-horario',
        //         text: `UPDATE ${Constants.tbl_control_horario_limpieza_sql} SET
        //                 fecha = $1, 
        //                 entrada = $2, 
        //                 salida = $3, 
        //                 idusuario = $4, 
        //                 idpiso = $5,
        //                 idusuario_ultimo_cambio = $6,
        //                 fecha_ultimo_cambio = $7,
        //                 estado = $8,
        //                 observacion = $9
        //                 WHERE id = $10 AND estado >= $11 RETURNING *`,
        //         values: [   
        //                 data.fecha, 
        //                 data.entrada, 
        //                 data.salida, 
        //                 data.idusuario, 
        //                 data.idpiso,
        //                 this.idUserLogin,
        //                 timeStampCurrent,
        //                 data.estado,
        //                 data.observacion,
        //                 id,
        //                 this.filterStatus
        //         ]
        //     }
        //     let lData = (await client.query(queryData)).rows as Array<ISolicitudPrecio | IErrorResponse>

        //     return lData
        // })

        // return ( responseD[0] ) as ISolicitudPrecio | IErrorResponse
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ISolicitudPrecio | IErrorResponse> {
        // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
        //     const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            
        //     const queryData = {
        //             name: 'delete-controlhorario',
        //             text: `UPDATE ${Constants.tbl_control_horario_limpieza_sql} SET
        //                 estado = $1,
        //                 idusuario_ultimo_cambio = $2,
        //                 fecha_ultimo_cambio = $3
        //                 WHERE id = $4 AND estado >= $5 RETURNING *`,
        //             values: [   Constants.code_status_delete,
        //                         this.idUserLogin,
        //                         timeStampCurrent, 
        //                         id,
        //                         this.filterStatus
        //                 ]
        //     }

        //     let lData: Array<ISolicitudPrecio | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ISolicitudPrecio | IErrorResponse>
            
        //     return lData
        // })

        // return ( responseD[0] ) as ISolicitudPrecio | IErrorResponse
        throw new Error("Method not implemented.")
    }

    async insertWP(data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            // buscar el propietario por username_wp
            const queryDataProp = {
                name: 'get-propietario-x-userwp',
                text: `
                    SELECT usu.* 
                    FROM tbl_usuario usu
                    WHERE usu.estado = 1 AND
                    lower(trim(usu.user_wp)) LIKE lower(trim($1))
                    LIMIT 1
                `,
                values: [ data.username_wp || '' ]
            }

            let lUser = (await client.query(queryDataProp)).rows as Array<IUser | IErrorResponse>
            let idPropietario = lUser.length !== 0 ? ( (lUser[0] as IUser).id ? (lUser[0] as IUser).id : null ) : null

            // obtener el piso de la solicitud
            const queryDataPiso = {
                name: 'get-piso-x-id',
                text: `
                    SELECT p.id, p.etiqueta 
                    FROM tbl_piso p
                    WHERE p.estado = 1 AND
                    p.id = $1
                    LIMIT 1
                `,
                values: [ data.idpiso || 0 ]
            }

            let lPiso = (await client.query(queryDataPiso)).rows as Array<IApartment | IErrorResponse>
            let etiquetaPiso = lPiso.length !== 0 ? ( (lPiso[0] as IApartment).id ? (lPiso[0] as IApartment).etiqueta : 'Desconocido' ) : 'Desconocido'

            const queryData = {
                name: 'insert-solicitud-precio-limite-wp',
                text: `INSERT INTO ${Constants.tbl_solicitud_precio_sql}(
                        limite_precio, 
                        porcentaje_limite_precio,
                        username_wp, 
                        fecha_creacion, 
                        fecha_ultimo_cambio, 
                        idpropietario,
                        idusuario,
                        idpiso)
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
                values: [   data.limite_precio, 
                            data.porcentaje_limite_precio,
                            data.username_wp, 
                            timeStampCurrent, 
                            timeStampCurrent, 
                            idPropietario || null,
                            this.idUserLogin,
                            data.idpiso || null
                        ]
            }
            let lData = (await client.query(queryData)).rows as Array<ISolicitudPrecio | IErrorResponse>
            
            // verficamos que no haya errores
            if ( lData.length !== 0 && !([ ...lData ] as Array<IErrorResponse>)[0].error ) {
                let _ldata = [ ...lData ] as Array<ISolicitudPrecio>
                _ldata[0].piso = etiquetaPiso
                lData = [ ..._ldata ]
            }

            return lData
        })

        return ( responseD[0] ) as ISolicitudPrecio | IErrorResponse
    }

    /**
     * Retorna los datos ya paginados
     * @returns 
     */
    async getAllWithPagination(): Promise<Array<ISolicitudPrecio> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let filter_state_sol = this.infoExtra.filter.state_sol || 0
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        let search_all = this.infoExtra.filter.search_all  || ''

        const queryData  = {
            name: 'get-solicitud-precio-by-user-prop',
            text: ` SELECT *
                    FROM (
                        SELECT sp.id, 
                        sp.limite_precio,
                        sp.porcentaje_limite_precio,
                        sp.fecha_creacion,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( sp.fecha_creacion, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS f_fecha_creacion,
                        sp.estado_solicitud,
                        (
                            CASE
                                WHEN sp.estado_solicitud = 1 THEN 'Pendiente'
                                WHEN sp.estado_solicitud = 2 THEN 'Aprobado'
                                WHEN sp.estado_solicitud = 3 THEN 'Rechazado'
                                WHEN sp.estado_solicitud is NULL THEN 'Desconocido'
                            END
                        ) as lbl_estado_solicitud,
                        COALESCE(usu.nombre_completo, 'Desconocido') as propietario,
                        p.etiqueta as piso
                        FROM tbl_solicitud_precio sp
                        LEFT JOIN tbl_usuario usu ON usu.id = sp.idpropietario
                        INNER JOIN tbl_piso p ON p.id = sp.idpiso
                        WHERE sp.estado = 1 AND
                        date(sp.fecha_creacion) BETWEEN $2 AND $3 AND
                        (sp.estado_solicitud = $1 OR $1 = 0)
                    ) sp
                    WHERE
                    ( 
                        UNACCENT(lower( replace(trim(sp.propietario ),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(sp.piso,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(sp.lbl_estado_solicitud,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        $6 = ''
                    )
                    ORDER BY sp.estado_solicitud ASC, sp.fecha_creacion DESC
                    LIMIT $4 OFFSET $5
                    `,
            values: [
                        filter_state_sol,
                        filter_m_start,
                        filter_m_end,
                        limit,
                        offset,
                        search_all === '' ? '' : `%${search_all}%`
                    ]
        }

        let lData: Array<ISolicitudPrecio | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ISolicitudPrecio | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ISolicitudPrecio>
    }

    /**
     * Aprobar solicitud por RMG
     * @param data 
     * @returns 
     */
    async aprobarSolicitudRMG(id: BigInt, data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                name: 'aprobar-precio-limite',
                text: `UPDATE ${Constants.tbl_solicitud_precio_sql} SET
                        limite_precio = $1, 
                        porcentaje_limite_precio = $2, 
                        fecha_ultimo_cambio = $3, 
                        idusuario = $4,
                        estado_solicitud = $5,
                        observacion = $6
                        WHERE id = $7 RETURNING *`,
                values: [   data.limite_precio, 
                            data.porcentaje_limite_precio, 
                            timeStampCurrent, 
                            this.idUserLogin,
                            data.estado_solicitud,
                            data.observacion,
                            id
                        ]
            }
            let lData = (await client.query(queryData)).rows as Array<ISolicitudPrecio | IErrorResponse>
            let _dataSPDB = lData[0] as ISolicitudPrecio
            let idPisoDB = _dataSPDB.idpiso || BigInt(0)

            // *************** Información en tabla de reserva RMG *************************
            // *****************************************************************************
            // *****************************************************************************
                // Se actualiza el registro de info piso si existe, caso contrario no hace nada, ni genera error
                const queryDataUpdate = {
                    name : "update-info-piso-comercial",
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql}
                            SET 
                            fecha_ultimo_cambio = $1,
                            idusuario_ult_cambio = $2
                            WHERE id IN (SELECT id 
                                        FROM ${Constants.tbl_info_piso_comercial_rmg_sql} 
                                        WHERE estado = 1 AND 
                                        idpiso = $3 
                                        ORDER BY id DESC 
                                        LIMIT 1)
                            RETURNING *
                            `,
                    values : [ 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idPisoDB
                    ]
                }
                let lDataDB = (await client.query(queryDataUpdate)).rows as Array<IInfoPisoComercial | IErrorResponse>
            
                // Se verifica si no existe el registro y proceder a crearlo
                if ( lDataDB && lDataDB.length === 0 ) {
                    let queryData = {
                            name: 'insert-info-piso-comercial-precio-limite',
                            text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
                                estado_general,
                                fecha_creacion,
                                fecha_ultimo_cambio,
                                idusuario_ult_cambio,
                                idpiso
                                )
                                VALUES($1,$2,$3,$4,$5) RETURNING *`,
                            values: [
                                1,
                                timeStampCurrent, 
                                timeStampCurrent, 
                                this.idUserLogin, 
                                idPisoDB
                            ]
                    }

                    lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
                }

                // Objeto del piso comercial existente o nuevo
                let dataDB = lDataDB[0] as IInfoPisoComercial
                let idDataDB = dataDB.id || BigInt(0)

                // Cambiamos el estado de la reserva exista o no la información comercial, de las reservas activas
                const queryDeleteReserva = {
                    name: 'update-estatus-reservas',
                    text: ` UPDATE ${Constants.tbl_variables_reserva_rmg_sql} SET
                        estado = $1,
                        fecha_ultimo_cambio = $2,
                        idusuario_ult_cambio = $3
                        WHERE idinfopisocom = $4 AND estado = 1 RETURNING *`,
                    values: [
                            0,
                            timeStampCurrent,
                            this.idUserLogin,
                            idDataDB
                        ]
                }
                await client.query(queryDeleteReserva)

                // Se crea la nueva row en la tabla de registro de reservas desde cero o una copia de la ultima
                // Consultar la última reserva
                const queryGetLastReserva = {
                    name: 'get-last-reserva',
                    text: ` SELECT vr.*
                        FROM ${Constants.tbl_variables_reserva_rmg_sql} vr
                        WHERE idinfopisocom = $1
                        ORDER BY fecha_creacion DESC, id DESC LIMIT 1`,
                    values: [ idDataDB ]
                }
                let _dataListReservaDB = (await client.query(queryGetLastReserva)).rows as Array<IVariablesReserva>
                let _dataReservaDB = (_dataListReservaDB.length !== 0) ? _dataListReservaDB[0] : undefined

                if ( !_dataReservaDB ) {
                    let queryDataVarReserva = {
                        name: 'insert-variables-reserva',
                        text: `INSERT INTO ${Constants.tbl_variables_reserva_rmg_sql}( 
                            precio_limite,
                            fecha_creacion,
                            fecha_ultimo_cambio,
                            idusuario_ult_cambio,
                            idinfopisocom, 
                            tipo_operacion
                            )
                            VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
                        values: [
                            data.limite_precio || 0,
                            timeStampCurrent, 
                            timeStampCurrent, 
                            this.idUserLogin, 
                            idDataDB,
                            'SolicitudPrecioLimite'
                        ]
                    }
                    await client.query(queryDataVarReserva)
                } else {
                    let queryDataVarReserva = {
                        name: 'insert-variables-reserva-lastdata',
                        text: `INSERT INTO ${Constants.tbl_variables_reserva_rmg_sql}( 
                            aplica,
                            fecha_inicio_vigencia, 
                            precio_base, 
                            porcentaje_descuento, 
                            precio_alquiler, 
                            precio_muebles,
                            total,
                            duracion_estancia,
                            edad_min,
                            edad_max,
                            mascota,
                            observacion,
                            fecha_creacion,
                            fecha_ultimo_cambio,
                            idusuario_ult_cambio,
                            idinfopisocom,
                            precio_limite,
                            tipo_operacion
                            )
                            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
                        values: [
                            _dataReservaDB.aplica || '',
                            _dataReservaDB.fecha_inicio_vigencia || null,
                            _dataReservaDB.precio_base || 0,
                            _dataReservaDB.porcentaje_descuento || 0,
                            _dataReservaDB.precio_alquiler || 0,
                            _dataReservaDB.precio_muebles || 0,
                            _dataReservaDB.total || 0,
                            _dataReservaDB.duracion_estancia || 0,
                            _dataReservaDB.edad_min || 0,
                            _dataReservaDB.edad_max || 0,
                            _dataReservaDB.mascota || false,
                            _dataReservaDB.observacion || '',
                            timeStampCurrent, 
                            timeStampCurrent, 
                            this.idUserLogin, 
                            idDataDB,
                            data.limite_precio || 0,
                            'SolicitudPrecioLimite'
                        ]
                    }
                    await client.query(queryDataVarReserva)
                }
            // *******************************************************************
            // *******************************************************************
            // ***************************** END *********************************

            // ******** obtener el usuario para el respectivo envio del correo *******
            // ***********************************************************************
            type dataSolPL = {
                id: number,
                email: string,
                user_wp: string
                piso: string
            }

            const queryDataUserSol = {
                name: 'get-user-x-id',
                text: `
                    SELECT u.id, u.email, u.user_wp, p.etiqueta as piso
                    FROM tbl_solicitud_precio sp
                    INNER JOIN tbl_usuario u ON (sp.idpropietario = u.id)
                    INNER JOIN tbl_piso p ON (p.id = sp.idpiso)
                    WHERE sp.id = $1
                    LIMIT 1
                `,
                values: [ id ]
            }

            let lUserSolicitud = (await client.query(queryDataUserSol)).rows as Array<dataSolPL | IErrorResponse>
            let userWPSol = lUserSolicitud.length !== 0 ? ( (lUserSolicitud[0] as dataSolPL).id ? ((lUserSolicitud[0] as dataSolPL).user_wp || (lUserSolicitud[0] as dataSolPL).email || '') : '' ) : ''
            let etiquetaPiso = lUserSolicitud.length !== 0 ? ( (lUserSolicitud[0] as dataSolPL).id ? (lUserSolicitud[0] as dataSolPL).piso : 'Desconocido' ) : 'Desconocido'

            // verficamos que no haya errores
            if ( lData.length !== 0 && !([ ...lData ] as Array<IErrorResponse>)[0].error ) {
                let _ldata = [ ...lData ] as Array<ISolicitudPrecio>
                _ldata[0].username_wp = userWPSol
                _ldata[0].piso = etiquetaPiso
                lData = [ ..._ldata ]
            }

            // *********************** END ********************
            // ***********************************************************************

            return lData
        })

        return ( responseD[0] ) as ISolicitudPrecio | IErrorResponse
    }

    async rechazarSolicitudRMG(id: BigInt, data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                name: 'aprobar-precio-limite',
                text: `UPDATE ${Constants.tbl_solicitud_precio_sql} SET
                        limite_precio = $1, 
                        porcentaje_limite_precio = $2, 
                        fecha_ultimo_cambio = $3, 
                        idusuario = $4,
                        estado_solicitud = $5,
                        observacion = $6
                        WHERE id = $7 RETURNING *`,
                values: [   data.limite_precio, 
                            data.porcentaje_limite_precio, 
                            timeStampCurrent, 
                            this.idUserLogin,
                            data.estado_solicitud,
                            data.observacion,
                            id
                        ]
            }
            let lData = (await client.query(queryData)).rows as Array<ISolicitudPrecio | IErrorResponse>

            type dataSolPL = {
                id: number,
                email: string,
                user_wp: string
                piso: string
            }

            const queryDataUserSol = {
                name: 'get-user-x-id',
                text: `
                    SELECT u.id, u.email, u.user_wp, p.etiqueta as piso
                    FROM tbl_solicitud_precio sp
                    INNER JOIN tbl_usuario u ON (sp.idpropietario = u.id)
                    INNER JOIN tbl_piso p ON (p.id = sp.idpiso)
                    WHERE sp.id = $1
                    LIMIT 1
                `,
                values: [ id ]
            }

            let lUserSolicitud = (await client.query(queryDataUserSol)).rows as Array<dataSolPL | IErrorResponse>
            let userWPSol = lUserSolicitud.length !== 0 ? ( (lUserSolicitud[0] as dataSolPL).id ? ((lUserSolicitud[0] as dataSolPL).user_wp || (lUserSolicitud[0] as dataSolPL).email || '') : '' ) : ''
            let etiquetaPiso = lUserSolicitud.length !== 0 ? ( (lUserSolicitud[0] as dataSolPL).id ? (lUserSolicitud[0] as dataSolPL).piso : 'Desconocido' ) : 'Desconocido'
            
            // verficamos que no haya errores
            if ( lData.length !== 0 && !([ ...lData ] as Array<IErrorResponse>)[0].error ) {
                let _ldata = [ ...lData ] as Array<ISolicitudPrecio>
                _ldata[0].username_wp = userWPSol
                _ldata[0].piso = etiquetaPiso
                lData = [ ..._ldata ]
            }

            return lData
        })

        return ( responseD[0] ) as ISolicitudPrecio | IErrorResponse
    }
}

export default SolicitudPrecioDA