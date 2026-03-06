import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import Constants from "../helpers/Constants"
import UtilInstance from "../helpers/Util"
import { IModel } from "../helpers/IModel"
import { IGrupoPropietario } from "../models/IGrupoPropietario"
import { ILead } from "../models/ILead"
import { ISucesoPropietario } from "../models/ISucesoPropietario"
import { IHistoricoLead } from "../models/IHistoricoLead"

class GrupoPropietarioDataAccess implements IDataAccess<IGrupoPropietario> {
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
     * @returns 
     */
    async get(): Promise<IErrorResponse | Array<IGrupoPropietario>> {
        if ( !this.infoExtra ) this.infoExtra = {}
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }
        
        const _search_all = this.infoExtra!.filter?.search_all || ''

        const queryData  = {
            name: 'get-grupo-propietario',
            text: ` SELECT gp.*
                    FROM (
                        SELECT gp.*, 
                        COALESCE(dpro.telefonos_str,'') as telefonos_usu, COALESCE(dpro.nombres_str,'') as nombres_usu,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( gp.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                        COALESCE(gp.next_step,date('2992-09-02')) as next_step_order
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
                    ORDER BY gp.next_step_order ASC, gp.nombre ASC
                    `,
            values: [
                        this.filterStatus,
                        _search_all === '' ? '' : `%${_search_all}%`
                    ]
        }

        // UNACCENT(lower( replace(trim(tlf.telefonos_str),' ','') )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR 
        // UNACCENT(lower( replace(trim(l.nombre_completo),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR
        // UNACCENT(lower( replace(trim(l.comentario_historico),' ','')  )) LIKE UNACCENT(lower( replace(trim($6),' ','') )) OR

        // replace(trim(COALESCE(dpre.telefonos_str,'')),' ','')

