import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import Constants from "../helpers/Constants"
import UtilInstance from "../helpers/Util"
import { IModel } from "../helpers/IModel"
import { IGrupoPrescriptor } from "../models/IGrupoPrescriptor"
import { ILead } from "../models/ILead"
import { ISucesoPrescriptor } from "../models/ISucesoPrescriptor"
import { IHistoricoLead } from "../models/IHistoricoLead"

class GrupoPrescriptorDataAccess implements IDataAccess<IGrupoPrescriptor> {
    public client: DbConnection

    constructor( 
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    /**
     * Filtra los grupos por NOMBRE-GRUPO, NOMBRE PRESCRIPTORES, TELEFONO-PRESCRIPTORES
     * PENDIENTE HACER ESTA PARTE CON PAGINACION
     * @returns 
     */
    async get(): Promise<IErrorResponse | Array<IGrupoPrescriptor>> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }
        
        const _search_all = this.infoExtra!.filter!.search_all || ''

        const queryData  = {
            name: 'get-grupo-prescriptor',
            text: ` 
                    SELECT gp.*
                    FROM (
                        SELECT gp.id,
                        gp.nombre,
                        gp.whatsapp,
                        gp.nro_visitas,
                        gp.nro_reservas,
                        gp.valor_propietario,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( gp.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step, 
                        COALESCE(dpre.telefonos_str,'') as telefonos_usu, COALESCE(dpre.nombres_str, '') as nombres_usu,
                        COALESCE(gp.next_step,date('2999-09-02')) as next_step_order
                        FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                        LEFT JOIN (
                            SELECT pre.idgrupo,
                            STRING_AGG(usu.telefono, ' | ') as telefonos_str,
                            STRING_AGG(usu.nombre_completo, ' | ') as nombres_str,
                            STRING_AGG(usu.email, ' | ') as email_str,
                            STRING_AGG(usu.empresa, ' | ') as empresa_str
                            FROM ${Constants.tbl_prescriptor_dn_sql} pre
                            INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = pre.idusuario)
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
                    ORDER BY gp.next_step_order ASC, gp.nombre ASC
                    `,
            values: [
                        this.filterStatus,
                        _search_all === '' ? '' : `%${_search_all}%`
                    ]
        }

