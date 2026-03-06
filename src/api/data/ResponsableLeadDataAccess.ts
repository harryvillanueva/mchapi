import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IResponsableLead } from "../models/IResponsableLead"
import UtilInstance from "../helpers/Util"

class ResponsableLeadDataAccess implements IDataAccess<IResponsableLead> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IResponsableLead> | IErrorResponse> {
        const queryData  = {
                name: 'get-responsablelead',
                text: ` SELECT rl.*, (CASE
                                        WHEN count(usu.*) > 0 THEN usu.nombre_completo
                                        ELSE 'Todos'
                                    END) AS responsable,
                        count(l.*) AS nro_leads
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                        LEFT JOIN ${Constants.tbl_lead_dn_sql} l ON (l.idresponsable = rl.id AND l.estatus = 1 )
                        WHERE rl.estado >= $1
                        GROUP BY rl.id, usu.nombre_completo
                        ORDER BY rl.orden ASC
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<IResponsableLead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IResponsableLead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IResponsableLead>
    }

    async getById(id: BigInt): Promise<IResponsableLead | IErrorResponse> {
        const queryData = {
                name: 'get-reponsable-lead-x-id',
                text: `SELECT rl.*, (CASE
                                    WHEN count(usu.*) > 0 THEN usu.nombre || ' ' || usu.apellido
                                    ELSE 'Todos'
                                END) AS responsable 
                        FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                        LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                        WHERE rl.id = $1 AND rl.estado >= $2
                        GROUP BY rl.id, usu.nombre, usu.apellido
                        ORDER BY id ASC`,
                values: [id, this.filterStatus]
        }

        let lData: Array<IResponsableLead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IResponsableLead | IErrorResponse>

        return lData[0]
    }

    async insert(data: IResponsableLead): Promise<IResponsableLead | IErrorResponse> {
        const queryData = {
                name: 'insert-responsable-lead',
                text: `INSERT INTO ${Constants.tbl_responsable_lead_dn_sql}(
                    codigo, 
                    nombre, 
                    observacion, 
                    idusuario_resp,
                    tipo_lead)
                    VALUES($1,$2,$3,$4,$5) RETURNING *`,
                values: [   data.codigo, 
                            data.nombre, 
                            data.observacion, 
                            data.idusuario_resp,
                            data.tipo_lead
                    ]
        }

        let lData: Array<IResponsableLead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IResponsableLead | IErrorResponse>

        return lData[0]
    }

    async update(id: BigInt, data: IResponsableLead): Promise<IResponsableLead | IErrorResponse> {
        const queryData = {
                name: 'update-responsable-lead',
                text: `UPDATE ${Constants.tbl_responsable_lead_dn_sql} SET
                    codigo = $1, 
                    nombre = $2, 
                    observacion = $3, 
                    estado = $4,
                    idusuario_resp = $5,
                    tipo_lead = $6
                    WHERE id = $7 AND estado >= $8 RETURNING *`,
                values: [   data.codigo, 
                            data.nombre, 
                            data.observacion, 
                            data.estado,
                            data.idusuario_resp,
                            data.tipo_lead,
                            id,
                            this.filterStatus
                    ]
        }

        let lData: Array<IResponsableLead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IResponsableLead | IErrorResponse>

        return lData[0]
    }

    async delete(id: BigInt): Promise<IResponsableLead | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getAllWithPagination(): Promise<Array<IResponsableLead> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        let search_all = this.infoExtra.filter.search_all  || ''

        const queryData  = {
            name: 'get-perfiles-DN',
            text: ` 
                    SELECT rl.*, (CASE
                        WHEN count(usu.*) > 0 THEN usu.nombre_completo
                        ELSE 'Todos'
                    END) AS responsable,
                    count(l.*) AS nro_leads
                    FROM ${Constants.tbl_responsable_lead_dn_sql} rl
                    LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = rl.idusuario_resp
                    LEFT JOIN ${Constants.tbl_lead_dn_sql} l ON (l.idresponsable = rl.id AND l.estatus = 1 )
                    WHERE rl.estado >= $1 AND 
                    (
                        UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(rl.codigo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(rl.nombre ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(rl.tipo_lead ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        $2 = ''
                    )
                    GROUP BY rl.id, usu.nombre_completo
                    LIMIT $3 OFFSET $4
                    `,
            values: [
                        this.filterStatus,
                        search_all === '' ? '' : `%${search_all}%`,
                        limit,
                        offset
                    ]
        }

        let lData: Array<IResponsableLead | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IResponsableLead | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IResponsableLead>
    }
}

export default ResponsableLeadDataAccess