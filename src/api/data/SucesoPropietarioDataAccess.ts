import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import Constants from "../helpers/Constants"
import UtilInstance from "../helpers/Util"
import { IModel } from "../helpers/IModel"
import { ISucesoPropietario } from "../models/ISucesoPropietario"

class SucesoPropietarioDataAccess implements IDataAccess<ISucesoPropietario> {
    public client: DbConnection
    
    constructor(      public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.client = new DbConnection(isTransactions)
    }

    get(): Promise<Array<ISucesoPropietario> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getById(id: BigInt): Promise<ISucesoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Inserta suceso y se actualiza información del prescriptor
     * @param data 
     * @returns 
     */

    async insert(data: ISucesoPropietario): Promise<ISucesoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
        // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
        //     const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        //     let _data = data as ISucesosDnUser
            
        //     // Insert suceso
        //     let queryData = {
        //         name: 'insert-suceso-dn',
        //         text: `INSERT INTO ${Constants.tbl_suceso_dn_sql}(
        //                     descripcion, 
        //                     fecha_creacion, 
        //                     idusu_suceso,
        //                     idrol,
        //                     idusu_creacion)
        //                 VALUES($1,$2,$3,$4,$5) RETURNING *`,
        //         values: [   _data.descripcion, 
        //                     timeStampCurrent, 
        //                     _data.idusu_suceso, 
        //                     _data.idrol,
        //                     this.idUserLogin
        //             ]
        //     }
            
        //     let lData: Array<ISucesosDn | IErrorResponse> = (await client.query(queryData)).rows as Array<ISucesosDn | IErrorResponse>

        //     // Actualizar la información del usuario
        //     let _estadoUser = _data.type_action === Constants.code_action_go_back_lead ? 0 : 1

        //     let queryDataUser = {
        //         name: 'update-user-suceso',
        //         text: `UPDATE ${Constants.tbl_usuario_sql} SET
        //                 nombre_completo = $1,
        //                 telefono = $2,
        //                 email = $3,
        //                 estado = $4
        //                 WHERE id = $5 RETURNING *`,
        //         values: [   _data.nombres_suceso!, 
        //                     _data.telefono_suceso!,
        //                     _data.correo_suceso!,
        //                     _estadoUser,
        //                     _data.idusu_suceso ]
        //     }
        //     await client.query(queryDataUser)

        //     // Actualiza la información del lead y agrega el historial
        //     if ( _data.type_action === Constants.code_action_go_back_lead ) {
        //         console.log(`Ingreso: ${Constants.code_action_go_back_lead}: ${_data.ref_lead}`)
        //         let queryData  = {
        //             name: 'get-lead-user',
        //             text: ` SELECT l.*
        //                     FROM ${Constants.tbl_lead_dn_sql} l
        //                     WHERE l.lead_id LIKE $1 limit 1
        //                     `,
        //             values: [ _data.ref_lead || '' ]
        //         }
    
        //         let lData = (await client.query(queryData)).rows as Array<ILead | IErrorResponse>

        //         // console.log(lData)

        //         if ( lData.length !== 0 ) {
        //             let _dataDb = { ...lData[0] } as ILead
        //             // update lead
        //             let queryDataL = {
        //                 name: 'update-lead-suceso',
        //                 text: `UPDATE ${Constants.tbl_lead_dn_sql} SET
        //                         "timestamp" = $1,
        //                         fecha_ult_cambio = $2,
        //                         estatus = $3
        //                         WHERE id = $4 RETURNING *`,
        //                 values: [   timeStampCurrent, 
        //                             timeStampCurrent,
        //                             1,
        //                             _dataDb.id ]
        //             }

        //             await client.query(queryDataL)

        //             // // Agrega el gran historial
        //             // let queryDataHL = {
        //             //     name: 'insert-history-lead',
        //             //     text: `INSERT INTO ${Constants.tbl_historico_lead_dn_sql} ( 
        //             //         fecha_creacion,
        //             //         next_step,
        //             //         last_step,
        //             //         data,
        //             //         interesa,
        //             //         avance,
        //             //         ocupacion,
        //             //         estatus,
        //             //         comentario,
        //             //         idlead,
        //             //         idusuario_resp,
        //             //         tipo_accion,
        //             //         categoria
        //             //         )
        //             //         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        //             //     values: [
        //             //                 timeStampCurrent,
        //             //                 _dataDb.next_step,
        //             //                 _dataDb.last_step, 
        //             //                 _dataDb || {}, 
        //             //                 _dataDb.name_tinteresa, 
        //             //                 _dataDb.name_tavance, 
        //             //                 _dataDb.name_tocupacion,
        //             //                 _dataDb.estatus,
        //             //                 _data.descripcion,
        //             //                 _dataDb.id,
        //             //                 this.idUserLogin,
        //             //                 _dataDb.tipo_accion,
        //             //                 _dataDb.name_categoria
        //             //         ]
        //             // }
        //             // await client.query(queryDataHL)
        //         }
        //     }

