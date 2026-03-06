import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IInfoPisoComercial } from "../models/IInfoPisoComercial"
import { IModel } from "../helpers/IModel"
import UtilInstance from "../helpers/Util"
import { IVariablesReserva } from "../models/IVariablesReserva"
import { off } from "process"

class InfoPisoComercialDataAccess implements IDataAccess<IInfoPisoComercial> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IInfoPisoComercial> | IErrorResponse> {
        const queryData  = {
                name: 'get-info-piso-comercial',
                text: ` SELECT ipc.*
                        FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                        INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso AND p.estado = $1)
                        ORDER BY ipc.nombre_comercial ASC
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<IInfoPisoComercial | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IInfoPisoComercial | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IInfoPisoComercial>
    }

    /**
     * Retorna todos los pisos, con sus respectivas información comercial, aunque esta no exista aún
     * [NO TOCAR]
     * @returns 
     */
    async getAllPisoAll(): Promise<Array<IInfoPisoComercial> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }
        
        const _search_all = this.infoExtra!.filter!.search_all || ''
        const _nro_habitaciones = isNaN(parseInt(this.infoExtra!.filter!.nro_habitaciones)) ? -1 : parseInt(this.infoExtra!.filter!.nro_habitaciones)
        const _capacidad_maxima = isNaN(parseInt(this.infoExtra!.filter!.capacidad_maxima)) ? -1 : parseInt(this.infoExtra!.filter!.capacidad_maxima)
        const _nro_camas = isNaN(parseInt(this.infoExtra!.filter!.nro_camas)) ? -1 : parseInt(this.infoExtra!.filter!.nro_camas)
        const _nro_banios = isNaN(parseInt(this.infoExtra!.filter!.nro_banios)) ? -1 : parseInt(this.infoExtra!.filter!.nro_banios)
        const _total = isNaN(parseFloat(this.infoExtra!.filter!.total)) ? -1 : parseFloat(this.infoExtra!.filter!.total)
        const _estado_general = isNaN(parseInt(this.infoExtra!.filter!.estado_general)) ? -2 : parseInt(this.infoExtra!.filter!.estado_general)

        let _total_start = isNaN(parseFloat(this.infoExtra!.filter!.total_start)) ? 0 : parseFloat(this.infoExtra!.filter!.total_start)
        let _total_end = isNaN(parseFloat(this.infoExtra!.filter!.total_end)) ? 10000000 : parseFloat(this.infoExtra!.filter!.total_end)

        _total_start = _total_start > -1 ? _total_start : 0
        _total_end = _total_end > -1 ? _total_end : 10000000

        const queryData  = {
                name: 'get-all-info-piso-comercial',
                text: ` SELECT pf.*,
                        ipd.cp_ocupacion_maxima,
                        ipd.cp_m2,
                        ipd.ds_nro_dormitorios,
                        ipd.ds_nro_camas,
                        ipd.bs_nro_banios,
                        ipd.ca_aire_acondicionado,
                        ipd.ca_calefaccion,
                        ipd.cp_ascensor,
                        ipd.ca_discapacidad,
                        ipd.ds_descripcion_camas,
                        ipd.bs_nro_aseos,
                        ipd.bs_descripcion_banios,
                        ipd.ds_descripcion_sofacama,
                        ipd.ds_nro_sofacama,

                        (
                         CASE
                            WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = true THEN 'Si'
                            WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = false THEN 'No'
                            WHEN ipd.id is NULL and pf.aire_acondicionado = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.aire_acondicionado = false THEN 'No'
                         END
                     ) as lbl_aire_acondicionado,
                     (
                         CASE
                            WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = true THEN 'Si'
                            WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = false THEN 'No'
                            WHEN ipd.id is NULL and pf.calefaccion = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.calefaccion = false THEN 'No'
                         END
                     ) as lbl_calefaccion,
                     (
                         CASE
                            WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = true THEN 'Si'
                            WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = false THEN 'No'
                            WHEN ipd.id is NULL and pf.ascensor= true THEN 'Si'
                            WHEN ipd.id is NULL and pf.ascensor = false THEN 'No'
                         END
                     ) as lbl_ascensor,
                     (
                         CASE
                            WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = true THEN 'Si'
                            WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = false THEN 'No'
                            WHEN ipd.id is NULL and pf.discapacidad = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.discapacidad = false THEN 'No'
                         END
                     ) as lbl_discapacidad
                 FROM (
                            SELECT ipc.id, ipc.estado_general, 
                            p.etiqueta AS a_etiqueta, p.id as idpiso, plfc.plataformas,
                            COALESCE(vc.variablesreserva, '[]') as variablesreserva,
                            p.ciudad as a_localidad, p.codigo_postal as a_codigo_postal, 
                            (p.direccion || ', Nro ' || p.nro_edificio || ', ' || p.nro_piso) as a_full_direccion, p.ubicacion_mapa,
                            vc.total_str,p.ocupacion_maxima, p.m2, p.nro_dormitorios, p.nro_camas, p.nro_banios, p.nro_sofacama,
                            p.etiqueta, p.discapacidad , p.ascensor , p.calefaccion , p.aire_acondicionado
                            FROM ${Constants.tbl_piso_sql} p
                            LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON p.id = ipd.id
                            LEFT JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (p.id = ipc.idpiso)
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
                                FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                                RIGHT JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso)
                                LEFT JOIN ${Constants.tbl_plataforma_comercial_rmg_sql} pc ON (pc.estado = 1)
                                LEFT JOIN ${Constants.tbl_plataforma_infopiso_rmg_sql} pi ON (pc.id = pi.idplataformacom AND pi.estado = 1 AND ipc.id = pi.idinfopisocom)
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
                                $2 = '') 
                    ) AS pf
                     LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.idpiso = ipd.id
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
`,
                values: [   this.filterStatus,
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

        // UNACCENT(lower( replace(trim(vc.total_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
        // CAST(COALESCE(vc.total_str, '0') as double precision) = $7 OR
        // CAST(COALESCE(vc.total_str, '0') as double precision)::integer = ($7)::integer OR 
        // $7 = -1

        let lData: Array<IInfoPisoComercial | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IInfoPisoComercial | IErrorResponse>
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IInfoPisoComercial>
    }

    async getById(id: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            // Insert codigo
            let queryData = {
                    name: 'insert-info-piso-comercial',
                    text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
                        nombre_comercial,
                        link_nombre_comercial,
                        estado_general,
                        link_tour_virtual,
                        link_calendario_disponibilidad,
                        link_repositorio,
                        tiene_anuncio,
                        anuncio_usuario,
                        anuncio_contrasenia,
                        anuncio_plataforma,
                        anuncio_link,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idpiso
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
                    values: [
                        data.nombre_comercial,
                        data.link_nombre_comercial, 
                        data.estado_general,
                        data.link_tour_virtual,
                        data.link_calendario_disponibilidad,
                        data.link_repositorio,
                        data.tiene_anuncio,
                        data.anuncio_usuario,
                        data.anuncio_contrasenia,
                        data.anuncio_plataforma,
                        data.anuncio_link,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.idpiso
                    ]
            }
            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial

            let idDataDB = dataDB.id || BigInt(0)
            
            // // Asocia varias plataformas al piso
            if ( dataDB && data.plataformas && data.plataformas.length !== 0 ) {
                for (let i = 0; i < data.plataformas!.length; i++) {
                    const queryData = {
                        name: 'insert-plataforma-x-piso-comercial',
                        text: `INSERT INTO ${Constants.tbl_plataforma_infopiso_rmg_sql} ( link, fecha_ultimo_cambio, idinfopisocom, idplataformacom )
                                VALUES($1, $2, $3, $4) RETURNING *`,
                        values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                    }
                    await client.query(queryData)
                    // let respTmp = (await client.query(queryData)).rows as Array<ITelefono | IErrorResponse>
                    // if ( (respTmp[0] as IErrorResponse).error ) {
                    //     lDataLead = respTmp as Array<IErrorResponse>
                    //     break
                    // }
                }
            }

            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    async update(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        // throw new Error("Method not implemented.")
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            // Insert codigo
            let queryData = {
                    name: 'update-info-piso-comercial',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
                        nombre_comercial = $1,
                        link_nombre_comercial = $2,
                        estado_general = $3,
                        link_tour_virtual = $4,
                        link_calendario_disponibilidad = $5,
                        link_repositorio = $6,
                        tiene_anuncio = $7,
                        anuncio_usuario = $8,
                        anuncio_contrasenia = $9,
                        anuncio_plataforma = $10,
                        anuncio_link = $11,
                        fecha_ultimo_cambio = $12,
                        idusuario_ult_cambio = $13
                        WHERE id = $14 AND idpiso = $15 RETURNING *`,
                    values: [
                        data.nombre_comercial,
                        data.link_nombre_comercial, 
                        data.estado_general,
                        data.link_tour_virtual,
                        data.link_calendario_disponibilidad,
                        data.link_repositorio,
                        data.tiene_anuncio,
                        data.anuncio_usuario,
                        data.anuncio_contrasenia,
                        data.anuncio_plataforma,
                        data.anuncio_link,
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)

            // // Asocia varias plataformas al piso [TEMPORALMENTE SIN USO :(]
            if ( dataDB && data.plataformas && data.plataformas.length !== 0 ) {
                // Delete all plataformas: changes state a -1
                queryData = {
                    name: 'inactivar-plataformas',
                    text: ` UPDATE ${Constants.tbl_plataforma_infopiso_rmg_sql} SET estado = -1
                            WHERE idinfopisocom = $1 AND estado = 1`,
                    values: [ idDataDB ]
                }
                await client.query(queryData)

                for (let i = 0; i < data.plataformas!.length; i++) {
                    const queryData = {
                        name: 'update-plataforma-x-piso-comercial',
                        text: ` UPDATE ${Constants.tbl_plataforma_infopiso_rmg_sql} SET 
                                    link = $1, 
                                    fecha_ultimo_cambio = $2,
                                    estado = 1
                                WHERE idinfopisocom = $3 AND idplataformacom = $4 RETURNING *`,
                        values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                    }
                    let respTmp = (await client.query(queryData)).rowCount
                    
                    // Si no actualiza, el registro no existe, por ende inserta
                    if (respTmp === 0) {
                        const queryData = {
                            name: 'insert-plataforma-x-piso-comercial',
                            text: `INSERT INTO ${Constants.tbl_plataforma_infopiso_rmg_sql} ( link, fecha_ultimo_cambio, idinfopisocom, idplataformacom )
                                    VALUES($1, $2, $3, $4)`,
                            values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                        }
                        await client.query(queryData)
                    }
                }
            }
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    async delete(id: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Obtiene la información comercial del piso
     * @param idPiso 
     * @returns 
     */
    async getByIdPiso(idPiso: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        const queryData = {
            name: 'get-info-piso-comercial-x-idpiso',
            text: `
                    SELECT ipc.*, p.etiqueta as a_etiqueta, p.id_dispositivo_ref as a_codigo,
                    p.ciudad as a_localidad, p.codigo_postal as a_codigo_postal, 
                    (p.direccion || ', Nro ' || p.nro_edificio || ', ' || p.nro_piso) as a_full_direccion,
                    plfc.plataformas 
                    FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                    RIGHT JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso AND p.estado >= $1 AND p.id = $2)
                    LEFT JOIN (
                        SELECT p.id,
                        (CASE
                            WHEN count(pi.*) > 0 THEN jsonb_agg(json_build_object(  'id', pc.id, 
                                                                                    'nombre', pc.nombre,
                                                                                    'link', pi.link))
                            WHEN count(pi.*) = 0 THEN '[]'
                        END
                        ) as plataformas
                        FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                        RIGHT JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso AND p.id = $2)
                        LEFT JOIN ${Constants.tbl_plataforma_infopiso_rmg_sql} pi ON (ipc.id = pi.idinfopisocom AND pi.estado = 1)
                        LEFT JOIN ${Constants.tbl_plataforma_comercial_rmg_sql} pc ON (pc.id = pi.idplataformacom)
                        WHERE p.id = $2
                        GROUP BY p.id
                    ) plfc ON plfc.id = p.id
                    WHERE p.id = $2
                    `,
            values: [ this.filterStatus, idPiso ]
        }

        let lData: Array<IInfoPisoComercial | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IInfoPisoComercial | IErrorResponse>

        return lData[0]
    }

    async getByIdPisoVarReserva(idPiso: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        const queryData = {
            name: 'get-info-piso-comercial-x-idpiso',
            text: `
                    SELECT ipc.id, ipc.estado_general, p.etiqueta as a_etiqueta, p.id_dispositivo_ref as a_codigo,
                    p.ciudad as a_localidad, p.codigo_postal as a_codigo_postal, 
                    (p.direccion || ', Nro ' || p.nro_edificio || ', ' || p.nro_piso) as a_full_direccion,
                    vc.variablesreserva
                    FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                    RIGHT JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso AND p.estado >= $1 AND p.id = $2)
                    LEFT JOIN (
                        SELECT ipc.idpiso,
                        (CASE
                            WHEN count(vr.*) > 0 THEN jsonb_agg(json_build_object(  'id', vr.id, 
                                                                                    'aplica', vr.aplica,
                                                                                    'fecha_inicio_vigencia', vr.fecha_inicio_vigencia,
                                                                                    'fecha_fin_vigencia', vr.fecha_fin_vigencia,
                                                                                    'estado', vr.estado,
                                                                                    'precio_base', vr.precio_base,
                                                                                    'porcentaje_descuento', vr.porcentaje_descuento,
                                                                                    'precio_alquiler', vr.precio_alquiler,
                                                                                    'precio_muebles', vr.precio_muebles,
                                                                                    'total', vr.total,
                                                                                    'estancia_min', vr.estancia_min,
                                                                                    'estancia_max', vr.estancia_max,
                                                                                    'duracion_estancia', vr.duracion_estancia,
                                                                                    'edad_min', vr.edad_min,
                                                                                    'edad_max', vr.edad_max,
                                                                                    'mascota', vr.mascota,
                                                                                    'observacion', vr.observacion,
                                                                                    'n_estancia', te.nombre,
                                                                                    'idtipoestancia', vr.idtipoestancia
                                                                                ))
                            WHEN count(vr.*) = 0 THEN '[]'
                        END
                        ) as variablesreserva
                        FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                        LEFT JOIN ${Constants.tbl_variables_reserva_rmg_sql} vr ON (ipc.id = vr.idinfopisocom AND vr.estado <> -1)
                        LEFT JOIN ${Constants.tbl_tipo_estancia_rmg_sql} te ON (te.id = vr.idtipoestancia)
                        WHERE ipc.idpiso = $2 AND ipc.estado = 1
                        GROUP BY ipc.idpiso
                    ) vc ON (vc.idpiso = p.id)
                    WHERE p.id = $2 AND (ipc.estado >= $1 OR ipc.estado IS NULL)
                    `,
            values: [ this.filterStatus, idPiso ]
        }

        let lData: Array<IInfoPisoComercial | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IInfoPisoComercial | IErrorResponse>

        return lData[0]
    }

    async updateVariableReserva(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            // Insert codigo
            let queryData = {
                    name: 'update-info-piso-comercial',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
                        estado_general = $1,
                        fecha_ultimo_cambio = $2,
                        idusuario_ult_cambio = $3
                        WHERE id = $4 AND idpiso = $5 RETURNING *`,
                    values: [ 
                        data.estado_general,
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)

            // Delete all plataformas: changes state a -1
            queryData = {
                name: 'inactivar-plataformas',
                text: ` UPDATE ${Constants.tbl_variables_reserva_rmg_sql} SET 
                        estado = -1, 
                        fecha_ultimo_cambio = $1,
                        idusuario_ult_cambio = $2
                        WHERE idinfopisocom = $3 AND estado <> -1`,
                values: [ timeStampCurrent, this.idUserLogin, idDataDB ]
            }
            await client.query(queryData)

            // Crea las configuración de la reserva
            if ( dataDB && data.variablesreserva && data.variablesreserva.length !== 0 ) {
                for (let i = 0; i < data.variablesreserva!.length; i++) {
                    const queryData = {
                        name: 'insert-variablereserva-x-piso-comercial',
                        text: `INSERT INTO ${Constants.tbl_variables_reserva_rmg_sql} 
                                (   aplica, 
                                    fecha_inicio_vigencia, 
                                    estado, 
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
                                    idtipoestancia
                                )
                                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                        values: [   
                                    data.variablesreserva![i].aplica,
                                    data.variablesreserva![i].fecha_inicio_vigencia || undefined,
                                    data.variablesreserva![i].estado,
                                    data.variablesreserva![i].precio_base,
                                    data.variablesreserva![i].porcentaje_descuento,
                                    data.variablesreserva![i].precio_alquiler,
                                    data.variablesreserva![i].precio_muebles,
                                    data.variablesreserva![i].total,
                                    data.variablesreserva![i].duracion_estancia,
                                    data.variablesreserva![i].edad_min,
                                    data.variablesreserva![i].edad_max,
                                    data.variablesreserva![i].mascota,
                                    data.variablesreserva![i].observacion,
                                    timeStampCurrent,
                                    timeStampCurrent,
                                    this.idUserLogin,
                                    idDataDB,
                                    data.variablesreserva![i].idtipoestancia,
                                ]
                    }
                    await client.query(queryData)
                }
            }
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Crea la información de la plataforma. Inserta o actualiza el link de las plataformas
     * [NO TOCAR]
     * @param data 
     * @returns 
     */
    async insertByPlataforma(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

     
            const queryDataUpdate = {
                name : "update-info-piso-comercial",
                text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
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
                    data.idpiso
                ]
            }
            let lDataDB = (await client.query(queryDataUpdate)).rows as Array<IInfoPisoComercial | IErrorResponse>
           

            if(lDataDB && lDataDB.length == 0){
                 // Insert codigo
                            let queryData = {
                                name: 'insert-info-piso-comercial',
                                text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
                                    estado_general,
                                    fecha_creacion,
                                    fecha_ultimo_cambio,
                                    idusuario_ult_cambio,
                                    idpiso
                                    )
                                    VALUES($1,$2,$3,$4,$5) RETURNING *`,
                                values: [
                                    data.estado_general,
                                    timeStampCurrent, 
                                    timeStampCurrent, 
                                    this.idUserLogin, 
                                    data.idpiso
                                ]
                        }
        
                    lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
                  
            }
            let dataDB = lDataDB[0] as IInfoPisoComercial
            // let dataDB = lDataDB[0] as IInfoPisoComercial

            let idDataDB = dataDB.id || BigInt(0)
            
            // // Asocia varias plataformas al piso
            if ( dataDB && data.plataformas && data.plataformas.length !== 0 ) {
                for (let i = 0; i < data.plataformas!.length; i++) {
                    const queryData = {
                        name: 'update-plataforma-x-piso-comercial',
                        text: ` UPDATE ${Constants.tbl_plataforma_infopiso_rmg_sql} SET 
                                    link = $1, 
                                    fecha_ultimo_cambio = $2,
                                    estado = 1
                                WHERE idinfopisocom = $3 AND idplataformacom = $4 RETURNING *`,
                        values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                    }
                    let respTmp = (await client.query(queryData)).rowCount
                    
                    // Si no actualiza, insertamos el registro
                    if (respTmp === 0) {
                        const queryData = {
                            name: 'insert-plataforma-x-piso-comercial',
                            text: `INSERT INTO ${Constants.tbl_plataforma_infopiso_rmg_sql} ( link, fecha_ultimo_cambio, idinfopisocom, idplataformacom )
                                    VALUES($1, $2, $3, $4)`,
                            values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                        }
                        await client.query(queryData)
                    }
                }
            }

            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Inserta o actualiza la informacion de las plataformas [LINK]
     * [NO TOCAR]
     * @param id 
     * @param data 
     * @returns 
     */
    async updateByPlataforma(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        // throw new Error("Method not implemented.")
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            // Insert codigo
            let queryData = {
                    name: 'update-info-piso-comercial',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
                        fecha_ultimo_cambio = $1,
                        idusuario_ult_cambio = $2
                        WHERE id = $3 AND idpiso = $4 RETURNING *`,
                    values: [
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)

            // // Asocia varias plataformas al piso
            if ( dataDB && data.plataformas && data.plataformas.length !== 0 ) {
                for (let i = 0; i < data.plataformas!.length; i++) {
                    const queryData = {
                        name: 'update-plataforma-x-piso-comercial',
                        text: ` UPDATE ${Constants.tbl_plataforma_infopiso_rmg_sql} SET 
                                    link = $1, 
                                    fecha_ultimo_cambio = $2,
                                    estado = 1
                                WHERE idinfopisocom = $3 AND idplataformacom = $4 RETURNING *`,
                        values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                    }
                    let respTmp = (await client.query(queryData)).rowCount
                    
                    // Si no actualiza, el registro no existe, por ende inserta
                    if (respTmp === 0) {
                        const queryData = {
                            name: 'insert-plataforma-x-piso-comercial',
                            text: `INSERT INTO ${Constants.tbl_plataforma_infopiso_rmg_sql} ( link, fecha_ultimo_cambio, idinfopisocom, idplataformacom )
                                    VALUES($1, $2, $3, $4)`,
                            values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
                        }
                        await client.query(queryData)
                    }
                }
            }
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Crea la información de la plataforma. Solo se considera el campo [estado_general]
     * [NO TOCAR]
     * @param data 
     * @returns 
     */
    async insertByEstadoGeneral(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            
            const queryDataUpdate = {
                name : "update-info-piso-comercial",
                text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql}
                        SET
                        estado_general = $1,
                        fecha_ultimo_cambio = $2,
                        idusuario_ult_cambio = $3
                        WHERE id IN (SELECT id 
                            FROM ${Constants.tbl_info_piso_comercial_rmg_sql} 
                            WHERE estado = 1 AND 
                            idpiso = $4 
                            ORDER BY id DESC 
                            LIMIT 1)
                        RETURNING *
                        `,
                values : [
                    data.estado_general,
                    timeStampCurrent, 
                    this.idUserLogin, 
                    data.idpiso
                ]
            }
            
            let lDataDB = (await client.query(queryDataUpdate)).rows as Array<IInfoPisoComercial | IErrorResponse>

            if(lDataDB && lDataDB.length == 0){
                let queryData = {
                        name: 'insert-info-piso-comercial-estado-general',
                        text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
                            estado_general,
                            fecha_creacion,
                            fecha_ultimo_cambio,
                            idusuario_ult_cambio,
                            idpiso
                            )
                            VALUES($1,$2,$3,$4,$5) RETURNING *`,
                        values: [
                            data.estado_general,
                            timeStampCurrent, 
                            timeStampCurrent, 
                            this.idUserLogin, 
                            data.idpiso
                        ]
                }
                lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            }
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Actualiza la informacion comercial del piso. Solo [estado_general]
     * [NO TOCAR]
     * @param id 
     * @param data 
     * @returns 
     */
    async updateByEstadoGeneral(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        // throw new Error("Method not implemented.")
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                    name: 'update-info-piso-comercial-estado-general',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET
                        estado_general = $1, 
                        fecha_ultimo_cambio = $2,
                        idusuario_ult_cambio = $3
                        WHERE id = $4 AND idpiso = $5 RETURNING *`,
                    values: [
                        data.estado_general,
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Crea la información de la plataforma. Solo se considera el campo [precio_alquiler, total]
     * [NO TOCAR]
     * @param data 
     * @returns 
     */
    async insertByAlquiler(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

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
                    data.idpiso
                ]
            }
            
            let lDataDB = (await client.query(queryDataUpdate)).rows as Array<IInfoPisoComercial | IErrorResponse>
           

            if(lDataDB && lDataDB.length == 0) {
                let queryData = {
                    name: 'insert-info-piso-comercial-alquiler',
                    text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
                        estado_general,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idpiso
                        )
                        VALUES($1,$2,$3,$4,$5) RETURNING *`,
                    values: [
                        data.estado_general,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.idpiso
                    ]
                }

                lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            }
            
            let dataDB = lDataDB[0] as IInfoPisoComercial

            let idDataDB = dataDB.id || BigInt(0)
            
            // Datos de la reserva
            let _dataReserva = data.variablesreserva[0]


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
                        precio_alquiler,
                        total,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idinfopisocom
                        )
                        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
                    values: [
                        _dataReserva.precio_alquiler || 0,
                        _dataReserva.precio_alquiler || 0,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB
                    ]
                }
                await client.query(queryDataVarReserva)
            } else {
                let _total: number = parseFloat( (( _dataReserva.precio_alquiler || 0.0 ) + ( _dataReservaDB.precio_muebles || 0.00 )).toFixed(2) )
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
                        precio_limite
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
                    values: [
                        _dataReservaDB.aplica || '',
                        _dataReservaDB.fecha_inicio_vigencia || null,
                        _dataReservaDB.precio_base || 0,
                        _dataReservaDB.porcentaje_descuento || 0,
                        _dataReserva.precio_alquiler || 0,
                        _dataReservaDB.precio_muebles || 0,
                        _total,
                        _dataReservaDB.duracion_estancia || 0,
                        _dataReservaDB.edad_min || 0,
                        _dataReservaDB.edad_max || 0,
                        _dataReservaDB.mascota || false,
                        _dataReservaDB.observacion || '',
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB,
                        _dataReservaDB.precio_limite || 0,
                    ]
                }
                await client.query(queryDataVarReserva)
            }

            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Actualiza la informacion comercial del piso. Solo [precio_alquiler, total (daño colareral)]
     * [NO TOCAR]
     * @param id 
     * @param data 
     * @returns 
     */
    async updateByAlquiler(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                    name: 'update-info-piso-comercial-precio-alquiler',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
                        fecha_ultimo_cambio = $1,
                        idusuario_ult_cambio = $2
                        WHERE id = $3 AND idpiso = $4 RETURNING *`,
                    values: [
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)
            
            // Datos de la reserva
            let _dataReserva = data.variablesreserva[0]

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

            // Cambiar el estado a todas las reservas posteriores
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

            // Verifica si hay información previa
            if ( !_dataReservaDB ) { // Inserta desde cero
                let queryDataVarReserva = {
                    name: 'insert-variables-reserva-new',
                    text: `INSERT INTO ${Constants.tbl_variables_reserva_rmg_sql}( 
                        precio_alquiler,
                        total,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idinfopisocom
                        )
                        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
                    values: [
                        _dataReserva.precio_alquiler,
                        _dataReserva.precio_alquiler,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB
                    ]
                }
                await client.query(queryDataVarReserva)
            } else { // Inserta el registro apartir de la ultima reserva
                let _total: number = parseFloat( (( _dataReserva.precio_alquiler || 0.0 ) + ( _dataReservaDB.precio_muebles || 0.00 )).toFixed(2) )
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
                        precio_limite
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
                    values: [
                        _dataReservaDB.aplica || '',
                        _dataReservaDB.fecha_inicio_vigencia || null,
                        _dataReservaDB.precio_base || 0,
                        _dataReservaDB.porcentaje_descuento || 0,
                        _dataReserva.precio_alquiler || 0,
                        _dataReservaDB.precio_muebles || 0,
                        _total,
                        _dataReservaDB.duracion_estancia || 0,
                        _dataReservaDB.edad_min || 0,
                        _dataReservaDB.edad_max || 0,
                        _dataReservaDB.mascota || false,
                        _dataReservaDB.observacion || '',
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB,
                        _dataReservaDB.precio_limite
                    ]
                }
                await client.query(queryDataVarReserva)
            }
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Crea la información de la plataforma. Solo se considera el campo [precio_muebles, total]
     * [NO TOCAR]
     * @param data 
     * @returns 
     */
    async insertByPrecioMueble(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

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
                    data.idpiso
                ]
            }
            
            let lDataDB = (await client.query(queryDataUpdate)).rows as Array<IInfoPisoComercial | IErrorResponse>

            if(lDataDB && lDataDB.length == 0) {
                let queryData = {
                    name: 'insert-info-piso-comercial-precio-mueble',
                    text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
                        estado_general,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idpiso
                        )
                        VALUES($1,$2,$3,$4,$5) RETURNING *`,
                    values: [
                        data.estado_general,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.idpiso
                    ]
                }

                lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            }
            let dataDB = lDataDB[0] as IInfoPisoComercial

            let idDataDB = dataDB.id || BigInt(0)
            
            // Datos de la reserva
            let _dataReserva = data.variablesreserva[0] 


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
                        precio_muebles,
                        total,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idinfopisocom
                        )
                        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
                    values: [
                        _dataReserva.precio_muebles || 0,
                        _dataReserva.precio_muebles || 0,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB
                    ]
                }
                await client.query(queryDataVarReserva)
            } else {
                let _total: number = parseFloat( ((_dataReserva.precio_muebles || 0.00) + (_dataReservaDB.precio_alquiler || 0.00)).toFixed(2) )
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
                        precio_limite
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
                    values: [
                        _dataReservaDB.aplica || '',
                        _dataReservaDB.fecha_inicio_vigencia || null,
                        _dataReservaDB.precio_base || 0,
                        _dataReservaDB.porcentaje_descuento || 0,
                        _dataReservaDB.precio_alquiler || 0,
                        _dataReserva.precio_muebles || 0,
                        _total,
                        _dataReservaDB.duracion_estancia || 0,
                        _dataReservaDB.edad_min || 0,
                        _dataReservaDB.edad_max || 0,
                        _dataReservaDB.mascota || false,
                        _dataReservaDB.observacion || '',
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB,
                        _dataReservaDB.precio_limite || 0,
                    ]
                }
                await client.query(queryDataVarReserva)
            }

            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Actualiza la informacion comercial del piso. Solo [precio_alquiler, total (daño colareral)]
     * [NO TOCAR]
     * @param id 
     * @param data 
     * @returns 
     */
    async updateByPrecioMueble(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                    name: 'update-info-piso-comercial-precio-mueble',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
                        fecha_ultimo_cambio = $1,
                        idusuario_ult_cambio = $2
                        WHERE id = $3 AND idpiso = $4 RETURNING *`,
                    values: [
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)
            
            // Datos de la reserva
            let _dataReserva = data.variablesreserva[0]

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

            // Cambiar el estado a todas las reservas posteriores
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

            // Verifica si hay información previa
            if ( !_dataReservaDB ) { // Inserta desde cero
                let queryDataVarReserva = {
                    name: 'insert-variables-reserva-new',
                    text: `INSERT INTO ${Constants.tbl_variables_reserva_rmg_sql}( 
                        precio_muebles,
                        total,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idinfopisocom
                        )
                        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
                    values: [
                        _dataReserva.precio_muebles || 0,
                        _dataReserva.precio_muebles || 0,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB
                    ]
                }
                await client.query(queryDataVarReserva)
            } else { // Inserta el registro apartir de la ultima reserva
                let _total: number = parseFloat( ((_dataReserva.precio_muebles || 0.00) + (_dataReservaDB.precio_alquiler || 0.00)).toFixed(2) )
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
                        precio_limite
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
                    values: [
                        _dataReservaDB.aplica || '',
                        _dataReservaDB.fecha_inicio_vigencia || null,
                        _dataReservaDB.precio_base || 0,
                        _dataReservaDB.porcentaje_descuento || 0,
                        _dataReservaDB.precio_alquiler || 0,
                        _dataReserva.precio_muebles || 0,
                        _total,
                        _dataReservaDB.duracion_estancia || 0,
                        _dataReservaDB.edad_min || 0,
                        _dataReservaDB.edad_max || 0,
                        _dataReservaDB.mascota || false,
                        _dataReservaDB.observacion || '',
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB,
                        _dataReservaDB.precio_limite
                    ]
                }
                await client.query(queryDataVarReserva)
            }
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Crea la información de la plataforma. Solo se considera el campo [precio_limite]
     * @param data 
     * @returns 
     */
    async insertByPrecioLimite(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

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
                    data.idpiso
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
                            data.estado_general,
                            timeStampCurrent, 
                            timeStampCurrent, 
                            this.idUserLogin, 
                            data.idpiso
                        ]
                }

                lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            }

            // Objeto del piso comercial existente o nuevo
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)
            
            // Datos de la reserva
            let _dataReserva = data.variablesreserva[0]

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
                        idinfopisocom
                        )
                        VALUES($1,$2,$3,$4,$5) RETURNING *`,
                    values: [
                        _dataReserva.precio_limite || 0,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB
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
                        precio_limite
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
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
                        _dataReserva.precio_limite || 0,
                    ]
                }
                await client.query(queryDataVarReserva)
            }

            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    /**
     * Actualiza la informacion comercial del piso. Solo [precio_alquiler, total (daño colareral)]
     * [NO TOCAR]
     * @param id 
     * @param data 
     * @returns 
     */
    async updateByPrecioLimite(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                    name: 'update-info-piso-comercial-precio-limite',
                    text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
                        fecha_ultimo_cambio = $1,
                        idusuario_ult_cambio = $2
                        WHERE id = $3 AND idpiso = $4 RETURNING *`,
                    values: [
                        timeStampCurrent, 
                        this.idUserLogin, 
                        data.id,
                        data.idpiso
                    ]
            }

            let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
            let dataDB = lDataDB[0] as IInfoPisoComercial
            let idDataDB = dataDB.id || BigInt(0)
            
            // Datos de la reserva
            let _dataReserva = data.variablesreserva[0]

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

            // Cambiar el estado a todas las reservas posteriores
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

            // Verifica si hay información previa
            if ( !_dataReservaDB ) { // Inserta desde cero
                let queryDataVarReserva = {
                    name: 'insert-variables-reserva-new',
                    text: `INSERT INTO ${Constants.tbl_variables_reserva_rmg_sql}( 
                        precio_limite,
                        fecha_creacion,
                        fecha_ultimo_cambio,
                        idusuario_ult_cambio,
                        idinfopisocom
                        )
                        VALUES($1,$2,$3,$4,$5) RETURNING *`,
                    values: [
                        _dataReserva.precio_limite,
                        timeStampCurrent, 
                        timeStampCurrent, 
                        this.idUserLogin, 
                        idDataDB
                    ]
                }
                await client.query(queryDataVarReserva)
            } else { // Inserta el registro apartir de la ultima reserva
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
                        precio_limite
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
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
                        _dataReserva.precio_limite || 0,
                    ]
                }
                await client.query(queryDataVarReserva)
            }
            
            return lDataDB
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        return dataResponse
    }

    async getAllPisoPagination(): Promise<Array<IInfoPisoComercial> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }
        const _search_all = this.infoExtra!.filter!.search_all || ''
        const _nro_habitaciones = isNaN(parseInt(this.infoExtra!.filter!.nro_habitaciones)) ? -1 : parseInt(this.infoExtra!.filter!.nro_habitaciones)
        const _capacidad_maxima = isNaN(parseInt(this.infoExtra!.filter!.capacidad_maxima)) ? -1 : parseInt(this.infoExtra!.filter!.capacidad_maxima)
        const _nro_camas = isNaN(parseInt(this.infoExtra!.filter!.nro_camas)) ? -1 : parseInt(this.infoExtra!.filter!.nro_camas)
        const _nro_banios = isNaN(parseInt(this.infoExtra!.filter!.nro_banios)) ? -1 : parseInt(this.infoExtra!.filter!.nro_banios)
        const _total = isNaN(parseFloat(this.infoExtra!.filter!.total)) ? -1 : parseFloat(this.infoExtra!.filter!.total)
        const _estado_general = isNaN(parseInt(this.infoExtra!.filter!.estado_general)) ? -2 : parseInt(this.infoExtra!.filter!.estado_general)

        let _total_start = isNaN(parseFloat(this.infoExtra!.filter!.total_start)) ? 0 : parseFloat(this.infoExtra!.filter!.total_start)
        let _total_end = isNaN(parseFloat(this.infoExtra!.filter!.total_end)) ? 10000000 : parseFloat(this.infoExtra!.filter!.total_end)

        let limit = this.infoExtra.filter.limit || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1

        _total_start = _total_start > -1 ? _total_start : 0
        _total_end = _total_end > -1 ? _total_end : 10000000

        
        const queryData  = {
                name: 'get-all-info-piso-comercial',
                text: ` SELECT pf.*,
                        ipd.cp_ocupacion_maxima,
                        ipd.cp_m2,
                        ipd.ds_nro_dormitorios,
                        ipd.ds_nro_camas,
                        ipd.bs_nro_banios,
                        ipd.ca_aire_acondicionado,
                        ipd.ca_calefaccion,
                        ipd.cp_ascensor,
                        ipd.ca_discapacidad,
                        ipd.ds_descripcion_camas,
                        ipd.bs_nro_aseos,
                        ipd.bs_descripcion_banios,
                        ipd.ds_descripcion_sofacama,
                        ipd.ds_nro_sofacama,

                        (
                         CASE
                            WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = true THEN 'Si'
                            WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = false THEN 'No'
                            WHEN ipd.id is NULL and pf.aire_acondicionado = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.aire_acondicionado = false THEN 'No'
                         END
                     ) as lbl_aire_acondicionado,
                     (
                         CASE
                            WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = true THEN 'Si'
                            WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = false THEN 'No'
                            WHEN ipd.id is NULL and pf.calefaccion = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.calefaccion = false THEN 'No'
                         END
                     ) as lbl_calefaccion,
                     (
                         CASE
                            WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = true THEN 'Si'
                            WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = false THEN 'No'
                            WHEN ipd.id is NULL and pf.ascensor= true THEN 'Si'
                            WHEN ipd.id is NULL and pf.ascensor = false THEN 'No'
                         END
                     ) as lbl_ascensor,
                     (
                         CASE
                            WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = true THEN 'Si'
                            WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = false THEN 'No'
                            WHEN ipd.id is NULL and pf.discapacidad = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.discapacidad = false THEN 'No'
                         END
                     ) as lbl_discapacidad
                 FROM (
                 SELECT ipc.id, ipc.estado_general, 
                 p.etiqueta AS a_etiqueta, p.id as idpiso, plfc.plataformas,
                 COALESCE(vc.variablesreserva, '[]') as variablesreserva,
                 p.ciudad as a_localidad, p.codigo_postal as a_codigo_postal, 
                 (p.direccion || ', Nro ' || p.nro_edificio || ', ' || p.nro_piso) as a_full_direccion, p.ubicacion_mapa,
                 vc.total_str,p.ocupacion_maxima, p.m2, p.nro_dormitorios, p.nro_camas, p.nro_banios, p.nro_sofacama,
                 p.etiqueta, p.discapacidad , p.ascensor , p.calefaccion , p.aire_acondicionado
                 FROM ${Constants.tbl_piso_sql} p
                 LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON p.id = ipd.id
                 LEFT JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (p.id = ipc.idpiso)
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
                     FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                     RIGHT JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso)
                     LEFT JOIN ${Constants.tbl_plataforma_comercial_rmg_sql} pc ON (pc.estado = 1)
                     LEFT JOIN ${Constants.tbl_plataforma_infopiso_rmg_sql} pi ON (pc.id = pi.idplataformacom AND pi.estado = 1 AND ipc.id = pi.idinfopisocom)
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
                     LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.idpiso = ipd.id
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
                 LIMIT $10 OFFSET $11
                    `,
                values: [   this.filterStatus,
                            _search_all === '' ? '' : `%${_search_all}%`,
                            _nro_habitaciones,
                            _capacidad_maxima,
                            _nro_camas,
                            _nro_banios,
                            _total_start,
                            _total_end,
                            _estado_general,
                            limit,
                            offset
                        ]
        }

        // UNACCENT(lower( replace(trim(vc.total_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
        // CAST(COALESCE(vc.total_str, '0') as double precision) = $7 OR
        // CAST(COALESCE(vc.total_str, '0') as double precision)::integer = ($7)::integer OR 
        // $7 = -1

        let lData: Array<IInfoPisoComercial | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IInfoPisoComercial | IErrorResponse>
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IInfoPisoComercial>
    }
}

export default InfoPisoComercialDataAccess