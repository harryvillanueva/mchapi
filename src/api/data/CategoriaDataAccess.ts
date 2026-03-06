import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { ICategoria } from "../models/ICategoria"

class CategoriaDataAccess implements IDataAccess<ICategoria> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ICategoria> | IErrorResponse> {
        const queryData  = {
                name: 'get-categoria',
                text: ` SELECT cat.*
                        FROM ${Constants.tbl_categoria_dn_sql} cat
                        WHERE cat.estado >= $1
                        ORDER BY cat.nombre ASC
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<ICategoria | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ICategoria | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ICategoria>
    }

    async getById(id: BigInt): Promise<ICategoria | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: ICategoria): Promise<ICategoria | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ICategoria): Promise<ICategoria | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ICategoria | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default CategoriaDataAccess