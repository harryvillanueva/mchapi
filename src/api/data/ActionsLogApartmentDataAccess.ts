import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import { IActionsLogApartment } from "../models/IActionsLogApartment"
import { IModel } from "../helpers/IModel"
import UtilInstance from "../helpers/Util"
import Constants from "../helpers/Constants"
import { ILogsApartment } from "../models/ILogsApartment"
import { ICode } from "../models/ICode"
import { IKey } from "../models/IKey"
import KeyDataAccess from "./KeyDataAccess"
import { IErrorSql } from "../modelsextra/IErrorSql"

class ActionsLogApartmentDataAccess implements IDataAccess<IActionsLogApartment> {
      public client: DbConnection

      constructor( 
                        public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any ) {
            this.client = new DbConnection(isTransactions)
      }

      async get(): Promise<Array<IActionsLogApartment> | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      async getById(id: BigInt): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      async insert(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      async update(id: BigInt, data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      async delete(id: BigInt): Promise<IActionsLogApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      /**
       * Registra el LOG, cuando el usuario realiza la acción de Abrir Portal
       * En esta parte solo es necesario para información del arduino 
       * @param data 
       * @returns 
       */
      async insertAction_OpenPortal_ToggleLight(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  const queryData = {
                        name: 'insert-log-openportal',
                        text: `INSERT INTO ${Constants.tbl_logs_piso_sql}(
                              accion,
                              resultado, 
                              "timestamp", 
                              data,
                              fecha_creacion, 
                              iddispositivo,
                              idpiso,
                              idusuario,
                              fecha,
                              usuario,
                              tipo_ejecucion,
                              observacion)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
                        values: [
                                    data.log_data.accion,
                                    data.log_data.resultado,
                                    data.log_data.timestamp, 
                                    data.log_data.data, 
                                    timeStampCurrent, 
                                    data.log_data.iddispositivo, 
                                    data.log_data.idpiso, 
                                    this.idUserLogin,
                                    timeStampCurrent, 
                                    data.log_data.usuario,
                                    data.log_data.tipo_ejecucion,
                                    data.log_data.observacion
                              ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<ILogsApartment | IErrorResponse>

                  return lData
            })

            // Verifica si es un error
            if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

            const dataLog = { ...responseD[0] } as ILogsApartment
            // convert responseD to ILogsApartment
            const dataResponse: IActionsLogApartment = {
                  log_data: dataLog,
                  code_data: undefined,
                  key_data: undefined
            }

            return dataResponse
      }

      /**
       * Registra el LOG, cuando el usuario realiza las acciones: [Sincronizar hora] la hora actual de la manija y desbloquea
       * la manija [Abrir puerta]
       * @param data 
       * @returns 
       */
      async insertAction_Lock_SincronizarTime(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  const queryData = {
                        name: 'insert-log-lock-sincro',
                        text: `INSERT INTO ${Constants.tbl_logs_piso_sql}(
                              accion,
                              resultado, 
                              "timestamp", 
                              data,
                              fecha_creacion, 
                              iddispositivo,
                              idpiso,
                              idusuario,
                              fecha,
                              usuario,
                              tipo_ejecucion,
                              observacion,
                              dispositivo_ejecucion)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                                    data.log_data.accion,
                                    data.log_data.resultado,
                                    data.log_data.timestamp, 
                                    data.log_data.data, 
                                    timeStampCurrent, 
                                    data.log_data.iddispositivo, 
                                    data.log_data.idpiso, 
                                    this.idUserLogin,
                                    timeStampCurrent, 
                                    data.log_data.usuario,
                                    data.log_data.tipo_ejecucion,
                                    data.log_data.observacion,
                                    data.log_data.dispositivo_ejecucion
                              ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<ILogsApartment | IErrorResponse>

                  // Update data battery on Manija and fecha ultimo cambio on dispositivo

                  return lData
            })

            // Verifica si es un error
            if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

            const dataLog = { ...responseD[0] } as ILogsApartment
            // convert responseD to ILogsApartment
            const dataResponse: IActionsLogApartment = {
                  log_data: dataLog,
                  code_data: undefined,
                  key_data: undefined
            }

            return dataResponse
      }

      /**
       * Registra el LOG, cuando el usuario genera un codigo para la manija [NewCode]. El código es temporal, con un 
       * tiempo limite de vigencia
       * @param data 
       * @returns 
       */
      async insertActionNewCode(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  // helper to run queries with debug logging on error
                  const runQuery = async (queryData: any) => {
                        try {
                              return (await client.query(queryData)).rows
                        } catch (err: any) {
                              try {
                                    console.error('insertActionNewCode - DB query error', {
                                          message: err.message,
                                          code: err.code,
                                          detail: err.detail,
                                          queryName: queryData && queryData.name,
                                          queryText: queryData && queryData.text,
                                          queryValues: queryData && queryData.values
                                    })
                              } catch (e) {
                                    console.error('insertActionNewCode - DB query error (failed to stringify)', err)
                              }
                              throw err
                        }
                  }
                  // Determinar id de la manija (puede venir en log_data.iddispositivo o en code_data.idmanija)
                  const idManija = (data.log_data && (data.log_data as any).iddispositivo) || (data.code_data && data.code_data.idmanija) || BigInt(0)
                  // Validación básica
                  if (!idManija || idManija === 0) throw { code: 'CUSTOM', detail: '(idmanija)', msg: 'No se indicó idmanija/iddispositivo en el payload' } as IErrorSql

                  // Insert codigo
                  let queryData = {
                        name: 'insert-codigo',
                        text: `INSERT INTO ${Constants.tbl_codigo_sql}(
                              codigo,
                              dias, 
                              "timestamp_inicio",
                              "timestamp_fin",
                              fecha_creacion, 
                              idmanija,
                              idusuario,
                              fecha_vig_inicio,
                              fecha_vig_fin,
                              idtipocodigo)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                        values: [
                                    data.code_data!.codigo,
                                    data.code_data!.dias,
                                    data.code_data!.timestamp_inicio, 
                                    data.code_data!.timestamp_fin, 
                                    timeStampCurrent, 
                                    idManija, 
                                    this.idUserLogin, 
                                    data.code_data!.fecha_vig_inicio,
                                    data.code_data!.fecha_vig_fin,
                                    data.code_data!.idtipocodigo
                              ]
                  }
                  let lDataCode = await runQuery(queryData) as Array<ICode | IErrorResponse>
                  let codeDB = lDataCode[0] as ICode

                  let idCodeDB = codeDB.id || BigInt(0)
                  // Update manija, codigo current, and battery[Pendiente] [siemepre quedara para el código temporal]
                  if ( data.code_data && data.code_data!.codigo_tipocodigo === Constants.type_code_temporal ) {
                        queryData = {
                              name: 'update-manija',
                              text: `UPDATE ${Constants.tbl_manija_sql} SET
                                    idcodigo = $1
                                    WHERE iddispositivo = $2 RETURNING *`,
                              values: [ idCodeDB, idManija ]
                        }
                        await runQuery(queryData)
                  }

                  // Cambiamos el estado a 0 de todos los códigos del mismo tipo
                  // Siempre debe existir un código activo por cada tipo de código
                  queryData = {
                        name: 'update-codigo-estado',
                        text: `UPDATE ${Constants.tbl_codigo_sql} SET
                               estado = 0
                               WHERE idmanija = $1 AND idtipocodigo = $2 AND estado = 1 AND id <> $3  RETURNING *`,
                        values: [ idManija, data.code_data!.idtipocodigo, idCodeDB ]
                  }
                  await runQuery(queryData)

                  // Update actualización del dispositivo
                  // Actualizamos fecha_ultimo_cambio del dispositivo (siempre referenciado por iddispositivo)
                  const idDevice = (data.log_data && (data.log_data as any).iddispositivo) || idManija
                  queryData = {
                        name: 'update-dispositivo',
                        text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                               fecha_ultimo_cambio = $1
                               WHERE id = $2 RETURNING *`,
                        values: [ timeStampCurrent, idDevice ]
                  }
                  await runQuery(queryData)

                  // insert logs
                  queryData = {
                        name: 'insert-log-newcode',
                        text: `INSERT INTO ${Constants.tbl_logs_piso_sql}(
                              accion,
                              resultado, 
                              "timestamp", 
                              data,
                              fecha_creacion, 
                              iddispositivo,
                              idpiso,
                              idusuario,
                              fecha,
                              usuario,
                              idcodigo,
                              tipo_ejecucion,
                              observacion)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                                    data.log_data.accion,
                                    data.log_data.resultado,
                                    data.log_data.timestamp, 
                                    data.log_data.data, 
                                    timeStampCurrent, 
                                    data.log_data.iddispositivo, 
                                    data.log_data.idpiso, 
                                    this.idUserLogin,
                                    timeStampCurrent, 
                                    data.log_data.usuario,
                                    idCodeDB,
                                    data.log_data.tipo_ejecucion,
                                    data.log_data.observacion
                              ]
                  }
                  let lData = await runQuery(queryData) as Array<ILogsApartment | IErrorResponse>

                  const dataResponse: IActionsLogApartment = {
                        log_data: lData[0] as ILogsApartment,
                        code_data: codeDB,
                        key_data: undefined
                  }

                  return [ dataResponse ]
            })

            // Verifica si es un error
            if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

            const dataResponse = { ...responseD[0] } as IActionsLogApartment

            return dataResponse
      }

      /**
       * Registra el LOG, cuando el usuario agrega una Tarjeta Nueva [NewCard/Add(1)], que aún no existe en la DB.
       * @param data 
       * @returns 
       */
      async insertActionNewCard(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  
                  // Insert key
                  let queryData = {
                        name: 'insert-key',
                        text: `INSERT INTO ${Constants.tbl_llave_sql}(
                              ubicacion,
                              tipo_tarjeta, 
                              idqr,
                              qr,
                              fecha_creacion, 
                              fecha_ultimo_cambio,
                              idusuario)
                              VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                        values: [
                                    data.key_data!.ubicacion,
                                    data.key_data!.tipo_tarjeta,
                                    data.key_data!.idqr, 
                                    data.key_data!.qr, 
                                    timeStampCurrent,
                                    timeStampCurrent, 
                                    this.idUserLogin
                              ]
                  }
                  let lDataCode = (await client.query(queryData)).rows as Array<IKey | IErrorResponse>
                  let keyDB = lDataCode[0] as IKey

                  // Update manija, codigo current, and battery[Pendiente]
                  let idKeyDB = keyDB.id || BigInt(0)
                  let idDevice = data.log_data.iddispositivo || BigInt(0)
                  queryData = {
                        name: 'insert-key-manija',
                        text: `INSERT INTO ${Constants.tbl_llave_x_manija_sql}(idllave, idmanija)
                               VALUES($1, $2) RETURNING *`,
                        values: [ idKeyDB, idDevice ]
                  }
                  await client.query(queryData)

                  // insert logs
                  queryData = {
                        name: 'insert-log-newcard',
                        text: `INSERT INTO ${Constants.tbl_logs_piso_sql}(
                              accion,
                              resultado, 
                              "timestamp", 
                              data,
                              fecha_creacion, 
                              iddispositivo,
                              idpiso,
                              idusuario,
                              fecha,
                              usuario,
                              idllave,
                              tipo_ejecucion,
                              observacion)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                                    data.log_data.accion,
                                    data.log_data.resultado,
                                    data.log_data.timestamp, 
                                    data.log_data.data, 
                                    timeStampCurrent, 
                                    data.log_data.iddispositivo, 
                                    data.log_data.idpiso, 
                                    this.idUserLogin,
                                    timeStampCurrent, 
                                    data.log_data.usuario,
                                    idKeyDB,
                                    data.log_data.tipo_ejecucion,
                                    data.log_data.observacion
                              ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<ILogsApartment | IErrorResponse>

                  const dataResponse: IActionsLogApartment = {
                        log_data: lData[0] as ILogsApartment,
                        code_data: undefined,
                        key_data: keyDB
                  }

                  return [ dataResponse ]
            })

            // Verifica si es un error
            if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

            const dataResponse = { ...responseD[0] } as IActionsLogApartment

            return dataResponse
      }

      /**
       * Registra el LOG, cuando el usuario agrega una tarjeta [NewCard/Add(1)], la tarjeta ya existe en la DB
       * @param data 
       * @returns 
       */
      async insertActionExistCard(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let keyDA = new KeyDataAccess(this.idUserLogin, -1, false)
            let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  let dataKeys = await keyDA.getKeysForValidateLogs(data.log_data.iddispositivo || BigInt(0), data.key_data!.idqr)
                  // Si hay error indicar que no se puede verificar el error
                  if ( (dataKeys as IErrorResponse).error ) throw { code: 'CUSTOM', detail: '(idqr)', msg: 'No se puede verificar la integridad de la llave' } as IErrorSql
                  dataKeys = dataKeys as Array<IKey>
                  // Si no hay datos, indicar que no se puede verificar el error
                  if ( dataKeys.length === 0 ) throw { code: 'CUSTOM', detail: '(idqr)', msg: 'No se puede verificar la existencia de la llave' } as IErrorSql
                  let keyDataValid = dataKeys.filter(el => el.idqr.toLocaleLowerCase() === data.key_data!.idqr.toLocaleLowerCase())[0]
                  // Si luego de filtar no encuentra la llave, indicar que la llave no existe en DB
                  if ( !keyDataValid ) throw { code: 'CUSTOM', detail: '(idqr)', msg: 'La llave no existe!!' } as IErrorSql
                  
                  // Validación, la relacion entre lock & key exist // COMENTADO TEMPORALMENTE, SE DA OTRO USO
                  // if ( (keyDataValid.tipo_tarjeta === Constants.card_type_normal || 
                  //       keyDataValid.tipo_tarjeta === Constants.card_type_maestra) &&
                  //       keyDataValid.is_mine === 'Y' )
                  //       throw { code: 'CUSTOM', detail: '(idqr)', msg: 'La llave ya ha sido agregada!!' } as IErrorSql
                  
                  // Actualizamos el id al obtener el registro al filtar por IDQR
                  data.key_data!.id = keyDataValid!.id
                  
                  // Update key
                  let queryData = {
                        name: 'update-card',
                        text: `UPDATE ${Constants.tbl_llave_sql} SET
                              ubicacion = $1,
                              tipo_tarjeta = $2,
                              qr = $3, 
                              fecha_ultimo_cambio = $4,
                              idusuario = $5
                              WHERE id = $6 RETURNING *`,
                        values: [
                                    data.key_data!.ubicacion,
                                    data.key_data!.tipo_tarjeta,
                                    data.key_data!.qr, 
                                    timeStampCurrent, 
                                    this.idUserLogin,
                                    data.key_data!.id
                              ]
                  }
                  let lDataCode = (await client.query(queryData)).rows as Array<IKey | IErrorResponse>
                  let keyDB = lDataCode[0] as IKey

                  // PENDIENTE: Update manija, battery[Pendiente]

                  // INSERTA LLAVE A MANIJA [VALIDACION PREVIA EXECUTADA]
                  let idKeyDB = keyDB.id || BigInt(0)
                  let idDevice = data.log_data.iddispositivo || BigInt(0)

                  // Guarda la ralación si la llave no esta asociada
                  if ( (keyDataValid.tipo_tarjeta === Constants.card_type_normal || 
                        keyDataValid.tipo_tarjeta === Constants.card_type_maestra) &&
                        keyDataValid.is_mine === 'N' ) {
                        let queryData = {
                              name: 'insert-key-manija',
                              text: `INSERT INTO ${Constants.tbl_llave_x_manija_sql}(idllave, idmanija)
                                          VALUES($1, $2) RETURNING *`,
                              values: [ idKeyDB, idDevice ]
                        }
                        await client.query(queryData)
                  }

                  // insert logs
                 let queryDataLogs = {
                        name: 'insert-log-newkey',
                        text: `INSERT INTO ${Constants.tbl_logs_piso_sql}(
                              accion,
                              resultado, 
                              "timestamp", 
                              data,
                              fecha_creacion, 
                              iddispositivo,
                              idpiso,
                              idusuario,
                              fecha,
                              usuario,
                              idllave,
                              tipo_ejecucion,
                              observacion)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                                    data.log_data.accion,
                                    data.log_data.resultado,
                                    data.log_data.timestamp, 
                                    data.log_data.data, 
                                    timeStampCurrent, 
                                    data.log_data.iddispositivo, 
                                    data.log_data.idpiso, 
                                    this.idUserLogin,
                                    timeStampCurrent, 
                                    data.log_data.usuario,
                                    idKeyDB,
                                    data.log_data.tipo_ejecucion,
                                    data.log_data.observacion
                              ]
                  }
                  let lData = (await client.query(queryDataLogs)).rows as Array<ILogsApartment | IErrorResponse>

                  const dataResponse: IActionsLogApartment = {
                        log_data: lData[0] as ILogsApartment,
                        code_data: undefined,
                        key_data: keyDB
                  }

                  return [ dataResponse ]
            })

            // Verifica si es un error
            if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

            const dataResponse = { ...responseD[0] } as IActionsLogApartment

            return dataResponse
      }

      /**
       * Registra LOG, cuando el usuario elimina una tarjeta de la manija [NewCard/Delete(2)]. La tarjeta debe existir en la DB
       * y debe estar asociada a la manija
       * @param data 
       * @returns 
       */
      async insertActionDeleteCard(data: IActionsLogApartment): Promise<IActionsLogApartment | IErrorResponse> {
            let keyDA = new KeyDataAccess(this.idUserLogin, -1, false)
            let responseD = await this.client.execQueryPool( async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  
                  let dataKeys = await keyDA.getKeysForValidateLogs(data.log_data.iddispositivo || BigInt(0), data.key_data!.idqr)
                  // Si hay error indicar que no se puede verificar el error
                  if ( (dataKeys as IErrorResponse).error ) throw { code: 'CUSTOM', detail: '(idqr)', msg: 'No se puede verificar la integridad de la llave' } as IErrorSql
                  dataKeys = dataKeys as Array<IKey>
                  // Si no hay datos, indicar que no se puede verificar el error
                  if ( dataKeys.length === 0 ) throw { code: 'CUSTOM', detail: '(idqr)', msg: 'No se puede verificar la existencia de la llave' } as IErrorSql
                  let keyDataValid = dataKeys.filter(el => el.idqr.toLocaleLowerCase() === data.key_data!.idqr.toLocaleLowerCase())[0]
                  // Si luego de filtar no encuentra la llave, indicar que la llave no existe en DB
                  if ( !keyDataValid ) throw { code: 'CUSTOM', detail: '(idqr)', msg: 'La llave no existe!!' } as IErrorSql
                  
                  // Verificacion que la llave pertenezca a la manija. COMENTADO, SE DARA OTRO USO
                  // if ( keyDataValid.is_mine === 'N' )
                  //       throw { code: 'CUSTOM', detail: '(idqr)', msg: 'La llave no pertenece a la manija!!' } as IErrorSql
                  
                  // Actualizamos el id al obtener el registro al filtar por IDQR
                  data.key_data!.id = keyDataValid!.id
                  data.log_data.data.Qr = keyDataValid!.qr
                  data.log_data.data.idQr = keyDataValid!.idqr
                  data.log_data.data.location = keyDataValid!.ubicacion
                  data.log_data.data.typeTarjeta = keyDataValid!.tipo_tarjeta

                  // PENDIENTE: Update manija, battery[Pendiente]

                  // ELIMINA LLAVE A MANIJA [VALIDACION PREVIA EXECUTADA]
                  let idKeyDB = keyDataValid!.id || BigInt(0)
                  let idDevice = data.log_data.iddispositivo || BigInt(0)

                  // Si la llave esta asociada al piso, se procede con la eliminación
                  if ( keyDataValid.is_mine === 'Y' ) {
                        let queryData = {
                              name: 'delete-key-manija',
                              text: `DELETE FROM ${Constants.tbl_llave_x_manija_sql} WHERE idllave = $1 AND idmanija = $2`,
                              values: [ idKeyDB, idDevice ]
                        }
                        await client.query(queryData)
                  }

                  // insert logs
                  let queryData = {
                        name: 'insert-log-newkey',
                        text: `INSERT INTO ${Constants.tbl_logs_piso_sql}(
                              accion,
                              resultado, 
                              "timestamp", 
                              data,
                              fecha_creacion, 
                              iddispositivo,
                              idpiso,
                              idusuario,
                              fecha,
                              usuario,
                              idllave,
                              tipo_ejecucion,
                              observacion
                              )
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                        values: [
                                    data.log_data.accion,
                                    data.log_data.resultado,
                                    data.log_data.timestamp, 
                                    data.log_data.data, 
                                    timeStampCurrent, 
                                    data.log_data.iddispositivo, 
                                    data.log_data.idpiso, 
                                    this.idUserLogin,
                                    timeStampCurrent, 
                                    data.log_data.usuario,
                                    idKeyDB,
                                    data.log_data.tipo_ejecucion,
                                    data.log_data.observacion
                              ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<ILogsApartment | IErrorResponse>

                  const dataResponse: IActionsLogApartment = {
                        log_data: lData[0] as ILogsApartment,
                        code_data: undefined,
                        key_data: undefined
                  }

                  return [ dataResponse ]
            })

            // Verifica si es un error
            if ( ({ ...responseD[0] } as IErrorResponse).error ) return responseD[0] as IErrorResponse

            const dataResponse = { ...responseD[0] } as IActionsLogApartment

            return dataResponse
      }
}

export default ActionsLogApartmentDataAccess