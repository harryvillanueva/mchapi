import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ITypeCode } from "../models/ITypeCode"
import Constants from "../helpers/Constants"

class TypeCodeDataAccess implements IDataAccess<ITypeCode> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ITypeCode> | IErrorResponse> {
        const queryData  = {
                name: 'get-types_code',
                text: ` SELECT *
                        FROM ${Constants.tbl_tipo_codigo_sql}
                        WHERE estado = 1
                        `,
                values: []
        }

        let lData: Array<ITypeCode | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ITypeCode | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ITypeCode>
    }

    async getById(id: BigInt): Promise<ITypeCode | IErrorResponse> {
        const queryData = {
                name: 'get-types_code-x-id',
                text: `SELECT tc.* 
                        FROM ${Constants.tbl_tipo_codigo_sql} tc
                        WHERE tc.id = $1 AND tc.estado = 1 
                        ORDER BY id ASC`,
                values: [id]
        }

        let lData: Array<ITypeCode | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ITypeCode | IErrorResponse>

        return lData[0]
    }

    async insert(data: ITypeCode): Promise<ITypeCode | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ITypeCode): Promise<ITypeCode | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ITypeCode | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default TypeCodeDataAccess