        let lData: Array<IGrupoPrescriptor | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IGrupoPrescriptor | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IGrupoPrescriptor>
    }

    async getById(id: BigInt): Promise<IGrupoPrescriptor | IErrorResponse> {
        const queryData = {
            name: 'get-grupo-prescriptor-x-id',
            text: `
                    SELECT gp.*,
                    (CASE
                            WHEN count(gup.*) > 0 THEN jsonb_agg(json_build_object('id', gup.id, 
                                                                                'nombre_completo', trim(gup.nombre_completo),
                                                                                'telefono', COALESCE(trim(gup.telefono), ''),
                                                                                'email', trim(gup.email),
                                                                                'empresa', COALESCE(trim(gup.empresa), ''),
                                                                                'idcategoria', COALESCE(gup.idcategoria, 0)
                                                                                ))
                            WHEN count(gup.*) = 0 THEN '[]'
                    END) AS prescriptores
                    FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                    LEFT JOIN (
                            SELECT pre.idgrupo, u.id, u.nombre_completo, u.telefono, u.email, u.empresa, u.idcategoria
                            FROM ${Constants.tbl_prescriptor_dn_sql} pre
                            INNER JOIN ${Constants.tbl_usuario_sql} u ON (u.id = pre.idusuario)
                            WHERE pre.idgrupo = $1
                            ORDER BY u.nombre_completo ASC, u.id
                    ) as gup ON (gup.idgrupo = gp.id)
                    WHERE gp.id = $1 AND gp.estado >= $2 AND gp.estado IS NOT NULL
                    GROUP BY gp.id
                    ORDER BY gp.nombre ASC
                   `,
            values: [ id, this.filterStatus ]
        }

        let lData: Array<IGrupoPrescriptor | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IGrupoPrescriptor | IErrorResponse>

        return lData[0]
    }

    /**
     * No hay insercción. El grupo se crea apartir del Lead
     * @param data 
     * @returns 
     */
    async insert(data: IGrupoPrescriptor): Promise<IGrupoPrescriptor | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Actuliza información del grupo, agrega suceso y permite traspasar prescriptores a leads
     * @param id 
     * @param data 
     * @returns 
     */
    async update(id: BigInt, data: IGrupoPrescriptor): Promise<IGrupoPrescriptor | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            // Get grupo a editar
            let queryData  = {
                name: 'get-group-by-id',
                text: ` SELECT gp.*
                        FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                        WHERE gp.id = $1 LIMIT 1
                        `,
                values: [ id ]
            }

            let lData = (await client.query(queryData)).rows as Array<IGrupoPrescriptor | IErrorResponse>
            let _dataDB = lData[0] as IGrupoPrescriptor

            const _uuidSuceso = `hspre-${UtilInstance.getUUID()}`

            const _flagVR = (data.flag_vr && data.flag_vr.toLowerCase()) || ''
            let _total_nro_visitas = _dataDB.nro_visitas
            let _total_nro_reservas = _dataDB.nro_reservas
            let _total_valor_prop = _dataDB.valor_propietario
            let _valor = 0

            if ( _flagVR === 'v' ) {
                _total_nro_visitas = _total_nro_visitas! + data.nro_visitas!
            } else if ( _flagVR === 'r' ) {
                _total_nro_reservas = _total_nro_reservas! + data.nro_reservas!
                _valor = data.valor!
            } else if ( _flagVR === 'p' ) {
                _total_valor_prop = parseInt(_total_valor_prop!.toString()) + parseInt(data.valor_propietario!.toString())
            }

            let queryDataUpdateGP = {
                name: 'update-grupo-prescriptor',
                text: `UPDATE ${Constants.tbl_grupo_prescriptor_dn_sql} SET
                        nombre = $1,
                        whatsapp = $2,
                        nro_visitas = $3,
                        nro_reservas = $4,
                        valor = $5,
                        fecha_ultimo_cambio = $6,
                        valor_propietario = $7,
                        next_step = $8,
                        acceso_intranet = $9
                        WHERE id = $10 RETURNING *`,
                values: [   data.nombre!, 
                            data.whatsapp!,
                            _total_nro_visitas,
                            _total_nro_reservas,
                            _valor,
                            timeStampCurrent,
                            _total_valor_prop,
                            data.next_step,
                            data.acceso_intranet,
                            id
                        ]
            }
            await client.query(queryDataUpdateGP)
            
            // Insert suceso prescriptor
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
                            ref_suceso,
                            valor_propietario,
                            next_step
                            )
                        VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                values: [   data.comentario_suceso, 
                            _dataDB || {},
                            timeStampCurrent, 
                            this.idUserLogin, 
                            id,
                            data.nro_visitas!,
                            data.nro_reservas!,
                            _valor,
                            _flagVR.toUpperCase(),
                            _uuidSuceso,
                            data.valor_propietario,
                            data.next_step
                        ]
            }

            await client.query(queryInsertSuceso)

            // Actualización de datos de usuario de todos los prescriptores
            // No se actualiza la información de los leads, solo información del USUARIO
            // PENDIENTE ACTUALIZAR INFORMACION EN LEAD
            if ( data.prescriptores && data.prescriptores!.length !== 0 ) {
                for ( let _i = 0; _i < data.prescriptores!.length; _i++ ) {
                    const queryUpdateUserData = {
                        name: 'update-user',
                        text: ` UPDATE ${Constants.tbl_usuario_sql} SET
                                nombre_completo = $1,
                                telefono = $2,
                                email = $3,
                                empresa = $4,
                                idcategoria =$5
                                WHERE id = $6 RETURNING *`,
                        values: [   data.prescriptores![_i].nombre_completo, 
                                    data.prescriptores![_i].telefono,
                                    data.prescriptores![_i].email,
                                    data.prescriptores![_i].empresa,
                                    data.prescriptores![_i].idcategoria,
                                    data.prescriptores![_i].id 
                                ]
                    }
                    await client.query(queryUpdateUserData)
                }
            }

            // Mover prescriptores a Leads
            if ( data.prescriptores_to_lead && data.prescriptores_to_lead!.length !== 0 ) {
                for ( let _i = 0; _i < data.prescriptores_to_lead!.length; _i++ ) {
                    const queryGetUserData = {
                        name: 'get-user-x-lead',
                        text: ` SELECT l.*
                                FROM ${Constants.tbl_usuario_sql} u
                                INNER JOIN ${Constants.tbl_lead_dn_sql} l ON (l.lead_id LIKE u.ref_lead)
                                WHERE u.id = $1`,
                        values: [ BigInt(data.prescriptores_to_lead![_i]) ]
                    }
                    let lDataLead = (await client.query(queryGetUserData)).rows as Array<ILead | IErrorResponse>

                    if ( lDataLead.length !== 0 ) {
                        const _dataLead = { ...lDataLead[0] } as ILead

                        // Delete el prescriptor del grupo
                        const queryDeletePrescriptorOfGrupo = {
                            name: 'delete-prescriptor-grupo',
                            text: ` DELETE FROM ${Constants.tbl_prescriptor_dn_sql}
                                    WHERE idusuario = $1 AND idgrupo = $2 RETURNING *`,
                            values: [ data.prescriptores_to_lead![_i], id ]
                        }
                        await client.query(queryDeletePrescriptorOfGrupo)

                        // Activar el Lead
                        const queryUpdateLeadData = {
                            name: 'update-lead-activar',
                            text: ` UPDATE ${Constants.tbl_lead_dn_sql} SET
                                    estatus = $1,
                                    "timestamp" = $2,
                                    fecha_ult_cambio = $3,
                                    idusuario_ult_cambio = $4
                                    WHERE id = $5 RETURNING *`,
                            values: [
                                        1,
                                        timeStampCurrent,
                                        timeStampCurrent,
                                        this.idUserLogin,
                                        _dataLead.id
                                    ]
                        }
                        await client.query(queryUpdateLeadData)

                        // Insertar historial en sucesos leads [Consultamos el historico de sucesos]
                        // ******** GET HISTORIAL SUCESO *************
                        //  Consultamos el historial previo del Lead para migrarlo al grupo prescriptor/propietario
                        const queryGetHistorialXGrupo = {
                            name: 'get-historial-x-lead',
                            text: ` SELECT sp.comentario, sp.fecha_creacion, sp.idusuario, sp.ref_historico_lead, sp.ref_suceso
                                    FROM ${Constants.tbl_suceso_prescriptor_dn_sql} sp
                                    WHERE sp.idgrupo = $1 AND 
                                    COALESCE((sp.ref_suceso), '') <> '' AND
                                    COALESCE((sp.ref_historico_lead), '') LIKE ''
                                    ORDER BY sp.fecha_creacion ASC`,
                            values: [ id ]
                        }
                        let _dataHistorySuceso = (await client.query(queryGetHistorialXGrupo)).rows as Array<ISucesoPrescriptor>
                        // ********************** FIN HISTORIAL SUCESO *******************


                        // consultamos el historial del usuario que se regresa al LEAD [PENDIENTE MIRAR]
                        let _dataHistoryLead: Array<IHistoricoLead> = []
                        const queryGetHistorialLead = {
                            name: 'get-suceso-historico-x-lead',
                            text: ` SELECT hl.comentario, hl.ref_historico_lead, hl.ref_suceso
                                    FROM ${Constants.tbl_historico_lead_dn_sql} hl
                                    WHERE hl.idlead = $1 AND
                                    COALESCE((hl.ref_suceso), '') <> ''
                                    ORDER BY hl.fecha_creacion ASC`,
                            values: [ _dataLead.id ]
                        }
                        _dataHistoryLead = (await client.query(queryGetHistorialLead)).rows as Array<IHistoricoLead>


                        // Comparar PENDIENTE
                        if ( _dataHistorySuceso.length !== 0 ) {
                            //let _dataRefHistory = (_dataHistorySuceso.map(el => el.ref_historico_lead?.trim())) || []
                            let _dataRefSuceso = (_dataHistoryLead.map(el => el.ref_suceso?.trim())) || []
                            
                            //_dataHistoryLead = _dataHistoryLead.filter( el => !(_dataRefHistory.includes(el.ref_historico_lead?.trim())) )
                            _dataHistorySuceso = _dataHistorySuceso.filter( el => !(_dataRefSuceso.includes(el.ref_suceso?.trim())) )
                        }

                        for (let i = 0; i < _dataHistorySuceso.length; i++) {
                            let _comentario = ((_dataHistorySuceso.length - 1) === i) ? `${_dataHistorySuceso[i].comentario}. [Traspaso de Prescriptor to Lead]`:`${_dataHistorySuceso[i].comentario}`
                            const queryDataHL = {
                                name: 'insert-history-lead',
                                text: `INSERT INTO ${Constants.tbl_historico_lead_dn_sql} ( 
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
                                    ref_suceso
                                    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                                values: [
                                        _dataHistorySuceso[i].fecha_creacion,
                                        _dataLead.next_step,
                                        _dataLead.last_step, 
                                        _dataLead || {}, 
                                        _dataLead.name_tinteresa, 
                                        _dataLead.name_tavance, 
                                        _dataLead.name_tocupacion,
                                        _dataLead.estatus,
                                        _comentario,
                                        _dataLead.id,
                                        this.idUserLogin,
                                        'Prescriptor-to-Lead',
                                        _dataLead.name_categoria,
                                        _dataHistorySuceso[i].ref_suceso
                                ]
                            }
                            await client.query(queryDataHL)
                        }   
                        
                    } else {
                        // Lanzar un error
                        break
                    }
                }
            }

            // Quedaria pendiente actualizacion de los LEADs y funcionalidad de regreso del prescriptor al LEAD

            return lData
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IGrupoPrescriptor

        return dataResponse
    }


    /**
     * Cambia de estado el grupo y envia todos los prescriptores al Lead
     * @param id 
     * @param data 
     * @returns 
     */
    async updateDelete(id: BigInt, data: IGrupoPrescriptor): Promise<IGrupoPrescriptor | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            // Get grupo a editar
            let queryData  = {
                name: 'get-group-by-id',
                text: ` SELECT gp.*
                        FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                        WHERE gp.id = $1 LIMIT 1
                        `,
                values: [ id ]
            }

            let lData = (await client.query(queryData)).rows as Array<IGrupoPrescriptor | IErrorResponse>
            let _dataDB = lData[0] as IGrupoPrescriptor

            const _uuidSuceso = `hspre-${UtilInstance.getUUID()}`

            const _flagVR = (data.flag_vr && data.flag_vr.toLowerCase()) || ''
            let _total_nro_visitas = _dataDB.nro_visitas
            let _total_nro_reservas = _dataDB.nro_reservas
            let _total_valor_prop = _dataDB.valor_propietario
            let _valor = 0

            if ( _flagVR === 'v' ) {
                _total_nro_visitas = parseInt(_total_nro_visitas!.toString()) + parseInt(data.nro_visitas!.toString())
            } else if ( _flagVR === 'r' ) {
                _total_nro_reservas = parseInt(_total_nro_reservas!.toString()) + parseInt(data.nro_reservas!.toString())
                _valor = data.valor!
            } else if ( _flagVR === 'p' ) {
                _total_valor_prop = parseInt(_total_valor_prop!.toString()) + parseInt(data.valor_propietario!.toString())
            }

            let queryDataUpdateGP = {
                name: 'update-grupo-prescriptor',
                text: `UPDATE ${Constants.tbl_grupo_prescriptor_dn_sql} SET
                        nombre = $1,
                        whatsapp = $2,
                        estado = $3,
                        fecha_ultimo_cambio = $4,
                        next_step = $5,
                        acceso_intranet = $6
                        WHERE id = $7 RETURNING *`,
                values: [   `${data.nombre!}_old_${timeStampCurrent}`, 
                            data.whatsapp!,
                            -1,
                            timeStampCurrent,
                            data.next_step,
                            data.acceso_intranet,
                            id
                        ]
            }
            await client.query(queryDataUpdateGP)
            
            // Insert suceso prescriptor
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
                            ref_suceso,
                            valor_propietario,
                            next_step)
                        VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                values: [   data.comentario_suceso, 
                            _dataDB || {},
                            timeStampCurrent, 
                            this.idUserLogin, 
                            id,
                            _total_nro_visitas,
                            _total_nro_reservas,
                            _valor,
                            _flagVR,
                            _uuidSuceso,
                            _total_valor_prop,
                            data.next_step
                        ]
            }

            await client.query(queryInsertSuceso)

            // Actualización de datos de usuario de todos los prescriptores
            // No se actualiza la información de los leads, solo información del USUARIO
            // PENDIENTE ACTUALIZAR INFORMACION EN LEAD
            if ( data.prescriptores && data.prescriptores!.length !== 0 ) {
                for ( let _i = 0; _i < data.prescriptores!.length; _i++ ) {
                    const queryUpdateUserData = {
                        name: 'update-user',
                        text: ` UPDATE ${Constants.tbl_usuario_sql} SET
                                nombre_completo = $1,
                                telefono = $2,
                                email = $3,
                                empresa = $4,
                                idcategoria =$5
                                WHERE id = $6 RETURNING *`,
                        values: [   data.prescriptores![_i].nombre_completo, 
                                    data.prescriptores![_i].telefono,
                                    data.prescriptores![_i].email,
                                    data.prescriptores![_i].empresa,
                                    data.prescriptores![_i].idcategoria,
                                    data.prescriptores![_i].id 
                                ]
                    }
                    await client.query(queryUpdateUserData)
                }
            }

            // Mover todos los prescriptores al LEADs
            if ( data.prescriptores && data.prescriptores!.length !== 0 ) {
                for ( let _i = 0; _i < data.prescriptores!.length; _i++ ) {
                    const queryGetUserData = {
                        name: 'get-user-x-lead',
                        text: ` SELECT l.*
                                FROM ${Constants.tbl_usuario_sql} u
                                INNER JOIN ${Constants.tbl_lead_dn_sql} l ON (l.lead_id LIKE u.ref_lead)
                                WHERE u.id = $1`,
                        values: [ data.prescriptores![_i].id ]
                    }
                    let lDataLead = (await client.query(queryGetUserData)).rows as Array<ILead | IErrorResponse>

                    if ( lDataLead.length !== 0 ) {
                        const _dataLead = { ...lDataLead[0] } as ILead

                        // Delete el prescriptor del grupo
                        const queryDeletePrescriptorOfGrupo = {
                            name: 'delete-prescriptor-grupo',
                            text: ` DELETE FROM ${Constants.tbl_prescriptor_dn_sql}
                                    WHERE idusuario = $1 AND idgrupo = $2 RETURNING *`,
                            values: [ data.prescriptores![_i].id, id ]
                        }
                        await client.query(queryDeletePrescriptorOfGrupo)

                        // Activar el Lead
                        const queryUpdateLeadData = {
                            name: 'update-lead-activar',
                            text: ` UPDATE ${Constants.tbl_lead_dn_sql} SET
                                    estatus = $1,
                                    "timestamp" = $2,
                                    fecha_ult_cambio = $3,
                                    idusuario_ult_cambio = $4
                                    WHERE id = $5 RETURNING *`,
                            values: [
                                        1,
                                        timeStampCurrent,
                                        timeStampCurrent,
                                        this.idUserLogin,
                                        _dataLead.id
                                    ]
                        }
                        await client.query(queryUpdateLeadData)

                        // Insertar historial en sucesos leads [Consultamos el historico de sucesos]
                        // ******** GET HISTORIAL SUCESO *************
                        //  Consultamos el historial previo del Lead para migrarlo al grupo prescriptor/propietario
                        const queryGetHistorialXGrupo = {
                            name: 'get-historial-x-lead',
                            text: ` SELECT sp.comentario, sp.fecha_creacion, sp.idusuario, sp.ref_historico_lead, sp.ref_suceso
                                    FROM ${Constants.tbl_suceso_prescriptor_dn_sql} sp
                                    WHERE sp.idgrupo = $1 AND 
                                    COALESCE((sp.ref_suceso), '') <> '' AND
                                    COALESCE((sp.ref_historico_lead), '') LIKE ''
                                    ORDER BY sp.fecha_creacion ASC`,
                            values: [ id ]
                        }
                        let _dataHistorySuceso = (await client.query(queryGetHistorialXGrupo)).rows as Array<ISucesoPrescriptor>


                        // consultamos el historial del usuario que se regresa al LEAD [PENDIENTE MIRAR]
                        let _dataHistoryLead: Array<IHistoricoLead> = []
                        const queryGetHistorialLead = {
                            name: 'get-suceso-historico-x-lead',
                            text: ` SELECT hl.comentario, hl.ref_historico_lead, hl.ref_suceso
                                    FROM ${Constants.tbl_historico_lead_dn_sql} hl
                                    WHERE hl.idlead = $1 AND
                                    COALESCE((hl.ref_suceso), '') <> ''
                                    ORDER BY hl.fecha_creacion ASC`,
                            values: [ _dataLead.id ]
                        }
                        _dataHistoryLead = (await client.query(queryGetHistorialLead)).rows as Array<IHistoricoLead>


                        // Comparar PENDIENTE
                        if ( _dataHistorySuceso.length !== 0 ) {
                            let _dataRefSuceso = (_dataHistoryLead.map(el => el.ref_suceso?.trim())) || []
                            
                            _dataHistorySuceso = _dataHistorySuceso.filter( el => !(_dataRefSuceso.includes(el.ref_suceso?.trim())) )
                        }

                        for (let i = 0; i < _dataHistorySuceso.length; i++) {
                            let _comentario = ((_dataHistorySuceso.length - 1) === i) ? `${_dataHistorySuceso[i].comentario}. [Traspaso de Prescriptor to Lead]`:`${_dataHistorySuceso[i].comentario}`
                            const queryDataHL = {
                                name: 'insert-history-lead',
                                text: `INSERT INTO ${Constants.tbl_historico_lead_dn_sql} ( 
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
                                    ref_suceso
                                    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                                values: [
                                        _dataHistorySuceso[i].fecha_creacion,
                                        _dataLead.next_step,
                                        _dataLead.last_step, 
                                        _dataLead || {}, 
                                        _dataLead.name_tinteresa, 
                                        _dataLead.name_tavance, 
                                        _dataLead.name_tocupacion,
                                        _dataLead.estatus,
                                        _comentario,
                                        _dataLead.id,
                                        this.idUserLogin,
                                        'Prescriptor-to-Lead',
                                        _dataLead.name_categoria,
                                        _dataHistorySuceso[i].ref_suceso
                                ]
                            }
                            await client.query(queryDataHL)
                        }
                    } else {
                        // Lanzar un error
                        break
                    }
                }
            }

            // Quedaria pendiente actualizacion de los LEADs y funcionalidad de regreso del prescriptor al LEAD

            return lData
        })

        // Verifica si es un error
        if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IGrupoPrescriptor

        return dataResponse
    }



    delete(id: BigInt): Promise<IGrupoPrescriptor | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Retorna suceso de solo los usuarios que tiene como rol [ propietario | colaborador ]
     * @param idUser 
     * @returns 
     */
    // async getByUserSuceso(idUser: BigInt): Promise<IErrorResponse | Array<IGrupoPrescriptor>> {
    //     // throw new Error("Method not implemented.")
    //     const queryData  = {
    //         name: 'get-suceso-by-user-suceso',
    //         text: ` SELECT sdn.id,
    //                 sdn.idusu_creacion,
    //                 sdn.idusu_suceso,
    //                 REPLACE(REPLACE(REPLACE(to_char( sdn.fecha_creacion, 'DD/mon/YYYY HH24:MI:SS'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene') AS fecha_creacion,
    //                 sdn.descripcion,
    //                 sdn.estado,
    //                 sdn.idrol,
    //                 COALESCE(usu.nombre_completo, 'Desconocido') AS nombre_usu_creacion
    //                 FROM ${Constants.tbl_suceso_dn_sql} sdn
    //                 LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = sdn.idusu_creacion
    //                 WHERE sdn.idusu_suceso = $1 AND
    //                 sdn.estado >= $2 AND 
    //                 sdn.idrol IN ('propietario', 'colaborador')
    //                 ORDER BY sdn.fecha_creacion DESC
    //                 `,
    //         values: [idUser, this.filterStatus]
    //     }

    //     let lData: Array<IGrupoPrescriptor | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ISucesosDn | IErrorResponse>
        
    //     if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

    //     return lData as Array<ISucesosDn>
    // }

    /**
     * Metodo que retorna los datos con paginación
     * @returns 
     */
    async getAllWithPagination(): Promise<Array<IGrupoPrescriptor> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        // como hay filtros, igual que en totaldata se debe recuperar la info
        //estos parametros son importantes para extraer la información por bloques
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        
        let search_all = this.infoExtra.filter.search_all  || '' // para filtrar

        const queryData  = {
            name: 'get-grupo-prescriptores-pagination',
            text: ` 
                    SELECT gp.id, gp.nombre, gp.whatsapp, gp.nro_visitas, gp.nro_reservas, gp.valor_propietario, gp.next_step
                    FROM (
                        SELECT gp.id,
                        gp.nombre,
                        gp.whatsapp,
                        gp.nro_visitas,
                        gp.nro_reservas,
                        gp.valor_propietario,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( gp.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step, 
                        COALESCE(dpre.telefonos_str,'') as telefonos_usu, COALESCE(dpre.nombres_str, '') as nombres_usu,
                        COALESCE(gp.next_step,date('2999-09-02')) as next_step_order
                        FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                        LEFT JOIN (
                            SELECT pre.idgrupo,
                            STRING_AGG(usu.telefono, ' | ') as telefonos_str,
                            STRING_AGG(usu.nombre_completo, ' | ') as nombres_str,
                            STRING_AGG(usu.email, ' | ') as email_str,
                            STRING_AGG(usu.empresa, ' | ') as empresa_str
                            FROM ${Constants.tbl_prescriptor_dn_sql} pre
                            INNER JOIN ${Constants.tbl_usuario_sql} usu ON (usu.id = pre.idusuario)
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
                    ORDER BY  gp.nro_visitas desc , gp.next_step_order ASC, gp.nombre ASC
                    LIMIT $3 OFFSET $4
                    `,
            values: [
                        1,
                        search_all === '' ? '' : `%${search_all}%`,
                        limit,
                        offset,
                    ]
        }

        let lData: Array<IGrupoPrescriptor | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IGrupoPrescriptor | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IGrupoPrescriptor>
    }
}

export default GrupoPrescriptorDataAccess