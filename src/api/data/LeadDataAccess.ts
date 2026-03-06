import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { ILead } from "../models/ILead"
import { IModel } from "../helpers/IModel"
import UtilInstance from "../helpers/Util"
import { ITelefono } from "../models/ITelefono"
import { ICorreo } from "../models/ICorreo"
import { IHistoricoLead } from "../models/IHistoricoLead"
import { IUser } from "../models/IUser"
import { IApartment } from "../models/IApartment"
import { IGrupoPrescriptor } from "../models/IGrupoPrescriptor"
import { IGrupoPropietario } from "../models/IGrupoPropietario"
import { ISucesoPrescriptor } from "../models/ISucesoPrescriptor"
import { IResponseGeneral } from "../modelsextra/IResponseGeneral"
import { IData } from "../modelsextra/IData"
import { time } from "console"

class LeadDataAccess implements IDataAccess<ILead> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async getOLDOK(): Promise<Array<ILead> | IErrorResponse> {
        // let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        // let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'
        // let filter_idresponsable = this.infoExtra.filter.idresponsable || -2
        // let filter_tipo_lead = this.infoExtra.filter.tipo_lead || '-2'
        // console.log(this.infoExtra.filter)
        const queryData  = {
                name: 'get-lead',
                text: ` 
                        SELECT
                        l.id, l.lead_id, l.tipo_lead, to_char( l."timestamp", 'DD/MM/YYYY HH24:MI:SS') as "timestamp", 
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.last_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS last_step,
                        l.semana, 
                        l.nombre, l.apellido, l.grupo_wpp, l.referencia, 
                        l.precio, l.m2, l.codigo_postal, l.direccion, l.nro_edificio, l.nro_piso, 
                        l.localidad, l.estatus, l.nro_llamadas, l.fecha_creacion, l.fecha_ult_cambio, 
                        l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
                        l.idusuario_creacion, l.idusuario_ult_cambio, 
                        tlf.telefonos, tlf.telefonos_str, cr.correos, rsp.responsable,
                        COALESCE((ti.nombre), 'NA') as name_tinteresa,
                        l.nombre_completo as persona,
                        l.nombre_completo
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN (
                            SELECT l.id,
                            (CASE
                                WHEN count(tlf.*) > 0 THEN jsonb_agg(json_build_object('id', tlf.id, 
                                                                                    'numero', tlf.numero))
                                WHEN count(tlf.*) = 0 THEN '[]'
                            END
                            ) as telefonos,
                            STRING_AGG(tlf.numero, ' | ') as telefonos_str
                            FROM ${Constants.tbl_lead_dn_sql} l
                            LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                            WHERE l.estatus >= $1
                            GROUP BY l.id
                        ) tlf ON tlf.id = l.id
                        LEFT JOIN (
                            SELECT l.id,
                            (CASE
                                WHEN count(cl.*) > 0 THEN jsonb_agg(json_build_object('id', cl.id, 
                                                                                    'correo', cl.correo))
                                WHEN count(cl.*) = 0 THEN '[]'
                            END
                            ) as correos
                            FROM ${Constants.tbl_lead_dn_sql} l
                            LEFT JOIN ${Constants.tbl_correo_dn_sql} cl ON (cl.idlead = l.id AND cl.estado = 1)
                            WHERE l.estatus >= $1
                            GROUP BY l.id
                        ) cr ON cr.id = l.id
                        LEFT JOIN (
                            SELECT rl.id, rl.codigo || ' -> ' || COALESCE((usu.nombre || ' ' || usu.apellido), 'Todos') AS responsable
                            FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                            LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                        ) rsp ON (rsp.id = l.idresponsable)
                        LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                        WHERE (l.estatus = $1 OR $1 = -2) AND 
                        (l.next_step BETWEEN $2 AND $3) AND 
                        (l.idresponsable = $4 OR $4 = -2) AND
                        (l.tipo_lead = $5 OR $5 = '-2') AND 
                        (   UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                            UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                            UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                            $6 = '')
                        ORDER BY COALESCE(ti.codigo, 0) DESC, l.next_step ASC
                        `,
                values: [
                            this.infoExtra.filter.estatus, 
                            this.infoExtra.filter.ns_start, 
                            this.infoExtra.filter.ns_end, 
                            this.infoExtra.filter.idresponsable, 
                            this.infoExtra.filter.tipo_lead,
                            this.infoExtra.filter.search_all === '' ? '' : `%${this.infoExtra.filter.search_all}%`
                        ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ILead>
    }

    async get(): Promise<Array<ILead> | IErrorResponse> {
        const _dateCurrent = UtilInstance.getDateCurrent().fecha
        const _dateLastWeek = UtilInstance.actionAddAndDismissDays(_dateCurrent, -7).fecha

        // l.semana, 
        // l.nombre, l.apellido, l.grupo_wpp, l.referencia, 
        // l.precio, COALESCE((l.precio), 1232) as precio_final, 
        // l.m2, l.codigo_postal, l.direccion, l.nro_edificio, l.nro_piso, 
        // l.localidad, l.estatus, l.nro_llamadas, l.fecha_creacion, l.fecha_ult_cambio, 
        // l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
        // l.idusuario_creacion, l.idusuario_ult_cambio, 
        // tlf.telefonos, tlf.telefonos_str, cr.correos, rsp.responsable,

        const queryData  = {
            name: 'get-lead',
            text: ` 
                    SELECT 	l.id, l.lead_id, l.tipo_lead, 
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.last_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS last_step,
                    l.grupo_wpp, 
                    l.precio, COALESCE((l.precio), 1232) as precio_final, 
                    l.estatus, 
                    l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
                    l.idusuario_creacion, l.idusuario_ult_cambio, 
                    tlf.telefonos_str, rsp.responsable,
                    COALESCE((ti.nombre), 'NA') as name_tinteresa,
                    l.nombre_completo as persona,
                    l.nombre_completo,
                    lsub.lbl_orden
                    FROM (
                        SELECT *
                        FROM (
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_1' AS ,
                                ROW_NUMBER() OVER (ORDER BY idtipointeresa DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE next_step = $7 AND
                                    idtipointeresa IS NOT NULL AND
                                    (next_step BETWEEN $2 AND $3)
                                ORDER BY idtipointeresa DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_2' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE (next_step > $8 AND next_step < $7) AND
                                    (next_step BETWEEN $2 AND $3)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_2' AS lbl_nivel, 'orden_3' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE ( next_step > $7 OR next_step <= $8 ) AND
                                    (next_step BETWEEN $2 AND $3)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                        ) d
                    ) lsub
                    INNER JOIN ${Constants.tbl_lead_dn_sql} l ON l.id = lsub.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(tlf.*) > 0 THEN jsonb_agg(json_build_object('id', tlf.id, 
                                                                                'numero', tlf.numero))
                            WHEN count(tlf.*) = 0 THEN '[]'
                        END
                        ) as telefonos,
                        STRING_AGG(tlf.numero, ' | ') as telefonos_str
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) tlf ON tlf.id = l.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(cl.*) > 0 THEN jsonb_agg(json_build_object('id', cl.id, 
                                                                                'correo', cl.correo))
                            WHEN count(cl.*) = 0 THEN '[]'
                        END
                        ) as correos
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_correo_dn_sql} cl ON (cl.idlead = l.id AND cl.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) cr ON cr.id = l.id
                    LEFT JOIN (
                        SELECT rl.id, rl.codigo || ' -> ' || COALESCE((usu.nombre || ' ' || usu.apellido), 'Todos') AS responsable
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                    ) rsp ON (rsp.id = l.idresponsable)
                    LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                    WHERE (l.estatus = $1 OR $1 = -2) AND 
                    (l.next_step BETWEEN $2 AND $3) AND 
                    (l.idresponsable = $4 OR $4 = -2) AND
                    (l.tipo_lead = $5 OR $5 = '-2') AND 
                    (   UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        $6 = ''
                    )
                    ORDER BY lsub.lbl_nivel ASC, COALESCE(l.idtipointeresa, 0) DESC, lsub.lbl_orden ASC, lsub.nro_row ASC, lsub.id DESC
                    `,
            values: [
                        this.infoExtra.filter.estatus, 
                        this.infoExtra.filter.ns_start, 
                        this.infoExtra.filter.ns_end, 
                        this.infoExtra.filter.idresponsable, 
                        this.infoExtra.filter.tipo_lead,
                        this.infoExtra.filter.search_all === '' ? '' : `%${this.infoExtra.filter.search_all}%`,
                        _dateCurrent,
                        _dateLastWeek
                    ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ILead>
    }

    /**
     * Retorna los datos de todos los leads
     * @returns 
     */
    async getAllWithPagination(): Promise<Array<ILead> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _dateCurrent = UtilInstance.getDateCurrent().fecha
        const _dateLastWeek = UtilInstance.actionAddAndDismissDays(_dateCurrent, -60).fecha

        let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'
        let filter_idresponsable = this.infoExtra.filter.idresponsable || -2
        let filter_tipo_lead = this.infoExtra.filter.tipo_lead || '-2'
        let filter_estatus = this.infoExtra.filter.estatus
        let search_all = this.infoExtra.filter.search_all  || ''
        
        // Pagination
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1

        // QUERY ANTERIOR RESPALDO
        // SELECT id, 'nivel_1' AS lbl_nivel, 'orden_1' AS lbl_orden,
        // ROW_NUMBER() OVER (ORDER BY idtipointeresa DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
        // FROM ${Constants.tbl_lead_dn_sql} 
        // WHERE next_step = $7 AND
        //     idtipointeresa IS NOT NULL AND
        //     (next_step BETWEEN $2 AND $3)
        // ORDER BY idtipointeresa DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC

        const queryData  = {
            name: 'get-lead-pagination',
            text: ` SELECT 	l.id, l.lead_id, l.tipo_lead, 
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.last_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS last_step,
                    l.grupo_wpp, 
                    l.precio, COALESCE((l.precio), 1232) as precio_final, 
                    l.estatus, 
                    l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
                    l.idusuario_creacion, l.idusuario_ult_cambio, 
                    tlf.telefonos_str, rsp.responsable,
                    COALESCE((ti.nombre), 'NA') as name_tinteresa,
                    l.nombre_completo as persona,
                    l.nombre_completo,
                    lsub.lbl_orden
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
                        (CASE
                            WHEN count(tlf.*) > 0 THEN jsonb_agg(json_build_object('id', tlf.id, 
                                                                                'numero', tlf.numero))
                            WHEN count(tlf.*) = 0 THEN '[]'
                        END
                        ) as telefonos,
                        STRING_AGG(tlf.numero, ' | ') as telefonos_str
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) tlf ON tlf.id = l.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(cl.*) > 0 THEN jsonb_agg(json_build_object('id', cl.id, 
                                                                                'correo', cl.correo))
                            WHEN count(cl.*) = 0 THEN '[]'
                        END
                        ) as correos
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_correo_dn_sql} cl ON (cl.idlead = l.id AND cl.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) cr ON cr.id = l.id
                    LEFT JOIN (
                        SELECT rl.id, rl.codigo || ' -> ' || COALESCE((usu.nombre || ' ' || usu.apellido), 'Todos') AS responsable
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                    ) rsp ON (rsp.id = l.idresponsable)
                    LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                    WHERE (l.estatus = $1 OR $1 = -2) AND 
                    (l.next_step BETWEEN $2 AND $3) AND 
                    (l.idresponsable = $4 OR $4 = -2) AND
                    (l.tipo_lead = $5 OR $5 = '-2') AND 
                    (   UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        $6 = ''
                    )
                    ORDER BY lsub.lbl_nivel ASC, COALESCE(l.idtipointeresa, 0) DESC, lsub.lbl_orden ASC, lsub.nro_row ASC, lsub.id DESC
                    LIMIT $9 OFFSET $10
                    `,
            values: [   filter_estatus, 
                        filter_ns_start, 
                        filter_ns_end, 
                        filter_idresponsable, 
                        filter_tipo_lead,
                        search_all === '' ? '' : `%${search_all}%`,
                        _dateCurrent,
                        _dateLastWeek,
                        limit,
                        offset
                    ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ILead>
    }

    async getById(id: BigInt): Promise<ILead | IErrorResponse> {
        const queryData = {
            name: 'get-lead-x-id',
            text: `
                    SELECT
                    l.id, l.lead_id, l.tipo_lead, to_char( l."timestamp", 'DD/MM/YYYY HH24:MI:SS') as "timestamp", 
                    l.next_step, l.last_step, l.semana, 
                    l.nombre, l.apellido, l.grupo_wpp, l.referencia, 
                    l.precio, l.m2, l.codigo_postal, l.direccion, l.nro_edificio, l.nro_piso, 
                    l.localidad, l.estatus, l.nro_llamadas, l.fecha_creacion, l.fecha_ult_cambio,
                    l.empresa, l.idcategoria, 
                    l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
                    l.idusuario_creacion, l.idusuario_ult_cambio, 
                    tlf.telefonos, cr.correos, hst.historico,
                    COALESCE((ta.nombre), 'NA') as name_tavance,
                    COALESCE((toc.nombre), 'NA') as name_tocupacion,
                    COALESCE((ti.nombre), 'NA') as name_tinteresa,
                    l.nombre_completo
                    FROM ${Constants.tbl_lead_dn_sql} l
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(tlf.*) > 0 THEN jsonb_agg(json_build_object('id', tlf.id, 
                                                                                'numero', tlf.numero))
                            WHEN count(tlf.*) = 0 THEN '[]'
                        END
                        ) as telefonos
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                        WHERE l.id = $1 AND l.estatus >= $2
                        GROUP BY l.id
                    ) tlf ON tlf.id = l.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(cl.*) > 0 THEN jsonb_agg(json_build_object('id', cl.id, 
                                                                                'correo', cl.correo))
                            WHEN count(cl.*) = 0 THEN '[]'
                        END
                        ) as correos
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_correo_dn_sql} cl ON (cl.idlead = l.id AND cl.estado = 1)
                        WHERE l.id = $1 AND l.estatus >= $2
                        GROUP BY l.id
                    ) cr ON cr.id = l.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(hl.*) > 0 THEN jsonb_agg(json_build_object(  'id', hl.id,
                                                                                    'fecha_creacion', REPLACE(REPLACE(REPLACE(to_char( hl.fecha_creacion, 'DD/mon/YYYY HH24:MI:SS'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),
                                                                                    'fecha_creacion_short', REPLACE(REPLACE(REPLACE(to_char( hl.fecha_creacion, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'), 
                                                                                    'comentario', hl.comentario,
                                                                                    'responsable', hl.responsable))
                            WHEN count(hl.*) = 0 THEN '[]'
                        END
                        ) as historico
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN (
                            SELECT hl.*, COALESCE((u.nombre || ' ' || u.apellido), 'Desconocido') as responsable
                            FROM ${Constants.tbl_historico_lead_dn_sql} hl
                            LEFT JOIN ${Constants.tbl_usuario_sql}  u ON (hl.idusuario_resp = u.id)
                            WHERE hl.idlead = $1
                            ORDER BY hl.fecha_creacion desc
                        ) hl ON (hl.idlead = l.id)
                        WHERE l.id = $1 AND l.estatus >= $2
                        GROUP BY l.id
                    ) hst ON hst.id = l.id
                    LEFT JOIN ${Constants.tbl_tipo_avance_dn_sql} ta ON (ta.id = l.idtipoavance)
                    LEFT JOIN ${Constants.tbl_tipo_ocupacion_dn_sql} toc ON (toc.id = l.idtipoocupacion)
                    LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                    WHERE l.id = $1 AND l.estatus >= $2`,
            values: [ id, this.filterStatus ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>

        return lData[0]
    }

    async getByIdForHistory(id: BigInt): Promise<ILead | IErrorResponse> {
        const queryData = {
            name: 'get-lead-x-id-history',
            text: `
                    SELECT l.*,
                    COALESCE((ta.nombre), 'NA') as name_tavance,
                    COALESCE((toc.nombre), 'NA') as name_tocupacion,
                    COALESCE((ti.nombre), 'NA') as name_tinteresa
                    FROM ${Constants.tbl_lead_dn_sql} l
                    LEFT JOIN tbl_tipo_avance_dn ta ON (ta.id = l.idtipoavance)
                    LEFT JOIN tbl_tipo_ocupacion_dn toc ON (toc.id = l.idtipoocupacion)
                    LEFT JOIN tbl_tipo_interesa_dn ti ON (ti.id = l.idtipointeresa)
                    WHERE l.id = $1 AND l.estatus >= $2`,
            values: [ id, this.filterStatus ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>

        return lData[0]
    }

    /**
     * Insert para el DN Master
     * @param data 
     * @returns 
     */
    async insert(data: ILead): Promise<ILead | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            // Insert codigo
            let queryData = {
                    name: 'insert-lead',
                    text: `INSERT INTO ${Constants.tbl_lead_dn_sql}( 
                        "timestamp",
                        next_step,
                        last_step,
                        fecha_creacion,
                        fecha_ult_cambio,
                        idusuario_creacion,
                        idusuario_ult_cambio,
                        idtipoavance,
                        idresponsable,
                        idtipoocupacion,
                        idtipointeresa,
                        nombre,
                        apellido,
                        grupo_wpp,
                        referencia,
                        precio,
                        m2,
                        direccion,
                        nro_edificio,
                        nro_piso,
                        codigo_postal,
                        localidad,
                        tipo_lead,
                        empresa,
                        idcategoria,
                        nombre_completo,
                        estatus,
                        comentario_historico
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,
                            regexp_replace(regexp_replace($28, '[[:alpha:]]', '','g'), '( ){1,}', '|','g') ) RETURNING *`,
                    values: [
                                timeStampCurrent,
                                data.next_step,
                                data.last_step, 
                                timeStampCurrent, 
                                timeStampCurrent, 
                                this.idUserLogin, 
                                this.idUserLogin,
                                data.idtipoavance,
                                data.idresponsable,
                                data.idtipoocupacion,
                                data.idtipointeresa,
                                data.nombre_completo,
                                data.nombre_completo,
                                data.grupo_wpp,
                                data.referencia,
                                data.precio,
                                data.m2,
                                data.direccion,
                                data.nro_edificio,
                                data.nro_piso,
                                data.codigo_postal,
                                data.localidad,
                                data.tipo_lead,
                                data.empresa,
                                data.idcategoria,
                                data.nombre_completo,
                                (data.estatus === null || data.estatus === undefined) ? 0 : data.estatus,
                                data.comentario || ''
                        ]
            }

            let lDataLead = (await client.query(queryData)).rows as Array<ILead | IErrorResponse>
            let leadDB = lDataLead[0] as ILead

            let idLeadDB = leadDB.id || BigInt(0)

            // Se crea el código unico para el historio lead
            const _uuidHistorico = `hl-${UtilInstance.getUUID()}`

            // Creamos el lead_id en base al ID proporcionado por DB
            let idLeadRef = (Constants.contador_id_lead + parseInt(idLeadDB.toString())).toString()
            queryData = {
                name: 'update-lead-nro-lead',
                text: `UPDATE ${Constants.tbl_lead_dn_sql} SET
                        lead_id = $1
                        WHERE id = $2 RETURNING *`,
                values: [idLeadRef, idLeadDB]
            }
            await client.query(queryData)
            
            // Asocia varios telefonos al Lead
            if ( leadDB && data.telefonos && data.telefonos.length !== 0 ) {
                for (let i = 0; i < data.telefonos!.length; i++) {
                    const queryData = {
                        name: 'insert-telefono-x-lead',
                        text: `INSERT INTO ${Constants.tbl_telefono_dn_sql} ( numero, fecha_creacion, idlead )
                                VALUES($1, $2, $3) RETURNING *`,
                        values: [ data.telefonos![i].numero, timeStampCurrent, idLeadDB ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<ITelefono | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lDataLead = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            // Asocia varios correos al Lead
            if ( leadDB && data.correos && data.correos.length !== 0 ) {
                for (let i = 0; i < data.correos!.length; i++) {
                    const queryData = {
                        name: 'insert-correo-x-lead',
                        text: `INSERT INTO ${Constants.tbl_correo_dn_sql} ( correo, fecha_creacion, idlead )
                                VALUES($1, $2, $3) RETURNING *`,
                        values: [ data.correos![i].correo, timeStampCurrent, idLeadDB ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<ICorreo | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lDataLead = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            // Si tipo_accion = Procesar-Contratar, se debe crear el usuario [Prescriptor, Propietario, Grupo]
            if ( data.tipo_accion && data.tipo_accion === 'Procesar-Contratar' ) {
                // IMPORTANTE, verificar que el usuario ya ha sido creado apartir del LEAD
                const queryGetUserXLead = {
                    name: 'get-user-x-lead',
                    text: ` SELECT usu.*
                            FROM ${Constants.tbl_usuario_sql} usu
                            WHERE usu.ref_lead LIKE $1 LIMIT 1`,
                    values: [ idLeadRef ]
                }
                let _dataUserLead = (await client.query(queryGetUserXLead)).rows as Array<IUser>
                // let _idUserLead = (_dataUserLead.length !== 0) ? _dataUserLead[0].id! : 0
                let userDB = (_dataUserLead.length !== 0) ? _dataUserLead[0] : undefined
                // let userDB: IUser | undefined = undefined

                if (_dataUserLead.length === 0 ) { // Creamos usuario
                    const queryInsertUser = {
                        name: 'insert-user-from-lead',
                        text: `INSERT INTO ${Constants.tbl_usuario_sql}(
                              username,
                              email, 
                              password, 
                              nombre, 
                              apellido, 
                              fecha_creacion, 
                              fecha_ultimo_cambio,
                              idusuario,
                              ref_lead,
                              nombre_completo,
                              telefono,
                              empresa,
                              idcategoria)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                              idLeadRef,
                              data.correos[0].correo,
                              UtilInstance.encryptDataHash256(Constants.reset_password_value),
                              data.nombre_completo,
                              data.nombre_completo,
                              timeStampCurrent,
                              timeStampCurrent,
                              this.idUserLogin,
                              idLeadRef,
                              data.nombre_completo,
                              data.telefonos[0].numero,
                              data.empresa,
                              data.idcategoria
                        ]
                    }
                    let lDataUser = (await client.query(queryInsertUser)).rows as Array<IUser>
                    userDB = (lDataUser.length !== 0) ? lDataUser[0] : undefined
                } else { // No deberia existir [Verificar si el usuario existe con el correo y disparar exception]
                    // const queryUpdateUserLead = {
                    //     name: 'update-user-lead',
                    //     text: ` UPDATE ${Constants.tbl_usuario_sql} SET
                    //             estado = $1,
                    //             email = $2,
                    //             nombre = $3,
                    //             apellido = $4,
                    //             fecha_ultimo_cambio = $5,
                    //             idusuario = $6,
                    //             nombre_completo = $7,
                    //             telefono = $8
                    //             WHERE id = $9 RETURNING *`,
                    //     values: [
                    //                 1,
                    //                 data.correos[0].correo,
                    //                 data.nombre_completo,
                    //                 data.nombre_completo,
                    //                 timeStampCurrent,
                    //                 this.idUserLogin,
                    //                 data.nombre_completo,
                    //                 data.telefonos[0].numero,
                    //                 userDB!.id
                    //             ]
                    // }
                    // await client.query(queryUpdateUserLead)
                }

                // Verifica que el usuario exista o se haya creado correctamente
                if ( userDB ) {
                    // Paso#0: Creamos el rol en base al tipo de Lead [Propietario(propietrio), Prescriptor(colaborador)]
                    const idDataUserDB = (userDB as IUser).id!
                    const role = data.tipo_lead === Constants.code_lead_propietario ? Constants.code_rol_propietario : Constants.code_rol_colaborador
                    queryData = {
                          name: 'insert-user-x-rol',
                          text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol ) VALUES($1,$2) RETURNING *`,
                          values: [idDataUserDB, role]
                    }
                    await client.query(queryData)

                    // Para el caso de leads con tipo PRESCRIPTOR [Colaborador]
                    if ( data.tipo_lead === Constants.code_lead_colaborador && data.grupo ) {
                        // Paso#1: Vericamos la existencia del grupo
                        const queryGetDataGrupo = {
                            name: 'get-grupo-x-nombre',
                            text: ` SELECT gp.*
                                    FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                                    WHERE gp.nombre LIKE $1 LIMIT 1`,
                            values: [ data.grupo.nombre]
                        }
                        let _dataGrupo = (await client.query(queryGetDataGrupo)).rows as Array<IGrupoPrescriptor>
                        let _idGrupoPre = (_dataGrupo.length !== 0) ? _dataGrupo[0].id! : 0 
                        
                        if ( _dataGrupo.length === 0 ) { // Crear grupo prescriptores
                            const queryInsertGrupo = {
                                name: 'insert-grupo-prescriptor',
                                text: `INSERT INTO ${Constants.tbl_grupo_prescriptor_dn_sql} (
                                        nombre,
                                        fecha_creacion, 
                                        fecha_ultimo_cambio
                                        ) VALUES($1,$2,$2) RETURNING *`,
                                values: [
                                            data.grupo!.nombre,
                                            timeStampCurrent
                                    ]
                            }
                            let _nGrupo = (await client.query(queryInsertGrupo)).rows as Array<IGrupoPrescriptor>
                            _idGrupoPre = (_nGrupo.length !== 0) ? _nGrupo[0].id! : 0 
                        } else { // Actualizamos el estado del grupo a ACTIVO
                            const queryUpdateActivarGrupo = {
                                name: 'update-grupo-pre-activar',
                                text: ` UPDATE ${Constants.tbl_grupo_prescriptor_dn_sql} SET
                                        estado = $1,
                                        fecha_ultimo_cambio = $2
                                        WHERE id = $3 RETURNING *`,
                                values: [
                                            1,
                                            timeStampCurrent,
                                            _idGrupoPre
                                        ]
                            }
                            await client.query(queryUpdateActivarGrupo)
                        }

                        // Paso#2: Se crea el prescriptor
                        const queryInsertPrescriptor = {
                            name: 'insert-prescriptor-x-grupo',
                            text: `INSERT INTO ${Constants.tbl_prescriptor_dn_sql} (
                                    idusuario, 
                                    fecha_creacion,
                                    idgrupo
                                    ) VALUES($1,$2,$3) RETURNING *`,
                            values: [
                                        idDataUserDB,   
                                        timeStampCurrent,
                                        _idGrupoPre
                                ]
                        }
                        await client.query(queryInsertPrescriptor)

                        // Guardar el comentario de LEAD a Suceso Prescriptor
                        // data.comentario -> comentario
                        // idLeadRef -> guardar en suceso prescriptor
                        // _idGrupoPre -> grupo para agregar el comentario a suceso
                        // Se guarda con la fecha actual el comentario de suceso
                        
                        // Paso #3 Insert comentario de lead a suceso
                        let queryInsertSuceso = {
                            name: 'insert-suceso-prescriptor-dn',
                            text: `INSERT INTO ${Constants.tbl_suceso_prescriptor_dn_sql} (
                                        comentario,
                                        data,
                                        fecha_creacion, 
                                        idusuario,
                                        idgrupo,
                                        nro_visitas,
                                        nro_reservas,
                                        valor,
                                        flag_vr,
                                        lead_id,
                                        ref_historico_lead)
                                    VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9,$10,$11) RETURNING *`,
                            values: [   data.comentario,
                                        {},
                                        timeStampCurrent, 
                                        this.idUserLogin, 
                                        _idGrupoPre,
                                        0,
                                        0,
                                        0,
                                        'na',
                                        idLeadRef,
                                        _uuidHistorico
                                    ]
                        }
                        await client.query(queryInsertSuceso)

                    } else if ( data.tipo_lead === Constants.code_lead_propietario && data.grupo ) {
                        // Paso#1: Vericamos la existencia del grupo
                        const queryGetDataGrupo = {
                            name: 'get-grupo-x-nombre-propietario',
                            text: ` SELECT gp.*
                                    FROM ${Constants.tbl_grupo_propietario_dn_sql} gp
                                    WHERE gp.nombre LIKE $1 LIMIT 1`,
                            values: [ data.grupo.nombre]
                        }
                        let _dataGrupo = (await client.query(queryGetDataGrupo)).rows as Array<IGrupoPropietario>
                        let _idGrupoPro = (_dataGrupo.length !== 0) ? _dataGrupo[0].id! : 0 
                        
                        if ( _dataGrupo.length === 0 ) { // Crear grupo propietarios
                            const queryInsertGrupo = {
                                name: 'insert-grupo-propietario',
                                text: `INSERT INTO ${Constants.tbl_grupo_propietario_dn_sql} (
                                        nombre, 
                                        fecha_creacion,
                                        fecha_ultimo_cambio
                                        ) VALUES($1,$2,$2) RETURNING *`,
                                values: [
                                            data.grupo!.nombre,
                                            timeStampCurrent
                                    ]
                            }
                            let _nGrupo = (await client.query(queryInsertGrupo)).rows as Array<IGrupoPropietario>
                            _idGrupoPro = (_nGrupo.length !== 0) ? _nGrupo[0].id! : 0 
                        } else { // Actualizamos el estado del grupo a ACTIVO
                            const queryUpdateActivarGrupo = {
                                name: 'update-grupo-pro-activar',
                                text: ` UPDATE ${Constants.tbl_grupo_propietario_dn_sql} SET
                                        estado = $1,
                                        fecha_ultimo_cambio = $2
                                        WHERE id = $3 RETURNING *`,
                                values: [
                                            1,
                                            timeStampCurrent,
                                            _idGrupoPro
                                        ]
                            }
                            await client.query(queryUpdateActivarGrupo)
                        }

                        // Paso#2: Se crea el propietario
                        const queryInsertPropietario = {
                            name: 'insert-propietario-x-grupo',
                            text: `INSERT INTO ${Constants.tbl_propietario_dn_sql} (
                                    idusuario, 
                                    fecha_creacion,
                                    idgrupo
                                    ) VALUES($1,$2,$3) RETURNING *`,
                            values: [
                                        idDataUserDB,   
                                        timeStampCurrent,
                                        _idGrupoPro
                                ]
                        }
                        await client.query(queryInsertPropietario)

                        // Guardar el comentario de LEAD a Suceso Prescriptor
                        // data.comentario -> comentario
                        // idLeadRef -> guardar en suceso prescriptor
                        // _idGrupoPre -> grupo para agregar el comentario a suceso
                        // Se guarda con la fecha actual el comentario de suceso

                        // Paso #3 Insert comentario de lead a suceso propietario
                        let queryInsertSuceso = {
                            name: 'insert-suceso-propietario-dn',
                            text: `INSERT INTO ${Constants.tbl_suceso_propietario_dn_sql} (
                                        comentario,
                                        data,
                                        fecha_creacion, 
                                        idusuario,
                                        idgrupo,
                                        lead_id,
                                        ref_historico_lead)
                                    VALUES( $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                            values: [   data.comentario,
                                        {},
                                        timeStampCurrent, 
                                        this.idUserLogin, 
                                        _idGrupoPro,
                                        idLeadRef,
                                        _uuidHistorico
                                    ]
                        }
                        await client.query(queryInsertSuceso)
                    }

                    // Insertar piso y asociarlo al propietario [SIN USO - REGLAS DEL JUEGO]
                    // Se cambia porque se puede crar un piso sin datos basicos, queda para posterior edición [Reglas del juego]
                    if ( data.tipo_lead === Constants.code_lead_propietario && false ) {
                        queryData = {
                            name: 'insert-piso',
                            text: `INSERT INTO ${Constants.tbl_piso_sql}(
                                pais, 
                                ciudad, 
                                codigo_postal, 
                                direccion, 
                                nro_edificio,
                                nro_piso,
                                id_dispositivo_ref,
                                fecha_creacion, 
                                fecha_ultimo_cambio, 
                                idusuario,
                                ref_lead)
                                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
                            values: [   'España', 
                                        data.localidad || `LOC-${idLeadRef}`, 
                                        data.codigo_postal || `CP-${idLeadRef}`, 
                                        data.direccion || `DIR-${idLeadRef}`, 
                                        data.nro_edificio,
                                        data.nro_piso,
                                        idLeadRef,
                                        timeStampCurrent, 
                                        timeStampCurrent,
                                        this.idUserLogin,
                                        idLeadRef
                                ]
                        }
                        let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>
                        let pisoDB = lData[0]

                        if (pisoDB && idDataUserDB) {
                            const idDataPisoDB = (pisoDB as IApartment).id!
                            queryData = {
                                name: 'insert-piso-x-user',
                                text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                                    VALUES($1,$2) RETURNING *`,
                                values: [ idDataUserDB, idDataPisoDB]
                            }
                            await client.query(queryData)
                        }
                    }
                }
            }

            // Agrega el gran historial, para controlar a DN
            queryData = {
                name: 'insert-history-lead',
                text: `INSERT INTO ${Constants.tbl_historico_lead_dn_sql}( 
                    fecha_creacion,
                    next_step,
                    last_step,
                    data,
                    interesa,
                    avance,
                    ocupacion,
                    estatus,
                    comentario,
                    idlead,
                    idusuario_resp,
                    tipo_accion,
                    categoria,
                    ref_historico_lead
                    )
                    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                values: [
                            timeStampCurrent,
                            data.next_step,
                            data.last_step, 
                            this.infoExtra.data || {}, 
                            data.name_tinteresa, 
                            data.name_tavance, 
                            data.name_tocupacion,
                            data.estatus,
                            data.comentario,
                            idLeadDB,
                            this.idUserLogin,
                            data.tipo_accion,
                            data.name_categoria,
                            _uuidHistorico
                    ]
            }
            let lDataHistoricoLead = (await client.query(queryData)).rows as Array<IHistoricoLead | IErrorResponse>

            if ( ({ ...lDataHistoricoLead[0] } as IErrorResponse).error ) return lDataHistoricoLead

            // Después de insertar el histórico, verifica si hay 5 o más registros con interesa = 'Poco'
            const queryCountPoco = {
                name: 'count-historico-tipointeresa-poco',
                text: `
                    SELECT COUNT(*) AS count
                    FROM ${Constants.tbl_historico_lead_dn_sql}
                    WHERE idlead = $1 AND interesa = 'Poco'
                `,
                values: [idLeadDB], // leadId es el ID del lead asociado al histórico
            };
            const resultCount = await client.query(queryCountPoco); // Ejecuta la consulta para contar los registros
            const countPoco = parseInt(resultCount.rows[0].count, 10); // Obtiene el conteo como número entero

            if (countPoco >= 5) {
                // Si hay 5 o más registros con interesa = 'Poco', actualiza el estatus del lead a 0 (oculto)
                const queryUpdateEstatus = {
                    name: 'update-lead-estatus-oculto',
                    text: `
                        UPDATE ${Constants.tbl_lead_dn_sql}
                        SET estatus = 0
                        WHERE id = $1
                    `,
                    values: [idLeadDB], // Actualiza el estatus del lead con el ID proporcionado
                };
                await client.query(queryUpdateEstatus); // Ejecuta la consulta para actualizar el estatus
            }

            return lDataLead
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as ILead

        return dataResponse
    }

    /**
     * Update para DN Master, SIN USO POR EL MOMENTO
     * @param id 
     * @param data 
     * @returns 
     */
    async update(id: BigInt, data: ILead): Promise<ILead | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                    name: 'update-lead',
                    text: `UPDATE ${Constants.tbl_lead_dn_sql} SET
                            "timestamp" = $1,
                            next_step = $2,
                            fecha_ult_cambio = $3,
                            idusuario_ult_cambio = $4,
                            idtipoavance = $5,
                            idresponsable = $6,
                            idtipoocupacion = $7,
                            idtipointeresa = $8,
                            nombre = $9,
                            apellido = $10,
                            grupo_wpp = $11,
                            referencia = $12,
                            estatus = $13,
                            precio = $14,
                            m2 = $15,
                            direccion = $16,
                            nro_edificio = $17,
                            nro_piso = $18,
                            codigo_postal = $19,
                            localidad = $20,
                            tipo_lead = $21,
                            empresa = $22,
                            idcategoria = $23,
                            nombre_completo = $24
                            WHERE id = $25 AND estatus >= $26 RETURNING *`,
                    values: [   
                        timeStampCurrent, 
                        data.next_step, 
                        timeStampCurrent,  
                        this.idUserLogin,
                        data.idtipoavance,
                        data.idresponsable,
                        data.idtipoocupacion,
                        data.idtipointeresa,
                        data.nombre_completo,
                        data.nombre_completo,
                        data.grupo_wpp,
                        data.referencia,
                        data.estatus,
                        data.precio,
                        data.m2,
                        data.direccion,
                        data.nro_edificio,
                        data.nro_piso,
                        data.codigo_postal,
                        data.localidad,
                        data.tipo_lead,
                        data.empresa,
                        data.idcategoria,
                        data.nombre_completo,
                        id,
                        this.filterStatus
                    ]
            }
            let lDataLead = (await client.query(queryData)).rows as Array<ILead | IErrorResponse>

            // Insertamos los nuevos propietarios
            let leadDB = lDataLead[0] as ILead
            let idLeadDB = leadDB.id || BigInt(0)

            // Delete/Add telefonos
            // Delete all telefonos: changes state a -1
            queryData = {
                name: 'delete-telefono',
                text: `UPDATE ${Constants.tbl_telefono_dn_sql} SET estado = $1 WHERE idlead = $2 AND estado IN (1, 0)`,
                values: [ -1, idLeadDB ]
            }
            await client.query(queryData)

            if ( leadDB && data.telefonos && data.telefonos!.length !== 0 ) {
                // Asocia varios telefonos al Lead
                for (let i = 0; i < data.telefonos!.length; i++) {
                    const queryData = {
                        name: 'insert-telefono-x-lead',
                        text: `INSERT INTO ${Constants.tbl_telefono_dn_sql} ( numero, fecha_creacion, idlead )
                                VALUES($1, $2, $3) RETURNING *`,
                        values: [ data.telefonos![i].numero, timeStampCurrent, idLeadDB ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<ITelefono | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lDataLead = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            // Delete/Add correos
            // Delete all telefonos: changes state a -1
            queryData = {
                name: 'delete-correo',
                text: `UPDATE ${Constants.tbl_correo_dn_sql} SET estado = $1 WHERE idlead = $2 AND estado IN (1, 0)`,
                values: [ -1, idLeadDB ]
            }
            await client.query(queryData)
            if ( leadDB && data.correos && data.correos!.length !== 0 ) {
                // Asocia varios correos al Lead
                for (let i = 0; i < data.correos!.length; i++) {
                    const queryData = {
                        name: 'insert-correo-x-lead',
                        text: `INSERT INTO ${Constants.tbl_correo_dn_sql} ( correo, fecha_creacion, idlead )
                                VALUES($1, $2, $3) RETURNING *`,
                        values: [ data.correos![i].correo, timeStampCurrent, idLeadDB ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<ICorreo | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lDataLead = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            // Agrega el gran historial, para controlar a DN
            queryData = {
                name: 'insert-history-lead',
                text: `INSERT INTO ${Constants.tbl_historico_lead_dn_sql}( 
                    fecha_creacion,
                    next_step,
                    last_step,
                    data,
                    interesa,
                    avance,
                    ocupacion,
                    estatus,
                    comentario,
                    idlead,
                    idusuario_resp,
                    tipo_accion,
                    categoria
                    )
                    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                values: [
                            timeStampCurrent,
                            data.next_step,
                            data.last_step, 
                            this.infoExtra.data || {}, 
                            data.name_tinteresa, 
                            data.name_tavance, 
                            data.name_tocupacion,
                            data.estatus,
                            data.comentario,
                            idLeadDB,
                            this.idUserLogin,
                            data.tipo_accion,
                            data.name_categoria
                    ]
            }
            let lDataHistoricoLead = (await client.query(queryData)).rows as Array<IHistoricoLead | IErrorResponse>

            if ( ({ ...lDataHistoricoLead[0] } as IErrorResponse).error ) return lDataHistoricoLead

            return lDataLead
        })

        return ( responseD[0] ) as ILead | IErrorResponse
    }

    async delete(id: BigInt): Promise<ILead | IErrorResponse> {
        throw new Error("Method not implemented.")
        // const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        // const queryData = {
        //         name: 'delete-lead',
        //         text: `UPDATE ${Constants.tbl_lead_dn_sql} SET
        //             estatus = $1,
        //             "timestamp" = $2
        //             fecha_ult_cambio = $2, 
        //             idusuario_ult_cambio = $3
        //             WHERE id = $4 RETURNING *`,
        //         values: [   0, 
        //                     timeStampCurrent, 
        //                     this.idUserLogin,
        //                     id
        //             ]
        // }

        // let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>

        // return lData[0]
    }

    async getMyLeads(): Promise<Array<ILead> | IErrorResponse> {
        let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'
        let filter_idresponsable = this.infoExtra.filter.idresponsable || -2
        let filter_tipo_lead = this.infoExtra.filter.tipo_lead || '-2'

        const _dateCurrent = UtilInstance.getDateCurrent().fecha
        const _dateLastWeek = UtilInstance.actionAddAndDismissDays(_dateCurrent, -7).fecha

        const queryData  = {
                name: 'get-my-leads',
                text: ` 
                        SELECT
                        l.id, l.lead_id, l.tipo_lead,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.last_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS last_step,
                        l.grupo_wpp, 
                        l.precio, COALESCE((l.precio), 1232) as precio_final, 
                        l.estatus, 
                        l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
                        tlf.telefonos_str, rsp.responsable,
                        COALESCE((ti.nombre), 'NA') as name_tinteresa,
                        l.nombre_completo as persona,
                        l.nombre_completo,
                        lsub.lbl_orden
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
                            (CASE
                                WHEN count(tlf.*) > 0 THEN jsonb_agg(json_build_object('id', tlf.id, 
                                                                                    'numero', tlf.numero))
                                WHEN count(tlf.*) = 0 THEN '[]'
                            END
                            ) as telefonos,
                            STRING_AGG(tlf.numero, ' | ') as telefonos_str
                            FROM ${Constants.tbl_lead_dn_sql} l
                            LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                            WHERE l.estatus >= 1
                            GROUP BY l.id
                        ) tlf ON tlf.id = l.id
                        LEFT JOIN (
                            SELECT l.id,
                            (CASE
                                WHEN count(cl.*) > 0 THEN jsonb_agg(json_build_object('id', cl.id, 
                                                                                    'correo', cl.correo))
                                WHEN count(cl.*) = 0 THEN '[]'
                            END
                            ) as correos
                            FROM ${Constants.tbl_lead_dn_sql} l
                            LEFT JOIN ${Constants.tbl_correo_dn_sql} cl ON (cl.idlead = l.id AND cl.estado = 1)
                            WHERE l.estatus >= 1
                            GROUP BY l.id
                        ) cr ON cr.id = l.id
                        LEFT JOIN (
                            SELECT rl.id, rl.codigo || ' -> ' || COALESCE((usu.nombre || ' ' || usu.apellido), 'Todos') AS responsable
                            FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                            LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                        ) rsp ON (rsp.id = l.idresponsable)
                        LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                        WHERE (l.estatus = $1 OR $1 = -2) AND 
                        (l.next_step BETWEEN $2 AND $3) AND 
                        (l.idresponsable = $4 OR $4 = -2) AND
                        (l.tipo_lead = $5 OR $5 = '-2') AND 
                        (   UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                            UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                            UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                            $6 = ''
                        )
                        ORDER BY lsub.lbl_nivel ASC, COALESCE(l.idtipointeresa, 0) DESC, lsub.lbl_orden ASC, lsub.nro_row ASC, lsub.id DESC
                    `,
            values: [
                        1, 
                        filter_idresponsable, 
                        filter_ns_start, 
                        filter_ns_end, 
                        this.idUserLogin, 
                        filter_tipo_lead,
                        this.infoExtra.filter.search_all === '' ? '' : `%${this.infoExtra.filter.search_all}%`,
                        _dateCurrent,
                        _dateLastWeek
                    ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ILead>
    }


    /**
     * Retorna los leads por usuario responsable
     * @returns 
     */
    async getMyLeadsWithPagination(): Promise<Array<ILead> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _dateCurrent = UtilInstance.getDateCurrent().fecha
        const _dateLastWeek = UtilInstance.actionAddAndDismissDays(_dateCurrent, -60).fecha

        let filter_ns_start = this.infoExtra.filter.ns_start || '1900-01-01'
        let filter_ns_end = this.infoExtra.filter.ns_end || '2900-01-01'
        let filter_idresponsable = this.infoExtra.filter.idresponsable || -2
        let filter_tipo_lead = this.infoExtra.filter.tipo_lead || '-2'
        let filter_search_all = this.infoExtra.filter.search_all  || ''
        
        // Pagination
        let limit = this.infoExtra.filter.limit  || 100
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1

        const queryData  = {
            name: 'get-my-lead-pagination',
            text: ` SELECT
                    l.id, l.lead_id, l.tipo_lead,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char( l.last_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS last_step,
                    l.grupo_wpp, 
                    l.precio, COALESCE((l.precio), 1232) as precio_final, 
                    l.estatus, 
                    l.idtipoavance, l.idresponsable, l.idtipoocupacion, l.idtipointeresa, 
                    l.idusuario_creacion, l.idusuario_ult_cambio, 
                    tlf.telefonos_str, rsp.responsable,
                    COALESCE((ti.nombre), 'NA') as name_tinteresa,
                    l.nombre_completo as persona,
                    l.nombre_completo,
                    lsub.lbl_orden
                    FROM (
                        SELECT *
                        FROM (
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_1' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE next_step = $8 AND
                                    (next_step BETWEEN $3 AND $4)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_1' AS lbl_nivel, 'orden_2' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE (next_step > $9 AND next_step < $8) AND
                                    (next_step BETWEEN $3 AND $4)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step DESC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                            UNION
                            (
                                SELECT id, 'nivel_2' AS lbl_nivel, 'orden_3' AS lbl_orden,
                                ROW_NUMBER() OVER (ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC) AS nro_row
                                FROM ${Constants.tbl_lead_dn_sql} 
                                WHERE ( next_step > $8 OR next_step <= $9 ) AND
                                    (next_step BETWEEN $3 AND $4)
                                ORDER BY COALESCE(idtipointeresa, 0) DESC, next_step ASC, COALESCE(precio, 0) DESC, COALESCE(idtipoocupacion, 100) ASC, id DESC
                            )
                        ) d
                    ) lsub
                    INNER JOIN ${Constants.tbl_lead_dn_sql} l ON l.id = lsub.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(tlf.*) > 0 THEN jsonb_agg(json_build_object('id', tlf.id, 
                                                                                'numero', tlf.numero))
                            WHEN count(tlf.*) = 0 THEN '[]'
                        END
                        ) as telefonos,
                        STRING_AGG(tlf.numero, ' | ') as telefonos_str
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_telefono_dn_sql} tlf ON (tlf.idlead = l.id AND tlf.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) tlf ON tlf.id = l.id
                    LEFT JOIN (
                        SELECT l.id,
                        (CASE
                            WHEN count(cl.*) > 0 THEN jsonb_agg(json_build_object('id', cl.id, 
                                                                                'correo', cl.correo))
                            WHEN count(cl.*) = 0 THEN '[]'
                        END
                        ) as correos
                        FROM ${Constants.tbl_lead_dn_sql} l
                        LEFT JOIN ${Constants.tbl_correo_dn_sql} cl ON (cl.idlead = l.id AND cl.estado = 1)
                        WHERE l.estatus >= 1
                        GROUP BY l.id
                    ) cr ON cr.id = l.id
                    LEFT JOIN (
                        SELECT rl.id, rl.codigo || ' -> ' || COALESCE((usu.nombre || ' ' || usu.apellido), 'Todos') AS responsable
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                    ) rsp ON (rsp.id = l.idresponsable)
                    LEFT JOIN ${Constants.tbl_tipo_interesa_dn_sql} ti ON (ti.id = l.idtipointeresa)
                    WHERE (l.estatus = $1 OR $1 = -2) AND 
                    (l.next_step BETWEEN $2 AND $3) AND 
                    (l.idresponsable = $4 OR $4 = -2) AND
                    (l.tipo_lead = $5 OR $5 = '-2') AND 
                    (   UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
                        UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
                        $6 = ''
                    )
                    ORDER BY lsub.lbl_nivel ASC, COALESCE(l.idtipointeresa, 0) DESC, lsub.lbl_orden ASC, lsub.nro_row ASC, lsub.id DESC
                    LIMIT $10 OFFSET $11
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
                        _dateLastWeek,
                        limit,
                        offset
                    ]
        }

        let lData: Array<ILead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ILead>
    }

    /**
     * Cuando DN procesa su lead, cuando localiza al potente propietario
     * @param id 
     * @param data 
     * @returns 
     */
    async updateDNCall(id: BigInt, data: ILead): Promise<ILead | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            if ( data.tipo_accion && data.tipo_accion === 'Procesar-Eliminar' ){
                data.estatus = -1
            }

            let dataPrevInit = ( this.infoExtra.data || {} ) as ILead
            if ( !dataPrevInit.lead_id ) throw new Error('No se puede consultar el lead_id')

            const _uuidHistorico = `hl-${UtilInstance.getUUID()}`

            let queryData = {
                    name: 'update-lead',
                    text: `UPDATE ${Constants.tbl_lead_dn_sql} SET
                            "timestamp" = $1,
                            next_step = $2,
                            fecha_ult_cambio = $3,
                            idusuario_ult_cambio = $4,
                            idtipoavance = $5,
                            idresponsable = $6,
                            idtipoocupacion = $7,
                            idtipointeresa = $8,
                            nombre = $9,
                            apellido = $10,
                            grupo_wpp = $11,
                            referencia = $12,
                            estatus = $13,
                            precio = $14,
                            m2 = $15,
                            direccion = $16,
                            nro_edificio = $17,
                            nro_piso = $18,
                            codigo_postal = $19,
                            localidad = $20,
                            last_step = $21,
                            nro_llamadas = $22,
                            empresa = $23,
                            idcategoria = $24,
                            tipo_lead = $25,
                            nombre_completo = $26,
                            comentario_historico = regexp_replace(regexp_replace($27, '[[:alpha:]]', '','g'), '( ){1,}', '|','g')
                            WHERE id = $28 AND estatus >= $29 RETURNING *`,
                    values: [   
                        timeStampCurrent, 
                        data.next_step, 
                        timeStampCurrent,  
                        this.idUserLogin,
                        data.idtipoavance,
                        data.idresponsable,
                        data.idtipoocupacion,
                        data.idtipointeresa,
                        data.nombre_completo,
                        data.nombre_completo,
                        data.grupo_wpp,
                        data.referencia,
                        data.estatus,

                        data.precio || undefined,
                        data.m2 || undefined,
                        data.direccion || undefined,
                        data.nro_edificio || undefined,
                        data.nro_piso || undefined,
                        data.codigo_postal || undefined,
                        data.localidad || undefined,

                        data.last_step,
                        data.nro_llamadas,
                        data.empresa,
                        data.idcategoria,
                        data.tipo_lead,
                        data.nombre_completo,
                        `${dataPrevInit.comentario_historico} ${data.comentario}`,
                        id,
                        this.filterStatus
                    ]
            }
            
            // console.log(`comentario: ${dataPrevInit.comentario_historico} ${data.comentario}`)
            let lDataLead = (await client.query(queryData)).rows as Array<ILead | IErrorResponse>
            // console.log('fin comentario')

            // Insertamos los nuevos propietarios
            let leadDB = lDataLead[0] as ILead
            let idLeadDB = leadDB.id || BigInt(0)

            // Delete/Add telefonos
            // Delete all telefonos: changes state a -1
            queryData = {
                name: 'delete-telefono',
                text: `UPDATE ${Constants.tbl_telefono_dn_sql} SET estado = $1 WHERE idlead = $2 AND estado IN (1, 0)`,
                values: [ -1, idLeadDB ]
            }
            await client.query(queryData)

            if ( leadDB && data.telefonos && data.telefonos!.length !== 0 ) {
                // Asocia varios telefonos al Lead
                for (let i = 0; i < data.telefonos!.length; i++) {
                    const queryData = {
                        name: 'insert-telefono-x-lead',
                        text: `INSERT INTO ${Constants.tbl_telefono_dn_sql} ( numero, fecha_creacion, idlead )
                                VALUES($1, $2, $3) RETURNING *`,
                        values: [ data.telefonos![i].numero, timeStampCurrent, idLeadDB ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<ITelefono | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lDataLead = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            // Delete/Add correos
            // Delete all telefonos: changes state a -1
            queryData = {
                name: 'delete-correo',
                text: `UPDATE ${Constants.tbl_correo_dn_sql} SET estado = $1 WHERE idlead = $2 AND estado IN (1, 0)`,
                values: [ -1, idLeadDB ]
            }
            await client.query(queryData)
            if ( leadDB && data.correos && data.correos!.length !== 0 ) {
                // Asocia varios correos al Lead
                for (let i = 0; i < data.correos!.length; i++) {
                    const queryData = {
                        name: 'insert-correo-x-lead',
                        text: `INSERT INTO ${Constants.tbl_correo_dn_sql} ( correo, fecha_creacion, idlead )
                                VALUES($1, $2, $3) RETURNING *`,
                        values: [ data.correos![i].correo, timeStampCurrent, idLeadDB ]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<ICorreo | IErrorResponse>
                    if ( (respTmp[0] as IErrorResponse).error ) {
                        lDataLead = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            // Si tipo_accion = Procesar-Contratar, se debe crear el Piso y el Propietario [PENDIENTE]
            if ( data.tipo_accion && data.tipo_accion === 'Procesar-Contratar' ) {
                let dataPrev = ( this.infoExtra.data || {} ) as ILead
                if ( !dataPrev.lead_id ) throw new Error('No se puede consultar el lead_id')

                // IMPORTANTE, verificar que el usuario ya ha sido creado apartir del LEAD [PENDIENTE]
                const queryGetUserXLead = {
                    name: 'get-user-x-lead',
                    text: ` SELECT usu.*
                            FROM ${Constants.tbl_usuario_sql} usu
                            WHERE usu.ref_lead LIKE $1 LIMIT 1`,
                    values: [ dataPrev.lead_id ]
                }
                let _dataUserLead = (await client.query(queryGetUserXLead)).rows as Array<IUser>
                // let _idUserLead = (_dataUserLead.length !== 0) ? _dataUserLead[0].id! : 0
                let userDB = (_dataUserLead.length !== 0) ? _dataUserLead[0] : undefined
                let _existUser = true
                // let userDB: IUser | undefined = undefined

                if (_dataUserLead.length === 0 ) { // Creamos usuario
                    _existUser = false
                    const queryInsertUser = {
                        name: 'insert-user-from-lead',
                        text: `INSERT INTO ${Constants.tbl_usuario_sql}(
                              username,
                              email, 
                              password, 
                              nombre, 
                              apellido, 
                              fecha_creacion, 
                              fecha_ultimo_cambio,
                              idusuario,
                              ref_lead,
                              nombre_completo,
                              telefono,
                              empresa,
                              idcategoria)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                              dataPrev.lead_id,
                              data.correos[0].correo,
                              UtilInstance.encryptDataHash256(Constants.reset_password_value),
                              data.nombre_completo,
                              data.nombre_completo,
                              timeStampCurrent,
                              timeStampCurrent,
                              this.idUserLogin,
                              dataPrev.lead_id,
                              data.nombre_completo,
                              data.telefonos[0].numero,
                              data.empresa,
                              data.idcategoria
                        ]
                    }
                    let lDataUser = (await client.query(queryInsertUser)).rows as Array<IUser>
                    userDB = (lDataUser.length !== 0) ? lDataUser[0] : undefined
                } else {
                    const queryUpdateUserLead = {
                        name: 'update-user-lead',
                        text: ` UPDATE ${Constants.tbl_usuario_sql} SET
                                estado = $1,
                                email = $2,
                                nombre = $3,
                                apellido = $4,
                                fecha_ultimo_cambio = $5,
                                idusuario = $6,
                                nombre_completo = $7,
                                telefono = $8,
                                empresa = $9,
                                idcategoria = $10
                                WHERE id = $11 RETURNING *`,
                        values: [
                                    1,
                                    data.correos[0].correo,
                                    data.nombre_completo,
                                    data.nombre_completo,
                                    timeStampCurrent,
                                    this.idUserLogin,
                                    data.nombre_completo,
                                    data.telefonos[0].numero,
                                    data.empresa,
                                    data.idcategoria,
                                    userDB!.id,
                                ]
                    }
                    await client.query(queryUpdateUserLead)
                }

                if ( userDB ) {
                    const idDataUserDB = (userDB as IUser).id!
                    const role = dataPrev.tipo_lead === Constants.code_lead_propietario ? Constants.code_rol_propietario : Constants.code_rol_colaborador
                    // Delete rol colaborador | propietario
                    const queryDeletePrescriptorOfGrupo = {
                        name: 'delete-user-x-rol',
                        text: ` DELETE FROM ${Constants.tbl_usuario_x_rol_sql}
                                WHERE idusuario = $1 AND idrol = $2 RETURNING *`,
                        values: [ idDataUserDB, role ]
                    }
                    await client.query(queryDeletePrescriptorOfGrupo)
                    
                    // Agregar rol colaborador | propietario
                    const queryUserRolData = {
                          name: 'insert-user-x-rol',
                          text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol ) VALUES($1,$2) RETURNING *`,
                          values: [idDataUserDB, role]
                    }
                    await client.query(queryUserRolData)

                    // ******** GET HISTORIAL *************
                    //  Consultamos el historial previo del Lead para migrarlo al grupo prescriptor/propietario
                        const queryGetHistorialXLead = {
                            name: 'get-historial-x-lead',
                            text: ` SELECT hl.comentario, hl.fecha_creacion, hl.idusuario_resp, 
                                    COALESCE((hl.ref_historico_lead), '') as ref_historico_lead, 
                                    COALESCE((hl.ref_suceso), '') as ref_suceso
                                    FROM ${Constants.tbl_historico_lead_dn_sql} hl
                                    WHERE hl.idlead = $1
                                    ORDER BY hl.fecha_creacion ASC`,
                            values: [ dataPrev.id ]
                        }
                        let _dataHistoryLead = (await client.query(queryGetHistorialXLead)).rows as Array<IHistoricoLead>
                        // Agregamos el ultimo comentario de Leads, con su respectiva referencia
                        if( _dataHistoryLead.length !== 0 ) 
                            _dataHistoryLead.push({
                                                    comentario: data.comentario, 
                                                    fecha_creacion: timeStampCurrent, 
                                                    idusuario_resp: this.idUserLogin,
                                                    ref_suceso: '',
                                                    ref_historico_lead: _uuidHistorico} as IHistoricoLead)
                    // ******** FIN HISTORIAL *******************

                    // Para el caso de leads con tipo PRESCRIPTOR [Colaborador]
                    if ( data.tipo_lead === Constants.code_lead_colaborador && data.grupo ) {
                        const queryGetDataGrupo = {
                            name: 'get-grupo-x-nombre',
                            text: ` SELECT gp.*
                                    FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                                    WHERE gp.nombre LIKE $1 LIMIT 1`,
                            values: [ data.grupo.nombre]
                        }
                        let _dataGrupo = (await client.query(queryGetDataGrupo)).rows as Array<IGrupoPrescriptor>
                        let _idGrupoPre = (_dataGrupo.length !== 0) ? _dataGrupo[0].id! : 0 
                        let _isGroupNew = true
                        
                        if ( _dataGrupo.length === 0 ) { // Crear grupo prescriptores
                            const queryInsertGrupo = {
                                name: 'insert-grupo-prescriptor',
                                text: `INSERT INTO ${Constants.tbl_grupo_prescriptor_dn_sql} (
                                        nombre,
                                        fecha_creacion, 
                                        fecha_ultimo_cambio
                                        ) VALUES($1,$2,$2) RETURNING *`,
                                values: [
                                            data.grupo!.nombre,
                                            timeStampCurrent
                                    ]
                            }
                            let _nGrupo = (await client.query(queryInsertGrupo)).rows as Array<IGrupoPrescriptor>
                            _idGrupoPre = (_nGrupo.length !== 0) ? _nGrupo[0].id! : 0 
                        } else { // Actualizamos el estado del grupo a ACTIVO
                            const queryUpdateActivarGrupo = {
                                name: 'update-grupo-pre-activar',
                                text: ` UPDATE ${Constants.tbl_grupo_prescriptor_dn_sql} SET
                                        estado = $1,
                                        fecha_ultimo_cambio = $2
                                        WHERE id = $3 RETURNING *`,
                                values: [
                                            1,
                                            timeStampCurrent,
                                            _idGrupoPre
                                        ]
                            }
                            await client.query(queryUpdateActivarGrupo)
                            _isGroupNew = false
                        }

                        // Crear al prescriptor
                        const queryInsertPrescriptor = {
                            name: 'insert-prescriptor-x-grupo',
                            text: `INSERT INTO ${Constants.tbl_prescriptor_dn_sql} (
                                    idusuario, 
                                    fecha_creacion,
                                    idgrupo
                                    ) VALUES($1,$2,$3) RETURNING *`,
                            values: [
                                        idDataUserDB,   
                                        timeStampCurrent,
                                        _idGrupoPre
                                ]
                        }
                        await client.query(queryInsertPrescriptor)

                        // Guardar el comentario de LEAD a Suceso Prescriptor
                        // data.comentario -> realizar una consulta previa del historico
                        // dataPrev.lead_id, -> guardar en suceso prescriptor
                        // _idGrupoPre -> grupo para agregar el comentario a suceso
                        
                        // Paso #3 Insert comentarios de lead a suceso prescriptor
                        // Consultamos todos los comentarios del grupo y comparamos con los del suceso y solo agregar
                        // los que no existen en el suceso
                        
                        // Si el grupo ya existe, consultamos sus comentarios, caso contrario los agregamos
                        let _dataHistorySuceso: Array<ISucesoPrescriptor> = []
                        if ( !_isGroupNew ) {
                            const queryGetHistorialSucesoXGrupo = {
                                name: 'get-suceso-historico-x-grupo',
                                text: ` SELECT sp.lead_id, COALESCE((sp.ref_historico_lead), '') as ref_historico_lead, COALESCE((sp.ref_suceso), '') as ref_suceso 
                                        FROM ${Constants.tbl_suceso_prescriptor_dn_sql} sp
                                        WHERE sp.idgrupo = $1
                                        ORDER BY sp.fecha_creacion ASC`,
                                values: [ _idGrupoPre ]
                            }
                            _dataHistorySuceso = (await client.query(queryGetHistorialSucesoXGrupo)).rows as Array<ISucesoPrescriptor>
                        }
                        // Si existe algun historico de suceso, solo agregamos los historicos de leads
                        // que no se encuentran en SUCESOS
                        if ( _dataHistorySuceso.length !== 0 ) {
                            let _dataRefHistory = (_dataHistorySuceso.map(el => el.ref_historico_lead?.trim()).filter(el => el !== '')) || []
                            let _dataRefSuceso = (_dataHistorySuceso.map(el => el.ref_suceso?.trim()).filter(el => el !== '')) || []

                            _dataHistoryLead = _dataHistoryLead.filter( el => !(_dataRefHistory.includes(el.ref_historico_lead?.trim())) )
                            _dataHistoryLead = _dataHistoryLead.filter( el => !(_dataRefSuceso.includes(el.ref_suceso?.trim())) )
                        }

                        for (let i = 0; i < _dataHistoryLead.length; i++) {
                            const queryInsertSuceso = {
                                name: 'insert-suceso-prescriptor-dn',
                                text: `INSERT INTO ${Constants.tbl_suceso_prescriptor_dn_sql} (
                                            comentario, data, fecha_creacion, idusuario, idgrupo,
                                            nro_visitas, nro_reservas, valor, flag_vr, lead_id, ref_historico_lead, ref_suceso)
                                        VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                                values: [   _dataHistoryLead[i].comentario,
                                            {},
                                            _dataHistoryLead[i].fecha_creacion, 
                                            _dataHistoryLead[i].idusuario_resp, 
                                            _idGrupoPre,
                                            0,
                                            0,
                                            0,
                                            'na',
                                            dataPrev.lead_id,
                                            _dataHistoryLead[i].ref_historico_lead,
                                            _dataHistoryLead[i].ref_suceso
                                        ]
                            }
                            await client.query(queryInsertSuceso)
                        }

                    } else if ( data.tipo_lead === Constants.code_lead_propietario && data.grupo ) { // Para lead [PROPIETARIO]
                        // Paso#1: Vericamos la existencia del grupo
                        const queryGetDataGrupo = {
                            name: 'get-grupo-x-nombre-propietario',
                            text: ` SELECT gp.*
                                    FROM ${Constants.tbl_grupo_propietario_dn_sql} gp
                                    WHERE gp.nombre LIKE $1 LIMIT 1`,
                            values: [ data.grupo.nombre]
                        }
                        let _dataGrupo = (await client.query(queryGetDataGrupo)).rows as Array<IGrupoPropietario>
                        let _idGrupoPro = (_dataGrupo.length !== 0) ? _dataGrupo[0].id! : 0
                        let _isGroupNew = true
                        
                        if ( _dataGrupo.length === 0 ) { // Crear grupo propietarios
                            const queryInsertGrupo = {
                                name: 'insert-grupo-propietario',
                                text: `INSERT INTO ${Constants.tbl_grupo_propietario_dn_sql} (
                                        nombre,
                                        fecha_creacion,
                                        fecha_ultimo_cambio
                                        ) VALUES($1,$2,$2) RETURNING *`,
                                values: [
                                            data.grupo!.nombre,
                                            timeStampCurrent
                                    ]
                            }
                            let _nGrupo = (await client.query(queryInsertGrupo)).rows as Array<IGrupoPropietario>
                            _idGrupoPro = (_nGrupo.length !== 0) ? _nGrupo[0].id! : 0 
                        } else { // Actualizamos el estado del grupo a ACTIVO
                            const queryUpdateActivarGrupo = {
                                name: 'update-grupo-pro-activar',
                                text: ` UPDATE ${Constants.tbl_grupo_propietario_dn_sql} SET
                                        estado = $1,
                                        fecha_ultimo_cambio = $2
                                        WHERE id = $3 RETURNING *`,
                                values: [
                                            1,
                                            timeStampCurrent,
                                            _idGrupoPro
                                        ]
                            }
                            await client.query(queryUpdateActivarGrupo)
                            _isGroupNew = false
                        }

                        // Paso#2: Se crea el propietario
                        const queryInsertPropietario = {
                            name: 'insert-propietario-x-grupo',
                            text: `INSERT INTO ${Constants.tbl_propietario_dn_sql} (
                                    idusuario, 
                                    fecha_creacion,
                                    idgrupo
                                    ) VALUES($1,$2,$3) RETURNING *`,
                            values: [
                                        idDataUserDB,   
                                        timeStampCurrent,
                                        _idGrupoPro
                                ]
                        }
                        await client.query(queryInsertPropietario)

                        // Guardar el comentario de LEAD a Suceso Prescriptor
                        // data.comentario -> comentario
                        // idLeadRef -> guardar en suceso prescriptor
                        // _idGrupoPre -> grupo para agregar el comentario a suceso
                        // Se guarda con la fecha actual el comentario de suceso

                        // Paso #3 Insert comentario de lead a suceso propietario

                        // Consultamos todos los comentarios del grupo y comparamos con los del suceso y solo agregar
                        // los que no existen en el suceso

                        // Si el grupo ya existe, consultamos sus comentarios, caso contrario los agregamos
                        let _dataHistorySuceso: Array<ISucesoPrescriptor> = []
                        if ( !_isGroupNew ) {
                            const queryGetHistorialSucesoXGrupo = {
                                name: 'get-suceso-historico-x-grupo',
                                text: ` SELECT sp.lead_id,
                                        COALESCE((sp.ref_historico_lead), '') as ref_historico_lead, 
                                        COALESCE((sp.ref_suceso), '') as ref_suceso
                                        FROM ${Constants.tbl_suceso_propietario_dn_sql} sp
                                        WHERE sp.idgrupo = $1
                                        ORDER BY sp.fecha_creacion ASC`,
                                values: [ _idGrupoPro ]
                            }
                            _dataHistorySuceso = (await client.query(queryGetHistorialSucesoXGrupo)).rows as Array<ISucesoPrescriptor>
                        }
                        // Si existe algun historico de suceso, solo agregamos los historicos de leads
                        // que no se encuentran en SUCESOS
                        if ( _dataHistorySuceso.length !== 0 ) {
                            let _dataRefHistory = (_dataHistorySuceso.map(el => el.ref_historico_lead?.trim()).filter(el => el !== '')) || []
                            let _dataRefSuceso = (_dataHistorySuceso.map(el => el.ref_suceso?.trim()).filter(el => el !== '')) || []

                            _dataHistoryLead = _dataHistoryLead.filter( el => !(_dataRefHistory.includes(el.ref_historico_lead?.trim())) )
                            _dataHistoryLead = _dataHistoryLead.filter( el => !(_dataRefSuceso.includes(el.ref_suceso?.trim())) )
                        }

                        for (let i = 0; i < _dataHistoryLead.length; i++) {
                            let queryInsertSuceso = {
                                name: 'insert-suceso-propietario-dn',
                                text: `INSERT INTO ${Constants.tbl_suceso_propietario_dn_sql} (
                                            comentario,
                                            data,
                                            fecha_creacion, 
                                            idusuario,
                                            idgrupo,
                                            lead_id,
                                            ref_historico_lead, 
                                            ref_suceso)
                                        VALUES( $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                                values: [   _dataHistoryLead[i].comentario,
                                            {},
                                            _dataHistoryLead[i].fecha_creacion, 
                                            _dataHistoryLead[i].idusuario_resp, 
                                            _idGrupoPro,
                                            dataPrev.lead_id,
                                            _dataHistoryLead[i].ref_historico_lead,
                                            _dataHistoryLead[i].ref_suceso
                                        ]
                            }
                            await client.query(queryInsertSuceso)
                        }
                    }

                    // Insertar piso y asociarlo al propietario
                    // Se cambia porque se puede crar un piso sin datos basicos, queda para posterior edición [Reglas del juego]
                    if ( dataPrev.tipo_lead === Constants.code_lead_propietario && false ) {
                        queryData = {
                            name: 'insert-piso',
                            text: `INSERT INTO ${Constants.tbl_piso_sql}(
                                pais, 
                                ciudad, 
                                codigo_postal, 
                                direccion, 
                                nro_edificio,
                                nro_piso,
                                id_dispositivo_ref,
                                fecha_creacion, 
                                fecha_ultimo_cambio, 
                                idusuario,
                                ref_lead)
                                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
                            values: [   'España', 
                                        data.localidad || `LOC-${dataPrev.lead_id}`, 
                                        data.codigo_postal || `CP-${dataPrev.lead_id}`, 
                                        data.direccion || `DIR-${dataPrev.lead_id}`, 
                                        data.nro_edificio,
                                        data.nro_piso,
                                        dataPrev.lead_id,
                                        timeStampCurrent, 
                                        timeStampCurrent,
                                        this.idUserLogin,
                                        dataPrev.lead_id
                                ]
                        }
                        let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>
                        let pisoDB = lData[0]

                        if (pisoDB && idDataUserDB) {
                            const idDataPisoDB = (pisoDB as IApartment).id!
                            queryData = {
                                name: 'insert-piso-x-user',
                                text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                                    VALUES($1,$2) RETURNING *`,
                                values: [ idDataUserDB, idDataPisoDB]
                            }
                            await client.query(queryData)
                        }
                    }
                }
            }

            // Agrega el gran historial, para controlar a DN
            queryData = {
                name: 'insert-history-lead',
                text: `INSERT INTO ${Constants.tbl_historico_lead_dn_sql}( 
                    fecha_creacion,
                    next_step,
                    last_step,
                    data,
                    interesa,
                    avance,
                    ocupacion,
                    estatus,
                    comentario,
                    idlead,
                    idusuario_resp,
                    tipo_accion,
                    categoria,
                    ref_historico_lead
                    )
                    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                values: [
                            timeStampCurrent,
                            data.next_step,
                            data.last_step, 
                            this.infoExtra.data || {}, 
                            data.name_tinteresa, 
                            data.name_tavance, 
                            data.name_tocupacion,
                            data.estatus,
                            data.comentario,
                            idLeadDB,
                            this.idUserLogin,
                            data.tipo_accion,
                            data.name_categoria,
                            _uuidHistorico
                    ]
            }
            let lDataHistoricoLead = (await client.query(queryData)).rows as Array<IHistoricoLead | IErrorResponse>

            if ( ({ ...lDataHistoricoLead[0] } as IErrorResponse).error ) return lDataHistoricoLead

            // Después de insertar el histórico, verifica si hay 5 o más registros con interesa = 'Poco'
            const queryCountPoco = {
                name: 'count-historico-tipointeresa-poco',
                text: `
                    SELECT COUNT(*) AS count
                    FROM ${Constants.tbl_historico_lead_dn_sql}
                    WHERE idlead = $1 AND interesa = 'Poco'
                `,
                values: [idLeadDB], // leadId es el ID del lead asociado al histórico
            };
            const resultCount = await client.query(queryCountPoco); // Ejecuta la consulta para contar los registros
            const countPoco = parseInt(resultCount.rows[0].count, 10); // Obtiene el conteo como número entero

            if (countPoco >= 5) {
                // Si hay 5 o más registros con interesa = 'Poco', actualiza el estatus del lead a 0 (oculto)
                const queryUpdateEstatus = {
                    name: 'update-lead-estatus-oculto',
                    text: `
                        UPDATE ${Constants.tbl_lead_dn_sql}
                        SET estatus = 0
                        WHERE id = $1
                    `,
                    values: [idLeadDB], // Actualiza el estatus del lead con el ID proporcionado
                };
                await client.query(queryUpdateEstatus); // Ejecuta la consulta para actualizar el estatus
            }

            return lDataLead
        })

        return ( responseD[0] ) as ILead | IErrorResponse
    }

    /**
     * [SIN USO - MEJORADO Y MIGRADO A ARCHIVO DE ESTADISTICAS]
     * @returns 
     */
    async leadsEstadistica(): Promise<IResponseGeneral | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise <Array<IModel | IErrorResponse>> => {

            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const _dateCurrent = UtilInstance.getDateCurrent().fecha
            const _dateYesterday = UtilInstance.actionAddAndDismissDays(_dateCurrent, -1).fecha
       

            let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
            let filter_m_end = this.infoExtra.filter.m_end || _dateYesterday


            // Obtiene los datos de la tabla lead que se usaran mas adelante para crear el reporte
            const queryData = {
                name : "get-leads-report",
                text : `SELECT lead_id , next_step , semana, nombre, apellido , grupo_wpp,
                estatus , nro_llamadas , idtipoavance , idresponsable , idtipoocupacion,
                idtipointeresa, idusuario_creacion , idusuario_ult_cambio , tipo_lead , idcategoria,
                empresa , nombre_completo FROM ${Constants.tbl_lead_dn_sql}
                WHERE  estatus = $1 AND next_step BETWEEN  $2 AND $3`,
                values : [
                    this.filterStatus,
                    filter_m_start,
                    filter_m_end
                ]
            }
            let lData = (await client.query(queryData)).rows as Array <ILead | IErrorResponse>

            let infoLead = ((lData as Array<ILead>)[0])
            
            

            // Hace un conteo de todos los prescriptores que tenemos actualmente

            const queryPrescriptores ={
                name : "get-prescriptores-count",
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_prescriptor_dn_sql}
                        WHERE estado = $1`,
                values : [
                    this.filterStatus
                ]
            }
            
            let lDataCountPres = (await client.query(queryPrescriptores)).rows as Array <IData | IErrorResponse>

            const _lDataCountPres = lDataCountPres as Array<IData>

            // Hace un conteo de todos los prescriptores que tienen grupo de whatsapp

            const queryGrupoPres = {
                name : "get-grupo-prescriptores-count",
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_grupo_prescriptor_dn_sql}
                        WHERE estado =$1`,
                values : [
                    this.filterStatus
                ]

            }
            
            let lDataCountGrupo = (await client.query(queryGrupoPres)).rows as Array <IData | IErrorResponse>

            const _lDataCountGrupo = lDataCountGrupo as Array<IData>



            // Hace un conteo de todos los leads atrasados en relacion con la fecha actuales

            const queryLeadRetr = {
                name : "get-leads-retrasados",
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_lead_dn_sql}
                        WHERE estatus = $1 AND next_step BETWEEN $2 AND $3
                        AND idtipointeresa != 1`,
                values : [
                    this.filterStatus,
                    filter_m_start,
                    filter_m_end
                ]
            }

            let lDataCountLeadRe = (await client.query(queryLeadRetr)).rows as Array <IData | IErrorResponse>
            
            const _lDataCountLeadRe = lDataCountLeadRe as Array<IData>

            //Hace un conteo de todos los leads atrasados en relacion con la fecha actual y el tipo de lead que sea 

            //Hace un conteo de todos los leads que hay 

            const queryLeadsAll = {
                name : "get-all-leads",
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_lead_dn_sql}
                        WHERE estatus = 1`,
                values : []
            }

            let lDataCountLeadsAll = (await client.query(queryLeadsAll)).rows as Array <IData | IErrorResponse>

            const _DataCountLeadsAll = lDataCountLeadsAll as Array<IData>


            // Hace un conteo de todos los leads retrasados por el tipo de lead Propietario y en un periodo de tiempo

            const queryLeadsRetrasadosPropietarios = {
                name : "get-leads",
                text: `SELECT COUNT(*) as total_data from ${Constants.tbl_lead_dn_sql}
                WHERE tipo_lead = $1 AND next_step BETWEEN $2 AND $3` ,
                values : [
                    'Propietario',
                    filter_m_start,
                    filter_m_end
                ]
            }
          
            let lDataCountLeadsRetrasadosPropietarios = (await client.query(queryLeadsRetrasadosPropietarios)).rows as Array<IData | IErrorResponse>

            const _lDataLeadsPropietarios = lDataCountLeadsRetrasadosPropietarios as Array<IData>


            //Hace un conteo de todos los leads retrasados por el tipo de lead Colaborador y en un periodo de tiempo

            const queryLeadsRetrasadosColaborador = {
                name : "get-leads-colaborador",
                text : `SELECT COUNT(*) as total_data FROM ${Constants.tbl_lead_dn_sql}
                    WHERE tipo_lead = $1 AND next_step BETWEEN $2 AND $3`,
                values : [
                    'Colaborador',
                    filter_m_start,
                    filter_m_end
                ]
            }

            let lDataCountLeadsRetrasadosColaborador = (await client.query(queryLeadsRetrasadosColaborador)).rows as Array<IData | IErrorResponse>

            const _lDataLeadsColaborador = lDataCountLeadsRetrasadosColaborador as Array <IData>

            // Devuelve todas las llamadas hechas durante un periodo de tiempo

            const queryLlamadas = {
                name : "get-llamadas", 
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_historico_lead_dn_sql} l
                where date(l.fecha_creacion) BETWEEN $1 AND $2`,
                values : [
                    filter_m_start,
                    filter_m_end
                ]
            }

            let lDataLlamadas = (await client.query(queryLlamadas)).rows as Array <IData | IErrorResponse>
            
           const _lDataLlamadas = lDataLlamadas as Array <IData>

             // Hace un conteo de las llamadas hechas por el tipo de lead Propietario:

             const queryLeadsPropietarios = {
                name : "get-leads-propietarios",
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_historico_lead_dn_sql} hl
                        INNER JOIN ${Constants.tbl_lead_dn_sql} ld
                        ON ld.id = hl.idlead
                        WHERE tipo_lead = $1 AND ld.next_step BETWEEN $2 AND $3`,
                values : [
                    'Propietario',
                    filter_m_start,
                    filter_m_end
                ]
            }

            let lDataCountLlamadasPropietarios = (await client.query(queryLeadsPropietarios)).rows as Array <IData | IErrorResponse>

            const _DataCountLlamadasPropietarios = lDataCountLlamadasPropietarios as Array<IData>


            // Hace un conteo de las llamadas hechas por el tipo de lead  Colaborador:


            const queryLeadsColaborador = {
                name : "get-llamadas-colaborador",
                text : `SELECT count(*) as total_data FROM ${Constants.tbl_historico_lead_dn_sql} hl
                        INNER JOIN ${Constants.tbl_lead_dn_sql} ld
                        ON ld.id = hl.idlead
                        WHERE tipo_lead = $1 AND ld.next_step BETWEEN $2 AND $3`,
                values : [
                    'Colaborador',
                    filter_m_start,
                    filter_m_end
                ]
            }

            let lDataCountLlamadasColaborador= (await client.query(queryLeadsColaborador)).rows as Array <IData | IErrorResponse>

            const _DataCountLeadsColaborador = lDataCountLlamadasColaborador as Array<IData>



         if(lData && lData.length != 0){
       
            // crea y devuelve un registro en TBL_ESTADISTICA donde se ven los prescriptores que hay/habia en las fechas elegidas
           
            const queryInsertEstadisticaPres = {
                name : "insert-estadistica-prescriptores",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (fecha_creacion,
                         tipo,
                         idusuario,
                         data,
                         estadistica
                        ) 
                        VALUES ($1 , $2 , $3 , $4, $5) RETURNING *`,

                values : [
                    timeStampCurrent,
                    "prescriptores_totales",
                    this.idUserLogin,
                    {filter_m_start , filter_m_end},
                    _lDataCountPres[0].total_data
                ]
                }
            
            let lDataInsertPres = (await client.query(queryInsertEstadisticaPres)).rows as Array <IModel | IErrorResponse>



            // crea y devuelve un registro con todos los leads

            const queryInsertAllLeads = {
                name : "insert-all-leads",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (fecha_creacion,
                         tipo,
                         idusuario,
                         data,
                         estadistica
                         )
                         VALUES ($1 , $2, $3, $4,$5)`,
                
                values: [
                    timeStampCurrent,
                    "all_leads",
                    this.idUserLogin,
                    {filter_m_start , filter_m_end},
                    _DataCountLeadsAll[0].total_data
                ]
            }

            let lDataAllLeads = (await client.query(queryInsertAllLeads)).rows as Array <ILead | IErrorResponse>

            // Crea y devuelve un registro con todos los leads retrasados que hay segun el tipo Propietario

            const queryInsertLeadsRetrasadosPropietario = {
                name : "insert-lead-retrasados-propietarios",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (
                            fecha_creacion, 
                            tipo,
                            idusuario,
                            data,
                            estadistica
                        )
                        VALUES ($1 , $2, $3, $4 , $5)`,
                values : [
                    timeStampCurrent,
                    "leads_retrasados_propietarios",
                    this.idUserLogin,
                    { filter_m_start,
                        filter_m_end},
                    _DataCountLlamadasPropietarios[0].total_data
                ]
            }

            let lDataLeadsRetrasadosPropietarios = (await client.query(queryInsertLeadsRetrasadosPropietario)).rows as Array <ILead | IErrorResponse>



            // crea y devuelve un registro de todos los leads retrasados que hay segun el tipo Prescriptor 

            const queryInserLeadsRetrasadosPrescriptor = {
                name : "insert-lead-retrasados-prescriptor",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (
                            fecha_creacion,
                            tipo,
                            idusuario,
                            data,
                            estadistica
                        )
                        VALUES ($1, $2, $3, $4, $5)`,
                values : [
                    timeStampCurrent,
                    "leads_retrasados_prescriptores",
                    this.idUserLogin,
                    { filter_m_start,
                        filter_m_end},
                    _lDataLeadsColaborador[0].total_data
                ]
            }

            let lDataLeadsRetrasadosColaborador = (await client.query(queryInserLeadsRetrasadosPrescriptor)).rows as Array <ILead | IErrorResponse>

            
            // Crea y devuelve un registro en la TBL donde se ven los whatsapps que hay/habia en las fechas elegidas

            const queryInsertEstadisticaWpp = {
                name : "insert-estadistica-grupo-prescriptores",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (fecha_creacion,
                         tipo,
                         idusuario,
                         data,
                         estadistica
                        ) 
                        VALUES ($1 , $2 , $3 , $4, $5) RETURNING *`,
                
                values : [
                    timeStampCurrent,
                    "whatsapp_grupo_prescriptor",
                    this.idUserLogin,
                    {filter_m_start , filter_m_end},
                    _lDataCountGrupo[0].total_data
                ]
            }

            let lDataInsertGrupo = (await client.query(queryInsertEstadisticaWpp)).rows as Array <IGrupoPrescriptor | IErrorResponse>

            // crea y devuelve los leads retrasados que hay/habia entre las fechas elegidas
           
            const queryLeadsRetrasados = {
                name : "insert-leads-retrasados",
                text: `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (
                          fecha_creacion,
                          tipo,
                          idusuario,
                          data,
                          estadistica  
                        ) 
                        VALUES ($1 , $2 , $3 , $4, $5) AND l.idtipointeresa IN (1, 2, 3) RETURNING *`,
                
                values : [
                    timeStampCurrent,
                    "leads_retrasados_total",
                    this.idUserLogin,
                    {filter_m_start , filter_m_end},
                    _lDataCountLeadRe[0].total_data
                ]
            }
            
            let lDataLeadsRetrasados = (await client.query(queryLeadsRetrasados)).rows as Array <ILead | IErrorResponse>






            // crea y devulve todas las llamadas hechas en un margen de tiempo
            
            const queryInsertLlamadas = {
                name : "insert-llamadas-hechas",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (
                            fecha_creacion,
                            tipo,
                            idusuario,
                            data,
                            estadistica
                        )
                        VALUES ($1 , $2, $3 , $4, $5) RETURNING *`,
                
                values : [
                    timeStampCurrent,
                    "llamadas_hechas_general",
                    this.idUserLogin,
                    {filter_m_start , filter_m_end},
                    _lDataLlamadas[0].total_data
                ]
            }
            let lDataLlamadasHechas = (await client.query(queryInsertLlamadas)).rows as Array <IHistoricoLead | IErrorResponse>


               // crea y devuelve las llamadas hechas a los propietarios 

               const queryInsertLeadsPropietarios ={
                name : "insert-llamadas-tipo-propietarios",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (
                            fecha_creacion,
                            tipo,
                            idusuario,
                            data,
                            estadistica
                        )
                        VALUES ($1 , $2 , $3, $4, $5)`,
                values : [
                    timeStampCurrent,
                    "llamadas_leads_propietarios",
                    this.idUserLogin,
                    { filter_m_start, filter_m_end},
                    _DataCountLlamadasPropietarios[0].total_data
                ]
            }

            let lDataInsertLeadsPropietarios = (await client.query(queryInsertLeadsPropietarios)).rows as Array <ILead | IErrorResponse>



            // crea y devuelve las llamadas hechas a los colaboradores 

            const queryInsertLeadsColaborador ={
                name : "insert-llamadas-tipo-prescriptores",
                text : `INSERT INTO ${Constants.tbl_estadistica_dn_sql}
                        (
                            fecha_creacion,
                            tipo,
                            idusuario,
                            data,
                            estadistica
                        )
                        VALUES ($1 , $2 , $3, $4, $5)`,
                values : [
                    timeStampCurrent,
                    "llamadas_leads_prescriptores",
                    this.idUserLogin,
                    { filter_m_start, filter_m_end},
                    _DataCountLeadsColaborador[0].total_data
                ]
            }

            let lDataInsertLeadsColaborador = (await client.query(queryInsertLeadsColaborador)).rows as Array <ILead | IErrorResponse>

         
            
        }
        
       
            return [{text: "Todo ha salido correctamente"}] as Array <IResponseGeneral>
        })
        return (responseD[0]) as IResponseGeneral | IErrorResponse
    }
}


export default LeadDataAccess