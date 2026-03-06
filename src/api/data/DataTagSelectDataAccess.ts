import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { IData } from "../modelsextra/IData"
import { IDataTagSelect } from "../modelsextra/IDataTagSelect"

class DataTagSelectDataAccess implements IDataAccess<IDataTagSelect> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IDataTagSelect> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getById(id: BigInt): Promise<IDataTagSelect | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IDataTagSelect): Promise<IDataTagSelect | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: IDataTagSelect): Promise<IDataTagSelect | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<IDataTagSelect | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Retorna todos los pisos activos
     * Return paramas [ID, ETIQUETA] -> [id, label]
     * Plantilla para las otras tablas que solo necesiten información basica
     */
    async getAllPisos(): Promise<Array<IDataTagSelect> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments',
            text: `SELECT COALESCE(p.id || '', '0') as key, p.etiqueta as name
                    FROM ${Constants.tbl_piso_sql} p
                    WHERE p.estado = $1 AND
                    p.tipo = $2 AND                    
					p.visible_otras_apps = $3
                    ORDER BY p.etiqueta ASC
                    `,
            values: [ 1, 'piso' , 1]
        }
        
        let lData: Array<IDataTagSelect | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDataTagSelect | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IDataTagSelect>
    }

    /**
     * Retorna los tipos de dispositivos
     * @returns 
     */
    async getAllTypeDevices(): Promise<Array<IDataTagSelect> | IErrorResponse> {
        const queryData = {
            name: 'get-typedevices',
            text: `SELECT COALESCE(td.id || '', '0') as key, td.codigo as name
                    FROM ${Constants.tbl_tipo_dispositivo_sql} td
                    ORDER BY td.codigo ASC
                    `,
            values: []
        }
        
        let lData: Array<IDataTagSelect | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDataTagSelect | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IDataTagSelect>
    }

    /**
     * Retorna las personas de la oficina
     * @returns 
     */
    async getPersonasOficina(): Promise<Array<IDataTagSelect> | IErrorResponse> {
        const queryData = {
            name: 'get-personas-oficina',
            text: ` SELECT usu.id as key, usu.nombre_completo as name
                    FROM tbl_usuario usu
                    INNER JOIN (
                        SELECT usu.id
                        FROM tbl_usuario usu 
                        INNER JOIN tbl_usuario_x_rol uxr on uxr.idusuario = usu.id
                        WHERE uxr.idrol not in ('propietario', 'colaborador', 'mantenimiento', 'limpieza')
                        GROUP BY usu.id
                    ) trab on trab.id = usu.id
                    WHERE usu.estado = 1
                    ORDER BY usu.nombre_completo
                    `,
            values: []
        }
        
        let lData: Array<IDataTagSelect | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDataTagSelect | IErrorResponse>
        
        if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

        return lData as Array<IDataTagSelect>
    }
}

export default DataTagSelectDataAccess