import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
// import { IInfoPisoComercial } from "../models/IInfoPisoComercial"
import { IModel } from "../helpers/IModel"
import UtilInstance from "../helpers/Util"
import { IVariablesReserva } from "../models/IVariablesReserva"

class VariablesReservaDataAccess implements IDataAccess<IVariablesReserva> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IVariablesReserva> | IErrorResponse> {
        // const queryData  = {
        //         name: 'get-info-piso-comercial',
        //         text: ` SELECT ipc.*
        //                 FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
        //                 INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso AND p.estado = $1)
        //                 ORDER BY ipc.nombre_comercial ASC
        //                 `,
        //         values: [this.filterStatus]
        // }

        // let lData: Array<IVariablesReserva | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IVariablesReserva | IErrorResponse>
        
        // if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        // return lData as Array<IVariablesReserva>
        throw new Error("Method not implemented.")
    }

    async getById(id: BigInt): Promise<IVariablesReserva | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IVariablesReserva): Promise<IVariablesReserva | IErrorResponse> {
        throw new Error("Method not implemented.")
        // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
        //     // console.log(' --- data init ---')
        //     // console.log(data)
        //     // console.log(' --- data end ---')
        //     const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            
        //     // Insert codigo
        //     let queryData = {
        //             name: 'insert-info-piso-comercial',
        //             text: `INSERT INTO ${Constants.tbl_info_piso_comercial_rmg_sql}( 
        //                 nombre_comercial,
        //                 link_nombre_comercial,
        //                 estado_general,
        //                 link_tour_virtual,
        //                 link_calendario_disponibilidad,
        //                 link_repositorio,
        //                 tiene_anuncio,
        //                 anuncio_usuario,
        //                 anuncio_contrasenia,
        //                 anuncio_plataforma,
        //                 anuncio_link,
        //                 fecha_creacion,
        //                 fecha_ultimo_cambio,
        //                 idusuario_ult_cambio,
        //                 idpiso
        //                 )
        //                 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        //             values: [
        //                 data.nombre_comercial,
        //                 data.link_nombre_comercial, 
        //                 data.estado_general,
        //                 data.link_tour_virtual,
        //                 data.link_calendario_disponibilidad,
        //                 data.link_repositorio,
        //                 data.tiene_anuncio,
        //                 data.anuncio_usuario,
        //                 data.anuncio_contrasenia,
        //                 data.anuncio_plataforma,
        //                 data.anuncio_link,
        //                 timeStampCurrent, 
        //                 timeStampCurrent, 
        //                 this.idUserLogin, 
        //                 data.idpiso
        //             ]
        //     }
        //     let lDataDB = (await client.query(queryData)).rows as Array<IVariablesReserva | IErrorResponse>
        //     let dataDB = lDataDB[0] as IVariablesReserva

        //     let idDataDB = dataDB.id || BigInt(0)
            
        //     // // Asocia varias plataformas al piso
        //     if ( dataDB && data.plataformas && data.plataformas.length !== 0 ) {
        //         for (let i = 0; i < data.plataformas!.length; i++) {
        //             const queryData = {
        //                 name: 'insert-plataforma-x-piso-comercial',
        //                 text: `INSERT INTO ${Constants.tbl_plataforma_infopiso_rmg_sql} ( link, fecha_ultimo_cambio, idinfopisocom, idplataformacom )
        //                         VALUES($1, $2, $3, $4) RETURNING *`,
        //                 values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
        //             }
        //             await client.query(queryData)
        //             // let respTmp = (await client.query(queryData)).rows as Array<ITelefono | IErrorResponse>
        //             // if ( (respTmp[0] as IErrorResponse).error ) {
        //             //     lDataLead = respTmp as Array<IErrorResponse>
        //             //     break
        //             // }
        //         }
        //     }

        //     return lDataDB
        // })

        // // Verifica si es un error
        // if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        // const dataResponse = { ...responseD[0] } as IVariablesReserva

        // return dataResponse
    }

    async update(id: BigInt, data: IVariablesReserva): Promise<IVariablesReserva | IErrorResponse> {
        throw new Error("Method not implemented.")
        // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
        //     const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        //     // Insert codigo
        //     let queryData = {
        //             name: 'update-info-piso-comercial',
        //             text: `UPDATE ${Constants.tbl_info_piso_comercial_rmg_sql} SET 
        //                 nombre_comercial = $1,
        //                 link_nombre_comercial = $2,
        //                 estado_general = $3,
        //                 link_tour_virtual = $4,
        //                 link_calendario_disponibilidad = $5,
        //                 link_repositorio = $6,
        //                 tiene_anuncio = $7,
        //                 anuncio_usuario = $8,
        //                 anuncio_contrasenia = $9,
        //                 anuncio_plataforma = $10,
        //                 anuncio_link = $11,
        //                 fecha_ultimo_cambio = $12,
        //                 idusuario_ult_cambio = $13
        //                 WHERE id = $14 AND idpiso = $15 RETURNING *`,
        //             values: [
        //                 data.nombre_comercial,
        //                 data.link_nombre_comercial, 
        //                 data.estado_general,
        //                 data.link_tour_virtual,
        //                 data.link_calendario_disponibilidad,
        //                 data.link_repositorio,
        //                 data.tiene_anuncio,
        //                 data.anuncio_usuario,
        //                 data.anuncio_contrasenia,
        //                 data.anuncio_plataforma,
        //                 data.anuncio_link,
        //                 timeStampCurrent, 
        //                 this.idUserLogin, 
        //                 data.id,
        //                 data.idpiso
        //             ]
        //     }
        //     // let lDataLead = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>

        //     let lDataDB = (await client.query(queryData)).rows as Array<IInfoPisoComercial | IErrorResponse>
        //     let dataDB = lDataDB[0] as IInfoPisoComercial
        //     let idDataDB = dataDB.id || BigInt(0)

        //     // Delete all plataformas: changes state a -1
        //     queryData = {
        //         name: 'inactivar-plataformas',
        //         text: ` UPDATE ${Constants.tbl_plataforma_infopiso_rmg_sql} SET estado = -1
        //                 WHERE idinfopisocom = $1 AND estado = 1`,
        //         values: [ idDataDB ]
        //     }
        //     await client.query(queryData)

        //     // // Asocia varias plataformas al piso
        //     if ( dataDB && data.plataformas && data.plataformas.length !== 0 ) {
        //         for (let i = 0; i < data.plataformas!.length; i++) {
        //             const queryData = {
        //                 name: 'update-plataforma-x-piso-comercial',
        //                 text: ` UPDATE ${Constants.tbl_plataforma_infopiso_rmg_sql} SET 
        //                             link = $1, 
        //                             fecha_ultimo_cambio = $2,
        //                             estado = 1
        //                         WHERE idinfopisocom = $3 AND idplataformacom = $4 RETURNING *`,
        //                 values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
        //             }
        //             let respTmp = (await client.query(queryData)).rowCount
                    
        //             // Si no actualiza, el registro no existe, por ende inserta
        //             if (respTmp === 0) {
        //                 const queryData = {
        //                     name: 'insert-plataforma-x-piso-comercial',
        //                     text: `INSERT INTO ${Constants.tbl_plataforma_infopiso_rmg_sql} ( link, fecha_ultimo_cambio, idinfopisocom, idplataformacom )
        //                             VALUES($1, $2, $3, $4)`,
        //                     values: [ data.plataformas![i].link, timeStampCurrent, idDataDB, data.plataformas![i].id]
        //                 }
        //                 await client.query(queryData)
        //             }
        //         }
        //     }
            
        //     return lDataDB
        // })

        // // Verifica si es un error
        // if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

        // const dataResponse = { ...responseD[0] } as IInfoPisoComercial

        // return dataResponse
    }

    async delete(id: BigInt): Promise<IVariablesReserva | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Obtiene las variables de configuración del piso
     * @param idPiso 
     * @returns 
     */
    // async getAllByIdPiso(idPiso: BigInt): Promise<Array<IVariablesReserva> | IErrorResponse> {
    //     const queryData = {
    //         name: 'get-variables-reserva-x-idpiso',
    //         text: `
    //                 SELECT vr.id, vr.aplica, 
    //                 vr.fecha_inicio_vigencia, vr.fecha_fin_vigencia, 
    //                 vr.estado, vr.precio_base, 
    //                 vr.porcentaje_descuento, vr.precio_alquiler, 
    //                 vr.precio_muebles, vr.total, 
    //                 vr.estancia_min, vr.estancia_max, 
    //                 vr.edad_min, vr.edad_max, 
    //                 vr.mascota, vr.observacion, 
    //                 vr.fecha_creacion, vr.fecha_ultimo_cambio,
    //                 vr.idtipoestancia,
    //                 ipc.id as idinfopisocom,
    //                 p.id as idpiso
    //                 FROM ${Constants.tbl_variables_reserva_rmg_sql} vr
    //                 RIGHT JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (ipc.id = vr.idinfopisocom AND ipc.estado = 1)	
    //                 RIGHT JOIN ${Constants.tbl_piso_sql} p ON (p.id = ipc.idpiso AND p.estado >= $1 AND p.id = $2)
    //                 WHERE p.id = $2 AND (vr.estado = 1 OR vr.id IS NULL)
    //                 `,
    //         values: [ this.filterStatus, idPiso ]
    //     }

    //     let lData: Array<IVariablesReserva | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IVariablesReserva | IErrorResponse>
        
    //     if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

    //     return lData as Array<IVariablesReserva>
    // }

    /**
     * Obtiene la configuración de la reserva por id and idpiso
     * @param id 
     * @param idPiso 
     */
    async getByIdAndIdPiso(id: BigInt, idPiso: BigInt): Promise<IVariablesReserva | IErrorResponse> {
        const queryData = {
            name: 'get-variable-reserva-x-idpiso',
            text: `
                    SELECT vr.*,
                    ipc.idpiso
                    FROM ${Constants.tbl_variables_reserva_rmg_sql} vr
                    INNER JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (ipc.id = vr.idinfopisocom AND ipc.estado = 1)
                    WHERE ipc.idpiso = $2 AND vr.id = $3 AND vr.estado = $1
                    `,
            values: [ this.filterStatus, idPiso, id ]
        }

        let lData: Array<IVariablesReserva | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IVariablesReserva | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData[0] as IVariablesReserva
    }
}

export default VariablesReservaDataAccess