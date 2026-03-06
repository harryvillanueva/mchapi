import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IData } from "../modelsextra/IData"
import UtilInstance from "../helpers/Util"

class DataDataAccess implements IDataAccess<IData> {
    public client: DbConnection

    constructor(
        public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IData> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getById(id: BigInt): Promise<IData | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IData): Promise<IData | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: IData): Promise<IData | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<IData | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Obtener total de registros 
     * @returns 
     */
    async getTotalControlLimpieza(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let filter_iduser = this.infoExtra.filter.iduser || 0
        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-control-limpieza',
            text: ` 
                    SELECT count(chl.id) as total_data
                    FROM ${Constants.tbl_control_horario_limpieza_sql} chl
                    INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = chl.idusuario)
                    INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = chl.idpiso)
                    WHERE chl.estado >= 0 AND 
                    chl.fecha BETWEEN $1 AND $2 AND
                    (chl.idusuario = $3 OR $3 = 0) AND
                    ( 
                        UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(p.etiqueta,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR 
                        $4 = ''
                    )
                    `,
            values: [
                filter_m_start,
                filter_m_end,
                filter_iduser,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Obtiene el total de todos los leads del sistema
     * @returns 
     */
    async getTotalAllLeads(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _dateCurrent = UtilInstance.getDateCurrent().fecha
        const _dateLastWeek = UtilInstance.actionAddAndDismissDays(_dateCurrent, -60).fecha

        let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'
        let filter_idresponsable = this.infoExtra.filter.idresponsable || -2
        let filter_tipo_lead = this.infoExtra.filter.tipo_lead || '-2'
        let filter_estatus = this.infoExtra.filter.estatus
        let filter_search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-leads',
            text: ` 
                    SELECT count(l.id) as total_data 
                    FROM (
                        SELECT *
                        FROM (
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_1' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE next_step = $7 AND
                                    (next_step BETWEEN $2 AND $3)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_2' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE (next_step > $8 AND next_step < $7) AND
                                    (next_step BETWEEN $2 AND $3)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_2' AS lbl_nivel, 'orden_3' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE ( next_step > $7 OR next_step <= $8 ) AND
                                    (next_step BETWEEN $2 AND $3)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                        ) d
                    ) lsub
                    INNER JOIN ${Constants.tbl_lead_dn_sql} l ON l.id = lsub.id
                    LEFT JOIN (
                        SELECT l.id,
                        STRING_AGG(tlf.numero, ' | ') as telefonos_str
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) tlf ON tlf.id = l.id
                    WHERE (l.estatus = $1 OR $1 = -2) AND 
                    (l.next_step BETWEEN $2 AND $3) AND 
                    (l.idresponsable = $4 OR $4 = -2) AND
                    (l.tipo_lead = $5 OR $5 = '-2') AND 
                    (   UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        $6 = ''
                    )
                    `,
            values: [filter_estatus,
                filter_ns_start,
                filter_ns_end,
                filter_idresponsable,
                filter_tipo_lead,
                filter_search_all === '' ? '' : `%${filter_search_all}%`,
                _dateCurrent,
                _dateLastWeek
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Retorna los leads por perfil
     * @returns 
     */
    async getTotaMyLeads(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _dateCurrent = UtilInstance.getDateCurrent().fecha
        const _dateLastWeek = UtilInstance.actionAddAndDismissDays(_dateCurrent, -60).fecha

        let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'
        let filter_idresponsable = this.infoExtra.filter.idresponsable || -2
        let filter_tipo_lead = this.infoExtra.filter.tipo_lead || '-2'
        let filter_search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-my-leads',
            text: ` 
                    SELECT count(l.id) as total_data
                    FROM (
                        SELECT *
                        FROM (
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_1' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY idtipointeresa DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE next_step = $8 AND
                                    idtipointeresa IS NOT NULL AND
                                    (next_step BETWEEN $3 AND $4)
                                ORDER BY idtipointeresa DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_2' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE (next_step > $9 AND next_step < $8) AND
                                    (next_step BETWEEN $3 AND $4)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_2' AS lbl_nivel, 'orden_3' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE ( next_step > $8 OR next_step <= $9 ) AND
                                    (next_step BETWEEN $3 AND $4)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                        ) d
                    ) lsub
                    INNER JOIN ${Constants.tbl_lead_dn_sql} l ON l.id = lsub.id
                    LEFT JOIN (
                        SELECT l.id,
                        STRING_AGG(tlf.numero, ' | ') as telefonos_str
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                        WHERE l.estatus >= $1
                        GROUP BY l.id
                    ) tlf ON tlf.id = l.id
                    LEFT JOIN (
                        SELECT rl.id, rl.idusuario_resp, rl.codigo, rl.codigo || ' -> ' || COALESCE((usu.nombre || ' ' || usu.apellido), 'Todos') AS responsable
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                    ) rsp ON (rsp.id = l.idresponsable)
                    WHERE l.estatus >= $1 AND 
                    (l.idresponsable = $2 OR ((rsp.idusuario_resp = $5 OR rsp.codigo LIKE 'LIBRE') AND $2 = -2)) AND 
                    (l.next_step BETWEEN $3 AND $4) AND
                    (l.tipo_lead = $6 OR $6 = '-2') AND
                    ( 
                        UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($7),' ','') )) OR 
                        UNACCENT(lower( replace(trim(l.nombre_completo),' ','') )) LIKE UNACCENT(lower( replace(trim($7),' ','') )) OR
                        UNACCENT(lower( replace(trim(l.comentario_historico),' ','') )) LIKE UNACCENT(lower( replace(trim($7),' ','') )) OR 
                        $7 = ''
                    )
                    `,
            values: [
                1,
                filter_idresponsable,
                filter_ns_start,
                filter_ns_end,
                this.idUserLogin,
                filter_tipo_lead,
                filter_search_all === '' ? '' : `%${filter_search_all}%`,
                _dateCurrent,
                _dateLastWeek
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Obtiene el número de LEADs para la migracion entre usuarios
     * @returns 
     */
    async getNroLeads(): Promise<IData | IErrorResponse> {
        const queryData = {
            name: 'get-nro-leads',
            text: ` 
                        SELECT count(l.*) as total_data
                        FROM (
                            SELECT l.id
                            FROM ${Constants.tbl_lead_dn_sql} l
                            LEFT JOIN ${Constants.tbl_responsable_lead_dn_sql} rsp ON (rsp.id = l.idresponsable)
                            LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                            WHERE l.estatus >= $1 AND 
                            (l.idresponsable = $2) AND 
                            (l.next_step BETWEEN $3 AND $4) AND
                            (l.tipo_lead = $5) AND
                            (l.idtipointeresa = $6 OR $6 = -2)
                            ORDER BY COALESCE(ti.codigo, 0) DESC, l.next_step DESC, l.id DESC
                        ) l
                        `,
            values: [1,
                this.infoExtra.filter.idresponsable_source,
                this.infoExtra.filter.ns_start,
                this.infoExtra.filter.ns_end,
                this.infoExtra.filter.tipo_lead,
                this.infoExtra.filter.idtipointeres
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async moverLeads(): Promise<IData | IErrorResponse> {
        const queryData = {
            name: 'mover-leads',
            text: ` 
                        UPDATE ${Constants.tbl_lead_dn_sql} SET idresponsable = $7
                        WHERE id IN (	SELECT l.id
                                        FROM ${Constants.tbl_lead_dn_sql} l
                                        LEFT JOIN ${Constants.tbl_responsable_lead_dn_sql} rsp ON (rsp.id = l.idresponsable)
                                        LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                                        WHERE l.estatus >= $1 AND 
                                        (l.idresponsable = $2) AND 
                                        (l.next_step BETWEEN $3 AND $4) AND
                                        (l.tipo_lead = $5) AND
                                        (l.idtipointeresa = $6 OR $6 = -2)
                                        ORDER BY COALESCE(ti.codigo, 0) DESC, l.next_step DESC, l.id DESC
                                        LIMIT $8
                        )
                        `,
            values: [1,
                this.infoExtra.filter.idresponsable_source,
                this.infoExtra.filter.ns_start,
                this.infoExtra.filter.ns_end,
                this.infoExtra.filter.tipo_lead,
                this.infoExtra.filter.idtipointeres,
                this.infoExtra.filter.idresponsable_target,
                this.infoExtra.filter.nro_datos_mover
            ]
        }

        await this.client.exeQuery(queryData)

        return { total_data: 0 }
    }

    /**
     * 
     * @returns 
     */
    async getTotalUsersRRHH(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        // let filter_iduser = this.infoExtra.filter.iduser || 0
        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-users-rrhh',
            text: ` 
                    SELECT count(dt.*) as total_data
                    FROM (
                        SELECT usu.id, usu.nombre_completo, usu.username,
                        STRING_AGG(srol.nombre, ' | ') as nombrerol_str
                        FROM ${Constants.tbl_usuario_sql} usu
                        LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                                    FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                                    JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                                    JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                        ) srol on (srol.idusuario = usu.id)
                        WHERE usu.estado >= $1 AND usu.estado IS NOT NULL AND 
                        srol.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin')
                        GROUP BY usu.id
                    ) dt
                    WHERE ( 
                        UNACCENT(lower( replace(trim(dt.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(dt.nombrerol_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(dt.username ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                        $2 = ''
                    )
                    `,
            values: [
                this.filterStatus,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async getTotalApartmentsCOLABORADOR(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''
        const _nro_habitaciones = isNaN(parseInt(this.infoExtra!.filter!.nro_habitaciones)) ? -1 : parseInt(this.infoExtra!.filter!.nro_habitaciones)
        const _capacidad_maxima = isNaN(parseInt(this.infoExtra!.filter!.capacidad_maxima)) ? -1 : parseInt(this.infoExtra!.filter!.capacidad_maxima)
        const _nro_banios = isNaN(parseInt(this.infoExtra!.filter!.nro_banios)) ? -1 : parseInt(this.infoExtra!.filter!.nro_banios)

        let _total_start = isNaN(parseFloat(this.infoExtra!.filter!.total_start)) ? 0 : parseFloat(this.infoExtra!.filter!.total_start)
        let _total_end = isNaN(parseFloat(this.infoExtra!.filter!.total_end)) ? 10000000 : parseFloat(this.infoExtra!.filter!.total_end)

        _total_start = _total_start > -1 ? _total_start : 0
        _total_end = _total_end > -1 ? _total_end : 10000000

        const queryData = {
            name: 'get-total-pisos-colaborador',
            text: ` 
                    SELECT count(pf.id) as total_data
                    FROM (
                        SELECT vc.variablesreserva, vc.total_str, p.*, ipc.estado_general        
                        FROM (
                                SELECT p.id
                                FROM ${Constants.tbl_piso_sql} p
                                WHERE p.estado = 1 AND
                                        p.tipo LIKE 'piso' AND
                                        p.visible_rmg = 1 AND
                                        (
                                            UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                                            UNACCENT(lower( replace(trim(   COALESCE(p.ciudad, '') || ',' ||
                                                                            COALESCE(p.codigo_postal, '') || ','  || 
                                                                            COALESCE(p.direccion, '') || ',' || 
                                                                            COALESCE(p.nro_edificio, '') || ',' ||
                                                                            COALESCE(p.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
                                            $1 = ''
                                        )
                                        GROUP BY p.id
                                        ORDER BY p.etiqueta ASC
                        ) p
                        INNER JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (p.id = ipc.idpiso)
                        INNER JOIN (
                            SELECT ipc.idpiso,
                            (CASE
                                WHEN count(vr.*) > 0 THEN jsonb_agg(json_build_object(  'id', vr.id,
                                                                                        'precio_alquiler', vr.precio_alquiler,
                                                                                        'precio_muebles', vr.precio_muebles,
                                                                                        'total', vr.total
                                                                                    ))
                                WHEN count(vr.*) = 0 THEN '[]'
                            END
                            ) as variablesreserva,
                            STRING_AGG( COALESCE(vr.total, 0)::text, ' | ') as total_str
                            FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                            LEFT JOIN (
                                SELECT * 
                                FROM ${Constants.tbl_variables_reserva_rmg_sql} vr 
                                WHERE vr.estado = 1 
                                ORDER BY fecha_creacion DESC, id DESC 
                            ) vr ON (ipc.id = vr.idinfopisocom)
                            WHERE ipc.estado = 1
                            GROUP BY ipc.idpiso
                        ) vc ON (vc.idpiso = p.id)
                    ) as pf
                    LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.id = ipd.id 
                    WHERE pf.estado_general = 1 AND 
                    (
                        ipd.ds_nro_dormitorios = $2 OR $2 = -1
                    ) AND
                    (
                        $3 <= ipd.cp_ocupacion_maxima OR $3 = -1
                    ) AND
                    (
                        ipd.bs_nro_banios = $4 OR $4 = -1
                    ) AND
                    ( 
                        ( CAST(COALESCE(pf.total_str, '0') as double precision) BETWEEN $5 AND $6 ) OR
                        ( CAST(COALESCE(pf.total_str, '0') as double precision)::integer BETWEEN ($5)::integer AND ($6)::integer )
                    )
                    `,
            values: [
                search_all === '' ? '' : `%${search_all}%`,
                _nro_habitaciones,
                _capacidad_maxima,
                _nro_banios,
                _total_start,
                _total_end
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Retorna total de todos los usuarios del sistema [datos para rol ADMIN]
     * @returns 
     */
    async getTotalUserAdmin(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-users-admin',
            text: ` 
                    SELECT count(dt.*) as total_data
                    FROM (
                        SELECT usu.id, usu.nombre_completo, usu.username,
                        STRING_AGG(srol.nombre, ' | ') as nombrerol_str
                        FROM ${Constants.tbl_usuario_sql} usu
                        LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                                    FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                                    JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                                    JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                        ) srol on (srol.idusuario = usu.id)
                        WHERE usu.estado >= $1 AND usu.estado IS NOT NULL
                        GROUP BY usu.id
                    ) dt
                    WHERE ( 
                        UNACCENT(lower( replace(trim(dt.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(dt.nombrerol_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(dt.username ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                        $2 = ''
                    )
                    `,
            values: [
                this.filterStatus,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }
        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Perfiles DN
     * @returns 
     */
    async getTotalPerfilesDN(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-perfiles-DN',
            text: ` SELECT COUNT(dt.*) as total_data 
                    FROM (
                        SELECT rl.*
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                        WHERE rl.estado >= $1 AND 
                        (
                            UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(rl.codigo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(rl.nombre ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(rl.tipo_lead ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            $2 = ''
                        )
                        GROUP BY rl.id, usu.nombre_completo
                    ) dt
                    `,
            values: [
                this.filterStatus,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }
        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Devices Pisos
     * @returns 
     */
    async getTotalDevices(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-devices',
            text: ` SELECT COUNT(d.*) as total_data 
                    FROM (
                        SELECT d.*, 
                        COALESCE((p.etiqueta), 'Libre') as etiqueta, 
                        td.codigo as tdevice, 
                        td.nombre as nametdevice,
                        COALESCE((l.mac), 'XX:XX:XX:XX:XX:XX') as mac
                        FROM tbl_dispositivo d
                        LEFT JOIN tbl_piso p ON (p.id = d.idpiso)
                        LEFT JOIN tbl_manija l ON (l.iddispositivo = d.id)
                        INNER JOIN tbl_tipo_dispositivo td ON (td.id = d.idtipodispositivo)
                    ) d
                    WHERE d.estado >= $1 AND 
                    (
                        UNACCENT(lower( replace(trim(d.codigo),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.nombre),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.tdevice),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.nametdevice),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.etiqueta),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.mac),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        $2 = ''
                    )
                    `,
            values: [
                this.filterStatus,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }
        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async getTotalDeviceReport(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        // let search_all = this.infoExtra.filter.search_all  || ''
        let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'

        const queryData = {
            name: 'get-total-devices-report',
            text: ` 
                    SELECT COUNT(rd.*) as total_data 
                    FROM ${Constants.tbl_reporte_atic_sql} rd
                    WHERE date(rd.fecha) BETWEEN $1 AND $2
                    `,
            values: [
                filter_ns_start,
                filter_ns_end
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }


    //// Si se necesita agregar los campos a cambiar
    async getTotalArticulosInventario(): Promise<IData | IErrorResponse> {


        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }


        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: "get-inventario",
            text: `SELECT COUNT (inv.id_piso, inv.id_articulo, inv.cantidad, ar.mobiliario, ar.stock, ar.total , pi.id_dispositivo_ref, pi.etiqueta) as total_data
                        FROM ${Constants.tbl_inventario_da_sql} inv
                        INNER JOIN ${Constants.tbl_piso_sql} pi
                        ON pi.id = inv.id_piso
                        INNER JOIN ${Constants.tbl_articulos_da_sql} ar
                        ON ar.id = inv.id_articulo
                        WHERE
                        (
                            UNACCENT(lower( replace(trim(ar.mobiliario), ' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                            UNACCENT(lower( replace(trim(pi.etiqueta), ' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                            UNACCENT(lower( replace(trim(pi.id_dispositivo_ref), ' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                            $1 = ''
                        )
                        `,
            values: [
                search_all === '' ? '' : `%${search_all}%`
            ]

        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]

    }

    async getTotalArticulos(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }


        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: "get-articulos-pag",
            text: `SELECT COUNT (ar.*) as total_data
                    FROM  ${Constants.tbl_articulos_da_sql} ar
                    WHERE 
                    (
                        UNACCENT(lower( replace(trim(ar.tag), ' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                        UNACCENT(lower( replace(trim(ar.mobiliario), ' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                        $1 = ''
                    )
                    `,

            values: [

                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse
        return lData[0]
    }

    // sigan esta nomenclatura de nombres
    /**
     * Retorna el total de grupo de prescriptores
     * @returns { total_data: number }
     */
    async getTotalGrupoPrescriptores(): Promise<IData | IErrorResponse> {
        //copiamos de otro metodo la estructura
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-prescriptores',
            text: ` SELECT count(gp.*) as total_data
                    FROM (
                        SELECT gp.id
                            FROM tbl_grupo_prescriptor_dn gp
                            LEFT JOIN (
                                SELECT pre.idgrupo,
                                STRING_AGG(usu.telefono, ' | ') as telefonos_str,
                                STRING_AGG(usu.nombre_completo, ' | ') as nombres_str,
                                STRING_AGG(usu.email, ' | ') as email_str,
                                STRING_AGG(usu.empresa, ' | ') as empresa_str
                                FROM tbl_prescriptor_dn pre
                                INNER JOIN tbl_usuario usu ON (usu.id = pre.idusuario)
                                GROUP BY pre.idgrupo
                            ) dpre ON dpre.idgrupo = gp.id
                            WHERE gp.estado >= $1 AND
                            ( 
                                UNACCENT(lower( replace(trim(gp.nombre ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                                UNACCENT(lower( replace(trim(COALESCE(dpre.telefonos_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                                UNACCENT(lower( replace(trim(COALESCE(dpre.nombres_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                                UNACCENT(lower( replace(trim(COALESCE(dpre.email_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                                UNACCENT(lower( replace(trim(COALESCE(dpre.empresa_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                                $2 = ''
                            )
                    ) gp
                    `,
            values: [
                1,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }
        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Retorna el total de grupo de prescriptores
     * @returns { total_data: number }
     */
    async getTotalGrupoPropietarios(): Promise<IData | IErrorResponse> {
        //copiamos de otro metodo la estructura
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-propietarios',
            text: ` SELECT count(gp.*) as total_data
                    FROM (
                        SELECT gp.id
                        FROM ${Constants.tbl_grupo_propietario_dn_sql} gp
                        LEFT JOIN (
                            SELECT pro.idgrupo,
                            STRING_AGG(usu.telefono, ' | ') as telefonos_str,
                            STRING_AGG(usu.nombre_completo, ' | ') as nombres_str,
                            STRING_AGG(usu.email, ' | ') as email_str
                            FROM ${Constants.tbl_propietario_dn_sql} pro
                            INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = pro.idusuario)
                            GROUP BY pro.idgrupo
                        ) dpro ON dpro.idgrupo = gp.id
                        WHERE gp.estado >= $1 AND
                        (
                            UNACCENT(lower( replace(trim(gp.nombre),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(COALESCE(dpro.telefonos_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(COALESCE(dpro.nombres_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(COALESCE(dpro.email_str,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            $2 = ''
                        )
                    ) gp
                    `,
            values: [
                1,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }
        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async getTotalKeys(): Promise<IData | IErrorResponse> {
        //copiamos de otro metodo la estructura
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-keys',
            text: ` 
                    SELECT count(keys.*) as total_data 
                        FROM (
                              SELECT ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr,
                              (CASE
                                    WHEN count(dll.*) > 0 THEN STRING_AGG(COALESCE(dll.id_dispositivo_ref, ''), ' | ')
                                    WHEN count(dll.*) = 0 THEN 'Libre'
                                    END
                              ) AS pisos_str,
                              ll.estado
                              FROM ${Constants.tbl_llave_sql} ll
                              LEFT JOIN (	
                                          SELECT llm.idllave, 
                                          (CASE
                                                WHEN p.id_dispositivo_ref IS NOT NULL THEN p.id_dispositivo_ref
                                                WHEN p.id_dispositivo_ref IS NULL THEN 'Libre'
                                          END) AS id_dispositivo_ref
                                          FROM ${Constants.tbl_llave_x_manija_sql} llm
                                          INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija
                                          INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1)
                                          LEFT JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso)
                              ) dll ON dll.idllave = ll.id
                              GROUP BY ll.id
                        ) keys
                         WHERE keys.estado >= $1 AND keys.estado IS NOT NULL AND 
                         ( 
                              UNACCENT(lower( replace(trim(keys.idqr ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                              UNACCENT(lower( replace(trim(keys.tipo_tarjeta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              UNACCENT(lower( replace(trim(keys.ubicacion ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              UNACCENT(lower( replace(trim(keys.pisos_str),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              $2 = '')
                    `,
            values: [
                -1,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }
        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async getTotalFichajeOficina(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-personal-oficina',
            text: ` 
                    SELECT count(fo.id) as total_data
                    FROM tbl_fichaje_oficina fo
                    INNER JOIN tbl_usuario usu ON (usu.id = fo.idusuario)
                    WHERE fo.estado = 1 AND 
                    fo.fecha BETWEEN $1 AND $2 AND
                    ( 
                        UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR 
                        $3 = ''
                    )
                    `,
            values: [
                filter_m_start,
                filter_m_end,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async _getTotalUsersRRHH():Promise <IData | IErrorResponse>{
        if(!this.infoExtra) this.infoExtra = {}
        else if(!this.infoExtra!.filter) this.infoExtra = { filter : {} }

        let search_all = this.infoExtra.filter.search_all || ''
        
        const queryData = {
            name : "get-total-usuarios-rrhh",
            text: `
            SELECT count(usp.*) as total_data FROM	
                (SELECT us.* , ur.correo_personal , ur.jornada
                FROM
                (SELECT usu.id, usu.email, usu.estado, usu.username, usu.idusuario,
                usu.nombre_completo,
                (CASE
                WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                WHEN count(srol.*) = 0 THEN '[]'
                END) AS roles,
                             STRING_AGG(srol.nombre, ' | ') as nombrerol_str
                FROM ${Constants.tbl_usuario_sql} usu
                LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre , uxr.ismain
                FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                ) srol on (srol.idusuario = usu.id)
                WHERE usu.estado >= 1 AND usu.estado IS NOT NULL AND srol.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin','limpieza', 'mantenimiento')
                AND srol.ismain = true
                GROUP BY usu.id							
                ) as us
                LEFT JOIN ${Constants.tbl_usuario_rrhh_sql} ur ON us.id = ur.id) AS usp
                            WHERE ( 
                            UNACCENT(lower( replace(trim(usp.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                            UNACCENT(lower( replace(trim(usp.nombrerol_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                            UNACCENT(lower( replace(trim(usp.username ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
                            $1 = ''
                            ) 
                            AND usp.id not in (select idusuario_resp from tbl_responsable_lead_dn where idusuario_resp <> 6)
                            AND usp.username not in ('rrhh','RRHH1', 'rmg', 'rmg1', 'rmg2', 'ade', 'ADE1', 'crm', 'CRM1', 'atic','dn', 'da', 'da1','da2', 'da3', 'da4', 'da5')

            `,
            // text : `
            // SELECT count(dt.*) as total_data
            //         FROM (
            //             SELECT usu.id, usu.nombre_completo, usu.username,
            //             STRING_AGG(srol.nombre, ' | ') as nombrerol_str
            //             FROM tbl_usuario usu
            //             LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
            //                         FROM tbl_usuario_x_rol uxr 
            //                         JOIN tbl_rol r on (r.id = uxr.idrol)
            //                         JOIN tbl_usuario usu on (usu.id = uxr.idusuario)
			// 					    JOIN tbl_usuario_rrhh ur on (usu.id = ur.id)
            //             ) srol on (srol.idusuario = usu.id)
            //             WHERE usu.estado >= 1 AND usu.estado IS NOT NULL AND 
            //             srol.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin', 'limpieza', 'mantenimiento')
            //             GROUP BY usu.id
            //         ) dt
            //         WHERE ( 
            //             UNACCENT(lower( replace(trim(dt.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
            //             UNACCENT(lower( replace(trim(dt.nombrerol_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
            //             UNACCENT(lower( replace(trim(dt.username ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
            //             $1 = ''
            //         )
					
            // `,
            values: [
                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    async getTotalInfoComercial(): Promise<IData | IErrorResponse>{
        if(!this.infoExtra) this.infoExtra = { filter : {} }
        else if(!this.infoExtra!.filter) this.infoExtra = { filter : {} }


        const _search_all = this.infoExtra!.filter!.search_all || ''
        const _nro_habitaciones = isNaN(parseInt(this.infoExtra!.filter!.nro_habitaciones)) ? -1 : parseInt(this.infoExtra!.filter!.nro_habitaciones)
        const _capacidad_maxima = isNaN(parseInt(this.infoExtra!.filter!.capacidad_maxima)) ? -1 : parseInt(this.infoExtra!.filter!.capacidad_maxima)
        const _nro_camas = isNaN(parseInt(this.infoExtra!.filter!.nro_camas)) ? -1 : parseInt(this.infoExtra!.filter!.nro_camas)
        const _nro_banios = isNaN(parseInt(this.infoExtra!.filter!.nro_banios)) ? -1 : parseInt(this.infoExtra!.filter!.nro_banios)
        const _total = isNaN(parseFloat(this.infoExtra!.filter!.total)) ? -1 : parseFloat(this.infoExtra!.filter!.total)
        const _estado_general = isNaN(parseInt(this.infoExtra!.filter!.estado_general)) ? -2 : parseInt(this.infoExtra!.filter!.estado_general)

        let _total_start = isNaN(parseFloat(this.infoExtra!.filter!.total_start)) ? 0 : parseFloat(this.infoExtra!.filter!.total_start)
        let _total_end = isNaN(parseFloat(this.infoExtra!.filter!.total_end)) ? 10000000 : parseFloat(this.infoExtra!.filter!.total_end)

        const queryData = {
            name: "get-total-data-info-comercial",
            text : `
            SELECT count(ptd.*) as total_data
			FROM(
                    SELECT pf.*
                 FROM (
                 SELECT ipc.id, ipc.estado_general, 
                 p.etiqueta AS a_etiqueta, p.id as idpiso, plfc.plataformas,
                 COALESCE(vc.variablesreserva, '[]') as variablesreserva,
                 p.ciudad as a_localidad, p.codigo_postal as a_codigo_postal, 
                 (p.direccion || ', Nro ' || p.nro_edificio || ', ' || p.nro_piso) as a_full_direccion, p.ubicacion_mapa,
                 vc.total_str,p.ocupacion_maxima, p.m2, p.nro_dormitorios, p.nro_camas, p.nro_banios, p.nro_sofacama,
                 p.etiqueta
                 FROM tbl_piso p
                 LEFT JOIN tbl_info_piso_da ipd ON p.id = ipd.id
                 LEFT JOIN tbl_info_piso_comercial_rmg ipc ON (p.id = ipc.idpiso)
                 LEFT JOIN (
                     SELECT p.id,
                     (CASE
                         WHEN count(pc.*) > 0 THEN jsonb_agg(json_build_object(  'id', pc.id,
                                                                                 'codigo', COALESCE(pc.codigo, ''), 
                                                                                 'nombre', COALESCE(pc.nombre, ''),
                                                                                 'link', COALESCE(pi.link, '') ))
                         WHEN count(pc.*) = 0 THEN '[]'
                     END
                     ) as plataformas
                     FROM tbl_info_piso_comercial_rmg ipc
                     RIGHT JOIN tbl_piso p ON (p.id = ipc.idpiso)
                     LEFT JOIN tbl_plataforma_comercial_rmg pc ON (pc.estado = 1)
                     LEFT JOIN tbl_plataforma_infopiso_rmg pi ON (pc.id = pi.idplataformacom AND pi.estado = 1 AND ipc.id = pi.idinfopisocom)
                     GROUP BY p.id
                 ) plfc ON plfc.id = p.id
                 LEFT JOIN (
                     SELECT ipc.idpiso,
                     (CASE
                         WHEN count(vr.*) > 0 THEN jsonb_agg(json_build_object(  'id', vr.id, 
                                                                                 'precio_limite', vr.precio_limite,
                                                                                 'precio_alquiler', vr.precio_alquiler,
                                                                                 'precio_muebles', vr.precio_muebles,
                                                                                 'total', vr.total
                                                                             ))
                         WHEN count(vr.*) = 0 THEN '[]'
                     END
                     ) as variablesreserva,
                     STRING_AGG( COALESCE(vr.total, 0)::text, ' | ') as total_str
                     FROM tbl_info_piso_comercial_rmg ipc
                     LEFT JOIN (
                         SELECT * 
                         FROM tbl_variables_reserva_rmg vr 
                         WHERE vr.estado = 1 
                         ORDER BY fecha_creacion DESC, id DESC 
                     ) vr ON (ipc.id = vr.idinfopisocom)
                     WHERE ipc.estado = 1
                     GROUP BY ipc.idpiso
                 ) vc ON (vc.idpiso = p.id)
                 WHERE p.estado = $1 AND 
                     (ipc.estado = 1 OR ipc.estado IS NULL) AND
                     p.visible_rmg = 1 AND
                     (ipc.estado_general = $9 OR $9 = -2) AND 
                     (
                         UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                         UNACCENT(lower( replace(trim(ipd.if_zonas ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                         (
                             CASE
                                 WHEN ipc.estado_general = 1 THEN 'activo'
                                 WHEN ipc.estado_general = 2 THEN 'stopsell'
                                 WHEN ipc.estado_general = 3 THEN 'nodisponible'
                                 WHEN ipc.estado_general IS NULL THEN '---'
                             END
                         ) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                         UNACCENT(lower( replace(trim(   COALESCE(ciudad, '') || ',' ||
                                                         COALESCE(codigo_postal, '') || ','  || 
                                                         COALESCE(direccion, '') || ',' || 
                                                         COALESCE(nro_edificio, '') || ',' ||
                                                         COALESCE(nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                         $2 = ''
                     ) 
                     ) AS pf
                     LEFT JOIN tbl_info_piso_da ipd ON pf.idpiso = ipd.id
                     WHERE 
                     (
                         ipd.ds_nro_dormitorios = $3 OR $3 = -1 
                     ) AND
                     (
                         $4 <= ipd.cp_ocupacion_maxima OR $4 = -1
                     ) AND
                     (
                         ipd.ds_nro_camas = $5 OR $5 = -1
                     ) AND
                     (
                         ipd.bs_nro_banios = $6 OR $6 = -1
                     ) AND
                     ( 
                         ( CAST(COALESCE(pf.total_str, '0') as double precision) BETWEEN $7 AND $8 ) OR
                         ( CAST(COALESCE(pf.total_str, '0') as double precision)::integer BETWEEN ($7)::integer AND ($8)::integer )
                     ) 
                 ORDER BY pf.estado_general ASC, CAST(COALESCE(pf.total_str, '0') as double precision) ASC, pf.etiqueta ASC
                ) as ptd
                    
            `,
            values : [
                1,
                _search_all === '' ? '' : `%${_search_all}%`,
                _nro_habitaciones,
                _capacidad_maxima,
                _nro_camas,
                _nro_banios,
                _total_start,
                _total_end,
                _estado_general
            ]
        }

        let lData: Array <IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IData | IErrorResponse>

        if (( {...lData[0]} as IErrorResponse ).error) return lData[0] as IErrorResponse
        return lData[0]
    } 

    async getTotalPisosDA(): Promise<IData | IErrorResponse>{
        if(!this.infoExtra) this.infoExtra = { filter : {} }
        else if(!this.infoExtra!.filter) this.infoExtra = { filter : {} }


        const _search_all = this.infoExtra!.filter!.search_all || ''

        const queryData = {
            name : "get-total-data-pisos-da",
            text: `
            SELECT count (pft.*) as total_data 
                FROM 	(
                    SELECT pf.*
                            FROM 
                            (
                                SELECT p.id,
                                p.ubicacion_mapa,
                                p.pais,
                                p.ciudad,
                                p.codigo_postal,
                                p.direccion,
                                p.nro_edificio,
                                p.nro_piso,
                                p.estado,
                                p.etiqueta,
                                p.tipo,
                                STRING_AGG(d.type, '|') as dispositivos_str,
                                (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
                                FROM tbl_piso p
                                LEFT JOIN (
                                    SELECT disp.id, disp.idpiso, tdisp.codigo as type  
                                    FROM tbl_dispositivo disp
                                    INNER JOIN tbl_tipo_dispositivo tdisp ON (tdisp.id = disp.idtipodispositivo)
                                    WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                                ) d ON (d.idpiso = p.id)
                            
                                GROUP BY p.id
                            ) as pf
                            LEFT JOIN tbl_info_piso_da ipd ON pf.id = ipd.id
                            WHERE pf.estado >= 0 AND 
                            pf.estado IS NOT NULL AND
                            pf.tipo LIKE 'piso' AND 
                            (
                                UNACCENT(lower( replace(trim(pf.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                                UNACCENT(lower( replace(trim(   COALESCE(pf.ciudad, '') || ',' ||
                                                                COALESCE(pf.codigo_postal, '') || ','  || 
                                                                COALESCE(pf.direccion, '') || ',' || 
                                                                COALESCE(pf.nro_edificio, '') || ',' ||
                                                                COALESCE(pf.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
                                $1 = ''
                            )
                            ORDER BY nullif(regexp_replace(lower(pf.etiqueta), '[^a-z]', '', 'g'),'')::text, 
                                    nullif(regexp_replace(pf.etiqueta, '[^0-9]', '', 'g'),'')::int
                        ) as pft
                    `,
            values : [
            _search_all === '' ? '' : `%${_search_all}%`
            ]
        }
        let lData: Array <IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IData | IErrorResponse>

        if (( {...lData[0]} as IErrorResponse ).error) return lData[0] as IErrorResponse
        return lData[0]

    }

    async getTotalShare(): Promise <IData | IErrorResponse>{
        if(!this.infoExtra) this.infoExtra = { filter : {} }
        else if(!this.infoExtra!.filter) this.infoExtra = { filter : {} }

        const _search_all = this.infoExtra!.filter!.search_all || ''

        const queryData = {
            name : "get-total-share-data",
            text : `
            SELECT count(pts.*) as total_data
                    FROM (
                    SELECT pf.* 
                            FROM
                            (
                            SELECT
                            p.id,
                            p.ubicacion_mapa,
                            p.pais,
                            p.ciudad,
                            p.codigo_postal,
                            p.direccion,
                            p.nro_edificio,
                            p.nro_piso,
                            p.estado,
                            p.etiqueta,           
                            STRING_AGG(d.type, '|') as dispositivos_str,
                            (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
                            FROM tbl_piso p
                            LEFT JOIN (
                                SELECT disp.id, disp.idpiso, tdisp.codigo as type  
                                FROM tbl_dispositivo disp
                                INNER JOIN tbl_tipo_dispositivo tdisp ON (tdisp.id = disp.idtipodispositivo)
                                WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                            ) d ON (d.idpiso = p.id)
                            WHERE p.estado >= 1 AND 
                            p.estado IS NOT NULL AND
                            p.tipo LIKE 'piso' AND 
                            (
                                UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                                UNACCENT(lower( replace(trim(   COALESCE(p.ciudad, '') || ',' ||
                                                                COALESCE(p.codigo_postal, '') || ','  || 
                                                                COALESCE(p.direccion, '') || ',' || 
                                                                COALESCE(p.nro_edificio, '') || ',' ||
                                                                COALESCE(p.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
                                $1 = ''
                            )
                            
                            GROUP BY p.id
                            ORDER BY p.etiqueta ASC ) as pf
                            LEFT JOIN tbl_info_piso_da ipd ON pf.id = ipd.id
                            ORDER BY pf.etiqueta ASC 
                            ) as pts 
            `,
            values : [
                _search_all === '' ? '' : `%${_search_all}%`
            ]
        }
        let lData : Array <IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IData | IErrorResponse>

        if (( {...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse
        return lData[0]
    }

    async getTotalVacaciones(): Promise <IData | IErrorResponse>{
        if(!this.infoExtra) this.infoExtra = { filter : {} }
        else if(!this.infoExtra!.filter) this.infoExtra = { filter : {} }

        const _search_all = this.infoExtra!.filter!.search_all || ''
        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'

        const queryData = {
            name : "get-total-vacaciones",
            text: `
            SELECT count (tv.*) as total_data 
            FROM(
                SELECT sv.id ,
                (
                    CASE 
                        when sv.estado_solicitud = 0 THEN 'En espera'
                        when sv.estado_solicitud = 1 THEN 'Aprobada'
                        when sv.estado_solicitud = 2 THEN 'Rechazada' 
                    END
                ) as estado_solicitud
                FROM tbl_solicitud_rrhh sv
                LEFT JOIN tbl_usuario usu ON usu.id = sv.idusuario
                WHERE sv.fecha_inicio BETWEEN $1 AND $2 AND
                ( 
                    UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                    UNACCENT(lower( replace(trim(
                        (
                            CASE 
                            when sv.estado_solicitud = 0 THEN 'En espera'
                            when sv.estado_solicitud = 1 THEN 'Aprobada'
                            when sv.estado_solicitud = 2 THEN 'Rechazada' 
                            END
                        )
                            ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR 
                    $3 = ''
                )
                ORDER BY sv.estado ASC) tv
                  
            `,
            values : [
               
                filter_m_start,
                filter_m_end,
                _search_all === '' ? '' : `%${_search_all}%`,
            ]
        }

        let lData : Array <IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IData | IErrorResponse>

        if (( {...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse
        return lData[0]
    }

    /**
     * Retorna el total de solicitudes realizadas por el propietario.
     * @returns { total_data }
     */
    async getTotalSolicitudLimitePrecio(): Promise<IData | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let filter_state_sol = this.infoExtra.filter.state_sol || 0
        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-total-solicitud-limite-precio',
            text: ` SELECT count(sp.*) as total_data
                    FROM (
                        SELECT sp.id,
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
                        UNACCENT(lower( replace(trim(sp.propietario ),' ','')  )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(sp.piso,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(sp.lbl_estado_solicitud,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR
                        $4 = ''
                    )
                    `,
            values: [
                filter_state_sol,
                filter_m_start,
                filter_m_end,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Retorna el numero de solicitudes de acuerdo a su estado. Es para mostrar a RMG
     * que no esta haciendo su trabajo como se debe jajajaja
     * 1 -> Pendiente
     * 2 -> Aprobada
     * 3 -> Rechazada
     * @param estadoSol 
     * @returns { total_data }
     */
    async getTotalSolicitudLimitePrecioByEstadoSol(estadoSol: number): Promise<IData | IErrorResponse> {
        const queryData = {
            name: 'get-total-solicitud-by-estado-solicitud',
            text: ` SELECT count(*) as total_data
                    FROM tbl_solicitud_precio 
                    WHERE estado = 1 AND 
                    estado_solicitud = $1
                    `,
            values: [
                estadoSol
            ]
        }

        let lData: Array<IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IData | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

     async getTotalEsquema(): Promise <IData | IErrorResponse>{
        if (!this.infoExtra) this.infoExtra = {filter : {} }
        else if(!this.infoExtra!.filter) this.infoExtra = {filte : {} }
        
        const _search_all = this.infoExtra!.filter!.search_all || ''
        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'
        let filter_iduser = this.infoExtra.filter.iduser || 0


        const queryData ={
            name : "get-total-esquema",
            // text :  `
            // SELECT  COUNT(esq.*) as total_data
			// from 
			// (SELECT 
			// fo.idusuario
		
            // FROM tbl_fichaje_oficina fo
            // LEFT JOIN tbl_usuario_rrhh usr ON (fo.idusuario = usr.id)
            // WHERE fo.estado = 1  AND
            // fo.fecha BETWEEN $1 AND $2
		    // ) as esq
			 
			//  INNER JOIN tbl_usuario usu ON (usu.id = esq.idusuario)
			//  INNER JOIN tbl_usuario_x_rol uxr ON (usu.id = uxr.idusuario)
			//  LEFT JOIN tbl_usuario_rrhh usrf ON (usu.id = usrf.id)
			//  WHERE  (esq.idusuario = $3 OR $3 = 0) AND
			//  ( 
            //     UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR 
            //     UNACCENT(lower( replace(trim(uxr.idrol ),' ','')  )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR
            //     UNACCENT(lower( replace(trim(
            //                                         (
            //                                     CASE 
            //                                     WHEN usrf.horario = 'HM' THEN 'Horario de Mañanas'
            //                                     WHEN usrf.horario = 'HT' THEN 'Horario de Tardes'
            //                                     WHEN usrf.horario = 'HC' THEN 'Horario Completo'
            //                                     END
            //                                         )
            //     ),' ','')  )) LIKE UNACCENT(lower( replace(trim($4),' ','') )) OR
            //     $4 = ''
            // ) AND uxr.ismain = true AND usu.estado = 1

            // `,
            text: `
                    select count(fo.*)			
                    from tbl_usuario u
                    LEFT join tbl_usuario_rrhh ur on u.id = ur.id
                    INNER JOIN tbl_usuario_x_rol uxr on u.id = uxr.idusuario
                    left join (
                            select fo.*
                            from tbl_fichaje_oficina fo
                            where fo.fecha BETWEEN $1 AND $2
                            AND fo.estado = 1
                                ) fo on fo.idusuario = u.id
                    WHERE
                    ( 
                        UNACCENT(lower( replace(trim(u.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR 
                        UNACCENT(lower( replace(trim(uxr.idrol ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                        UNACCENT(lower( replace(trim(
                                                            (
                                                        CASE 
                                                        WHEN ur.horario = 'HM' THEN 'Horario de Mañanas'
                                                        WHEN ur.horario = 'HT' THEN 'Horario de Tardes'
                                                        WHEN ur.horario = 'HC' THEN 'Horario Completo'
                                                        END
                                                            )
                        ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                        $3 = ''
                    ) 
                    AND uxr.ismain = true AND u.estado = 1
                    AND uxr.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin','limpieza', 'mantenimiento')
                    AND u.id not in (select idusuario_resp from tbl_responsable_lead_dn where idusuario_resp <> 6)
                
            `,
            values : [
                filter_m_start, 
                filter_m_end,
                _search_all === '' ? '' : `%${_search_all}%`
            ]
        }

        let lData : Array <IData | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IData | IErrorResponse>

        if( ( {...lData[0] } as IErrorResponse ).error ) return lData[0] as IErrorResponse

        return lData[0]
    }
}

export default DataDataAccess