        //     // Pendiente actualización información [telefono | correo] en LEADS
            
        //     // // Asocia varios telefonos al Lead
        //     // if ( leadDB && data.telefonos && data.telefonos.length !== 0 ) {
        //     //     for (let i = 0; i < data.telefonos!.length; i++) {
        //     //         const queryData = {
        //     //             name: 'insert-telefono-x-lead',
        //     //             text: `INSERT INTO ${Constants.tbl_telefono_dn_sql} ( numero, fecha_creacion, idlead )
        //     //                     VALUES($1, $2, $3) RETURNING *`,
        //     //             values: [ data.telefonos![i].numero, timeStampCurrent, idLeadDB ]
        //     //         }
        //     //         let respTmp = (await client.query(queryData)).rows as Array<ITelefono | IErrorResponse>
        //     //         if ( (respTmp[0] as IErrorResponse).error ) {
        //     //             lDataLead = respTmp as Array<IErrorResponse>
        //     //             break
        //     //         }
        //     //     }
        //     // }

        //     // // Asocia varios correos al Lead
        //     // if ( leadDB && data.correos && data.correos.length !== 0 ) {
        //     //     for (let i = 0; i < data.correos!.length; i++) {
        //     //         const queryData = {
        //     //             name: 'insert-correo-x-lead',
        //     //             text: `INSERT INTO ${Constants.tbl_correo_dn_sql} ( correo, fecha_creacion, idlead )
        //     //                     VALUES($1, $2, $3) RETURNING *`,
        //     //             values: [ data.correos![i].correo, timeStampCurrent, idLeadDB ]
        //     //         }
        //     //         let respTmp = (await client.query(queryData)).rows as Array<ICorreo | IErrorResponse>
        //     //         if ( (respTmp[0] as IErrorResponse).error ) {
        //     //             lDataLead = respTmp as Array<IErrorResponse>
        //     //             break
        //     //         }
        //     //     }
        //     // }

        //     return lData
        // })

        // // Verifica si es un error
        // if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        // const dataResponse = { ...responseD[0] } as ISucesosDn

        // return dataResponse
    }

    update(id: BigInt, data: ISucesoPropietario): Promise<ISucesoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<ISucesoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    
    /**
     * Retorna suceso de solo los usuarios que tiene como rol [ propietario | colaborador ]
     * @param idUser 
     * @returns 
     */

    async getByGrupoId(idGrupo: BigInt): Promise<IErrorResponse | Array<ISucesoPropietario>> {

        const queryData = {
            name: 'get-suceso-by-grupo',
            text: `
                    SELECT
                        sp.id,
                        sp.idusuario,
                        sp.idgrupo,
                        REPLACE(REPLACE(REPLACE(to_char( sp.fecha_creacion, 'DD/mon/YYYY HH24:MI:SS'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene') AS fecha_creacion,
                        REPLACE(REPLACE(REPLACE(to_char( sp.fecha_creacion, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene') AS fecha_creacion_short,
                        sp.comentario,
                        sp.estado,
                        COALESCE( usu.nombre_completo, 'Desconocido') AS responsable
                    FROM ${Constants.tbl_suceso_propietario_dn_sql} sp
                    LEFT JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = sp.idusuario
                    WHERE   sp.idgrupo = $1 AND
                            sp.estado >= $2 AND
                            trim(COALESCE(sp.comentario,'')) <> ''
                    ORDER BY sp.fecha_creacion DESC
                    `,
            values: [idGrupo, this.filterStatus]
        }
        let lData: Array<ISucesoPropietario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ISucesoPropietario | IErrorResponse>

        if ( ({ ...lData[0]} as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<ISucesoPropietario> 
    }
}

export default SucesoPropietarioDataAccess