import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import UtilInstance from "../helpers/Util"
import { IUser } from "../models/IUser"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { StatusDataType, jornadaType } from "../types/GlobalTypes"
import { IModel } from "../helpers/IModel"
import { IRole } from "../models/IRole"

class UserDataAccess implements IDataAccess<IUser> {
      public client: DbConnection

      constructor(
            public idUserLogin: BigInt,
            public filterStatus: StatusDataType,
            public isTransactions: boolean,
            public infoExtra?: any) {
            this.client = new DbConnection(isTransactions)
      }

      /**
       * NO TOCAR
       * @returns 
       */
      async get(): Promise<Array<IUser> | IErrorResponse> {
            const queryData = {
                  name: 'get-users',
                  text: `SELECT usu.id, usu.ref_lead, usu.nombre, usu.apellido, usu.email, usu.estado, usu.username, usu.idusuario,
                         usu.telefono, usu.nombre_completo,
                         (CASE
                              WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                              WHEN count(srol.*) = 0 THEN '[]'
                         END) AS roles
                         FROM ${Constants.tbl_usuario_sql} usu
                         LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                                    FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                                    JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                                    JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                                    ) srol on (srol.idusuario = usu.id)
                         WHERE usu.estado >= $1 AND usu.estado IS NOT NULL
                         GROUP BY usu.id
                         ORDER BY usu.nombre, usu.apellido ASC
                         `,
                  values: [this.filterStatus]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }

      /**
       * Retorna todos los usuarios del sistema. Uso para rol de [SUPERADMIN, ADMIN]
       * @returns 
       */
      async getWithPagination(): Promise<Array<IUser> | IErrorResponse> {
            if (!this.infoExtra) this.infoExtra = { filter: {} }
            else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

            // let search_all = this.infoExtra.filter.search_all  || ''
            let limit = this.infoExtra.filter.limit || 50
            let offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1
            let search_all = this.infoExtra.filter.search_all || ''

            const queryData = {
                  name: 'get-users-admin',
                  text: `
                         SELECT dt.*
                         FROM (
                              SELECT usu.id, usu.ref_lead, usu.email, usu.estado, usu.username,
                              usu.nombre_completo,
                              STRING_AGG(srol.nombre, ' | ') as nombrerol_str
                              FROM ${Constants.tbl_usuario_sql} usu
                              LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                                          FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                                          JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                                          JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                                          ) srol on (srol.idusuario = usu.id)
                              WHERE usu.estado >= $1 AND usu.estado IS NOT NULL
                              GROUP BY usu.id
                         ) dt 
                         WHERE ( 
                              UNACCENT(lower( replace(trim(dt.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              UNACCENT(lower( replace(trim(dt.nombrerol_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                              UNACCENT(lower( replace(trim(dt.username ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                              $2 = ''
                        )
                        ORDER BY dt.estado DESC, dt.nombrerol_str ASC, dt.username ASC
                        LIMIT $3 OFFSET $4
                         `,
                  values: [
                        this.filterStatus,
                        search_all === '' ? '' : `%${search_all}%`,
                        limit,
                        offset
                  ]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }

      /**
       * Verificar que usuarios solo debe retornar 
       * @returns 
       */
      async getRRHH(): Promise<Array<IUser> | IErrorResponse> {
            const queryData = {
                  name: 'get-users-rrhh',
                  text: `SELECT usu.id, usu.ref_lead, usu.nombre, usu.apellido, usu.email, usu.estado, usu.username, usu.idusuario,
                         usu.telefono, usu.nombre_completo, usu.ref_lead,
                         (CASE
                              WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                              WHEN count(srol.*) = 0 THEN '[]'
                         END) AS roles
                         FROM ${Constants.tbl_usuario_sql} usu
                         LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                                    FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                                    JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                                    JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                                    ) srol on (srol.idusuario = usu.id)
                         WHERE usu.estado >= $1 AND usu.estado IS NOT NULL AND srol.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin')
                         GROUP BY usu.id
                         ORDER BY usu.estado DESC, usu.username ASC
                         `,
                  values: [this.filterStatus]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }



      /**
       * NO TOCAR METHODO
       * @param id 
       * @returns 
       */
      async getById(id: BigInt): Promise<IUser | IErrorResponse> {
            const queryData = {
                  name: 'get-user-x-id',
                  text: `SELECT usu.id, usu.nombre, usu.apellido, usu.email, usu.estado, usu.username, usu.idusuario,
                         usu.telefono, usu.nombre_completo, usu.ref_lead,
                         (CASE
                              WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                              WHEN count(srol.*) = 0 THEN '[]'
                         END) AS roles
                         FROM ${Constants.tbl_usuario_sql} usu
                         LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                                    FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                                    JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                                    JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                                    WHERE usu.id = $1
                                    ) srol on (srol.idusuario = usu.id)
                         WHERE usu.id = $1 AND usu.estado >= $2 AND usu.estado IS NOT NULL
                         GROUP BY usu.id`,
                  values: [id, this.filterStatus]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            return lData[0]
      }



      /**
       * NO TOCAR: Pendiente agregar telefono, nombre_completo
       * @param data 
       * @returns 
       */
      async insert(data: IUser): Promise<IUser | IErrorResponse> {
            let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  let _nombreCompleto = data.nombre_completo ? data.nombre_completo!.trim() : `${data.nombre.trim()} ${data.apellido.trim()}`
                  const queryData = {
                        name: 'insert-user',
                        text: `INSERT INTO ${Constants.tbl_usuario_sql}(
                              username,
                              email, 
                              password, 
                              nombre, 
                              apellido, 
                              fecha_creacion, 
                              fecha_ultimo_cambio,
                              idusuario,
                              nombre_completo)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
                        values: [
                              data.username,
                              data.email,
                              data.password,
                              data.nombre,
                              data.apellido,
                              timeStampCurrent,
                              timeStampCurrent,
                              this.idUserLogin,
                              `${_nombreCompleto}`
                        ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>

                  let userDB = lData[0]
                  if (userDB) {
                        const idDataDB = (userDB as IUser).id!
                        const queryData = {
                              name: 'insert-user-x-rol',
                              text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
                                          VALUES($1,$2) RETURNING *`,
                              values: [idDataDB, data.idrol]
                        }
                        let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                        if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>
                  }

                  return lData
            })

            return (responseD[0]) as IUser | IErrorResponse
      }


      async getByIdRRHH(id: BigInt): Promise<IUser | IErrorResponse> {
            const queryData = {
                  name: 'get-user-x-id-rrhh',
                  text: `SELECT usu.id, usu.nombre, usu.apellido, usu.email, usu.estado, usu.username, usu.idusuario, usu.telefono, usu.nombre_completo, usu.ref_lead,
                  (CASE
                       WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                       WHEN count(srol.*) = 0 THEN '[]'
                  END) AS roles
                  FROM ${Constants.tbl_usuario_sql} usu
                  LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                             FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                             JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                             JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                             WHERE usu.id = $1
                             ) srol on (srol.idusuario = usu.id)
                  WHERE usu.id = $1 AND usu.estado >= $2 AND usu.estado IS NOT NULL AND srol.idrol NOT IN ('propietario' , 'admin' , 'superadmin')
                  GROUP BY usu.id`,
                  values: [id, this.filterStatus]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            return lData[0]
      }









      // METODOS DE RECURSOS HUMANOS

      /**NO TOCAR ESTA POR REVISAR Y VER SI SE IMPLEMENTA LOS METODO PARA RECURSOS HUMANOS */
      async getAllRRHH(): Promise<Array<IUser> | IErrorResponse> {

            const queryData = {
                  name: 'get-usuarios-RRHH',
                  text: `SELECT us.* , ur.correo_personal , ur.jornada
                        FROM
                        (SELECT usu.id, usu.ref_lead, usu.nombre, usu.apellido, usu.email, usu.estado, usu.username, usu.idusuario,
                        usu.nombre_completo, usu.ref_lead,
                        (CASE
                        WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                        WHEN count(srol.*) = 0 THEN '[]'
                        END) AS roles
                        FROM ${Constants.tbl_usuario_sql} usu
                        LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                        FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                        JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                        JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                        ) srol on (srol.idusuario = usu.id)
                        WHERE usu.estado >= $1 AND usu.estado IS NOT NULL AND srol.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin','limpieza', 'mantenimiento')
                        GROUP BY usu.id							
                        ) as us
                        LEFT JOIN ${Constants.tbl_usuario_rrhh_sql} ur ON us.id = ur.id
                        ORDER BY us.estado DESC, us.username ASC`,

                  values: [this.filterStatus]

            }


            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }

      async getByIdRRHH_(id: BigInt): Promise<IUser | IErrorResponse> {
            const queryData = {
                  name: "get-byId-usuarios-RRHH",
                  text: `SELECT us.* , ur.correo_personal , ur.detalles , ur.fecha_inicio , to_char( ur.alta_ss, 'YYYY-MM-DD') as alta_ss, exu.etapa, ur.jornada,
                  to_char( ur.cumpleanyos, 'YYYY-MM-DD') as cumpleanyos, ur.horario
                
                  FROM
                       (
                       SELECT usu.id, usu.email, usu.estado, usu.username, usu.idusuario, usu.nombre_completo,
                        (CASE
                        WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                        WHEN count(srol.*) = 0 THEN '[]'
                        END) AS roles
                  FROM tbl_usuario usu
                  LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre 
                          FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                          JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                          JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                          WHERE usu.id = $1
                          ) srol on (srol.idusuario = usu.id)
                          WHERE usu.id = $1 AND usu.estado >= $2 AND usu.estado IS NOT NULL AND srol.idrol NOT IN ('propietario' , 'admin' , 'superadmin','limpieza', 'mantenimiento')
               GROUP BY usu.id) as us
                       LEFT JOIN ${Constants.tbl_usuario_rrhh_sql} ur ON us.id = ur.id
                       LEFT JOIN ${Constants.tbl_etapa_usuario_rrhh_sql} exu ON us.id = exu.idusuario AND exu.estado = $2`,



                  values: [id, 1]
            }
            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            return lData[0]
      }


      async getAllRRHHWithPagination(): Promise<Array<IUser> | IErrorResponse> {
            if (!this.infoExtra) this.infoExtra = { filter: {} }
            else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

            let limit = this.infoExtra.filter.limit || 50
            let offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1
            let search_all = this.infoExtra.filter.search_all || ''

            const queryData = {
                  name: 'get-users-rrhh-p',
                  text: `	
                SELECT * FROM	
                (SELECT us.* , ur.correo_personal , ur.jornada
                FROM
                (SELECT usu.id, usu.email, usu.estado, usu.username, usu.idusuario,
                usu.nombre_completo,
                (CASE
                WHEN count(srol.*) > 0 THEN jsonb_agg(json_build_object('id', srol.idrol, 'nombre', srol.nombre))
                WHEN count(srol.*) = 0 THEN '[]'
                END) AS roles,
                             STRING_AGG(srol.nombre, ' | ') as nombrerol_str
                FROM ${Constants.tbl_usuario_sql} usu
                LEFT JOIN ( SELECT uxr.idusuario, uxr.idrol, r.nombre , uxr.ismain
                FROM ${Constants.tbl_usuario_x_rol_sql} uxr 
                JOIN ${Constants.tbl_rol_sql} r on (r.id = uxr.idrol)
                JOIN ${Constants.tbl_usuario_sql} usu on (usu.id = uxr.idusuario)
                ) srol on (srol.idusuario = usu.id)
                WHERE usu.estado >= $1 AND usu.estado IS NOT NULL AND srol.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin','limpieza', 'mantenimiento')
                AND srol.ismain = true
                GROUP BY usu.id							
                ) as us
                LEFT JOIN tbl_usuario_rrhh ur ON us.id = ur.id) AS usp
                            WHERE ( 
                            UNACCENT(lower( replace(trim(usp.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(usp.nombrerol_str ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(usp.username ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                            $2 = ''
                            ) 
                  AND usp.id not in (select idusuario_resp from tbl_responsable_lead_dn where idusuario_resp <> 6)
                  AND usp.username not in ('rrhh','RRHH1', 'rmg', 'rmg1', 'rmg2', 'ade', 'ADE1', 'crm', 'CRM1', 'atic','dn', 'da', 'da1','da2', 'da3', 'da4', 'da5')
                  ORDER BY  usp.nombrerol_str asc, usp.nombre_completo
                            LIMIT $3 OFFSET $4`,
           
                  values: [
                        1,
                        search_all === '' ? '' : `%${search_all}%`,
                        limit,
                        offset
                  ]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }




      async insertRRHH(data: IUser): Promise<IUser | IErrorResponse> {
            let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  let _nombreCompleto = data.nombre_completo ? data.nombre_completo!.trim() : `${data.nombre.trim()} ${data.apellido.trim()}`


                  const queryData = {
                        name: 'insert-user',
                        text: `INSERT INTO ${Constants.tbl_usuario_sql}(
                              username,
                              email, 
                              password, 
                              nombre, 
                              apellido, 
                              fecha_creacion, 
                              fecha_ultimo_cambio,
                              idusuario,
                              nombre_completo)
                              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
                        values: [
                              data.username,
                              data.email,
                              data.password,
                              '',
                              '',
                              timeStampCurrent,
                              timeStampCurrent,
                              this.idUserLogin,
                              `${_nombreCompleto}`
                        ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>

                  let id_usuario = ((lData as Array<IUser>)[0].id)


                  const queryDataRRHH = {
                        name: "insert-usuario-rrhh",
                        text: `INSERT INTO ${Constants.tbl_usuario_rrhh_sql}
                                (id,
                                 cumpleanyos,
                                 correo_personal,
                                 detalles,
                                 fecha_inicio,
                                 alta_ss,
                                 fecha_ultimo_cambio,
                                 jornada,
                                 fecha_cambio_jornada,
                                 horario
                                    )
                                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                        values: [
                              id_usuario,
                              data.cumpleanyos,
                              data.correo_personal,
                              data.detalles,
                              timeStampCurrent,
                              data.alta_ss,
                              timeStampCurrent,
                              data.jornada,
                              timeStampCurrent,
                              data.horario
                        ]
                  }

                  let lData2 = (await client.query(queryDataRRHH)).rows as Array<IUser | IErrorResponse>

                  const queryEtapa = {
                        name: 'insert-usuario-etapa',
                        text: `INSERT INTO ${Constants.tbl_etapa_usuario_rrhh_sql}
                                    (idusuario,
                                    etapa,
                                    fecha_inicio,
                                    estado)
                                    VALUES ($1 , $2, $3,$4)`,
                        values: [
                              id_usuario,
                              data.etapa,
                              timeStampCurrent,
                              1
                        ]
                  }

                  let lData3 = (await client.query(queryEtapa)).rows as Array<IUser | IErrorResponse>

                  let userDB = lData[0]
                  if (userDB) {
                        const idDataDB = (userDB as IUser).id!
                        const queryData = {
                              name: 'insert-user-x-rol',
                              text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
                                          VALUES($1,$2) RETURNING *`,
                              values: [idDataDB, data.idrol]
                        }
                        let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                        if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>
                  }

                  return lData
            })

            return (responseD[0]) as IUser | IErrorResponse
      }



      async updateRRHH(id: BigInt, data: IUser): Promise<IUser | IErrorResponse> {
            let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {

                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  let _nombreCompleto = data.nombre_completo ? data.nombre_completo!.trim() : `${data.nombre.trim()} ${data.apellido.trim()}`


                  let queryData = {
                        name: 'update-user',
                        text: `
                              UPDATE ${Constants.tbl_usuario_sql} SET
                              email = $1, 
                              nombre = $2, 
                              apellido = $3,
                              estado = $4,  
                              fecha_ultimo_cambio = $5, 
                              idusuario = $6,
                              username = $7,
                              nombre_completo = $8
                              WHERE id = $9 AND estado >= $10
                              RETURNING *
                              `,
                        values: [
                              data.email,
                              '',
                              '',
                              data.estado,
                              timeStampCurrent,
                              this.idUserLogin,
                              data.username,
                              `${_nombreCompleto}`,
                              id,
                              this.filterStatus
                        ]
                  }

                  let lData = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>


                  let queryDataRRHH = {
                        name: 'update-usu-rrhh',
                        text: `  
                        UPDATE ${Constants.tbl_usuario_rrhh_sql} SET
                        cumpleanyos = $1,
                        correo_personal = $2,
                        detalles = $3,
                        alta_ss = $4,
                        fecha_ultimo_cambio = $5
                        WHERE id = $6
                        RETURNING *
                        `,
                        values: [
                              data.cumpleanyos,
                              data.correo_personal,
                              data.detalles,
                              data.alta_ss,
                              timeStampCurrent,
                              id
                        ]
                  }

                  let lData_ = (await client.query(queryDataRRHH)).rows


                  queryData = {
                        name: 'Select-multilogin-usu',
                        text: `SELECT usu.multilogin , uxr.ismain , uxr.idrol  FROM 
                              ${Constants.tbl_usuario_sql} usu
                              LEFT JOIN ${Constants.tbl_usuario_x_rol_sql} uxr ON (usu.id = uxr.idusuario)
                              WHERE id = $1`,
                        values: [
                              id
                        ]
                  }
                  let lData_s = (await client.query(queryData)).rows as Array<IUser>


                  if (lData_s[0].multilogin == true && lData_s.map(el => el.idrol as string).includes(`${data.idrol}`) == false) {

                        let queryUpdate = {
                              name : 'update-rol-ismain',
                              text: `UPDATE ${Constants.tbl_usuario_x_rol_sql} SET
                                    idusuario = $1,
                                    ismain = $2
                                    WHERE idusuario = $1`,
                              values : [id , false]
                        }
                        
                        await client.query(queryUpdate)

                        const queryData = {
                              name: 'insert-user-x-role',
                              text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol)
                                    VALUES($1,$2) RETURNING *`,
                              values: [id, data.idrol]
                        }

                        let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                        if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>

                  }
                  else if (lData_s[0].multilogin == true && data.roles?.map(el => el.id as string).includes(`${data.idrol}`) == true) {



                        const queryData = {
                              name: 'update-user-x-role',
                              text: `UPDATE ${Constants.tbl_usuario_x_rol_sql} SET
                                    idusuario = $1,
                                    idrol = $2
                                    WHERE idusuario = $1`,
                              values: [id, data.idrol]
                        }

                        let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                        if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>

                  }
                  else if (lData_s[0].multilogin == false) {

                        // Delete all roles [Verificar si es la mejor forma]
                        queryData = {
                              name: 'delete-role-x-user',
                              text: `DELETE FROM ${Constants.tbl_usuario_x_rol_sql} WHERE idusuario = $1`,
                              values: [id]
                        }
                        await client.query(queryData)
                        let userDB = lData[0]
                        if (userDB) {


                              const queryData = {
                                    name: 'insert-user-x-role',
                                    text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
                                          VALUES($1,$2) RETURNING *`,
                                    values: [id, data.idrol]
                              }
                              let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                              if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>
                        }
                  }




                  if (lData_ && lData_.length == 0) {

                        const queryDataRRHH = {
                              name: "insert-usuario-rrhh",
                              text: `INSERT INTO ${Constants.tbl_usuario_rrhh_sql}
                                (id,
                                 cumpleanyos,
                                 correo_personal,
                                 detalles,
                                 fecha_inicio,
                                 alta_ss,
                                 fecha_ultimo_cambio,
                                 jornada,
                                 fecha_cambio_jornada,
                                 horario
                                    )
                                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                              values: [
                                    id,
                                    data.cumpleanyos,
                                    data.correo_personal,
                                    data.detalles,
                                    timeStampCurrent,
                                    data.alta_ss,
                                    timeStampCurrent,
                                    data.jornada,
                                    timeStampCurrent,
                                    data.horario
                              ]
                        }

                        let lData2 = (await client.query(queryDataRRHH)).rows as Array<IUser | IErrorResponse>


                        const queryEtapa = {
                              name: 'insert-usuario-etapa',
                              text: `INSERT INTO ${Constants.tbl_etapa_usuario_rrhh_sql}
                                    (idusuario,
                                    etapa,
                                    fecha_inicio,
                                    estado)
                                    VALUES ($1 , $2, $3,$4)`,
                              values: [
                                    id,
                                    data.etapa,
                                    timeStampCurrent,
                                    1
                              ]
                        }

                        let lData3 = (await client.query(queryEtapa)).rows as Array<IUser | IErrorResponse>


                  }


                  //Verificar si es la mejor forma     
                  let querySelect = {
                        name: 'select-etapa-x-user',
                        text: `SELECT etapa FROM ${Constants.tbl_etapa_usuario_rrhh_sql}
                              WHERE idusuario = $1`,
                        values: [id]
                  }

                  let lDataEtapa = (await client.query(querySelect)).rows as Array<IUser>




                  if (lDataEtapa[0].etapa != data.etapa) {


                        let queryDataDel = {
                              name: 'update-last-etapa-x-user',
                              text: `UPDATE ${Constants.tbl_etapa_usuario_rrhh_sql} SET
                                    fecha_final = $1,
                                    estado = $2
                                    RETURNING *`,
                              values: [timeStampCurrent, 0]
                        }
                        await client.query(queryDataDel)


                        let queryDataInsert = {
                              name: 'insert-new-etapa',
                              text: `INSERT INTO ${Constants.tbl_etapa_usuario_rrhh_sql}
                              (
                                    idusuario,
                                    etapa,
                                    fecha_inicio,
                                    estado
                              )
                              VALUES ($1,$2,$3,$4) RETURNING *`,
                              values: [id, data.etapa, timeStampCurrent, 1]
                        }
                        await client.query(queryDataInsert)

                  }


                  return lData
            })
            return (responseD[0]) as IUser | IErrorResponse

      }

      //



      /**
       * NO TOCAR: pendiente agregar telefono, nombre_completo
       * @param id 
       * @param data 
       * @returns 
       */
      async update(id: BigInt, data: IUser): Promise<IUser | IErrorResponse> {
            let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
                  let _nombreCompleto = data.nombre_completo ? data.nombre_completo!.trim() : `${data.nombre.trim()} ${data.apellido.trim()}`
                  let queryData = {
                        name: 'update-user',
                        text: `UPDATE ${Constants.tbl_usuario_sql} SET
                              email = $1, 
                              nombre = $2, 
                              apellido = $3,
                              estado = $4,  
                              fecha_ultimo_cambio = $5, 
                              idusuario = $6,
                              username = $7,
                              nombre_completo = $8
                              WHERE id = $9 AND estado >= $10 RETURNING *`,
                        values: [
                              data.email,
                              data.nombre,
                              data.apellido,
                              data.estado,
                              timeStampCurrent,
                              this.idUserLogin,
                              data.username,
                              `${_nombreCompleto}`,
                              id,
                              this.filterStatus
                        ]
                  }
                  let lData = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>

                  // Delete all roles [Verificar si es la mejor forma]
                  queryData = {
                        name: 'delete-role-x-user',
                        text: `DELETE FROM ${Constants.tbl_usuario_x_rol_sql} WHERE idusuario = $1`,
                        values: [id]
                  }
                  await client.query(queryData)

                  let userDB = lData[0]
                  if (userDB) {
                        const queryData = {
                              name: 'insert-user-x-role',
                              text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
                                          VALUES($1,$2) RETURNING *`,
                              values: [id, data.idrol]
                        }
                        let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                        if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>
                  }

                  return lData
            })

            return (responseD[0]) as IUser | IErrorResponse
      }

      // Revisar porque afecta a varios archivos

      async deleteRRHH(id: BigInt): Promise<IUser | IErrorResponse> {
            let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {

                  const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

                  const queryData = {
                        name: 'delete-user',
                        text: `UPDATE ${Constants.tbl_usuario_sql} SET
                        estado = $1,
                        fecha_ultimo_cambio = $2, 
                        idusuario = $3
                        WHERE id = $4 AND estado >= $5 RETURNING *`,
                        values: [Constants.code_status_delete,
                              timeStampCurrent,
                        this.idUserLogin,
                              id,
                        this.filterStatus
                        ]
                  }

                  let lData: Array<IUser | IErrorResponse> = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>
                  let queryDataDel = {
                        name: 'update-user-fecha-fin',
                        text: `UPDATE ${Constants.tbl_usuario_rrhh_sql} SET 
                        fecha_fin = $1
                        WHERE id = $2
                        RETURNING *`,
                        values: [timeStampCurrent, id]

                  }

                  let lData2: Array<IUser | IErrorResponse> = (await client.query(queryDataDel)).rows as Array<IUser | IErrorResponse>

                  return lData
            })

            return (responseD[0]) as IUser | IErrorResponse
      }

      async delete(id: BigInt): Promise<IUser | IErrorResponse> {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                  name: 'delete-user',
                  text: `UPDATE ${Constants.tbl_usuario_sql} SET
                        estado = $1,
                        fecha_ultimo_cambio = $2, 
                        idusuario = $3
                        WHERE id = $4 AND estado >= $5 RETURNING *`,
                  values: [Constants.code_status_delete,
                        timeStampCurrent,
                  this.idUserLogin,
                        id,
                  this.filterStatus
                  ]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            return lData[0]
      }

      /**
       * Retorna información completa de los usuarios, filtrados por role
       * @param idrole 
       * @returns 
       */
      async getUsersByRole(idrole: string): Promise<Array<IUser> | IErrorResponse> {
            // Para evitar errores de filtrado desde otras secciones
            if (!this.infoExtra) this.infoExtra = { filter: { telefono: '', persona: '' } }

            const queryData = {
                  name: 'get-users',
                  text: `SELECT u.id, u.ref_lead, u.nombre, u.apellido, u.email, u.estado, u.username, u.telefono, u.nombre_completo, u.ref_lead 
                         FROM ${Constants.tbl_usuario_x_rol_sql} us
                         JOIN ${Constants.tbl_usuario_sql} u on (u.id = us.idusuario)
                         WHERE us.idrol LIKE $1 AND 
                         u.estado >= $2 AND 
                         u.estado IS NOT NULL AND
                         (u.telefono LIKE $3 OR $3 = '') AND
                         ( UNACCENT(lower(u.nombre_completo)) LIKE UNACCENT(lower($4)) OR $4 = '')
                         ORDER BY u.nombre, u.apellido ASC`,
                  values: [
                        idrole,
                        this.filterStatus,
                        this.infoExtra.filter.telefono === '' ? '' : `%${this.infoExtra.filter.telefono}%`,
                        this.infoExtra.filter.persona === '' ? '' : `%${this.infoExtra.filter.persona}%`
                  ]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }

      async getUsersDN(): Promise<Array<IUser> | IErrorResponse> {
            const queryData = {
                  name: 'get-users-dn',
                  text: `SELECT u.id, u.ref_lead, u.nombre, u.apellido, u.email, u.estado, u.username, r.nombre as nombrerol,
                         u.telefono, u.nombre_completo, u.ref_lead 
                         FROM ${Constants.tbl_usuario_x_rol_sql} us
                         JOIN ${Constants.tbl_usuario_sql} u on (u.id = us.idusuario)
                         JOIN ${Constants.tbl_rol_sql} r on (r.id = us.idrol)
                         WHERE us.idrol IN ('propietario', 'colaborador') AND u.estado >= $1 AND u.estado IS NOT NULL
                         ORDER BY u.nombre, u.apellido ASC`,
                  values: [this.filterStatus]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }

      /**
       * [PROD]
       * Retorna todos los usuarios potenciales a responsables de los LEADs [ceo, dn, dnmaster, rrhhmaster] 
       * @returns 
       */
      async getResponsablesDN(): Promise<Array<IUser> | IErrorResponse> {
            const queryData = {
                  name: 'get-users-responsables-dn',
                  text: `
                        SELECT u.*
                        FROM ${Constants.tbl_usuario_sql} u
                        INNER JOIN ${Constants.tbl_usuario_x_rol_sql} ur ON (u.id = ur.idusuario AND ur.idrol IN ('ceo', 'dn', 'dnmaster', 'rrhhmaster'))
                        WHERE u.estado >= $1
                        GROUP BY u.id
                        ORDER BY u.nombre, u.apellido
                         `,
                  values: [this.filterStatus]
            }

            let lData: Array<IUser | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IUser | IErrorResponse>

            if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IUser>
      }
}

export default UserDataAccess