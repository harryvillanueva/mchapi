import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { ITipoOcupacion } from "../models/ITipoOcupacion"

class TipoOcupacionDataAccess implements IDataAccess<ITipoOcupacion> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<ITipoOcupacion> | IErrorResponse> {
        const queryData  = {
                name: 'get-tipo-ocupacion',
                text: ` SELECT ti.*
                        FROM ${Constants.tbl_tipo_ocupacion_dn_sql} ti
                        WHERE ti.estado >= $1
                        ORDER BY ti.codigo asc
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<ITipoOcupacion | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ITipoOcupacion | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<ITipoOcupacion>
    }

    async getById(id: BigInt): Promise<ITipoOcupacion | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: ITipoOcupacion): Promise<ITipoOcupacion | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ITipoOcupacion): Promise<ITipoOcupacion | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<ITipoOcupacion | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default TipoOcupacionDataAccess