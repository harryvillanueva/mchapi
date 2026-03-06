import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ValidationsInstance from "../helpers/Validations"
import Constants from "../helpers/Constants"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import UtilInstance from "../helpers/Util"
import GrupoPropietarioDataAccess from "../data/GrupoPropietarioDataAccess"
import { IGrupoPropietario } from "../models/IGrupoPropietario"

class GrupoPropietarioBusiness implements IDataAccess<IGrupoPropietario> {
    public dataAccess: GrupoPropietarioDataAccess
    
    constructor(    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAccess = new GrupoPropietarioDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<IGrupoPropietario> | IErrorResponse> {
        return this.dataAccess.get()
    }

    getById(id: BigInt): Promise<IGrupoPropietario | IErrorResponse> {
        return this.dataAccess.getById(id)
    }

    private validate(data: IGrupoPropietario, error: IErrorResponse): void {
        // nombre (*)
        !ValidationsInstance.isEmpty( data.nombre ) || 
        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                code: '', 
                                field:'nombre',
                                label: 'Nombre', 
                                msg: 'El campo Nombre es inválido!' } 
                          ) 
        )

        // whatsapp (*)
        if ( !data.whatsapp ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'whatsapp',
                label: 'Whatsapp', 
                msg: 'El campo Whatsapp es obligatorio!' } 
            )
        } else if ( data.whatsapp && ValidationsInstance.isEmpty(data.whatsapp) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'whatsapp', 
                msg: 'El campo Whatsapp es inválido!' }
            )
        }

        // next_step 
        if ( data.next_step !== undefined ) {
            if ( !ValidationsInstance.checkFormatDateSQL(data.next_step || '') ) {
                error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'next_step',
                    label: 'Next step', 
                    msg: 'Fecha incorrecta. Formato [YYYY-MM-DD]!!' } 
                )
            }
        }

        // Propietarios
        let _propietariosL = data.propietarios || []
        // Que exista al menos un prescriptor para agregar un suceso
        if ( _propietariosL.length === 0 ) {
            error.data?.push( {   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'propietarios',
                label: 'Propietarios',
                msg: 'Debe existir al menos un propietario!' }
            )
        }else if ( _propietariosL.length !== 0 ) {
            for (let _i = 0; _i < _propietariosL.length; _i++ ) {
                let _nCompleto = _propietariosL[_i].nombre_completo || ''
                let _telefono = _propietariosL[_i].telefono || ''
                if ( _nCompleto.length === 0 || _telefono.length === 0 ) {
                    error.data?.push( {   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'propietarios',
                        label: 'propietarios',
                        msg: 'Verficar que sen correctos los campos [ Nombres, Teléfono] de los propietarios!' }
                    )
                    break
                }
            }
        }

        // comentario_suceso QUITAR VALIDACION 01 DIC 2023
        // let _comentarioSuceso = data.comentario_suceso || ''
        // !ValidationsInstance.isEmpty( _comentarioSuceso ) || 
        // ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
        //                         code: '', 
        //                         field:'comentario_suceso',
        //                         label:'Comentario', 
        //                         msg: 'El campo Comentario es inválido!' } 
        //                   ) 
        // )        
    }

    private validateDelete(data: IGrupoPropietario, error: IErrorResponse): void {
        // nombre
        !ValidationsInstance.isEmpty( data.nombre ) || 
        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                code: '', 
                                field:'nombre',
                                label: 'Nombre', 
                                msg: 'El campo Nombre es inválido!' } 
                          ) 
        )

        // comentario_suceso SE QUITA VALIDACION DE COMENTARIO POR NUEVO REQUERIMIENTO
        // let _comentarioSuceso = data.comentario_suceso || ''
        // !ValidationsInstance.isEmpty( _comentarioSuceso ) || 
        // ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
        //                         code: '', 
        //                         field:'comentario_suceso',
        //                         label:'Comentario', 
        //                         msg: 'El campo Comentario es inválido!' } 
        //                   ) 
        // )        
    }

    insert(data: IGrupoPropietario): Promise<IGrupoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
        // // Validaciones de usuario y de campos
        // let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        // this.validate(data, error)

        // return (error.data?.length === 0) ? this.dataAccess.insert(data) : 
        //                                     new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    update(id: BigInt, data: IGrupoPropietario): Promise<IGrupoPropietario | IErrorResponse> {
        // // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        this.validate(data, error)
        
        return (error.data?.length === 0) ? this.dataAccess.update(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    updateDelete(id: BigInt, data: IGrupoPropietario): Promise<IGrupoPropietario | IErrorResponse> {
        // // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        this.validateDelete(data, error)
        
        return (error.data?.length === 0) ? this.dataAccess.updateDelete(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    delete(id: BigInt): Promise<IGrupoPropietario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getAllWithPagination(): Promise<Array<IGrupoPropietario> | IErrorResponse> {
        return this.dataAccess.getAllWithPagination()
    }
}

export default GrupoPropietarioBusiness