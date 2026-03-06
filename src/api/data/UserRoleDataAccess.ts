import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import { IUserRol } from "../models/IUserRol"
import Constants from "../helpers/Constants"

class UserRolDataAccess implements IDataAccess<IUserRol> {
      public client: DbConnection

      constructor( 
                        public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any ) {
            this.client = new DbConnection(isTransactions)
      }

      get(): Promise<IErrorResponse | IUserRol[]> {
            throw new Error("Method not implemented.")
      }

      getById(id: BigInt): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IUserRol): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IUserRol): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
      
      async getUserRoleByRole(idrole: string): Promise<Array<IUserRol> | IErrorResponse> {
            const queryData = {
                  name: 'get-users-x-role',
                  text: `SELECT us.*
                         FROM ${Constants.tbl_usuario_x_rol_sql} us
                         JOIN ${Constants.tbl_usuario_sql} u on (u.id = us.idusuario)
                         WHERE us.idrol LIKE $1 AND u.estado >= $2 AND u.estado IS NOT NULL`,
                  values: [ idrole, this.filterStatus ]
            }

            let lData: Array<IUserRol | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUserRol | IErrorResponse>

            if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

            return lData as Array<IUserRol>
      }
}

export default UserRolDataAccess