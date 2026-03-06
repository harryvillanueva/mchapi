import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { StatusDataType } from "../types/GlobalTypes"
import { ILogsApartment } from "../models/ILogsApartment"

class LogsApartmentDataAccess implements IDataAccess<ILogsApartment> {
      public client: DbConnection

      constructor( 
                        public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any ) {
            this.client = new DbConnection(isTransactions)
      }

      async get(): Promise<Array<ILogsApartment> | IErrorResponse> {
            // const queryData = {
            //       name: 'get-users',
            //       text: `SELECT usu.id, usu.nombre, usu.apellido, usu.email, usu.estado, usu.idusuario, r.id as idrol, r.nombre as nombrerol 
            //              FROM ${Constants.tbl_usuario_sql} usu
            //              JOIN ${Constants.tbl_rol_sql} r on (r.id = usu.idrol)
            //              WHERE usu.estado >= $1 AND usu.estado IS NOT NULL
            //              ORDER BY usu.id ASC`,
            //       values: [ this.filterStatus ]
            // }
              
            // let lData: Array<ILogsApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILogsApartment | IErrorResponse>
            
            // if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

            // return lData as Array<ILogsApartment>
            throw new Error("Method not implemented.")
      }

      async getById(id: BigInt): Promise<ILogsApartment | IErrorResponse> {
            // const queryData = {
            //       name: 'get-user-x-id',
            //       text: `SELECT usu.id, usu.nombre, usu.apellido, usu.email, usu.estado, usu.idusuario, r.id as idrol, r.nombre as nombrerol 
            //              FROM ${Constants.tbl_usuario_sql} usu
            //              JOIN ${Constants.tbl_rol_sql} r on (r.id = usu.idrol)
            //              WHERE usu.id = $1 AND usu.estado >= $2 AND usu.estado IS NOT NULL
            //              ORDER BY usu.id ASC`,
            //       values: [ id, this.filterStatus ]
            // }

            // let lData: Array<ILogsApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILogsApartment | IErrorResponse>

            // return lData[0]
            throw new Error("Method not implemented.")
      }

      async insert(data: ILogsApartment): Promise<ILogsApartment | IErrorResponse> {
            // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            //       const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            //       const queryData = {
            //             name: 'insert-user',
            //             text: `INSERT INTO ${Constants.tbl_usuario_sql}(
            //                   email, 
            //                   password, 
            //                   nombre, 
            //                   apellido, 
            //                   fecha_creacion, 
            //                   fecha_ultimo_cambio, 
            //                   idrol,
            //                   idusuario)
            //                   VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            //             values: [   data.email, 
            //                         data.password, 
            //                         data.nombre, 
            //                         data.apellido, 
            //                         timeStampCurrent, 
            //                         timeStampCurrent,
            //                         data.idrol, 
            //                         this.idUserLogin
            //                   ]
            //       }
            //       let lData = (await client.query(queryData)).rows as Array<ILogsApartment | IErrorResponse>

            //       let userDB = lData[0]
            //       if ( userDB ) {
            //             const idDataDB = (userDB as ILogsApartment).id!
            //             const queryData = {
            //                   name: 'insert-piso-x-user',
            //                   text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
            //                               VALUES($1,$2) RETURNING *`,
            //                   values: [ idDataDB, data.idrol ]
            //             }
            //             let respTmp = (await client.query(queryData)).rows as Array<ILogsApartment | IErrorResponse>
            //             if ( (respTmp[0] as IErrorResponse).error ) lData = respTmp as Array<IErrorResponse>
            //       }

            //       return lData
            // })

            // return ( responseD[0] ) as ILogsApartment | IErrorResponse
            throw new Error("Method not implemented.")
      }

      async update(id: BigInt, data: ILogsApartment): Promise<ILogsApartment | IErrorResponse> {
            // let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
            //       const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            //       let queryData = {
            //             name: 'update-user',
            //             text: `UPDATE ${Constants.tbl_usuario_sql} SET
            //                   email = $1, 
            //                   nombre = $2, 
            //                   apellido = $3,
            //                   estado = $4,  
            //                   fecha_ultimo_cambio = $5,
            //                   idrol = $6, 
            //                   idusuario = $7
            //                   WHERE id = $8 AND estado >= $9 RETURNING *`,
            //             values: [   data.email, 
            //                         data.nombre, 
            //                         data.apellido, 
            //                         data.estado, 
            //                         timeStampCurrent, 
            //                         data.idrol,
            //                         this.idUserLogin,
            //                         id,
            //                         this.filterStatus
            //                   ]
            //       }
            //       let lData = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>

            //       // Delete all propietarios
            //       queryData = {
            //             name: 'delete-role-x-user',
            //             text: `DELETE FROM ${Constants.tbl_usuario_x_rol_sql} WHERE idusuario = $1`,
            //             values: [id]
            //       }
            //       await client.query(queryData)

            //       let userDB = lData[0]
            //       if ( userDB ) {
            //             const queryData = {
            //                   name: 'insert-user-x-role',
            //                   text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
            //                               VALUES($1,$2) RETURNING *`,
            //                   values: [ id, data.idrol ]
            //             }
            //             let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
            //             if ( (respTmp[0] as IErrorResponse).error ) lData = respTmp as Array<IErrorResponse>
            //       }

            //       return lData
            // })

            // return ( responseD[0] ) as IUser | IErrorResponse
            throw new Error("Method not implemented.")
      }

      async delete(id: BigInt): Promise<ILogsApartment | IErrorResponse> {
            // const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            // const queryData = {
            //       name: 'delete-user',
            //       text: `UPDATE ${Constants.tbl_usuario_sql} SET
            //             estado = $1,
            //             fecha_ultimo_cambio = $2, 
            //             idusuario = $3
            //             WHERE id = $4 AND estado >= $5 RETURNING *`,
            //       values: [   Constants.code_status_delete, 
            //                   timeStampCurrent, 
            //                   this.idUserLogin,
            //                   id,
            //                   this.filterStatus
            //             ]
            // }

            // let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            // return lData[0]
            throw new Error("Method not implemented.")
      }

      async getAllByApartment(): Promise<Array<ILogsApartment> | IErrorResponse> {
            let idApartment = this.infoExtra.idApartment || null
            const queryData = {
                  name: 'get-logs-by-apartment',
                  text: `
                         SELECT  lp.*, p.id_dispositivo_ref
                         FROM tbl_logs_piso lp
                         INNER JOIN tbl_piso p ON (lp.idpiso = p.id)
                         WHERE lp.idpiso = $1
                         ORDER BY lp.id DESC
                         `,
                  values: [ idApartment ]
            }
              
            let lData: Array<ILogsApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILogsApartment | IErrorResponse>
            
            if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

            return lData as Array<ILogsApartment>
      }
}

export default LogsApartmentDataAccess