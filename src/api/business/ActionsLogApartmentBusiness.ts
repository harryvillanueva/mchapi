import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ErrorFieldType, LocationDataType, StatusDataType, TypeCardType } from "../types/GlobalTypes"
import ActionsLogApartmentDataAccess from "../data/ActionsLogApartmentDataAccess"
import { IActionsLogApartment } from "../models/IActionsLogApartment"
import Constants from "../helpers/Constants"
import ValidationsInstance from "../helpers/Validations"

class ActionsLogApartmentBusiness implements IDataAccess<IActionsLogApartment> {
      public dataAcces: ActionsLogApartmentDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new ActionsLogApartmentDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IActionsLogApartment> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }
            switch(data.log_data.accion) {
                  case Constants.action_openPortal:
                        return this.insertAction_OpenPortal_ToggleLight(data)
                  case Constants.action_openLock:
                        return this.insertAction_Lock_SincronizarTime(data)
                  case Constants.action_newCode:
                        return this.insertActionNewCode(data)
                  case Constants.action_setCard:
                        const typeActionCard = data.key_data?.type_action || null 
                        const idKey = data.key_data?.id || null
                        // Valida el tipo de accion para la tarjeta
                        if ( !typeActionCard ) {
                              error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'type_action', 
                                    msg: 'El campo type_action [key_data] es obligatorio!' } 
                              )
                        } else ValidationsInstance.checkyTypeActionCard(typeActionCard) || 
                        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                                code: '', 
                                                field:'type_action', 
                                                msg: 'El campo type_action [key_data] es invalido.!' } 
                                          ) 
                        )

                        if (  typeActionCard && 
                              typeActionCard === Constants.card_type_action_add && 
                              !idKey ) return this.insertActionNewCard(data) // Add card 
                        if (  typeActionCard && 
                              typeActionCard === Constants.card_type_action_add && 
                              idKey
                              ) return this.insertActionExistCard(data) // update card
                        if (  typeActionCard && 
                              typeActionCard === Constants.card_type_action_delete
                              ) return this.insertActionDeleteCard(data) // delete card
                        // Error, no cumple con ninguna de las opciones para insertar una card
                        return new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
                  case Constants.action_syncTime:
                        return this.insertAction_Lock_SincronizarTime(data)
                  case Constants.action_toggleLight:
                        return this.insertAction_OpenPortal_ToggleLight(data)
                  default:
                        return new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
            }
      }

      update(id: BigInt, data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insertAction_Lock_SincronizarTime(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            // Validaciones antes de ingresar el log de OPENPORTAL
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validateActionLog(data, error)

            // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
            this.validateLog(data, error)
            // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

            return (error.data?.length === 0) ? this.dataAcces.insertAction_Lock_SincronizarTime(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertAction_OpenPortal_ToggleLight(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            // Validaciones antes de ingresar el log de OPENPORTAL
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validateActionLog(data, error)

            // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
            this.validateLog(data, error)
            // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

            return (error.data?.length === 0) ? this.dataAcces.insertAction_OpenPortal_ToggleLight(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertActionNewCode(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            // Validaciones antes de ingresar el log de OPENPORTAL
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validateActionLog(data, error)

            // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
            this.validateLog(data, error)      
            // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

            // :::::::::::::::: Validate code data :::::::::::::::::::::::::::::::::::::::::
            this.validateCodigo(data, error)
            // :::::::::::::::: End validate code data :::::::::::::::::::::::::::::::::::::

            return (error.data?.length === 0) ? this.dataAcces.insertActionNewCode(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertActionNewCard(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            // Validaciones antes de ingresar el log de OPENPORTAL
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validateActionLog(data, error)

            // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
            this.validateLog(data, error)      
            // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

            // :::::::::::::::: Validate key data :::::::::::::::::::::::::::::::::::::::::
            this.validateCard(data, error)
            // :::::::::::::::: End validate key data :::::::::::::::::::::::::::::::::::::

            return (error.data?.length === 0) ? this.dataAcces.insertActionNewCard(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertActionExistCard(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            // Validaciones antes de ingresar el log de OPENPORTAL
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validateActionLog(data, error)

            // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
            this.validateLog(data, error)      
            // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

            // :::::::::::::::: Validate key data :::::::::::::::::::::::::::::::::::::::::
            this.validateCard(data, error)
            // :::::::::::::::: End validate key data :::::::::::::::::::::::::::::::::::::

            return (error.data?.length === 0) ? this.dataAcces.insertActionExistCard(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertActionDeleteCard(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            // Validaciones antes de ingresar el log de OPENPORTAL
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validateActionLog(data, error)

            // :::::::::::::::: Validation log data ::::::::::::::::::::::::::::::::::::::::
            this.validateLog(data, error)      
            // :::::::::::::::: End validation log data ::::::::::::::::::::::::::::::::::::

            // :::::::::::::::: Validate key data :::::::::::::::::::::::::::::::::::::::::
            // key_data (*)
            if ( !data.key_data ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'key_data', 
                        msg: 'El campo key_data [key_data] es obligatorio!' } 
                  )
            } else {
                  // key_data.idqr (*)
                  if ( !data.key_data!.idqr ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'idqr', 
                              msg: 'El campo idqr [key_data] es obligatorio!' } 
                        )
                  } else data.key_data!.idqr.toLocaleUpperCase().match(/^M[0-9]{12}$/) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'idqr', 
                                          msg: 'El campo idqr [key_data] es invalido. Formato M123456789123 [12 dígitos]!' } 
                                    ) 
                  )
            }

            data.log_data.data.type = data.key_data!.type_action
            // :::::::::::::::: End validate key data :::::::::::::::::::::::::::::::::::::

            return (error.data?.length === 0) ? this.dataAcces.insertActionDeleteCard(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      private validateActionLog(data: IActionsLogApartment, error: IErrorResponse): void {
            // accion
            if ( !data.log_data.accion ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'accion', 
                        msg: 'El campo accion es obligatorio!' } 
                  )
            } else ValidationsInstance.checkAction( data.log_data.accion ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'accion', 
                                    msg: 'El campo accion es invalido!' } 
                              ) 
            )
      }

      private validateLog(data: IActionsLogApartment, error: IErrorResponse): void {
            if ( !data.log_data ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'log_data', 
                        msg: 'El campo log_data es obligatorio!' } 
                  )
            } else {
                  // log_data[accion] (*)
                  if ( !data.log_data.accion ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'accion', 
                              msg: 'El campo accion es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkAction( data.log_data.accion ) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'accion', 
                                          msg: 'El campo accion [log_data] es invalido!' } 
                                    ) 
                  )

                  // log_data[resultado] (*)
                  // Comentado por el momento, pero deberia existir una validacion
                  // Anterior era un string, ahora es un numero [culpa del pura vida]
                  /*if ( !data.log_data.resultado ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'resultado', 
                              msg: 'El campo resultado es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkResultAction( data.log_data.resultado ) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'resultado', 
                                          msg: 'El campo resultado [log_data] es invalido!' } 
                                    ) 
                  )*/

                  // log_data[usuario] (*): temporal for moment
                  if ( !data.log_data.usuario ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'usuario', 
                              msg: 'El campo usuario [log_data] es obligatorio!' } 
                        )
                  } else !ValidationsInstance.isEmpty( data.log_data.usuario ) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'usuario', 
                                          msg: 'El campo usuario [log_data] esta vacío!' } 
                                    ) 
                  )

                  // log_data[data] (*)
                  if ( !data.log_data.data ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'data', 
                              msg: 'El campo data [log_data] es obligatorio!' } 
                        )
                  } else {
                        data.log_data.data.user = data.log_data.usuario
                        data.log_data.data.fechaLog = data.log_data.fecha
                        data.log_data.data.timeStampLog = data.log_data.timestamp
                        data.log_data.data.cmd = data.log_data.accion
                        data.log_data.data.answer = data.log_data.resultado

                        // log_data.data[client] (*)
                        if ( !data.log_data.data.client ) {
                              error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'client', 
                                    msg: 'El campo client [log_data.data] es obligatorio!' } 
                              )
                        } else !ValidationsInstance.isEmpty( data.log_data.data.client ) || 
                        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                                code: '', 
                                                field:'client', 
                                                msg: 'El campo client [log_data.data] esta vacío!' } 
                                          ) 
                        )

                        // log_data.data[clientFrom] (*)
                        if ( !data.log_data.data.clientFrom ) {
                              error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'clientFrom', 
                                    msg: 'El campo clientFrom [log_data.data] es obligatorio!' } 
                              )
                        } else !ValidationsInstance.isEmpty( data.log_data.data.clientFrom ) || 
                        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                                code: '', 
                                                field:'clientFrom', 
                                                msg: 'El campo clientFrom [log_data.data] esta vacío!' } 
                                          ) 
                        )

                        // log_data.data[answer] (*)
                        if ( !data.log_data.data.msg ) {
                              error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'msg', 
                                    msg: 'El campo msg [log_data.data] es obligatorio!' } 
                              )
                        } else !ValidationsInstance.isEmpty( data.log_data.data.msg ) || 
                        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                                code: '', 
                                                field:'msg', 
                                                msg: 'El campo msg [log_data.data] esta vacío!' } 
                                          ) 
                        )
                  }
            }
      }

      private validateCodigo(data: IActionsLogApartment, error: IErrorResponse): void {
            // code_data (*)
            if ( !data.code_data ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'code_data', 
                        msg: 'El campo code_data [code_data] es obligatorio!' } 
                  )
            } else {
                  // code_data.codigo (*)
                  if ( !data.code_data.codigo ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'codigo', 
                              msg: 'El campo codigo [code_data] es obligatorio!' } 
                        )
                  } else data.code_data.codigo.match(/^[0-9]{6}$/) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'codigo', 
                                          msg: 'El campo codigo [code_data] debe contener 6 digitos!!' } 
                                    ) 
                  )

                  // code_data.idtipocodigo (*)
                  if ( !data.code_data.idtipocodigo ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'idtipocodigo', 
                              msg: 'El campo idtipocodigo [code_data] es obligatorio!' } 
                        )
                  }

                  // code_data.dias (*)
                  if ( !data.code_data.dias ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'dias', 
                              msg: 'El campo dias [code_data] es obligatorio!' } 
                        )
                  } else if ( !data.code_data.dias.toString().match(/[1-9]\d*$/) ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'dias', 
                              msg: 'El campo dias [code_data] debe ser un digito. [sin ceros a la izquierda]!' } 
                        )
                  } else ValidationsInstance.checkNumberRange(data.code_data.dias, 1, 300) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'dias', 
                                          msg: 'El campo dias [code_data] debe estar entre 1 y 300 días!' } 
                                    ) 
                  )

                  // code_data.timestampInicio (*)
                  if ( !data.code_data.timestamp_inicio ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'timestamp_inicio', 
                              msg: 'El campo startTime [code_data] es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkNumberMayorCero(data.code_data.timestamp_inicio) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'timestamp_inicio', 
                                          msg: 'El campo timestamp_inicio [code_data] debe ser mayor de 0!' } 
                                    ) 
                  )

                  // code_data.timestampFin (*)
                  if ( !data.code_data.timestamp_fin ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'timestamp_fin', 
                              msg: 'El campo timestamp_fin [code_data] es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkNumberMayorCero(data.code_data.timestamp_fin) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'timestamp_fin', 
                                          msg: 'El campo timestamp_fin [code_data] debe ser mayor de 0!' } 
                                    ) 
                  )

                  // PENDIENTE: validar que fechas sean como maximo menor a 2 días
                  // PENDIENTE: validar que las fechas fin sea mayor en dias, tal como se lo indica en el campo día. 

                  // code_data.fecha_vig_inicio (*)
                  if ( !data.code_data.fecha_vig_inicio ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'fecha_vig_inicio', 
                              msg: 'El campo fecha_vig_inicio [code_data] es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkFormatDateTimeSQL(data.code_data.fecha_vig_inicio) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'fecha_vig_inicio', 
                                          msg: 'El campo fecha_vig_inicio [code_data] es invalida!' } 
                                    ) 
                  )

                  // code_data.fecha_vig_fin (*)
                  if ( !data.code_data.fecha_vig_fin ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'fecha_vig_fin', 
                              msg: 'El campo fecha_vig_fin [code_data] es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkFormatDateTimeSQL(data.code_data.fecha_vig_fin) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'fecha_vig_fin', 
                                          msg: 'El campo fecha_vig_fin [code_data] es invalida!' } 
                                    ) 
                  )

                  // Luego de pasar todas las validaciones, se guarda en data [JSON]
                  data.log_data.data.startTime = data.code_data!.timestamp_inicio
                  data.log_data.data.endTime = data.code_data!.timestamp_fin
                  data.log_data.data.days = data.code_data!.dias
                  data.log_data.data.code = data.code_data!.codigo
            }
      }

      private validateCard(data: IActionsLogApartment, error: IErrorResponse): void {
            // key_data (*)
            if ( !data.key_data ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'key_data', 
                        msg: 'El campo key_data [key_data] es obligatorio!' } 
                  )
            } else {
                  // key_data.ubicacion (*)
                  if ( !data.key_data!.ubicacion ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'ubicacion', 
                              msg: 'El campo ubicacion [key_data] es obligatorio!' } 
                        )
                  } else (ValidationsInstance.checkLocationCard( data.key_data!.ubicacion as LocationDataType) ) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'ubicacion', 
                                          msg: 'El campo ubicacion [key_data] es invalido!!' } 
                                    ) 
                  )

                  // key_data.tipo_tarjeta (*)
                  if ( !data.key_data!.tipo_tarjeta ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'tipo_tarjeta', 
                              msg: 'El campo tipo_tarjeta [key_data] es obligatorio!' } 
                        )
                  } else (ValidationsInstance.checkyTypeCard( data.key_data!.tipo_tarjeta as TypeCardType) ) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'tipo_tarjeta', 
                                          msg: 'El campo tipo_tarjeta [key_data] es invalido!!' } 
                                    ) 
                  )

                  // key_data.idqr (*)
                  if ( !data.key_data!.idqr ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'idqr', 
                              msg: 'El campo idqr [key_data] es obligatorio!' } 
                        )
                  } else data.key_data!.idqr.toLocaleUpperCase().match(/^M[0-9]{12}$/) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'idqr', 
                                          msg: 'El campo idqr [key_data] es invalido. Formato M123456789123 [12 dígitos]!' } 
                                    ) 
                  )

                  // key_data.qr (*)
                  if ( !data.key_data!.qr ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'qr', 
                              msg: 'El campo qr [key_data] es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkUrl(data.key_data!.qr) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'qr', 
                                          msg: 'El campo qr [key_data] es invalido. Formato [(http|https)://xxxxx]!' } 
                                    )
                  )

                  // key_data.type_action (*)
                  if ( !data.key_data!.type_action ) {
                        error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'type_action', 
                              msg: 'El campo type_action [key_data] es obligatorio!' } 
                        )
                  } else ValidationsInstance.checkyTypeActionCard(data.key_data!.type_action) || 
                  ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                          code: '', 
                                          field:'type_action', 
                                          msg: 'El campo type_action [key_data] es invalido.!' } 
                                    ) 
                  ) 

                  // // Luego de pasar todas las validaciones, se guarda en data [JSON]
                  data.log_data.data.type = data.key_data!.type_action
                  data.log_data.data.Qr = data.key_data!.qr
                  data.log_data.data.idQr = data.key_data!.idqr
                  data.log_data.data.location = data.key_data!.ubicacion
                  data.log_data.data.typeTarjeta = data.key_data!.tipo_tarjeta
            }
      }
}

export default ActionsLogApartmentBusiness