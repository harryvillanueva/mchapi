import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { ITipoEstancia } from "../models/ITipoEstancia"

class TipoEstanciaDataAccess implements IDataAccess<ITipoEstancia> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ITipoEstancia> | IErrorResponse> {
        const queryData  = {
                name: 'get-tipo-estancia',
                text: ` SELECT te.*
                        FROM ${Constants.tbl_tipo_estancia_rmg_sql} te
                        WHERE te.estado >= $1
                        ORDER BY te.nombre ASC
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<ITipoEstancia | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ITipoEstancia | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ITipoEstancia>
    }

    async getById(id: BigInt): Promise<ITipoEstancia | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: ITipoEstancia): Promise<ITipoEstancia | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ITipoEstancia): Promise<ITipoEstancia | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ITipoEstancia | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default TipoEstanciaDataAccess