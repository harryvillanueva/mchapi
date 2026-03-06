import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { ITipoInteresa } from "../models/ITipoInteresa"

class TipoInteresaDataAccess implements IDataAccess<ITipoInteresa> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ITipoInteresa> | IErrorResponse> {
        const queryData  = {
                name: 'get-tipo-interesa',
                text: ` SELECT ti.*
                        FROM ${Constants.tbl_tipo_interesa_dn_sql} ti
                        WHERE ti.estado >= $1
                        ORDER BY ti.codigo asc
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<ITipoInteresa | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ITipoInteresa | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ITipoInteresa>
    }

    async getById(id: BigInt): Promise<ITipoInteresa | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: ITipoInteresa): Promise<ITipoInteresa | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ITipoInteresa): Promise<ITipoInteresa | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ITipoInteresa | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default TipoInteresaDataAccess