import { IDataAccess } from "../helpers/IDataAccess"
import { ErrorFieldType, StatusDataType, jornadaType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import ValidationsInstance from "../helpers/Validations"
import UtilInstance from "../helpers/Util"
import { IFichajeOficina } from "../models/IFichajeOficina"
import FichajeOficinaDAL from "../data/FichajeOficinaDAL"
import { IUser } from "../models/IUser"
import { ifError } from "assert"
import EmailServiceInstance from "../helpers/EmailService"
import TemplateEmails from "../helpers/TemplateEmails"

class FichajeOficinaBLL implements IDataAccess<IFichajeOficina> {
    public dataAcces: FichajeOficinaDAL
    
    constructor(    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAcces = new FichajeOficinaDAL(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<IFichajeOficina> | IErrorResponse> {
        return this.dataAcces.get()
    }

    getById(id: BigInt): Promise<IFichajeOficina | IErrorResponse> {
        return this.dataAcces.getById(id)
    }

    async insert(data: IFichajeOficina): Promise<IFichajeOficina | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
        
        // Init data por defecto
        data.usuario = data.usuario || ''
        data.token = UtilInstance.getUUID()
        data.tipo_ejecucion = data.tipo_ejecucion || 'manual'
        data.observacion = data.observacion || ''
        
        // validacion
        this.validate(data, error)

        return (error.data?.length === 0) ? this.dataAcces.insert(data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    async update(id: BigInt, data: IFichajeOficina): Promise<IFichajeOficina | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        // Init data por defecto
        data.usuario = data.usuario || ''
        data.token = UtilInstance.getUUID()
        data.tipo_ejecucion = data.tipo_ejecucion || 'manual'
        data.observacion = data.observacion || ''
        data.idusuario = BigInt(1) // por conveniencia, pero nunca se actualiza en DB

        this.validate(data, error)

        return (error.data?.length === 0) ? this.dataAcces.update(id, data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    delete(id: BigInt): Promise<IFichajeOficina | IErrorResponse> {
        return this.dataAcces.delete(id)
    }

    private validate(data: IFichajeOficina, error: IErrorResponse) {
        // personal limpieza [user] (*)
        if (  !(ValidationsInstance.checkNumberMayorCero(parseInt(data.idusuario.toString())) ) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'idusuario',
                        label: 'Personal oficina', 
                        msg: 'Seleccionar un personal de oficina!!' } 
            )
        }

        // pendiente validar si el usuario es personal de oficina [sin prioridad]

        // pendiete validar que no permita ingresar varios registros el mismo dia por usuario

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
    }

    /**
     * Validación que se ejecuta cuando se registra desde la APP MOVIL
     * @param data 
     * @param error 
     * @param type_fichaje 
     */
    // private async validateFichajePendiente(data: IControlHorarioLimpieza, error: IErrorResponse, type_fichaje: string) {
    //     let _controlHLBusiness: ControlHorarioLimpiezaBusiness = new ControlHorarioLimpiezaBusiness(this.idUserLogin, 0, false)
    //     let lControlHL = await _controlHLBusiness.getMyFichajeLimpiezaToday()
        
    //     // Verifica si hay fichaje pendiente, se verifica por el estado = 1
    //     if (  (lControlHL as IErrorResponse).error ) {
    //         error.data?.push({   
    //             type: Constants.error_type_custom as ErrorFieldType,
    //             code: '', 
    //             field:'piso', 
    //             msg: 'No se puede verificar el fichaje del piso, por favor intentelo más tarde!!' 
    //         })
    //     } else if ( type_fichaje === Constants.entrada_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 1 ) {
    //         lControlHL = lControlHL as Array<IControlHorarioLimpieza>
    //         if ( lControlHL[0].idpiso == data.idpiso ) {
    //             error.data?.push({   
    //                 type: Constants.error_type_custom as ErrorFieldType,
    //                 code: '', 
    //                 field:'piso', 
    //                 msg: `La entrada del piso ${lControlHL[0].etiqueta_piso} ya ha sido registrada [${lControlHL[0].entrada}]` 
    //             })
    //         } else {
    //             error.data?.push({   
    //                 type: Constants.error_type_custom as ErrorFieldType,
    //                 code: '', 
    //                 field:'piso', 
    //                 msg: `Existe otro piso [${lControlHL[0].etiqueta_piso}] con fichaje entrada, por favor registrar la respectiva salida del piso. O comunicarse con ADE!` 
    //             })
    //         }
    //     } else if ( type_fichaje === Constants.salida_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 0 ) {
    //         error.data?.push({   
    //             type: Constants.error_type_custom as ErrorFieldType,
    //             code: '', 
    //             field:'piso', 
    //             msg: 'Por favor, fichar ENTRADA!' 
    //         })
    //     } else if ( type_fichaje === Constants.salida_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 1 ) {
    //         lControlHL = lControlHL as Array<IControlHorarioLimpieza>
    //         if ( lControlHL[0].idpiso != data.idpiso ) {
    //             error.data?.push({   
    //                 type: Constants.error_type_custom as ErrorFieldType,
    //                 code: '', 
    //                 field:'piso', 
    //                 msg: `El piso no corresponde con el del sistema [${lControlHL[0].etiqueta_piso}]` 
    //             })
    //         } else {
    //             data.id = lControlHL[0].id // Asigna el id del recurso a modificar
    //         }
    //     } else if ( (type_fichaje === Constants.entrada_fichar || type_fichaje === Constants.salida_fichar) && (lControlHL as Array<IControlHorarioLimpieza>).length > 1 ) {
    //         error.data?.push({   
    //             type: Constants.error_type_custom as ErrorFieldType,
    //             code: '', 
    //             field:'piso', 
    //             msg: 'Hay varias fichajes de pisos pendientes, por favor comunicarse con ADE!' 
    //         })
    //     }
    // }

    /**
     * Validacion que se ejecuta, cuando se registra desde la WEB [ADE]
     * @param data 
     * @param error 
     * @param type_fichaje 
     */
    // private async validateFichajePendienteByUser(data: IControlHorarioLimpieza, error: IErrorResponse, type_fichaje: string) {
    //     let _controlHLBusiness: ControlHorarioLimpiezaBusiness = new ControlHorarioLimpiezaBusiness(this.idUserLogin, 0, false)
    //     let lControlHL = await _controlHLBusiness.getMyFichajeLimpiezaByUserAndDate(data.idusuario, data.fecha!)
        
    //     // Verifica si hay fichaje pendiente, se verifica por el estado = 1
    //     if (  (lControlHL as IErrorResponse).error ) {
    //         error.data?.push({   
    //             type: Constants.error_type_custom as ErrorFieldType,
    //             code: '', 
    //             field:'idusuario', 
    //             label: 'Personal limpieza',
    //             msg: 'No se puede verificar el fichaje del piso, por favor intentelo más tarde!!' 
    //         })
    //     } else if ( type_fichaje === Constants.entrada_fichar && (lControlHL as Array<IControlHorarioLimpieza>).length === 1 ) {
    //         lControlHL = lControlHL as Array<IControlHorarioLimpieza>
    //         if ( lControlHL[0].idpiso == data.idpiso ) {
    //             error.data?.push({   
    //                 type: Constants.error_type_custom as ErrorFieldType,
    //                 code: '', 
    //                 field:'idusuario', 
    //                 label: 'Personal limpieza', 
    //                 msg: `La entrada del piso ${lControlHL[0].etiqueta_piso} ya ha sido registrada [${lControlHL[0].entrada}]` 
    //             })
    //         } else {
    //             error.data?.push({   
    //                 type: Constants.error_type_custom as ErrorFieldType,
    //                 code: '', 
    //                 field:'idusuario', 
    //                 label: 'Personal limpieza',
    //                 msg: `Existe otro piso [${lControlHL[0].etiqueta_piso}] con fichaje entrada, por favor registrar la respectiva salida del piso. O comunicarse con ADE!` 
    //             })
    //         }
    //     } else if ( (type_fichaje === Constants.entrada_fichar) && (lControlHL as Array<IControlHorarioLimpieza>).length > 1 ) {
    //         error.data?.push({   
    //             type: Constants.error_type_custom as ErrorFieldType,
    //             code: '', 
    //             field:'idusuario', 
    //             label: 'Personal limpieza', 
    //             msg: 'Hay varias fichajes de pisos pendientes, por favor comunicarse con ADE!' 
    //         })
    //     }
    // }

    // getMyFichajeLimpiezaToday(): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
    //     return this.dataAcces.getMyFichajeLimpiezaToday()
    // }

    // getMyFichajeLimpiezaByUserAndDate(idUser: BigInt, fecha: string): Promise<Array<IControlHorarioLimpieza> | IErrorResponse> {
    //     return this.dataAcces.getMyFichajeLimpiezaByUserAndDate(idUser, fecha)
    // }

    async fichar(data: IFichajeOficina): Promise<IFichajeOficina | IErrorResponse> {
        // Validaciones
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        // Comentar codigo en caso de fallar validación de token
        // **********************************************
        let msgdescifrado = UtilInstance.decryptMsg(data.token || '')
        let isvalid = UtilInstance.tokenFicharValido(msgdescifrado)

        if (  !isvalid ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'token',
                        label: 'Token', 
                        msg: 'Token invalido' } 
            )
        }
        // ********************************************

        // Lógica de llegada tarde (ejemplo: después de las 09:10)
        // Puedes ajustar la hora límite según tu necesidad
        if (data.entrada) {
            try {
                const horaLimite = "09:10";
                // Suponiendo formato entrada: 'YYYY-MM-DD HH:mm:ss'
                const horaEntrada = data.entrada.split(' ')[1]?.substring(0,5); // 'HH:mm'
                if (horaEntrada && horaEntrada > horaLimite) {
                    // Notificar por email
                    const subject = `Aviso: Llegada tarde de ${data.usuario || 'usuario'} (${data.fecha || ''})`;
                    const html = `<div><b>El usuario ${data.usuario || ''} ha fichado tarde el día ${data.fecha || ''} a las ${horaEntrada}.</b><br/>Por favor, revise la justificación si aplica.</div>`;
                    EmailServiceInstance.changeMailOptions(
                        'My City Home',
                        subject,
                        html
                    );
                    EmailServiceInstance.sendEmail();
                }
            } catch (e) {
                // No romper el flujo si hay error en notificación
                console.log('Error enviando email de llegada tarde:', e);
            }
        }

        // Capturar error si el usuario no vale
        //await this.validateFichajePendiente( data, error, Constants.entrada_fichar )

        return (error.data?.length === 0) ? this.dataAcces.fichar(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }


    async getJornada() : Promise <Array <IFichajeOficina> | IErrorResponse>{
        return this.dataAcces.getEsquemaxRol()
    }

    async updateJornada(id : BigInt , data : IUser) : Promise <IUser | IErrorResponse>{
        let error : IErrorResponse = {error : "Error, integridad de datos" , data : []}
        if(!ValidationsInstance.checkJornada(data.jornada)){
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'jornada',
                label: 'Jornada', 
                msg: 'Valor incorrecto, ha de ser Jornada Completa o Media Jornada' } 
    )
        }

        if(!ValidationsInstance.checkHorario(data.horario)){
            error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
                              code : '',
                              field: 'horario',
                              label : 'Horario',
                              msg : 'El horario ha de ser por las Mañanas, Tardes o Completo'
                        }
                        )
      }


      //Si la jornada es completa el horario ha de ser completo

      if(data.jornada == 'Jornada Completa' && data.horario != 'HC'){
        error.data?.push({type : Constants.error_type_custom as ErrorFieldType , 
              code : '',
              field : 'horario',
              label : 'Horario',
              msg : 'Si la jornada es Jornada completa, el horario ha de ser Horario Completo'})
       }


       //Si la jornada es media jornada el horario tiene que ser de mañanas o de tardes

       if(data.jornada == 'Media Jornada' && data.horario == 'HC'){
        error.data?.push({type : Constants.error_type_custom as ErrorFieldType,
                          code : '',
                          field : 'horario',
                          label : 'Horario',
                          msg : 'Si la jornada es Media Jornada, el horario ha de ser de Mañanas o de Tardes'})
       }

      
        return (error.data?.length === 0) ? this.dataAcces.updateJornada(id,data) : 
        new Promise <IErrorResponse> ((resolve , reject) => {resolve(error)})
    }


    getAllWithPagination(): Promise<Array<IFichajeOficina> | IErrorResponse> {
        return this.dataAcces.getAllWithPagination()
    }
}

export default FichajeOficinaBLL