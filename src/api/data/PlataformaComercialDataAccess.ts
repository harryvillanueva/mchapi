import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IPlataformaComercial } from "../models/IPlataformaComercial"

class PlataformaComercialDataAccess implements IDataAccess<IPlataformaComercial> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IPlataformaComercial> | IErrorResponse> {
        const queryData  = {
                name: 'get-plataforma-comercial',
                text: ` SELECT pc.*
                        FROM ${Constants.tbl_plataforma_comercial_rmg_sql} pc
                        WHERE pc.estado >= $1
                        ORDER BY pc.nombre asc
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<IPlataformaComercial | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IPlataformaComercial | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IPlataformaComercial>
    }

    async getById(id: BigInt): Promise<IPlataformaComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IPlataformaComercial): Promise<IPlataformaComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: IPlataformaComercial): Promise<IPlataformaComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<IPlataformaComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
}

export default PlataformaComercialDataAccess