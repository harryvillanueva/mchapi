import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import Constants from "../helpers/Constants"
import { IRole } from "../models/IRole"

class RoleDataAccess implements IDataAccess<IRole> {
    public client: DbConnection

    constructor( 
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<IErrorResponse | IRole[]> {
        const queryData = {
            name: 'get-roles',
            text: `SELECT r.*
                   FROM ${Constants.tbl_rol_sql} r
                   ORDER BY r.nombre ASC
                   `,
            values: []
      }
        
      let lData: Array<IRole | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IRole | IErrorResponse>

      if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

      return lData as Array<IRole>
    }

    getById(id: BigInt): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    insert(data: IRole): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    update(id: BigInt, data: IRole): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default RoleDataAccess