import { IDataAccess } from "../helpers/IDataAccess"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ISolicitudPrecio } from "../models/ISolicitudPrecio"
import SolicitudPrecioDA from "../data/SolicitudPrecioDA"
import Constants from "../helpers/Constants"

class SolicitudPrecioBLL implements IDataAccess<ISolicitudPrecio> {
    public dataAcces: SolicitudPrecioDA
    
    constructor(    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAcces = new SolicitudPrecioDA(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<ISolicitudPrecio> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getById(id: BigInt): Promise<ISolicitudPrecio | IErrorResponse> {
        return this.dataAcces.getById(id)
    }

    async insert(data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<ISolicitudPrecio | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    private validate(data: ISolicitudPrecio, error: IErrorResponse) {
        // validation for limite precio
        if ( isNaN( parseInt(data.limite_precio.toString()) ) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'limite_precio',
                label: 'Limite precio', 
                msg: 'Ingresar limite precio!' } 
            )
        } else if ( parseFloat(data.limite_precio.toString()) < 1.0 ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'limite_precio',
                label: 'Limite precio', 
                msg: 'Ingresar un valor mayor a cero!' }
            )
        }

        // validation for porcentaje_limite_precio
        if ( isNaN( parseInt(data.porcentaje_limite_precio.toString()) ) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'porcentaje_limite_precio',
                label: 'Porcentaje limite precio', 
                msg: 'Ingresar % limite precio!' } 
            )
        } else if ( parseFloat(data.porcentaje_limite_precio.toString()) < 0.0 ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'porcentaje_limite_precio',
                label: 'Porcentaje limite precio', 
                msg: 'Ingresar un valor mayor o igual cero!' }
            )
        }
    }

    /**
     * Metodo que sera invocado siempre y cuando no haya errores
     * @param data 
     */
    private cleaningData(data: ISolicitudPrecio) {
        data.limite_precio = parseFloat(data.limite_precio.toFixed(2))
        data.porcentaje_limite_precio = parseFloat(data.porcentaje_limite_precio.toFixed(2))
        data.idpiso = data.idpiso.toString() === '0' ? BigInt(1) : data.idpiso // 1 Oficina
    }

    insertWP(data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        
        // validacion de los datos generales
        this.validate(data, error)
        error.data?.length === 0 && this.cleaningData(data)

        return (error.data?.length === 0) ? this.dataAcces.insertWP(data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    aprobarSolicitudRMG(id: BigInt, data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        
        // validacion de los datos generales
        this.validate(data, error)
        error.data?.length === 0 && this.cleaningData(data)

        return (error.data?.length === 0) ? this.dataAcces.aprobarSolicitudRMG(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    rechazarSolicitudRMG(id: BigInt, data: ISolicitudPrecio): Promise<ISolicitudPrecio | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        
        // validacion de los datos generales
        this.validate(data, error)
        error.data?.length === 0 && this.cleaningData(data)

        return (error.data?.length === 0) ? this.dataAcces.aprobarSolicitudRMG(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    getAllWithPagination(): Promise<Array<ISolicitudPrecio> | IErrorResponse> {
        return this.dataAcces.getAllWithPagination()
    }
}

export default SolicitudPrecioBLL