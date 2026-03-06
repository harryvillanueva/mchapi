import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { IKey } from "../models/IKey"
import UtilInstance from "../helpers/Util"
import { ILock } from "../models/ILock"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"


class KeyDataAccess implements IDataAccess<IKey> {

      public client: DbConnection


      constructor(
            public idUserLogin: BigInt,
            public filterStatus: StatusDataType,
            public isTransactions: boolean,
            public infoExtra?: any) {
            this.client = new DbConnection(isTransactions)
      }

      /**
       * Retorna todas la llaves con sus respectivo piso, para app MCH [NO TOCAR]
       * @returns 
       */
      async getold(): Promise<Array<IKey> | IErrorResponse> {
            if (!this.infoExtra) this.infoExtra = { filter: {} }
            else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }



            let search_all = this.infoExtra.filter.search_all || '';

            const queryData = {
                  name: 'get-keys',
                  text: `SELECT ll.id, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr, ll.fecha_creacion, ll.observacion,
                         (CASE
                              WHEN count(dll.*) > 0 THEN jsonb_agg(dll.id_dispositivo_ref)
                              WHEN count(dll.*) = 0 THEN '[]'
                         END) AS pisos
                         FROM ${Constants.tbl_llave_sql} ll
                         LEFT JOIN (	SELECT llm.idllave, 
                                          (CASE
                                                WHEN p.id_dispositivo_ref IS NOT NULL THEN p.id_dispositivo_ref
                                                WHEN p.id_dispositivo_ref IS NULL THEN 'Libre'
                                          END) AS id_dispositivo_ref
                                          FROM ${Constants.tbl_llave_x_manija_sql} llm
                                          INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija
                                          INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1)
                                          LEFT JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso)
                         ) dll ON dll.idllave = ll.id
                         WHERE ll.estado >= $1 AND ll.estado IS NOT NULL 
                         AND ( 
                              UNACCENT(lower( replace(trim(ll.idqr ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                              UNACCENT(lower( replace(trim(ll.tipo_tarjeta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              UNACCENT(lower( replace(trim(ll.ubicacion ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              UNACCENT(lower( replace(trim(dll.id_dispositivo_ref),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              $2 = '')
                         GROUP BY ll.id
                         ORDER BY id ASC
                         LIMIT 50 
                         `,
                  values: [
                        this.filterStatus,
                        search_all === '' ? '' : `%${search_all}%`
                  ]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IKey>
      }

