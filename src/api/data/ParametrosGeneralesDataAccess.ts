import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IParametrosGenerales } from "../models/IParametrosGenerales"
import UtilInstance from "../helpers/Util"

class ParametrosGeneralesDataAccess implements IDataAccess<IParametrosGenerales> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IParametrosGenerales> | IErrorResponse> {
        const queryData  = {
                name: 'get-parametros-generales',
                text: ` SELECT pg.*
                        FROM ${Constants.tbl_parametros_generales_sql} pg
                        WHERE pg.estado >= $1
                        ORDER BY pg.codigo ASC
                        `,
                values: [this.filterStatus]
        }

        let lData: Array<IParametrosGenerales | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IParametrosGenerales | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IParametrosGenerales>
    }

    async getById(id: BigInt): Promise<IParametrosGenerales | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IParametrosGenerales): Promise<IParametrosGenerales | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: IParametrosGenerales): Promise<IParametrosGenerales | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<IParametrosGenerales | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getByCode(codigo: string): Promise<IParametrosGenerales | IErrorResponse> {
        const queryData  = {
                name: 'get-parametros-generales-x-codigo',
                text: ` SELECT pg.*
                        FROM ${Constants.tbl_parametros_generales_sql} pg
                        WHERE pg.estado >= $1 AND pg.codigo LIKE $2
                        ORDER BY pg.codigo ASC
                        `,
                values: [this.filterStatus, codigo]
        }

        let lData: Array<IParametrosGenerales | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IParametrosGenerales | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData[0] as IParametrosGenerales
    }

    async updateTokeneWeLink(id: BigInt, data: IParametrosGenerales): Promise<IParametrosGenerales | IErrorResponse> {
        throw new Error("Method not implemented.")
        // const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        //     const queryData = {
        //           name: 'update-parametro-general-token',
        //           text: `UPDATE tbl_llave SET
        //                 ubicacion = $1, 
        //                 tipo_tarjeta = $2, 
        //                 idqr = $3, 
        //                 qr = $4,
        //                 imagenqr = $5,
        //                 estado = $6,
        //                 observacion = $7,  
        //                 fecha_ultimo_cambio = $8, 
        //                 idusuario = $9
        //                 WHERE id = $10 AND estado >= $11 RETURNING *`,
        //           values: [   data.ubicacion, 
        //                       data.tipo_tarjeta, 
        //                       data.idqr, 
        //                       data.qr,
        //                       data.imagenqr, 
        //                       data.estado,
        //                       data.observacion, 
        //                       timeStampCurrent, 
        //                       this.idUserLogin,
        //                       id,
        //                       this.filterStatus
        //                 ]
        //     }

        //     let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

        //     return lData[0]
    }
}

export default ParametrosGeneralesDataAccess