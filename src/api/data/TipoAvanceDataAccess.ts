import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { ITipoAvance } from "../models/ITipoAvance"

class TipoAvanceDataAccess implements IDataAccess<ITipoAvance> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ITipoAvance> | IErrorResponse> {
        const queryData  = {
                name: 'get-tipo-avance',
                text: ` SELECT ta.*
                        FROM ${Constants.tbl_tipo_avance_dn_sql} ta
                        WHERE ta.estado >= $1
                        ORDER BY ta.codigo asc
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<ITipoAvance | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ITipoAvance | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ITipoAvance>
    }

    async getById(id: BigInt): Promise<ITipoAvance | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: ITipoAvance): Promise<ITipoAvance | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ITipoAvance): Promise<ITipoAvance | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ITipoAvance | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default TipoAvanceDataAccess