        let lData: Array<IGrupoPropietario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IGrupoPropietario | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IGrupoPropietario>
    }

    async getById(id: BigInt): Promise<IGrupoPropietario | IErrorResponse> {
        const queryData = {
            name: 'get-grupo-propietario-x-id',
            text: `
                    SELECT gp.*,
                    (CASE
                            WHEN count(gup.*) > 0 THEN jsonb_agg(json_build_object('id', gup.id, 
                                                                                'nombre_completo', trim(gup.nombre_completo),
                                                                                'telefono', COALESCE(trim(gup.telefono), ''),
                                                                                'email', trim(gup.email)
                                                                                ))
                            WHEN count(gup.*) = 0 THEN '[]'
                    END) AS propietarios
                    FROM ${Constants.tbl_grupo_propietario_dn_sql} gp
                    LEFT JOIN (
                            SELECT pre.idgrupo, u.id, u.nombre_completo, u.telefono, u.email
                            FROM ${Constants.tbl_propietario_dn_sql} pre
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

        let lData: Array<IGrupoPropietario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IGrupoPropietario | IErrorResponse>

        return lData[0]
    }

    /**
     * No hay insercción. El grupo se crea apartir del Lead
     * @param data 
     * @returns 
     */
    async insert(data: IGrupoPropietario): Promise<IGrupoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Actuliza información del grupo, agrega suceso y permite traspasar prescriptores a leads
     * @param id 
     * @param data 
     * @returns 
     */
    async update(id: BigInt, data: IGrupoPropietario): Promise<IGrupoPropietario | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let queryData ={
                name: 'get-group-by-id',
                text: ` SELECT gp.*
                        FROM ${Constants.tbl_grupo_propietario_dn_sql} gp
                        WHERE gp.id =$1 LIMIT 1
                        `,
                values: [ id ]
            }

            let lData = (await client.query(queryData)).rows as Array<IGrupoPropietario | IErrorResponse>
            let _dataDB = lData[0] as IGrupoPropietario

            const _uuidSuceso = `hspro-${UtilInstance.getUUID()}`

            let _total_nro_llamadas = _dataDB.nro_llamadas! + (((data.comentario_suceso||'').trim() !== '') ? 1 : 0)

            let queryDataUpdateGP = {
                name: 'update-group-propietario',
                text: `UPDATE ${Constants.tbl_grupo_propietario_dn_sql} SET
                        nombre = $1,
                        whatsapp = $2,
                        nro_llamadas = $3,
                        fecha_ultimo_cambio = $4,
                        next_step = $5,
                        administrador = $6,
                        presidente = $7,
                        vecinos = $8,
                        portero = $9,
                        otros = $10,
                        acceso_intranet = $11
                        WHERE id = $12 RETURNING *`,
                values: [   data.nombre!,
                            data.whatsapp!,
                            _total_nro_llamadas,
                            timeStampCurrent,
                            data.next_step,
                            data.administrador?.trim(),
                            data.presidente?.trim(),
                            data.vecinos?.trim(),
                            data.portero?.trim(),
                            data.otros?.trim(),
                            data.acceso_intranet?.trim(),
                            id
                            ]
            }
            await client.query(queryDataUpdateGP)

            //insert suceso propietario
            let queryInsertSuceso = {
                name: 'insert-suceso-propietario-dn',
                text: `INSERT INTO ${Constants.tbl_suceso_propietario_dn_sql} (
                          comentario,
                          data,
                          fecha_creacion,
                          idusuario,
                          idgrupo,
                          ref_suceso,
                          next_step )
                       VALUES( $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                values: [   data.comentario_suceso,
                            _dataDB || {},
                            timeStampCurrent,
                            this.idUserLogin,
                            id,
                            _uuidSuceso,
                            data.next_step
                        ]
            }
            await client.query(queryInsertSuceso)

            // Actualización de datos de usuario de todos los prescriptores
            // No se actualiza la información de los leads, solo información del USUARIO
            // PENDIENTE ACTUALIZAR INFORMACION EN LEAD
            if ( data.propietarios && data.propietarios!.length !== 0){
                for (let _i = 0; _i < data.propietarios!.length; _i++){
                    const queryUpdateUserData = {
                        name: 'update-user',
                        text: ` UPDATE ${Constants.tbl_usuario_sql} SET
                                nombre_completo = $1,
                                telefono = $2,
                                email = $3
                                WHERE id = $4 RETURNING *`,
                        values: [   data.propietarios![_i].nombre_completo,
                                    data.propietarios![_i].telefono,
                                    data.propietarios![_i].email,
                                    data.propietarios![_i].id
                                ]
                    }
                    await client.query(queryUpdateUserData)
                }
            }

            //Mover propietarios a Leads
            if ( data.propietarios_to_lead && data.propietarios_to_lead!.length !== 0){
                for ( let _i = 0; _i < data.propietarios_to_lead!.length; _i++){
                    const queryGetUserData = {
                        name: 'get-user-x-lead',
                        text: ` SELECT l.*
                                FROM ${Constants.tbl_usuario_sql} u
                                INNER JOIN ${Constants.tbl_lead_dn_sql} l ON (l.lead_id LIKE u.ref_lead)
                                WHERE u.id = $1`,
                        values: [ BigInt(data.propietarios_to_lead![_i])]
                    }
                    let lDataLead = (await client.query(queryGetUserData)).rows as Array<ILead | IErrorResponse>
                    
                    if ( lDataLead.length !== 0 ) {
                        const _dataLead = { ...lDataLead[0] } as ILead

                        //Delete el propietarop del grupo
                        const queryDeletePropietarioOfGrupo = {
                            name: 'delete-propietario-grupo',
                            text: ` DELETE FROM ${Constants.tbl_propietario_dn_sql}
                                    WHERE idusuario = $1 AND idgrupo = $2 RETURNING *`,
                            values: [ data.propietarios_to_lead![_i], id]
                        }
                        await client.query(queryDeletePropietarioOfGrupo)

                        //Activar el Lead
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
                        // ******** GET HISTORIAL SUCESO PROPIETARIO *************
                        //  Consultamos el historial previo del Suceso para migrarlo al LEAD
                        const queryGetHistorialXGrupo = {
                            name: 'get-historial-x-lead',
                            text: ` SELECT sp.comentario, sp.fecha_creacion, sp.idusuario, sp.ref_historico_lead, sp.ref_suceso
                                    FROM ${Constants.tbl_suceso_propietario_dn_sql} sp
                                    WHERE sp.idgrupo = $1 AND 
                                    COALESCE((sp.ref_suceso), '') <> '' AND
                                    COALESCE((sp.ref_historico_lead), '') LIKE ''
                                    ORDER BY sp.fecha_creacion ASC`,
                            values: [ id ]
                        }
                        let _dataHistorySuceso = (await client.query(queryGetHistorialXGrupo)).rows as Array<ISucesoPropietario>


                        // consultamos el HISTORIAL LEAD del usuario que se regresa al LEAD
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
                                        'Propietario-to-Lead',
                                        _dataLead.name_categoria,
                                        _dataHistorySuceso[i].ref_suceso
                                ]
                            }
                            await client.query(queryDataHL)
                        }
                    } else {
                        //Lanzar Error
                        break
                    }
                }
            }

            // pendiente actualizar los LEADS y regresóde propietario a LEAD
            return lData
        })

        if ( ({ ...responseD[0] } as IErrorResponse).error) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IGrupoPropietario
        
        return dataResponse
    }

    delete(id: BigInt): Promise<IGrupoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Eliminar un grupo de propietarios. Automaticamente regresan los Leads y se activba para futuras llamadas
     * @param id 
     * @param data 
     * @returns 
     */
    async updateDelete(id: BigInt, data: IGrupoPropietario): Promise<IGrupoPropietario | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let queryData ={
                name: 'get-group-by-id',
                text: ` SELECT gp.*
                        FROM ${Constants.tbl_grupo_propietario_dn_sql} gp
                        WHERE gp.id =$1 LIMIT 1
                        `,
                values: [ id ]
            }

            let lData = (await client.query(queryData)).rows as Array<IGrupoPropietario | IErrorResponse>
            let _dataDB = lData[0] as IGrupoPropietario

            const _uuidSuceso = `hspro-${UtilInstance.getUUID()}`

            let _total_nro_llamadas = _dataDB.nro_llamadas! + 1

            // actualiza información adicional del grupo si se da el caso de eliminación
            let queryDataUpdateGP = {
                name: 'update-group-propietario',
                text: `UPDATE ${Constants.tbl_grupo_propietario_dn_sql} SET
                        nombre = $1,
                        whatsapp = $2,
                        estado = $3,
                        nro_llamadas = $4,
                        fecha_ultimo_cambio = $5,
                        next_step = $6,
                        administrador = $7,
                        presidente = $8,
                        vecinos = $9,
                        portero = $10,
                        otros = $11,
                        acceso_intranet = $12
                        WHERE id = $13 RETURNING *`,
                values: [   `${data.nombre!}_old_${timeStampCurrent}`,
                            data.whatsapp!,
                            -1,
                            _total_nro_llamadas,
                            timeStampCurrent,
                            data.next_step,
                            data.administrador?.trim(),
                            data.presidente?.trim(),
                            data.vecinos?.trim(),
                            data.portero?.trim(),
                            data.acceso_intranet?.trim(),
                            id
                            ]
            }
            await client.query(queryDataUpdateGP)

            //insert suceso propietario
            let queryInsertSuceso = {
                name: 'insert-suceso-propietario-dn',
                text: `INSERT INTO ${Constants.tbl_suceso_propietario_dn_sql} (
                          comentario,
                          data,
                          fecha_creacion,
                          idusuario,
                          idgrupo,
                          ref_suceso,
                          next_step)
                       VALUES( $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                values: [   data.comentario_suceso,
                            _dataDB || {},
                            timeStampCurrent,
                            this.idUserLogin,
                            id,
                            _uuidSuceso,
                            data.next_step
                        ]
            }
            await client.query(queryInsertSuceso)

            // Actualización de datos de usuario de todos los prescriptores
            // No se actualiza la información de los leads, solo información del USUARIO
            // PENDIENTE ACTUALIZAR INFORMACION EN LEAD
            if ( data.propietarios && data.propietarios!.length !== 0){
                for (let _i = 0; _i < data.propietarios!.length; _i++){
                    const queryUpdateUserData = {
                        name: 'update-user',
                        text: ` UPDATE ${Constants.tbl_usuario_sql} SET
                                nombre_completo = $1,
                                telefono = $2,
                                email = $3
                                WHERE id = $4 RETURNING *`,
                        values: [   data.propietarios![_i].nombre_completo,
                                    data.propietarios![_i].telefono,
                                    data.propietarios![_i].email,
                                    data.propietarios![_i].id
                                ]
                    }
                    await client.query(queryUpdateUserData)
                }
            }

            //Mover propietarios a Leads
            if ( data.propietarios && data.propietarios!.length !== 0) {
                for ( let _i = 0; _i < data.propietarios!.length; _i++){
                    const queryGetUserData = {
                        name: 'get-user-x-lead',
                        text: ` SELECT l.*
                                FROM ${Constants.tbl_usuario_sql} u
                                INNER JOIN ${Constants.tbl_lead_dn_sql} l ON (l.lead_id LIKE u.ref_lead)
                                WHERE u.id = $1`,
                        values: [data.propietarios![_i].id]
                    }
                    let lDataLead = (await client.query(queryGetUserData)).rows as Array<ILead | IErrorResponse>
                    
                    if ( lDataLead.length !== 0 ) {
                        const _dataLead = { ...lDataLead[0] } as ILead

                        //Delete el propietarop del grupo
                        const queryDeletePropietarioOfGrupo = {
                            name: 'delete-propietario-grupo',
                            text: ` DELETE FROM ${Constants.tbl_propietario_dn_sql}
                                    WHERE idusuario = $1 AND idgrupo = $2 RETURNING *`,
                            values: [ data.propietarios![_i].id, id]
                        }
                        await client.query(queryDeletePropietarioOfGrupo)

                        //Activar el Lead
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
                        // ******** GET HISTORIAL SUCESO PROPIETARIO *************
                        //  Consultamos el historial previo del Suceso para migrarlo al LEAD
                        const queryGetHistorialXGrupo = {
                            name: 'get-historial-x-lead',
                            text: ` SELECT sp.comentario, sp.fecha_creacion, sp.idusuario, sp.ref_historico_lead, sp.ref_suceso
                                    FROM ${Constants.tbl_suceso_propietario_dn_sql} sp
                                    WHERE sp.idgrupo = $1 AND 
                                    COALESCE((sp.ref_suceso), '') <> '' AND
                                    COALESCE((sp.ref_historico_lead), '') LIKE ''
                                    ORDER BY sp.fecha_creacion ASC`,
                            values: [ id ]
                        }
                        let _dataHistorySuceso = (await client.query(queryGetHistorialXGrupo)).rows as Array<ISucesoPropietario>

                        // consultamos el HISTORIAL LEAD del usuario que se regresa al LEAD
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
                                        'Propietario-to-Lead',
                                        _dataLead.name_categoria,
                                        _dataHistorySuceso[i].ref_suceso
                                ]
                            }
                            await client.query(queryDataHL)
                        }
                    } else {
                        //Lanzar Error
                        break
                    }
                }
            }

            // pendiente actualizar los LEADS y regresóde propietario a LEAD
            return lData
        })

        if ( ({ ...responseD[0] } as IErrorResponse).error) return responseD[0] as IErrorResponse

        const dataResponse = { ...responseD[0] } as IGrupoPropietario
        
        return dataResponse
    }

    /**
     * Retornaa todos los registros por paginación
     * @returns 
     */
    async getAllWithPagination(): Promise<Array<IGrupoPropietario> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        // como hay filtros, igual que en totaldata se debe recuperar la info
        //estos parametros son importantes para extraer la información por bloques
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        
        let search_all = this.infoExtra.filter.search_all  || '' // para filtrar

        const queryData  = {
            name: 'get-grupo-propietarios-pagination',
            text: ` SELECT gp.id, gp.nombre, gp.whatsapp, gp.next_step, gp.nro_llamadas
                    FROM (
                        SELECT gp.id, gp.nombre, gp.whatsapp, gp.nro_llamadas,  
                        COALESCE(dpro.telefonos_str,'') as telefonos_usu, COALESCE(dpro.nombres_str,'') as nombres_usu,
                        REPLACE(REPLACE(REPLACE(REPLACE(to_char( gp.next_step, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS next_step,
                        COALESCE(gp.next_step,date('2992-09-02')) as next_step_order
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
                    ORDER BY gp.next_step_order ASC, gp.nombre ASC
                    LIMIT $3 OFFSET $4
                    `,
            values: [
                        1,
                        search_all === '' ? '' : `%${search_all}%`,
                        limit,
                        offset,
                    ]
        }

        let lData: Array<IGrupoPropietario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IGrupoPropietario | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IGrupoPropietario>
    }
}

export default GrupoPropietarioDataAccess