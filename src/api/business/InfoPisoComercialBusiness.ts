import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { IInfoPisoComercial } from "../models/IInfoPisoComercial"
import InfoPisoComercialDataAccess from "../data/InfoPisoComercialDataAccess"
// import Constants from "../helpers/Constants"

class InfoPisoComercialBusiness implements IDataAccess<IInfoPisoComercial> {
    public dataAcces: InfoPisoComercialDataAccess
    
    constructor(      public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAcces = new InfoPisoComercialDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<IInfoPisoComercial> | IErrorResponse> {
        return this.dataAcces.get()
    }

    getPagination(): Promise <Array<IInfoPisoComercial> | IErrorResponse>{
        return this.dataAcces.getAllPisoPagination()
    }

    getById(id: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    insert(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
        this.validate(data, error)
        // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

        return (error.data?.length === 0) ? this.dataAcces.insert(data) : 
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    update(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        // throw new Error("Method not implemented.")
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
        this.validate(data, error)
        // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

        return (error.data?.length === 0) ? this.dataAcces.update(id, data) : 
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    delete(id: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getByIdPiso(idPiso: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.getByIdPiso(idPiso)
    }

    getByIdPisoVarReserva(idPiso: BigInt): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.getByIdPisoVarReserva(idPiso)
    }

    updateVariableReserva(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.updateVariableReserva(id, data)
    }

    private validate(data: IInfoPisoComercial, error: IErrorResponse): void {
        // Si no tiene anuncio
        if ( data.tiene_anuncio === false ) {
            data.anuncio_usuario = ''
            data.anuncio_contrasenia = ''
            data.anuncio_plataforma = ''
            data.anuncio_link = ''
        }
        // if ( !data.log_data ) {
        //         error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
        //             code: '', 
        //             field:'log_data', 
        //             msg: 'El campo log_data es obligatorio!' } 
        //         )
        // }
    }

    getAllPisoAll(): Promise<Array<IInfoPisoComercial> | IErrorResponse> {
        return this.dataAcces.getAllPisoAll()
    }

    insertByPlataforma(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.insertByPlataforma(data)
    }

    updateByPlataforma(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.updateByPlataforma(id, data)
    }

    insertByEstadoGeneral(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.insertByEstadoGeneral(data)
    }

    updateByEstadoGeneral(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.updateByEstadoGeneral(id, data)
    }

    insertByAlquiler(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.insertByAlquiler(data)
    }

    updateByAlquiler(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.updateByAlquiler(id, data)
    }

    insertByPrecioMueble(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.insertByPrecioMueble(data)
    }

    updateByPrecioMueble(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.updateByPrecioMueble(id, data)
    }

    insertByPrecioLimite(data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.insertByPrecioLimite(data)
    }

    updateByPrecioLimite(id: BigInt, data: IInfoPisoComercial): Promise<IInfoPisoComercial | IErrorResponse> {
        return this.dataAcces.updateByPrecioLimite(id, data)
    }
}

export default InfoPisoComercialBusiness