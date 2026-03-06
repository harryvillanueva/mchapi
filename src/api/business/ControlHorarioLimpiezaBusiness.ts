import { IDataAccess } from "../helpers/IDataAccess"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ControlHorarioLimpiezaDataAccess from "../data/ControlHorarioLimpiezaDataAccess"
import { IControlHorarioLimpieza } from "../models/IControlHorarioLimpieza"
import Constants from "../helpers/Constants"
import ValidationsInstance from "../helpers/Validations"
import UtilInstance from "../helpers/Util"

class ControlHorarioLimpiezaBusiness implements IDataAccess<IControlHorarioLimpieza> {
    public dataAcces: ControlHorarioLimpiezaDataAccess
    
    constructor(    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAcces = new ControlHorarioLimpiezaDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        return this.dataAcces.get()
    }

    getById(id: BigInt): Promise<IControlHorarioLimpieza | IErrorResponse> {
        return this.dataAcces.getById(id)
    }

    async insert(data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        // pendiente validación
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        await this.validate(data, error)
        if ( error.data?.length === 0 ) await this.validateFichajePendienteByUser(data, error, Constants.entrada_fichar)

        return (error.data?.length === 0) ? this.dataAcces.insert(data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })

        // return this.dataAcces.insert(data)
    }

    async update(id: BigInt, data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        // pendiente validacion
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        await this.validate(data, error)
        // if ( !data.salida )
        //     if ( error.data?.length === 0 ) await this.validateFichajePendienteByUser(data, error, Constants.entrada_fichar)

        return (error.data?.length === 0) ? this.dataAcces.update(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    delete(id: BigInt): Promise<IControlHorarioLimpieza | IErrorResponse> {
        return this.dataAcces.delete(id)
    }

    private async validate(data: IControlHorarioLimpieza, error: IErrorResponse): Promise<number> {
        // piso (*)
        if (  !(ValidationsInstance.checkNumberMayorCero(parseInt(data.idpiso.toString())) ) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'piso',
                        label: 'Piso', 
                        msg: 'Seleccionar un piso!!' } 
            )
        }

        // personal limpieza [user] (*)
        if (  !(ValidationsInstance.checkNumberMayorCero(parseInt(data.idusuario.toString())) ) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'idusuario',
                        label: 'Personal limpieza', 
                        msg: 'Seleccionar un personal de limpieza!!' } 
            )
        }

        // Fecha
        if ( ValidationsInstance.isEmpty(data.fecha || '') ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'fecha',
                label: 'Fecha', 
                msg: 'Ingresar una fecha!!' } 
            )
        } else if ( !ValidationsInstance.checkFormatDateSQL(data.fecha || '') ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'fecha',
                label: 'Fecha', 
                msg: 'Fecha incorrecta. Formato [YYYY-MM-DD]!!' } 
            )
        } else {
            let { fecha: _fechaCurrent } = UtilInstance.getDateCurrent()
            let _diffTimestampt = ((Date.parse(_fechaCurrent) - Date.parse(data.fecha!))/1000)
            if ( _diffTimestampt < 0 ) {
                error.data?.push( { type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'fecha',
                    label: 'Fecha', 
                    msg: 'No puede ser mayor a la fecha actual!!' } 
                )
            }
        }

        // Entrada
        if ( ValidationsInstance.isEmpty(data.entrada || '') ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'h_entrada',
                label: 'Hora entrada', 
                msg: 'Ingresar hora de entrada!!' } 
            )
        } else if ( !ValidationsInstance.checkFormatDateTimeSQL(data.entrada || '') ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'h_entrada',
                label: 'Hora entrada', 
                msg: 'Ingresar hora de entrada!!' } 
            )
        }

        // Salida
        if ( data.salida ) {
            if ( !ValidationsInstance.checkFormatDateTimeSQL(data.salida || '') ) {
                error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'h_salida',
                    label: 'Hora salida', 
                    msg: 'Ingresar hora de salida!!' } 
                )
            }
        }

        // Validar ENTRADA <= SALIDA
        if (    ValidationsInstance.checkFormatDateTimeSQL(data.entrada || '') && 
                ValidationsInstance.checkFormatDateTimeSQL(data.salida || '')) {
            let _diffTimestampt = ((Date.parse(data.salida!) - Date.parse(data.entrada!))/1000)
            if ( _diffTimestampt < 0 ) {
                error.data?.push( { type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'h_entrada',
                    label: 'Hora entrada', 
                    msg: 'Hora entrada NO puede ser mayor que Hora salida!!' } 
                )
            }
        }

        return 0        
    }

    /**
     * Validación que se ejecuta cuando se registra desde la APP MOVIL
     * @param data 
     * @param error 
     * @param type_fichaje 
     */
    private async validateFichajePendiente(data: IControlHorarioLimpieza, error: IErrorResponse, type_fichaje: string) {
        let _controlHLBusiness: ControlHorarioLimpiezaBusiness = new ControlHorarioLimpiezaBusiness(this.idUserLogin, 0, false)
        let lControlHL = await _controlHLBusiness.getMyFichajeLimpiezaToday()
        
        // Verifica si hay fichaje pendiente, se verifica por el estado = 1
        if (  (lControlHL as IErrorResponse).error ) {
            error.data?.push({   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'piso', 
                msg: 'No se puede verificar el fichaje del piso, por favor intentelo más tarde!!' 
            })
        } else if ( type_fichaje === Constants.entrada_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 1 ) {
            lControlHL = lControlHL as Array<IControlHorarioLimpieza>
            if ( lControlHL[0].idpiso == data.idpiso ) {
                error.data?.push({   
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'piso', 
                    msg: `La entrada del piso ${lControlHL[0].etiqueta_piso} ya ha sido registrada [${lControlHL[0].entrada}]` 
                })
            } else {
                error.data?.push({   
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'piso', 
                    msg: `Existe otro piso [${lControlHL[0].etiqueta_piso}] con fichaje entrada, por favor registrar la respectiva salida del piso. O comunicarse con ADE!` 
                })
            }
        } else if ( type_fichaje === Constants.salida_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 0 ) {
            error.data?.push({   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'piso', 
                msg: 'Por favor, fichar ENTRADA!' 
            })
        } else if ( type_fichaje === Constants.salida_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 1 ) {
            lControlHL = lControlHL as Array<IControlHorarioLimpieza>
            if ( lControlHL[0].idpiso != data.idpiso ) {
                error.data?.push({   
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'piso', 
                    msg: `El piso no corresponde con el del sistema [${lControlHL[0].etiqueta_piso}]` 
                })
            } else {
                data.id = lControlHL[0].id // Asigna el id del recurso a modificar
            }
        } else if ( (type_fichaje === Constants.entrada_fichar || type_fichaje === Constants.salida_fichar) && (lControlHL as Array<IControlHorarioLimpieza>).length > 1 ) {
            error.data?.push({   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'piso', 
                msg: 'Hay varias fichajes de pisos pendientes, por favor comunicarse con ADE!' 
            })
        }
    }

    /**
     * Validacion que se ejecuta, cuando se registra desde la WEB [ADE]
     * @param data 
     * @param error 
     * @param type_fichaje 
     */
    private async validateFichajePendienteByUser(data: IControlHorarioLimpieza, error: IErrorResponse, type_fichaje: string) {
        let _controlHLBusiness: ControlHorarioLimpiezaBusiness = new ControlHorarioLimpiezaBusiness(this.idUserLogin, 0, false)
        let lControlHL = await _controlHLBusiness.getMyFichajeLimpiezaByUserAndDate(data.idusuario, data.fecha!)
        
        // Verifica si hay fichaje pendiente, se verifica por el estado = 1
        if (  (lControlHL as IErrorResponse).error ) {
            error.data?.push({   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'idusuario', 
                label: 'Personal limpieza',
                msg: 'No se puede verificar el fichaje del piso, por favor intentelo más tarde!!' 
            })
        } else if ( type_fichaje === Constants.entrada_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 1 ) {
            lControlHL = lControlHL as Array<IControlHorarioLimpieza>
            if ( lControlHL[0].idpiso == data.idpiso ) {
                error.data?.push({   
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'idusuario', 
                    label: 'Personal limpieza', 
                    msg: `La entrada del piso ${lControlHL[0].etiqueta_piso} ya ha sido registrada [${lControlHL[0].entrada}]` 
                })
            } else {
                error.data?.push({   
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '', 
                    field:'idusuario', 
                    label: 'Personal limpieza',
                    msg: `Existe otro piso [${lControlHL[0].etiqueta_piso}] con fichaje entrada, por favor registrar la respectiva salida del piso. O comunicarse con ADE!` 
                })
            }
        } else if ( (type_fichaje === Constants.entrada_fichar) && (lControlHL as Array<IControlHorarioLimpieza>).length > 1 ) {
            error.data?.push({   
                type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'idusuario', 
                label: 'Personal limpieza', 
                msg: 'Hay varias fichajes de pisos pendientes, por favor comunicarse con ADE!' 
            })
        }
    }

    getMyFichajeLimpiezaToday(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        return this.dataAcces.getMyFichajeLimpiezaToday()
    }

    getMyFichajeLimpiezaByUserAndDate(idUser: BigInt, fecha: string): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        return this.dataAcces.getMyFichajeLimpiezaByUserAndDate(idUser, fecha)
    }

    async ficharEntrada(data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        // Validaciones
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        await this.validateFichajePendiente( data, error, Constants.entrada_fichar )

        return (error.data?.length === 0) ? this.dataAcces.ficharEntrada(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    async ficharSalida(data: IControlHorarioLimpieza): Promise<IControlHorarioLimpieza | IErrorResponse> {
        // Validaciones
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        await this.validateFichajePendiente( data, error, Constants.salida_fichar )

        return (error.data?.length === 0) ? this.dataAcces.ficharSalida(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    getAllReport(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        return this.dataAcces.getAllReport()
    }

    getAllReportByUser(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        return this.dataAcces.getAllReportByUser()
    }

    getAllWithPagination(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
        return this.dataAcces.getAllWithPagination()
    }
}

export default ControlHorarioLimpiezaBusiness