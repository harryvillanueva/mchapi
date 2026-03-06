import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ValidationsInstance from "../helpers/Validations"
import Constants from "../helpers/Constants"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import UtilInstance from "../helpers/Util"
import GrupoPrescriptorDataAccess from "../data/GrupoPrescriptorDataAccess"
import { IGrupoPrescriptor } from "../models/IGrupoPrescriptor"

class GrupoPrescriptorBusiness implements IDataAccess<IGrupoPrescriptor> {
    public dataAccess: GrupoPrescriptorDataAccess
    
    constructor(    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAccess = new GrupoPrescriptorDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<IGrupoPrescriptor> | IErrorResponse> {
        return this.dataAccess.get()
    }

    getById(id: BigInt): Promise<IGrupoPrescriptor | IErrorResponse> {
        return this.dataAccess.getById(id)
    }

    private validate(data: IGrupoPrescriptor, error: IErrorResponse): void {
        // nombre
        !ValidationsInstance.isEmpty( data.nombre ) || 
        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                code: '', 
                                field:'nombre',
                                label: 'Nombre', 
                                msg: 'El campo Nombre es inválido!' } 
                          ) 
        )

        // whatsapp
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

        // Validar next_step, si el usario ingresa una fecha
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

        // flag_vr: [Se valida si es un suceso por reserva || visita || incidencia]
        const _flagVR = (data.flag_vr && data.flag_vr.toLowerCase()) || ''
        if ( ['v', 'r', 'p'].includes(_flagVR) ) {
            // Si es un suceso por visita, se verifica el número de visitas
            if ( _flagVR === 'v') {
                if ( data.nro_visitas === undefined ) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'nro_visitas',
                        label: 'Nro Visitas', 
                        msg: 'El campo Nro Visitas es inválido!' }
                    )
                } else if ( data.nro_visitas <= 0) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'nro_visitas', 
                        label: 'Nro Visitas',
                        msg: 'El campo Nro Visitas no puede ser menor o igual a CERO!' }
                    )
                }
            }

            // Si es un suceso por reserva, se verifica el nro de reserva, y el valor
            if ( _flagVR === 'r') {
                // Verificación Nro Reservas
                if ( data.nro_reservas === undefined ) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'nro_reservas', 
                        label: 'Nro Reservas',
                        msg: 'El campo Nro Reservas es inválido!' }
                    )
                } else if ( data.nro_reservas <= 0) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'nro_reservas',
                        label: 'Nro Reservas', 
                        msg: 'El campo Nro Reservas no puede ser menor o igual a CERO!' }
                    )
                }

                // Verificación para el valor de la reserva
                if ( !data.valor ) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'valor',
                        label: 'Valor', 
                        msg: 'El campo Valor es inválido!' }
                    )
                } else if ( data.valor && data.valor <= 0) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'valor',
                        label: 'Valor',  
                        msg: 'El campo Valor no puede ser menor o igual a CERO!' }
                    )
                }
            }

            // Si es un propietario se verifica el valor propietario NUEVO CAMBIO 06/12/2023
            if ( _flagVR === 'p') {
                // Pendiente verificar que el valor de propietario sea un INTEGER
                if ( data.valor_propietario === undefined ) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'valor_propietario',
                        label: 'Propietario', 
                        msg: 'El campo valor propietario es inválido!' }
                    )
                } else if ( data.valor_propietario <= -11) {
                    error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'valor_propietario', 
                        label: 'Propietario',
                        msg: 'El campo Propietario no puede ser menor o igual a -11!' }
                    )
                }
            }
        }

        // Prescriptores
        let _prescriptoresL = data.prescriptores || []
        // Que exista al menos un prescriptor para agregar un suceso
        if ( _prescriptoresL.length === 0 ) {
            error.data?.push( {   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'prescriptores',
                label: 'Prescriptores',
                msg: 'Debe existir al menos un prescriptor!' }
            )
        }else if ( _prescriptoresL.length !== 0 ) {
            // Validar fields de todos los prescriptores [ id | telefono | nombre_completo ]
            // PENDIENTE VALIDAR CORREO, EMPRESA [01 DIC 2023]
            for (let _i = 0; _i < _prescriptoresL.length; _i++ ) {
                let _nCompleto = _prescriptoresL[_i].nombre_completo || ''
                let _telefono = _prescriptoresL[_i].telefono || ''
                let _email = _prescriptoresL[_i].email || ''
                if ( _nCompleto.length === 0 || _telefono.length === 0 ) {
                    error.data?.push( {   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'prescriptores',
                        label: 'Prescriptores',
                        msg: 'Verficar que sen correctos los campos [ Nombres, Teléfono, Email] de los prescriptores!' }
                    )
                    break
                }
            }
        }

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

    private validateDelete(data: IGrupoPrescriptor, error: IErrorResponse): void {
        // nombre
        !ValidationsInstance.isEmpty( data.nombre ) || 
        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                code: '', 
                                field:'nombre',
                                label: 'Nombre', 
                                msg: 'El campo Nombre es inválido!' } 
                          ) 
        )

        // whatsapp
        // if ( !data.whatsapp ) {
        //     error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
        //         code: '', 
        //         field:'whatsapp',
        //         label: 'Whatsapp', 
        //         msg: 'El campo Whatsapp es obligatorio!' } 
        //     )
        // } else if ( data.whatsapp && ValidationsInstance.isEmpty(data.whatsapp) ) {
        //     error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
        //         code: '', 
        //         field:'whatsapp', 
        //         msg: 'El campo Whatsapp es inválido!' }
        //     )
        // }

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

    insert(data: IGrupoPrescriptor): Promise<IGrupoPrescriptor | IErrorResponse> {
        throw new Error("Method not implemented.")
        // // Validaciones de usuario y de campos
        // let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        // this.validate(data, error)

        // return (error.data?.length === 0) ? this.dataAccess.insert(data) : 
        //                                     new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    update(id: BigInt, data: IGrupoPrescriptor): Promise<IGrupoPrescriptor | IErrorResponse> {
        // // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        this.validate(data, error)
        
        return (error.data?.length === 0) ? this.dataAccess.update(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    updateDelete(id: BigInt, data: IGrupoPrescriptor): Promise<IGrupoPrescriptor | IErrorResponse> {
        // // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        this.validateDelete(data, error)
        
        return (error.data?.length === 0) ? this.dataAccess.updateDelete(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    delete(id: BigInt): Promise<IGrupoPrescriptor | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getAllWithPagination(): Promise<Array<IGrupoPrescriptor> | IErrorResponse> {
        return this.dataAccess.getAllWithPagination()
    }
}

export default GrupoPrescriptorBusiness