      async get(): Promise<Array<IKey> | IErrorResponse> {
            if (!this.infoExtra) this.infoExtra = { filter: {} }
            else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

            let limit = this.infoExtra.filter.limit || 200
            let offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1
            let search_all = this.infoExtra.filter.search_all || ''


            const queryData = {
                  name: 'get-keys',
                  // text: `SELECT keys.*, COALESCE(nl.nro_locks, 0) as nro_locks
                  // FROM (
                  //       SELECT ll.id, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr, ll.observacion,
                  //       (CASE
                  //             WHEN count(dll.*) > 0 THEN STRING_AGG(COALESCE(dll.id_dispositivo_ref, ''), ' | ')
                  //             WHEN count(dll.*) = 0 THEN 'Libre'
                  //             END
                  //       ) AS pisos_str,
                  //       ll.estado
                  //       FROM tbl_llave ll
                  //       LEFT JOIN (	
                  //                   SELECT llm.idllave, 
                  //                   (CASE
                  //                         WHEN p.id_dispositivo_ref IS NOT NULL THEN p.id_dispositivo_ref
                  //                         WHEN p.id_dispositivo_ref IS NULL THEN NULL
                  //                   END) AS id_dispositivo_ref
                  //                   FROM tbl_llave_x_manija llm
                  //                   INNER JOIN tbl_manija m ON m.iddispositivo = llm.idmanija
                  //                   INNER JOIN tbl_dispositivo d ON (d.id = m.iddispositivo AND d.estado = 1)
                  //                   INNER JOIN tbl_piso p ON (p.id = d.idpiso)
                  //       ) dll ON dll.idllave = ll.id
                  //       GROUP BY ll.id
                  // ) keys
                  //             LEFT JOIN (
                  //                                       SELECT llm.idllave, count(llm.idllave) as nro_locks
                  //                   FROM tbl_llave_x_manija llm
                  //                   INNER JOIN tbl_manija m ON m.iddispositivo = llm.idmanija
                  //                                       GROUP BY llm.idllave
                  //                     ) as nl ON nl.idllave = keys.id
                              
                  //  WHERE keys.estado >= $1 AND keys.estado IS NOT NULL AND 
                  //        ( 
                  //             UNACCENT(lower( replace(trim(keys.idqr ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                  //             UNACCENT(lower( replace(trim(keys.tipo_tarjeta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                  //             UNACCENT(lower( replace(trim(keys.ubicacion ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                  //             UNACCENT(lower( replace(trim(keys.pisos_str),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                  //             $2 = '')
                  //        ORDER BY keys.estado DESC , keys.id ASC
                  //        LIMIT $3 OFFSET $4
                  //        `,
                  text: `SELECT keys.*
                  FROM (
                        SELECT ll.id, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr, ll.observacion,
                        (CASE
                              WHEN count(dll.*) > 0 THEN jsonb_agg(dll.id_dispositivo_ref)
                              WHEN count(dll.*) = 0 THEN '[]'
                        END) AS pisos,
                        (CASE
                              WHEN count(dll.*) > 0 THEN STRING_AGG(COALESCE(dll.id_dispositivo_ref, ''), ' | ')
                              WHEN count(dll.*) = 0 THEN 'Libre'
                              END
                        ) AS pisos_str,
                        ll.estado
                        FROM ${Constants.tbl_llave_sql} ll
                        LEFT JOIN (	
                                    SELECT llm.idllave, 
                                    (CASE
                                          WHEN p.id_dispositivo_ref IS NOT NULL THEN p.id_dispositivo_ref
                                          WHEN p.id_dispositivo_ref IS NULL THEN 'Libre'
                                    END) AS id_dispositivo_ref
                                    FROM ${Constants.tbl_llave_x_manija_sql} llm
                                    INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija
                                    INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1)
                                    LEFT JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso)
                        ) dll ON dll.idllave = ll.id
                        GROUP BY ll.id
                  ) keys
                   WHERE keys.estado >= 1 AND keys.estado IS NOT NULL AND 
                   ( 
                        UNACCENT(lower( replace(trim(keys.idqr ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
                        UNACCENT(lower( replace(trim(keys.tipo_tarjeta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                        UNACCENT(lower( replace(trim(keys.ubicacion ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                        UNACCENT(lower( replace(trim(keys.pisos_str),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                        $1 = '')
                   ORDER BY keys.estado DESC , keys.id ASC
                   LIMIT $2 OFFSET $3
                   `,
                  values: [
                        search_all === '' ? '' : `%${search_all}%`,
                        limit,
                        offset
                  ]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IKey>
      }

      async getById(id: BigInt): Promise<IKey | IErrorResponse> {
            const queryData = {
                  name: 'get-keys-x-id',
                  text: `SELECT * 
                         FROM ${Constants.tbl_llave_sql} ll 
                         WHERE id = $1 AND ll.estado <= $2 AND ll.estado IS NOT NULL 
                         ORDER BY id ASC`,
                  values: [id, this.filterStatus]
            }

            // let lData: Array<IKey> = (await this.client.exeQuery(queryData)) as Array<IKey>

            // return lData[0]

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            return lData[0]
      }

      async insert(data: IKey): Promise<IKey | IErrorResponse> {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                  name: 'insert-key',
                  text: `INSERT INTO tbl_llave(
                        ubicacion, 
                        tipo_tarjeta, 
                        idqr, 
                        qr, 
                        fecha_creacion, 
                        fecha_ultimo_cambio,
                        observacion,
                        idusuario)
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
                  values: [data.ubicacion,
                  data.tipo_tarjeta,
                  data.idqr,
                  data.qr,
                  timeStampCurrent,
                  timeStampCurrent,
                  data.observacion,
                  this.idUserLogin
                  ]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            return lData[0]
      }

      async update(id: BigInt, data: IKey): Promise<IKey | IErrorResponse> {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                  name: 'update-key',
                  text: `UPDATE tbl_llave SET
                        ubicacion = $1, 
                        tipo_tarjeta = $2, 
                        idqr = $3, 
                        qr = $4,
                        imagenqr = $5,
                        estado = $6,
                        observacion = $7,  
                        fecha_ultimo_cambio = $8, 
                        idusuario = $9
                        WHERE id = $10 AND estado <= $11 RETURNING *`,
                  values: [data.ubicacion,
                  data.tipo_tarjeta,
                  data.idqr,
                  data.qr,
                  data.imagenqr,
                  data.estado,
                  data.observacion,
                        timeStampCurrent,
                  this.idUserLogin,
                        id,
                  this.filterStatus
                  ]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            return lData[0]
      }

      async delete(id: BigInt): Promise<IKey | IErrorResponse> {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                  name: 'update-key',
                  text: `UPDATE tbl_llave SET
                        estado = $1,
                        fecha_ultimo_cambio = $2, 
                        idusuario = $3
                        WHERE id = $4 AND estado <= $5 RETURNING *`,
                  values: [Constants.code_status_delete,
                        timeStampCurrent,
                  this.idUserLogin,
                        id,
                  this.filterStatus
                  ]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            return lData[0]
      }

      // Este metodos no deberia ir aqui
      async getLockXKey(id: number): Promise<Array<ILock> | IErrorResponse> {
            const queryData = {
                  name: 'get-lock-x-key',
                  text: `SELECT d.id, d.codigo, d.nombre, m.mac, d.ubicacion 
                         FROM tbl_llave_x_manija llm
                         JOIN tbl_manija m ON (m.iddispositivo = llm.idmanija)
                         JOIN tbl_dispositivo d ON (d.id = m.iddispositivo)
                         WHERE llm.idllave = $1 AND d.estado >= $2 AND d.estado IS NOT NULL 
                         ORDER BY d.id ASC`,
                  values: [id, this.filterStatus]
            }

            let lData: Array<ILock | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<ILock | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<ILock>
      }

      /**
       * Retorna data [keys] only for validate on insert of LOGS
       * @param idDevice Dispostivo del cual se obtiene las llaves asociadas
       * @param idqr ID llave que se desea verificar 
       * @returns 
       */
      async getKeysForValidateLogs(idDevice: BigInt, idqr: string): Promise<Array<IKey> | IErrorResponse> {
            const queryData = {
                  name: 'get-keys-device-validate-logs',
                  text: `(
                              SELECT ll.id, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr, 'Y' as is_mine 
                              FROM ${Constants.tbl_llave_sql} ll
                              INNER JOIN ${Constants.tbl_llave_x_manija_sql} llm ON (ll.id = llm.idllave) 
                              WHERE llm.idmanija = $1
                              GROUP BY ll.id
                              ORDER BY ll.qr ASC
                        )
                        UNION
                        (
                              SELECT ll.id, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr, 'N' as is_mine 
                              FROM ${Constants.tbl_llave_sql} ll
                              LEFT JOIN ${Constants.tbl_llave_x_manija_sql} llm ON (ll.id = llm.idllave) 
                              WHERE ll.idqr LIKE $2 AND ll.idqr NOT IN ( 
                                          SELECT ll.idqr 
                                          FROM ${Constants.tbl_llave_sql} ll
                                          INNER JOIN ${Constants.tbl_llave_x_manija_sql} llm ON (ll.id = llm.idllave) 
                                          WHERE llm.idmanija = $1
                                          GROUP BY ll.idqr)
                              GROUP BY ll.id
                              ORDER BY ll.qr ASC
                        )
                         `,
                  values: [idDevice, idqr]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IKey>
      }


      /**
     * Retorna los datos de control de limpieza
     * @returns 
     */
      async getAllWithPagination(): Promise<Array<IKey> | IErrorResponse> {
            if (!this.infoExtra) this.infoExtra = { filter: {} }
            else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

            let limit = this.infoExtra.filter.limit || 50
            let offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1
            let search_all = this.infoExtra.filter.search_all || ''

            const queryData = {
                  name: 'get-control-horario-limpieza-report-by-user',
                  text: ` 
                  select p.etiqueta, ll.* 
                  from ${Constants.tbl_llave_sql} ll
                  left join tbl_llave_x_manija llxm ON llxm.idllave = ll.id
                  left join tbl_dispositivo d on d.id = llxm.idmanija
                  left join tbl_piso p on p.id = d.idpiso
                  WHERE ll.estado >= $1 AND
                  ( 
                        UNACCENT(lower( replace(trim(ll.idqr ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                        UNACCENT(lower( replace(trim(COALESCE(p.etiqueta,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR 
                        $3 = ''
                  )
                  ORDER BY p.etiqueta ASC, ll.idqr ASC
                  LIMIT $1 OFFSET $2
                  `,
                  values: [
                        limit,
                        offset,
                        search_all === '' ? '' : `%${search_all}%`
                  ]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IKey>
      }
      //  * Retorna los datos de control de limpieza
      //  * @returns 
      //  */
      // async getAllWithPagination(): Promise<Array<IKey> | IErrorResponse> {
      //       if ( !this.infoExtra ) this.infoExtra = { filter: {} }
      //       else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

      //       let limit = this.infoExtra.filter.limit  || 50
      //       let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
      //       let search_all = this.infoExtra.filter.search_all  || ''

      //       const queryData  = {
      //       name: 'get-control-horario-limpieza-report-by-user',
      //       text: ` 
      //                   select p.etiqueta, ll.* 
      //                   from tbl_llave ll
      //                   left join tbl_llave_x_manija llxm ON llxm.idllave = ll.id
      //                   left join tbl_dispositivo d on d.id = llxm.idmanija
      //                   left join tbl_piso p on p.id = d.idpiso
      //                   WHERE ll.estado >= -1 AND
      //                   ( 
      //                         UNACCENT(lower( replace(trim(ll.idqr ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
      //                         UNACCENT(lower( replace(trim(COALESCE(p.etiqueta,'')),' ','') )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR 
      //                         $3 = ''
      //                   )
      //                   ORDER BY p.etiqueta ASC, ll.idqr ASC
      //                   LIMIT $1 OFFSET $2
      //                   `,
      //       values: [
      //                   limit,
      //                   offset,
      //                   search_all === '' ? '' : `%${search_all}%`
      //                   ]
      //       }

      //       let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

      //       if ( ({ ...lData[0] } as IErrorResponse).error ) return lData[0] as IErrorResponse

      //       return lData as Array<IKey>
      // }

      /**
       * Busca las llaves por query, uso desde server que administra ingreso de llaves
       * filter {idqr}
       * Retorna toda las llaves con sus pisos asociados, si no hay filtro retorna todas las llaves [total de 50]
       * @returns 
       */
      async getAllAppMCHWithFilter(): Promise<Array<IKey> | IErrorResponse> {
            if (!this.infoExtra) this.infoExtra = { filter: {} }
            else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

            let _idqr = this.infoExtra.filter.idqr || ''

            const queryData = {
                  name: 'get-keys-by-piso-device',
                  text: `
                        SELECT ll.id, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr,ll.observacion,
                         (CASE
                              WHEN count(dll.*) > 0 THEN jsonb_agg(dll.etiqueta)
                              WHEN count(dll.*) = 0 THEN '[]'
                         END) AS pisos
                         FROM ${Constants.tbl_llave_sql} ll
                         LEFT JOIN (	SELECT llm.idllave, 
                                          (CASE
                                                WHEN p.id_dispositivo_ref IS NOT NULL THEN p.id_dispositivo_ref
                                                WHEN p.id_dispositivo_ref IS NULL THEN 'Default'
                                          END) AS etiqueta
                                          FROM ${Constants.tbl_llave_x_manija_sql} llm
                                          INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija
                                          INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo)
                                          LEFT JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso)
                         ) dll ON dll.idllave = ll.id
                         WHERE ll.estado = 1 AND 
                         ll.estado IS NOT NULL AND
                         (ll.idqr LIKE $1 OR $1 = '')
                         GROUP BY ll.id
                         ORDER BY id ASC
                         LIMIT 50
                         `,
                  values: [_idqr]
            }

            let lData: Array<IKey | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IKey | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IKey>
      }
}

export default KeyDataAccess