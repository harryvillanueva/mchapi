import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import UtilInstance from "../helpers/Util"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import Constants from "../helpers/Constants"
import { StatusDataType, TypeDeviceType } from "../types/GlobalTypes"
import { IApartment } from "../models/IApartment"
import { IUserApartment } from "../models/IUserApartment"
import { IModel } from "../helpers/IModel"
import { IApartmentDetails } from "../modelsextra/IApartmentDetails"
import { ILead } from "../models/ILead"
import { IDevice } from "../models/IDevice"
import { off } from "process"


class ApartmentDataAccess implements IDataAccess<IApartment> {
    public client: DbConnection

    constructor(
        public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any) {
        this.client = new DbConnection(isTransactions)
    }

    /**
     * NO USARLOS, VERIFICAR SI SE USA DESDE OTRO SISTEMA EXTERNO
     * Lo usa MCHAPP, cambiar para que solo retorne la información necesaria
     * @returns 
     */
    async get(): Promise<Array<IApartment> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments',
            text: `SELECT p.*,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
                                                                                'type', d.type, 
                                                                                'codigo', d.codigo, 
                                                                                'nombre', d.nombre,
                                                                                'etiqueta_dispositivo', d.etiqueta_dispositivo))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos,
                        ipc.nombre_comercial, ipc.link_nombre_comercial, ipc.estado_general
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre, disp.etiqueta_dispositivo  
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                        ) d ON (d.idpiso = p.id)
                        LEFT JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (ipc.idpiso = p.id AND ipc.estado = 1)
                        WHERE p.estado >= $1 AND p.estado IS NOT NULL AND
                        p.tipo IN ('piso', 'oficina') AND
                        p.visible_otras_apps = $2
                        GROUP BY p.id, ipc.nombre_comercial, ipc.link_nombre_comercial, ipc.estado_general
                        ORDER BY p.id_dispositivo_ref ASC
                        `,
            values: [this.filterStatus, 1]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * Obtiene la informacion de todos los pisos con sus dispositivos
     * @returns 
     */
    async getAllPublic(): Promise<Array<IApartment> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments-mch',
            text: `SELECT p.id,
                        p.id_dispositivo_ref,
                        p.etiqueta,
                        p.config_dispositivo,
                        p.gestion_piso,
                        p.estado,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
                                                                                'type', d.type, 
                                                                                'codigo', d.codigo, 
                                                                                'nombre', d.nombre,
                                                                                'etiqueta_dispositivo', d.etiqueta_dispositivo))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre, disp.etiqueta_dispositivo  
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                        ) d ON (d.idpiso = p.id)
                        WHERE p.estado = $1 AND p.estado IS NOT NULL AND
                        p.tipo IN ('piso', 'oficina') AND
                        p.visible_otras_apps = $2
                        GROUP BY p.id
                        ORDER BY p.id_dispositivo_ref ASC
                        `,
            values: [1, 1]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * Retorna los pisos de un usuario WordPress
     * @returns 
     */
    async getByUserWP(): Promise<Array<IApartment> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _user_wp = this.infoExtra!.filter!.user_wp || ''

        // INNER JOIN tbl_propietario_dn prop ON prop.idusuario = pusu.idusuario

        const queryData = {
            name: 'get-apartment-x-user-wp',
            text: `
                SELECT p.id,
                p.etiqueta
                FROM ${Constants.tbl_piso_sql} p
                INNER JOIN tbl_piso_x_usuario pusu ON pusu.idpiso = p.id
                INNER JOIN tbl_usuario usu ON usu.id = pusu.idusuario
                WHERE p.estado = $1 AND p.estado IS NOT NULL AND
                p.tipo IN ('piso', 'oficina') AND
                p.visible_otras_apps = 1 AND
                usu.user_wp LIKE $2
                ORDER BY p.etiqueta ASC             
                        `,
            values: [1, _user_wp]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * Obtiene la información del piso y sus dispositivos
     * @param code 
     * @returns 
     */
    async getByDeviceCodePublic(code: string): Promise<IApartment | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            // get device by code
            let queryData = {
                name: 'get-device-by-code',
                text: `
                        SELECT disp.id, disp.idpiso
                        FROM ${Constants.tbl_dispositivo_sql} disp
                        WHERE lower(disp.codigo) like lower($1)
                        LIMIT 1
                            `,
                values: [`${code}`.toLowerCase()]
            }

            let lDataDevices = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>
            let _idPiso = lDataDevices.length !== 0 ? (lDataDevices[0] as IDevice).idpiso : undefined

            if ( _idPiso ) {
                let queryData = {
                    name: 'get-apartment-by-code-device',
                    text: `
                        SELECT p.id,
                        p.id_dispositivo_ref,
                        p.etiqueta,
                        p.config_dispositivo,
                        p.gestion_piso,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
                                                                                'type', d.type, 
                                                                                'codigo', d.codigo, 
                                                                                'nombre', d.nombre,
                                                                                'etiqueta_dispositivo', d.etiqueta_dispositivo))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre, disp.etiqueta_dispositivo  
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                        ) d ON (d.idpiso = p.id)
                        WHERE p.estado = $1 AND p.estado IS NOT NULL AND
                        p.tipo IN ('piso', 'oficina') AND
                        p.visible_otras_apps = $2 AND
                        p.id = $3
                        GROUP BY p.id
                        `,
                    values: [1, 1, _idPiso]
                }

                let lData: Array<IApartment | IErrorResponse> = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>
                return lData
            } else return []
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }

    // crear una metodo para extraer la info del piso por codigo de dispositivo, especialmente la informacion del movil



    async getById(id: BigInt): Promise<IApartment | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id',
            text: `
                    SELECT ps.*,
                    (CASE
                            WHEN count(usu.*) > 0 THEN jsonb_agg(json_build_object('id', usu.id, 
                                                                                'nombre', usu.nombre,
                                                                                'apellido', usu.apellido))
                            WHEN count(usu.*) = 0 THEN '[]'
                    END) AS propietarios
                    FROM tbl_piso ps
                    LEFT JOIN (
                            SELECT pxu.idpiso, u.id, u.nombre, u.apellido, u.username
                            FROM tbl_piso_x_usuario pxu
                            INNER JOIN tbl_usuario u ON (u.id = pxu.idusuario)
                            WHERE pxu.idpiso = $1
                    ) as usu ON (usu.idpiso = ps.id)
                    WHERE ps.id = $1 AND ps.estado >= $2 AND ps.estado IS NOT NULL
                    GROUP BY ps.id
                    ORDER BY ps.id ASC
                        `,
            values: [id, this.filterStatus]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        return lData[0]
    }

    public async getByIdReferencial(): Promise<IApartment | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id-referencial',
            text: `SELECT
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 'type', d.type, 'codigo', d.codigo, 'nombre', d.nombre))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre 
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                        ) d ON (d.idpiso = p.id)
                        WHERE p.id_dispositivo_ref = $1 AND p.estado >= $2 AND p.estado IS NOT NULL
                        GROUP BY p.id
                        `,
            values: [this.infoExtra.filter.idRef, this.filterStatus]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        return lData[0]
    }

    public async insert(data: IApartment): Promise<IApartment | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                name: 'insert-piso',
                text: `INSERT INTO ${Constants.tbl_piso_sql}(
                            pais, 
                            ciudad, 
                            codigo_postal, 
                            direccion, 
                            nro_edificio,
                            nro_piso,
                            id_dispositivo_ref,
                            ubicacion_mapa,
                            observaciones,
                            fecha_creacion, 
                            fecha_ultimo_cambio, 
                            idusuario,
                            etiqueta,
                            estado)
                            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                values: [data.pais,
                data.ciudad,
                data.codigo_postal,
                data.direccion,
                data.nro_edificio,
                data.nro_piso,
                data.id_dispositivo_ref,
                data.ubicacion_mapa,
                data.observaciones,
                    timeStampCurrent,
                    timeStampCurrent,
                this.idUserLogin,
                data.etiqueta,
                data.estado
                ]
            }
            let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>

            let userDB = lData[0]
            if (userDB && data.propietarios && data.propietarios!.length !== 0) {
                const idDataDB = (userDB as IApartment).id!
                // Asocia varios propietarios a un piso o no asocia
                for (let i = 0; i < data.propietarios!.length; i++) {
                    const queryData = {
                        name: 'insert-piso-x-user',
                        text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                                        VALUES($1,$2) RETURNING *`,
                        values: [data.propietarios![i].id, idDataDB]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<IUserApartment | IErrorResponse>
                    if ((respTmp[0] as IErrorResponse).error) {
                        lData = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            return lData
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }

    async update(id: BigInt, data: IApartment): Promise<IApartment | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                name: 'update-piso',
                text: `UPDATE ${Constants.tbl_piso_sql} SET
                            pais = $1, 
                            ciudad = $2, 
                            codigo_postal = $3, 
                            direccion = $4, 
                            nro_edificio = $5,
                            nro_piso = $6,
                            id_dispositivo_ref = $7,
                            ubicacion_mapa = $8,
                            observaciones = $9, 
                            fecha_ultimo_cambio = $10, 
                            idusuario = $11,
                            etiqueta = $12,
                            estado = $13
                            WHERE id = $14 AND estado >= $15 RETURNING *`,
                values: [
                    data.pais,
                    data.ciudad,
                    data.codigo_postal,
                    data.direccion,
                    data.nro_edificio,
                    data.nro_piso,
                    data.id_dispositivo_ref,
                    data.ubicacion_mapa,
                    data.observaciones,
                    timeStampCurrent,
                    this.idUserLogin,
                    data.etiqueta,
                    data.estado,
                    id,
                    this.filterStatus
                ]
            }
            let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>

            // Delete all propietarios
            queryData = {
                name: 'delete-piso',
                text: `DELETE FROM ${Constants.tbl_piso_x_usuario_sql} WHERE idpiso = $1`,
                values: [id]
            }
            await client.query(queryData)

            // Insertamos los nuevos propietarios
            let userDB = lData[0]
            if (userDB && data.propietarios && data.propietarios!.length !== 0) {
                const idDataDB = (userDB as IApartment).id!
                // Asocia varios propietarios a un piso o no asocia
                for (let i = 0; i < data.propietarios!.length; i++) {
                    const queryData = {
                        name: 'insert-piso-x-user',
                        text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                                        VALUES($1,$2) RETURNING *`,
                        values: [data.propietarios![i].id, idDataDB]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<IUserApartment | IErrorResponse>
                    if ((respTmp[0] as IErrorResponse).error) {
                        lData = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            return lData
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }

    async delete(id: BigInt): Promise<IApartment | IErrorResponse> {
        // const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        // const queryData = {
        //         name: 'delete-piso',
        //         text: `UPDATE ${Constants.tbl_piso_sql} SET
        //             estado = $1,
        //             fecha_ultimo_cambio = $2, 
        //             idusuario = $3
        //             WHERE id = $4 AND estado >= $5 RETURNING *`,
        //         values: [   Constants.code_status_delete, 
        //                     timeStampCurrent, 
        //                     this.idUserLogin,
        //                     id,
        //                     this.filterStatus
        //             ]
        // }

        // let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        // return lData[0]

        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            const queryGetApartment = {
                name: 'get-apartment',
                text: ` SELECT ps.id_dispositivo_ref
                        FROM ${Constants.tbl_piso_sql} ps
                        WHERE ps.id = $1`,
                values: [id]
            }
            let _dataApartment = (await client.query(queryGetApartment)).rows as Array<IApartment>
            let apartmentDB = (_dataApartment.length !== 0) ? _dataApartment[0] : {} as IApartment

            const queryData = {
                name: 'delete-piso',
                text: `UPDATE ${Constants.tbl_piso_sql} SET
                        estado = $1,
                        id_dispositivo_ref = $2,
                        fecha_ultimo_cambio = $3, 
                        idusuario = $4
                        WHERE id = $5 AND estado >= $6 RETURNING *`,
                values: [Constants.code_status_delete,
                `${apartmentDB.id_dispositivo_ref}_${timeStampCurrent}`,
                    timeStampCurrent,
                this.idUserLogin,
                    id,
                this.filterStatus
                ]
            }

            let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

            return lData
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }

    async getAllByUser(idUser: BigInt): Promise<Array<IApartment> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments-x-user',
            text: `
                        SELECT p.*
                        FROM ${Constants.tbl_piso_sql} p
                        INNER JOIN ${Constants.tbl_piso_x_usuario_sql} pxu ON pxu.idpiso = p.id
                        WHERE pxu.idusuario = $1 AND p.estado >=$2 AND p.estado IS NOT NULL
                        ORDER BY p.id_dispositivo_ref ASC
                        `,
            values: [idUser, this.filterStatus]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    async getDetailsById(id: BigInt): Promise<IApartmentDetails | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id',
            text: `
                SELECT p.*, 
                cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                cod."timestamp_inicio", cod."timestamp_fin", 
                ks.keys, 
                lgs.logs 
                FROM ${Constants.tbl_piso_sql} p 
                LEFT JOIN (
                    SELECT p.id, 
                    cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                    cod."timestamp_inicio", cod."timestamp_fin" 
                    FROM ${Constants.tbl_piso_sql} p 
                    LEFT JOIN (
                        SELECT d.idpiso, m.codigo_permanente, c.codigo, c.dias, c.fecha_vig_inicio, c.fecha_vig_fin,
                        c."timestamp_inicio", c."timestamp_fin" 
                        FROM ${Constants.tbl_manija_sql} m 
                        INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
                        INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
                        LEFT JOIN ${Constants.tbl_codigo_sql} c ON (c.id = m.idcodigo) 
                        WHERE p.id = $1
                    ) cod ON (cod.idpiso = p.id) 
                    WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL 
                    GROUP BY p.id, cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                    cod."timestamp_inicio", cod."timestamp_fin"
                ) cod on cod.id = p.id 
                LEFT JOIN (
                    SELECT p.id, 
                    (	CASE 
                                WHEN count(ks.*) > 0 THEN jsonb_agg(
                                                    json_build_object(
                                                    'id', ks.id, 'ubicacion', ks.ubicacion, 
                                                    'tipo_tarjeta', ks.tipo_tarjeta, 
                                                    'idqr', ks.idqr, 'qr', ks.qr
                                            )) 
                                WHEN count(ks.*) = 0 THEN '[]' 
                            END
                    ) AS keys 
                    FROM ${Constants.tbl_piso_sql} p 
                    LEFT JOIN (
                        SELECT 
                        ll.id, dll.idpiso, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr 
                        FROM ${Constants.tbl_llave_sql} ll 
                        INNER JOIN (
                            SELECT llm.idllave, d.idpiso 
                            FROM ${Constants.tbl_llave_x_manija_sql} llm 
                            INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija 
                            INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
                            INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
                            WHERE p.id = $1
                        ) dll ON dll.idllave = ll.id 
                        WHERE ll.estado IS NOT NULL 
                        GROUP BY ll.id, dll.idpiso 
                        ORDER BY id ASC
                    ) ks ON (ks.idpiso = p.id) 
                    WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL 
                    GROUP BY p.id
                ) ks ON (ks.id = p.id) 
                LEFT JOIN (
                    SELECT p.id, 
                    (
                        CASE 
                                WHEN count(logs.*) > 0 THEN jsonb_agg(
                                                json_build_object(
                                                    'id', logs.id, 
                                                    'accion', logs.accion, 
                                                    'resultado', logs.resultado,
                                                    'data', logs.data,
                                                    'fecha', to_char( logs.fecha, 'YYYY-MM-DD HH24:MI:SS'),
                                                    'usuario', logs.usuario,
                                                    'fecha_vig_inicio', to_char( logs.fecha_vig_inicio, 'YYYY-MM-DD HH24:MI:SS'),
                                        'fecha_vig_fin', to_char( logs.fecha_vig_fin, 'YYYY-MM-DD HH24:MI:SS')
                                                )) 
                                WHEN count(logs.*) = 0 THEN '[]' 
                            END
                    ) AS logs 
                    FROM ${Constants.tbl_piso_sql} p 
                    LEFT JOIN (
                        SELECT lp.*, cod.fecha_vig_inicio, cod.fecha_vig_fin 
                        FROM ${Constants.tbl_logs_piso_sql} lp 
                        INNER JOIN ${Constants.tbl_piso_sql} p ON (lp.idpiso = p.id)
                        LEFT JOIN ${Constants.tbl_codigo_sql} cod ON (cod.id = lp.idcodigo) 
                        WHERE lp.idpiso = $1 
                        ORDER BY lp.id DESC
                        LIMIT 10
                    ) logs ON (logs.idpiso = p.id) 
                    WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL 
                    GROUP BY p.id
                ) lgs ON (lgs.id = p.id)
                WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL                  
                        `,
            values: [id, this.filterStatus]
        }

        let lData: Array<IApartmentDetails | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartmentDetails | IErrorResponse>

        return lData[0]
    }

    async getDetailsByIdAndIdLock(id: BigInt, idLock: BigInt): Promise<IApartmentDetails | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id-x-idlock',
            text: `
                SELECT p.*, 
                cod.iddispositivo, cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                cod."timestamp_inicio", cod."timestamp_fin", d.etiqueta_dispositivo, 
                ks.keys, 
                lgs.logs 
                FROM ${Constants.tbl_piso_sql} p 
                LEFT JOIN (
                SELECT p.id, cod.iddispositivo, 
                cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                cod."timestamp_inicio", cod."timestamp_fin" 
                FROM ${Constants.tbl_piso_sql} p 
                LEFT JOIN (
                    SELECT d.id as iddispositivo, d.idpiso, m.codigo_permanente, c.codigo, c.dias, c.fecha_vig_inicio, c.fecha_vig_fin,
                    c."timestamp_inicio", c."timestamp_fin" 
                    FROM ${Constants.tbl_manija_sql} m 
                    INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
                    INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
                    LEFT JOIN ${Constants.tbl_codigo_sql} c ON (c.id = m.idcodigo) 
                    WHERE p.id = $1 AND d.id = $3
                    ) cod ON (cod.idpiso = p.id) 
                WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL 
                GROUP BY p.id, cod.iddispositivo, cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                cod."timestamp_inicio", cod."timestamp_fin"
                ) cod on cod.id = p.id 
                LEFT JOIN (
                SELECT p.id, 
                (	CASE 
                                        WHEN count(ks.*) > 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'id', ks.id, 'ubicacion', ks.ubicacion, 
                                                                'tipo_tarjeta', ks.tipo_tarjeta, 
                                                                'idqr', ks.idqr, 'qr', ks.qr
                                                        )) 
                                        WHEN count(ks.*) = 0 THEN '[]' 
                            END
                ) AS keys 
                FROM ${Constants.tbl_piso_sql} p 
                LEFT JOIN (
                    SELECT 
                            ll.id, dll.idpiso, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr 
                    FROM ${Constants.tbl_llave_sql} ll 
                    INNER JOIN (
                            SELECT llm.idllave, d.idpiso 
                            FROM ${Constants.tbl_llave_x_manija_sql} llm 
                            INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija 
                            INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
                            INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
                            WHERE p.id = $1 AND d.id = $3
                    ) dll ON dll.idllave = ll.id 
                    WHERE ll.estado IS NOT NULL 
                    GROUP BY ll.id, dll.idpiso 
                    ORDER BY id ASC
                ) ks ON (ks.idpiso = p.id) 
                WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL 
                GROUP BY p.id
                ) ks ON (ks.id = p.id) 
                LEFT JOIN (
                SELECT p.id, 
                (
                    CASE 
                                        WHEN count(logs.*) > 0 THEN jsonb_agg(
                                                        json_build_object(
                                                                'id', logs.id, 
                                                                'accion', logs.accion, 
                                                                'resultado', logs.resultado,
                                                                'data', logs.data,
                                                                'fecha', to_char( logs.fecha, 'YYYY-MM-DD HH24:MI:SS'),
                                                                'usuario', logs.usuario,
                                                                'fecha_vig_inicio', to_char( logs.fecha_vig_inicio, 'YYYY-MM-DD HH24:MI:SS'),
                                                                'fecha_vig_fin', to_char( logs.fecha_vig_fin, 'YYYY-MM-DD HH24:MI:SS'),
                                                                'etiqueta_dispositivo', logs.etiqueta_dispositivo
                                                        )) 
                                        WHEN count(logs.*) = 0 THEN '[]' 
                            END
                ) AS logs 
                FROM ${Constants.tbl_piso_sql} p 
                LEFT JOIN (
                    SELECT lp.*, cod.fecha_vig_inicio, cod.fecha_vig_fin, d.etiqueta_dispositivo 
                    FROM ${Constants.tbl_logs_piso_sql} lp 
                    INNER JOIN ${Constants.tbl_piso_sql} p ON (lp.idpiso = p.id)
                    LEFT JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = lp.iddispositivo)
                    LEFT JOIN ${Constants.tbl_codigo_sql} cod ON (cod.id = lp.idcodigo) 
                    WHERE lp.idpiso = $1 
                    ORDER BY lp.id DESC
                    LIMIT 15
                ) logs ON (logs.idpiso = p.id) 
                WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL 
                GROUP BY p.id
                ) lgs ON (lgs.id = p.id)
                LEFT JOIN ${Constants.tbl_dispositivo_sql} d ON d.idpiso = p.id
                WHERE p.id = $1 AND d.id = $3 AND p.estado >= $2 AND p.estado IS NOT NULL                  
                        `,
            values: [id, this.filterStatus, idLock]
        }

        let lData: Array<IApartmentDetails | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartmentDetails | IErrorResponse>

        return lData[0]
    }

    async getByIdAndUser(id: BigInt, idUser: BigInt): Promise<IApartment | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id-x-user',
            text: `SELECT p.* 
                        FROM ${Constants.tbl_piso_sql} p
                        INNER JOIN ${Constants.tbl_piso_x_usuario_sql} pxu ON pxu.idpiso = p.id
                        WHERE p.id = $1 AND pxu.idusuario = $2 AND p.estado >= $3 AND p.estado IS NOT NULL
                        ORDER BY p.id ASC`,
            values: [id, idUser, this.filterStatus]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        return lData[0]
    }

    async getByGestionPiso(): Promise<Array<IApartment> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _gestion_piso = this.infoExtra!.filter!.gestion_piso || ''

        // Con llaves
        // const queryData = {
        //       name: 'get-apartment-x-id',
        //       text: `
        //       SELECT p.*, 
        //       cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
        //       cod."timestamp_inicio", cod."timestamp_fin", 
        //       ks.keys, d.dispositivos
        //       FROM ${Constants.tbl_piso_sql} p
        //       LEFT JOIN (
        //             SELECT p.id as idpiso, (CASE
        //                   WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
        //                                                                                                     'type', d.type, 
        //                                                                                                     'codigo', d.codigo, 
        //                                                                                                     'nombre', d.nombre,
        //                                                                                                     'etiqueta_dispositivo', d.etiqueta_dispositivo))
        //                   WHEN count(d.*) = 0 THEN '[]'
        //                 END) AS dispositivos
        //             FROM ${Constants.tbl_piso_sql} p
        //             LEFT JOIN (
        //                   SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre, disp.etiqueta_dispositivo  
        //                   FROM ${Constants.tbl_dispositivo_sql} disp
        //                   INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
        //                   WHERE disp.estado = 1 AND disp.estado IS NOT NULL
        //             ) d ON (d.idpiso = p.id)
        //             WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2 
        //             GROUP BY p.id
        //       ) d ON (d.idpiso = p.id)
        //       LEFT JOIN (
        //           SELECT p.id, 
        //           cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
        //           cod."timestamp_inicio", cod."timestamp_fin" 
        //           FROM ${Constants.tbl_piso_sql} p 
        //           LEFT JOIN (
        //               SELECT d.idpiso, m.codigo_permanente, c.codigo, c.dias, c.fecha_vig_inicio, c.fecha_vig_fin,
        //               c."timestamp_inicio", c."timestamp_fin" 
        //               FROM ${Constants.tbl_manija_sql} m 
        //               INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
        //               INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
        //               LEFT JOIN ${Constants.tbl_codigo_sql} c ON (c.id = m.idcodigo) 
        //               WHERE p.gestion_piso LIKE $2
        //             ) cod ON (cod.idpiso = p.id) 
        //           WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2 
        //           GROUP BY p.id, cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
        //           cod."timestamp_inicio", cod."timestamp_fin"
        //       ) cod on cod.id = p.id 
        //       LEFT JOIN (
        //           SELECT p.id, 
        //           (	CASE 
        //                         WHEN count(ks.*) > 0 THEN jsonb_agg(
        //                                           json_build_object(
        //                                           'id', ks.id, 'ubicacion', ks.ubicacion, 
        //                                           'tipo_tarjeta', ks.tipo_tarjeta, 
        //                                           'idqr', ks.idqr, 'qr', ks.qr
        //                                     )) 
        //                         WHEN count(ks.*) = 0 THEN '[]' 
        //                   END
        //           ) AS keys 
        //           FROM ${Constants.tbl_piso_sql} p 
        //           LEFT JOIN (
        //               SELECT 
        //                 ll.id, dll.idpiso, ll.ubicacion, ll.tipo_tarjeta, ll.idqr, ll.qr 
        //               FROM ${Constants.tbl_llave_sql} ll 
        //               INNER JOIN (
        //                   SELECT llm.idllave, d.idpiso 
        //                   FROM ${Constants.tbl_llave_x_manija_sql} llm 
        //                   INNER JOIN ${Constants.tbl_manija_sql} m ON m.iddispositivo = llm.idmanija 
        //                   INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
        //                   INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
        //                   WHERE p.gestion_piso LIKE $2
        //               ) dll ON dll.idllave = ll.id 
        //               WHERE ll.estado IS NOT NULL 
        //               GROUP BY ll.id, dll.idpiso 
        //               ORDER BY id ASC
        //           ) ks ON (ks.idpiso = p.id) 
        //           WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2
        //           GROUP BY p.id
        //       ) ks ON (ks.id = p.id) 
        //       WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2
        //       ORDER BY p.etiqueta ASC               
        //              `,
        //       values: [ this.filterStatus, _gestion_piso ]
        // }

        // Sin llaves
        const queryData = {
            name: 'get-apartment-x-id',
            text: `
                SELECT p.*, 
                cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                cod."timestamp_inicio", cod."timestamp_fin", 
                d.dispositivos
                FROM ${Constants.tbl_piso_sql} p
                LEFT JOIN (
                    SELECT p.id as idpiso, (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
                                                                                                            'type', d.type, 
                                                                                                            'codigo', d.codigo, 
                                                                                                            'nombre', d.nombre,
                                                                                                            'etiqueta_dispositivo', d.etiqueta_dispositivo))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                    FROM ${Constants.tbl_piso_sql} p
                    LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre, disp.etiqueta_dispositivo  
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                    ) d ON (d.idpiso = p.id)
                    WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2 
                    GROUP BY p.id
                ) d ON (d.idpiso = p.id)
                LEFT JOIN (
                    SELECT p.id, 
                    cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                    cod."timestamp_inicio", cod."timestamp_fin" 
                    FROM ${Constants.tbl_piso_sql} p 
                    LEFT JOIN (
                        SELECT d.idpiso, m.codigo_permanente, c.codigo, c.dias, c.fecha_vig_inicio, c.fecha_vig_fin,
                        c."timestamp_inicio", c."timestamp_fin" 
                        FROM ${Constants.tbl_manija_sql} m 
                        INNER JOIN ${Constants.tbl_dispositivo_sql} d ON (d.id = m.iddispositivo AND d.estado = 1) 
                        INNER JOIN ${Constants.tbl_piso_sql} p ON (p.id = d.idpiso) 
                        LEFT JOIN ${Constants.tbl_codigo_sql} c ON (c.id = m.idcodigo) 
                        WHERE p.gestion_piso LIKE $2
                    ) cod ON (cod.idpiso = p.id) 
                    WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2 
                    GROUP BY p.id, cod.codigo_permanente, cod.codigo, cod.dias, cod.fecha_vig_inicio, cod.fecha_vig_fin,
                    cod."timestamp_inicio", cod."timestamp_fin"
                ) cod on cod.id = p.id 
                WHERE p.estado >= $1 AND p.estado IS NOT NULL AND p.gestion_piso LIKE $2
                ORDER BY p.etiqueta ASC               
                        `,
            values: [this.filterStatus, _gestion_piso]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * Retorna información basica de los pisos y de oficina
     * @returns 
     */
    async getAllAppMovil(): Promise<Array<IApartment> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments',
            text: `SELECT p.id,
                        p.codigo_postal,
                        p.direccion,
                        p.nro_edificio,
                        p.nro_piso,
                        p.etiqueta
                        FROM ${Constants.tbl_piso_sql} p
                        WHERE p.estado >= $1 AND
                        p.estado IS NOT NULL AND 
                        p.visible_otras_apps = $2 AND
                        (p.tipo LIKE 'piso' OR p.tipo LIKE 'oficina') 
                        ORDER BY p.etiqueta ASC
                        `,
            values: [this.filterStatus, 1]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * Retorna todos los pisos, que tienen asignado al menos una manija
     * @returns 
     */
    async getAllWithDetailsLocksAppMovil(): Promise<Array<IApartment> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments',
            text: `SELECT p.id,
                        p.codigo_postal,
                        p.direccion,
                        p.nro_edificio,
                        p.nro_piso,
                        p.etiqueta,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
                                                                                'type', d.type, 
                                                                                'codigo', d.codigo, 
                                                                                'nombre', d.nombre,
                                                                                'etiqueta_dispositivo', d.etiqueta_dispositivo))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, disp.codigo, disp.nombre, disp.etiqueta_dispositivo  
                            FROM tbl_dispositivo disp
                            INNER JOIN tbl_tipo_dispositivo tdisp 
                            ON (tdisp.id = disp.idtipodispositivo AND (tdisp.codigo = 'lock' OR tdisp.codigo = 'ttlock'))
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                                    ) d ON (d.idpiso = p.id)
                                    WHERE p.estado >= $1 AND p.estado IS NOT NULL 
                                    AND (p.tipo = 'piso' OR p.tipo = 'oficina') 
                                    AND p.visible_otras_apps = $2
                            GROUP BY p.id
                            ORDER BY p.etiqueta ASC
                        `,
            values: [this.filterStatus, 1]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * Obtiene todos los pisos ACTIVOS/INACTIVOS del sistema
     * @returns 
     */
    async getAllDA(): Promise<Array<IApartment> | IErrorResponse> { 
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _search_all = this.infoExtra!.filter!.search_all || ''

        const queryData = {
            name: 'get-apartments-by-da',
            text: `
                    SELECT pf.*, 
                    ipd.cp_ocupacion_maxima,
                    ipd.cp_m2,
                    ipd.ds_nro_dormitorios,
                    ipd.ds_nro_camas,
                    ipd.bs_nro_banios,
                    ipd.ca_aire_acondicionado,
                    ipd.ca_calefaccion,
                    ipd.cp_ascensor,
                    ipd.ca_discapacidad,
                    ipd.ds_descripcion_camas,
                    ipd.bs_nro_aseos,
                    ipd.bs_descripcion_banios,
                    ipd.ds_descripcion_sofacama,
                    ipd.ds_nro_sofacama,
                    ipd.link_source_mantenimiento,
                    (
                        CASE
                            WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = true THEN 'Si'
                            WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = false THEN 'No'
                            WHEN ipd.id is NULL and pf.aire_acondicionado = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.aire_acondicionado = false THEN 'No'
                        END
                    ) AS lbl_aire_acondicionado,
                    (
                        CASE
                            WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = true THEN 'Si'
                            WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = false THEN 'No'
                            WHEN ipd.id is NULL and pf.calefaccion = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.calefaccion = false THEN 'No'
                        END
                    ) AS lbl_calefaccion,
                    (
                        CASE
                            WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = true THEN 'Si'
                            WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = false THEN 'No'
                            WHEN ipd.id is NULL and pf.ascensor= true THEN 'Si'
                            WHEN ipd.id is NULL and pf.ascensor = false THEN 'No'
                        END
                    ) AS lbl_ascensor,
                    (
                        CASE
                            WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = true THEN 'Si'
                            WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = false THEN 'No'
                            WHEN ipd.id is NULL and pf.discapacidad = true THEN 'Si'
                            WHEN ipd.id is NULL and pf.discapacidad = false THEN 'No'
                        END
                    ) AS lbl_discapacidad
                    FROM 
                    (
                        SELECT p.id,
                        p.ubicacion_mapa,
                        p.pais,
                        p.ciudad,
                        p.codigo_postal,
                        p.direccion,
                        p.nro_edificio,
                        p.nro_piso,
                        p.estado,
                        p.etiqueta,
                        p.ocupacion_maxima,
                        p.m2,
                        p.nro_dormitorios,
                        p.nro_camas,
                        p.nro_banios,
                        p.nro_sofacama,
                        p.aire_acondicionado,
                        p.calefaccion,
                        p.ascensor,
                        p.discapacidad,
                        p.descripcion_camas,
                        p.nro_aseos,
                        p.descripcion_banios,
                        p.descripcion_sofacama,
                        p.observaciones,
                        STRING_AGG(d.type, '|') as dispositivos_str,
                        (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type  
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                        ) d ON (d.idpiso = p.id)
                        WHERE p.estado >= $1 AND 
                        p.estado IS NOT NULL AND
                        p.tipo LIKE 'piso' AND 
                        (
                            UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                            UNACCENT(lower( replace(trim(   COALESCE(p.ciudad, '') || ',' ||
                                                            COALESCE(p.codigo_postal, '') || ','  || 
                                                            COALESCE(p.direccion, '') || ',' || 
                                                            COALESCE(p.nro_edificio, '') || ',' ||
                                                            COALESCE(p.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                            $2 = ''
                        )
                        GROUP BY p.id
                    ) as pf
                    LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.id = ipd.id
                    ORDER BY nullif(regexp_replace(lower(pf.etiqueta), '[^a-z]', '', 'g'),'')::text, 
                            nullif(regexp_replace(pf.etiqueta, '[^0-9]', '', 'g'),'')::int
                        `,
            values: [this.filterStatus,
            _search_all === '' ? '' : `%${_search_all}%`
            ]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>
        
        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * NO TOCAR !!
     * DA, crea los pisos, por ende en la columna tipo se quema con valor 'piso'
     * @param data 
     * @returns 
     */
    async insertDA(data: IApartment): Promise<IApartment | IErrorResponse> {
        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            const queryData = {
                name: 'insert-piso',
                text: `INSERT INTO ${Constants.tbl_piso_sql}(
                            pais, 
                            ciudad, 
                            codigo_postal, 
                            direccion, 
                            nro_edificio,
                            nro_piso,
                            id_dispositivo_ref,
                            ubicacion_mapa,
                            observaciones,
                            fecha_creacion, 
                            fecha_ultimo_cambio, 
                            idusuario,
                            etiqueta,
                            estado,
                            ocupacion_maxima,
                            m2,
                            nro_dormitorios,
                            nro_camas,
                            nro_banios,
                            aire_acondicionado,
                            calefaccion,
                            ascensor,
                            discapacidad,
                            descripcion_camas,
                            descripcion_banios,
                            tipo,
                            nro_sofacama,
                            descripcion_sofacama,
                            zonas
                            )
                            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING *`,
                values: [data.pais,
                data.ciudad,
                data.codigo_postal,
                data.direccion,
                data.nro_edificio,
                data.nro_piso,
                data.id_dispositivo_ref,
                data.ubicacion_mapa,
                data.observaciones,
                    timeStampCurrent,
                    timeStampCurrent,
                this.idUserLogin,
                data.etiqueta,
                data.estado,
                data.ocupacion_maxima,
                data.m2,
                data.nro_dormitorios,
                data.nro_camas,
                data.nro_banios,
                data.aire_acondicionado,
                data.calefaccion,
                data.ascensor,
                data.discapacidad,
                data.descripcion_camas,
                data.descripcion_banios,
                    'piso',
                data.nro_sofacama,
                data.descripcion_sofacama,
                data.zonas
                ]
            }



            let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>

            let userDB = lData[0]
            if (userDB && data.propietarios && data.propietarios!.length !== 0) {
                const idDataDB = (userDB as IApartment).id!
                // Asocia varios propietarios a un piso o no asocia
                for (let i = 0; i < data.propietarios!.length; i++) {
                    const queryData = {
                        name: 'insert-piso-x-user',
                        text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                                        VALUES($1,$2) RETURNING *`,
                        values: [data.propietarios![i].id, idDataDB]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<IUserApartment | IErrorResponse>
                    if ((respTmp[0] as IErrorResponse).error) {
                        lData = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            return lData
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }



    // Funcion a añadir a insertDA ya que en front faltan campos para poder usarse en ambas tablas


    // No guarda relación de piso con propietario [ DESHABILITADO 26/02/2024 ]
    async insertDA_info(data: IApartment): Promise<IApartment | IErrorResponse> {

        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {

            // Cuando se implemente desde front todos los campos nuevos a añadir 
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            //------> let lead = (lData[0] as IApartment).id <--------
            const queryData = {
                name: "insert-piso",
                text: `INSERT INTO ${Constants.tbl_piso_sql} (
                    pais , 
                    ciudad , 
                    codigo_postal , 
                    direccion , 
                    nro_edificio , 
                    nro_piso , 
                    id_dispositivo_ref ,
                    ubicacion_mapa , 
                    observaciones , 
                    estado ,
                    fecha_creacion , 
                    fecha_ultimo_cambio , 
                    idusuario ,
                    etiqueta , 
                    config_dispositivo ,  
                    gestion_piso,
                    tipo
            ) 
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                            $11,$12,$13,$14,$15,$16, $17) RETURNING *`,
                values: [
                    data.pais,
                    data.ciudad,
                    data.codigo_postal,
                    data.direccion,
                    data.nro_edificio,
                    data.nro_piso,
                    data.id_dispositivo_ref,
                    data.ubicacion_mapa,
                    data.observaciones,
                    data.estado,
                    timeStampCurrent,
                    timeStampCurrent,
                    this.idUserLogin,
                    data.etiqueta,
                    'Normal',
                    'mch',
                    'piso'
                ]

            }
            let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>

            let id_piso = ((lData as Array<IApartment>)[0].id)


            const query_Data = {
                name: "insert-info-piso",
                text: `INSERT INTO ${Constants.tbl_info_piso_da_sql}(
                id,
                cp_ocupacion_maxima,
                cp_m2,
                ds_nro_dormitorios,
                ds_nro_camas,
                bs_nro_banios,
                ca_aire_acondicionado,
                ca_calefaccion,
                cp_ascensor,
                ca_discapacidad,
                ds_descripcion_camas,
                if_tipo,
                ds_nro_sofacama,
                ds_descripcion_sofacama,
                if_zonas,
                if_clase,
                if_vista,
                cp_estancia_total,
                cp_cerradura_puertas,
                cp_nro_plantas,
                co_clase_cocina,
                co_tipo_cocina,
                co_tipo_cafetera,
                co_freidora,
                co_horno,
                ah_entrada_independiente,
                ah_chimenea,
                ah_lavadora,
                ah_caja_fuerte,
                ah_minibar,
                ah_tipo_tv,
                ah_ventilador_techo,
                ah_tipo_internet,
                ca_aparcamiento_instalaciones,
                ca_nro_plazas,
                ca_ubicacion_calefaccion,
                ca_tipo_calefaccion,
                ca_alarma,
                ca_alarma_incendios,
                ca_balcon,
                ca_terraza,
                ca_jardin,
                ca_piscina,
                ca_patio_interior,
                cu_zona_bbq,
                cu_zona_infantil,
                cu_spa,
                cu_gimnasio,
                plano, 
                bs_nro_aseos, 
                bs_descripcion_banios,
                link_source_mantenimiento) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
                    $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
                    $29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,
                    $43,$44,$45,$46,$47,$48,$49, $50, $51 , $52) RETURNING *`,

                values: [
                    id_piso,
                    data.cp_ocupacion_maxima,
                    data.cp_m2,
                    data.ds_nro_dormitorios,
                    data.ds_nro_camas,
                    data.bs_nro_banios,
                    data.ca_aire_acondicionado,
                    data.ca_calefaccion,
                    data.cp_ascensor,
                    data.ca_discapacidad,
                    data.ds_descripcion_camas,
                    data.if_tipo,
                    data.ds_nro_sofacama,
                    data.ds_descripcion_sofacama,
                    data.if_zonas,
                    data.if_clase,
                    data.if_vista,
                    data.cp_estancia_total,
                    data.cp_cerradura_puertas,
                    data.cp_nro_plantas,
                    data.co_clase_cocina,
                    data.co_tipo_cocina,
                    data.co_tipo_cafetera,
                    data.co_freidora,
                    data.co_horno,
                    data.ah_entrada_independiente,
                    data.ah_chimenea,
                    data.ah_lavadora,
                    data.ah_caja_fuerte,
                    data.ah_minibar,
                    data.ah_tipo_tv,
                    data.ah_ventilador_techo,
                    data.ah_tipo_internet,
                    data.ca_aparcamiento_instalaciones,
                    data.ca_nro_plazas,
                    data.ca_ubicacion_calefaccion,
                    data.ca_tipo_calefaccion,
                    data.ca_alarma,
                    data.ca_alarma_incendios,
                    data.ca_balcon,
                    data.ca_terraza,
                    data.ca_jardin,
                    data.ca_piscina,
                    data.ca_patio_interior,
                    data.cu_zona_bbq,
                    data.cu_zona_infantil,
                    data.cu_spa,
                    data.cu_gimnasio,
                    data.plano,
                    data.bs_nro_aseos,
                    data.bs_descripcion_banios,
                    data.link_source_mantenimiento
                ]

            }


            let l_Data = (await client.query(query_Data)).rows as Array<IApartment | IErrorResponse>

            return l_Data
        })

        return (responseD[0]) as IApartment | IErrorResponse

    }

    async updateDA(id: BigInt, data: IApartment): Promise<IApartment | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                name: 'update-piso',
                text: `UPDATE ${Constants.tbl_piso_sql} SET
                            pais = $1, 
                            ciudad = $2, 
                            codigo_postal = $3, 
                            direccion = $4, 
                            nro_edificio = $5,
                            nro_piso = $6,
                            id_dispositivo_ref = $7,
                            ubicacion_mapa = $8,
                            observaciones = $9, 
                            fecha_ultimo_cambio = $10, 
                            idusuario = $11,
                            etiqueta = $12,
                            estado = $13,
                            ocupacion_maxima = $14,
                            m2 = $15,
                            nro_dormitorios = $16,
                            nro_camas = $17,
                            nro_banios = $18,
                            aire_acondicionado = $19,
                            calefaccion = $20,
                            ascensor = $21,
                            discapacidad = $22,
                            descripcion_camas = $23,
                            descripcion_banios = $24,
                            nro_sofacama = $25,
                            descripcion_sofacama = $26,
                            zonas = $27
                            WHERE id = $28 AND estado >= $29 RETURNING *`,
                values: [
                    data.pais,
                    data.ciudad,
                    data.codigo_postal,
                    data.direccion,
                    data.nro_edificio,
                    data.nro_piso,
                    data.id_dispositivo_ref,
                    data.ubicacion_mapa,
                    data.observaciones,
                    timeStampCurrent,
                    this.idUserLogin,
                    data.etiqueta,
                    data.estado,
                    data.ocupacion_maxima,
                    data.m2,
                    data.nro_dormitorios,
                    data.nro_camas,
                    data.nro_banios,
                    data.aire_acondicionado,
                    data.calefaccion,
                    data.ascensor,
                    data.discapacidad,
                    data.descripcion_camas,
                    data.descripcion_banios,
                    data.nro_sofacama,
                    data.descripcion_sofacama,
                    data.zonas,
                    id,
                    this.filterStatus
                ]
            }
            let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>

            // Delete all propietarios
            queryData = {
                name: 'delete-propietarios',
                text: `DELETE FROM ${Constants.tbl_piso_x_usuario_sql} WHERE idpiso = $1`,
                values: [id]
            }
            await client.query(queryData)

            // Insertamos los nuevos propietarios
            let userDB = lData[0]
            if (userDB && data.propietarios && data.propietarios!.length !== 0) {
                const idDataDB = (userDB as IApartment).id!
                // Asocia varios propietarios a un piso o no asocia
                for (let i = 0; i < data.propietarios!.length; i++) {
                    const queryData = {
                        name: 'insert-piso-x-user',
                        text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                                        VALUES($1,$2) RETURNING *`,
                        values: [data.propietarios![i].id, idDataDB]
                    }
                    let respTmp = (await client.query(queryData)).rows as Array<IUserApartment | IErrorResponse>
                    if ((respTmp[0] as IErrorResponse).error) {
                        lData = respTmp as Array<IErrorResponse>
                        break
                    }
                }
            }

            return lData
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }



    async updateDA_info(id: BigInt, data: IApartment): Promise<IApartment | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let queryData = {
                name: 'update-piso',
                text: `with piso_update as (
                    UPDATE ${Constants.tbl_piso_sql} SET
                    pais = $1, 
                    ciudad = $2, 
                    codigo_postal = $3, 
                    direccion = $4, 
                    nro_edificio = $5,
                    nro_piso = $6,
                    id_dispositivo_ref = $7,
                    ubicacion_mapa = $8,
                    observaciones = $9, 
                    fecha_ultimo_cambio = $10, 
                    idusuario = $11,
                    etiqueta = $12,
                    estado = $13
                    WHERE id = $65 AND estado >= $66
                    RETURNING *
                )
                    UPDATE ${Constants.tbl_info_piso_da_sql}
                    SET 
                    cp_ocupacion_maxima = $14,
                    cp_m2 = $15,
                    ds_nro_dormitorios = $16,
                    ds_nro_camas = $17,
                    bs_nro_banios = $18,
                    ca_aire_acondicionado = $19,
                    ca_calefaccion = $20,
                    cp_ascensor = $21,
                    ca_discapacidad = $22,
                    ds_descripcion_camas = $23,
                    ds_nro_sofacama = $24,
                    ds_descripcion_sofacama = $25,
                    if_zonas = $26,
                    if_tipo = $27,
                    if_clase = $28,
                    if_vista = $29,
                    cp_estancia_total = $30,
                    cp_cerradura_puertas = $31,
                    cp_nro_plantas = $32,
                    co_clase_cocina = $33,
                    co_tipo_cocina = $34,
                    co_tipo_cafetera = $35,
                    co_freidora = $36,
                    co_horno = $37,
                    ah_entrada_independiente = $38,
                    ah_chimenea = $39,
                    ah_lavadora = $40,
                    ah_caja_fuerte = $41,
                    ah_minibar = $42,
                    ah_tipo_tv = $43,
                    ah_ventilador_techo = $44,
                    ah_tipo_internet = $45,
                    ca_aparcamiento_instalaciones = $46,
                    ca_nro_plazas = $47,
                    ca_ubicacion_calefaccion = $48,
                    ca_tipo_calefaccion = $49,
                    ca_alarma = $50,
                    ca_alarma_incendios = $51,
                    ca_balcon = $52,
                    ca_terraza = $53,
                    ca_jardin = $54,
                    ca_piscina = $55,
                    ca_patio_interior = $56,
                    cu_zona_bbq = $57,
                    cu_zona_infantil = $58,
                    cu_spa = $59,
                    cu_gimnasio = $60,
                    plano = $61,
                    bs_nro_aseos = $62,
                    bs_descripcion_banios = $63,
                    link_source_mantenimiento = $64
                    where (id ) IN (select id from piso_update)
                    RETURNING *`,
                values: [
                    data.pais,
                    data.ciudad,
                    data.codigo_postal,
                    data.direccion,
                    data.nro_edificio,
                    data.nro_piso,
                    data.id_dispositivo_ref,
                    data.ubicacion_mapa,
                    data.observaciones,
                    timeStampCurrent,
                    this.idUserLogin,
                    data.etiqueta,
                    data.estado,
                    data.cp_ocupacion_maxima,
                    data.cp_m2,
                    data.ds_nro_dormitorios,
                    data.ds_nro_camas,
                    data.bs_nro_banios,
                    data.ca_aire_acondicionado,
                    data.ca_calefaccion,
                    data.cp_ascensor,
                    data.ca_discapacidad,
                    data.ds_descripcion_camas,
                    // data.descripcion_banios,
                    data.ds_nro_sofacama,
                    data.ds_descripcion_sofacama,
                    data.if_zonas,
                    data.if_tipo,
                    data.if_clase,
                    data.if_vista,
                    data.cp_estancia_total,
                    data.cp_cerradura_puertas,
                    data.cp_nro_plantas,
                    data.co_clase_cocina,
                    data.co_tipo_cocina,
                    data.co_tipo_cafetera,
                    data.co_freidora,
                    data.co_horno,
                    data.ah_entrada_independiente,
                    data.ah_chimenea,
                    data.ah_lavadora,
                    data.ah_caja_fuerte,
                    data.ah_minibar,
                    data.ah_tipo_tv,
                    data.ah_ventilador_techo,
                    data.ah_tipo_internet,
                    data.ca_aparcamiento_instalaciones,
                    data.ca_nro_plazas,
                    data.ca_ubicacion_calefaccion,
                    data.ca_tipo_calefaccion,
                    data.ca_alarma,
                    data.ca_alarma_incendios,
                    data.ca_balcon,
                    data.ca_terraza,
                    data.ca_jardin,
                    data.ca_piscina,
                    data.ca_patio_interior,
                    data.cu_zona_bbq,
                    data.cu_zona_infantil,
                    data.cu_spa,
                    data.cu_gimnasio,
                    data.plano,
                    data.bs_nro_aseos,
                    data.bs_descripcion_banios,
                    data.link_source_mantenimiento,
                    id,
                    this.filterStatus
                ]

            }

            let lData = (await client.query(queryData)).rows as Array<IApartment | IErrorResponse>


            //************** ASIGNAR PROPIETARIO [DESHABILITADO] ****************
            //*******************************************************************
                // Delete all propietarios
                // queryData = {
                //     name: 'delete-propietarios',
                //     text: `DELETE FROM ${Constants.tbl_piso_x_usuario_sql} WHERE idpiso = $1`,
                //     values: [id]
                // }
                // await client.query(queryData)

                // Insertamos los nuevos propietarios
                // let userDB = lData[0]
                // if (userDB && data.propietarios && data.propietarios!.length !== 0) {
                //     const idDataDB = (userDB as IApartment).id!
                //     // Asocia varios propietarios a un piso o no asocia
                //     for (let i = 0; i < data.propietarios!.length; i++) {
                //         const queryData = {
                //             name: 'insert-piso-x-user',
                //             text: `INSERT INTO ${Constants.tbl_piso_x_usuario_sql} ( idusuario, idpiso )
                //                             VALUES($1,$2) RETURNING *`,
                //             values: [data.propietarios![i].id, idDataDB]
                //         }
                //         let respTmp = (await client.query(queryData)).rows as Array<IUserApartment | IErrorResponse>
                //         if ((respTmp[0] as IErrorResponse).error) {
                //             lData = respTmp as Array<IErrorResponse>
                //             break
                //         }
                //     }
                // }
            //******************** END ASIGNAR PROPIETARIO ***************************
            //************************************************************************

            return lData
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }

    async getByIdDA(id: BigInt): Promise<IApartment | IErrorResponse> {
        const queryData = {
            name: 'get-apartment-x-id',
            text: `
                    SELECT 		
                    pf.*,
                    ipd.*
                    FROM (
                        SELECT 
                        p.id,
                        p.ubicacion_mapa,
                        p.pais,
                        p.ciudad,
                        p.codigo_postal,
                        p.direccion,
                        p.nro_edificio,
                        p.nro_piso,
                        p.estado,
                        p.etiqueta,
                        p.ocupacion_maxima,
                        p.m2,
                        p.nro_dormitorios,
                        p.nro_camas,
                        p.nro_banios,
                        p.nro_sofacama,
                        p.aire_acondicionado,
                        p.calefaccion,
                        p.ascensor,
                        p.discapacidad,
                        p.descripcion_camas,
                        p.nro_aseos,
                        p.descripcion_banios,
                        p.descripcion_sofacama,
                        p.observaciones,
                        p.id_dispositivo_ref,
                        (CASE
                            WHEN count(usu.*) > 0 THEN jsonb_agg(json_build_object('id', usu.id, 
                                                                                'nombre', usu.nombre,
                                                                                'apellido', usu.apellido))
                            WHEN count(usu.*) = 0 THEN '[]'
                        END) AS propietarios
                        FROM tbl_piso p
                        LEFT JOIN (
                            SELECT pxu.idpiso, u.id, u.nombre, u.apellido, u.username
                            FROM ${Constants.tbl_piso_x_usuario_sql} pxu
                            INNER JOIN ${Constants.tbl_usuario_sql} u ON (u.id = pxu.idusuario)
                            WHERE pxu.idpiso = $1
                        ) as usu ON (usu.idpiso = p.id)
                        WHERE p.id = $1 AND p.estado >= $2 AND p.estado IS NOT NULL
                        GROUP BY p.id
                        ORDER BY p.id ASC   ) as pf
                        LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd
                        ON pf.id = ipd.id                                     
                        `,
            values: [id, this.filterStatus]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        return lData[0]
    }

    async getAllShare(): Promise<Array<IApartment> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _search_all = this.infoExtra!.filter!.search_all || ''
        const queryData = {
            name: 'get-apartments-by-da',
            text: `SELECT pf.* ,	
                        ipd.cp_ocupacion_maxima,
                        ipd.cp_m2,
                        ipd.ds_nro_dormitorios,
                        ipd.ds_nro_camas,
                        ipd.bs_nro_banios,
                        ipd.ca_aire_acondicionado,
                        ipd.ca_calefaccion,
                        ipd.cp_ascensor,
                        ipd.ca_discapacidad,
                        ipd.ds_descripcion_camas,
                        ipd.bs_nro_aseos,
                        ipd.bs_descripcion_banios,
                        ipd.ds_descripcion_sofacama,
                        ipd.ds_nro_sofacama,
            (
                CASE
                    WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = true THEN 'Si'
                    WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = false THEN 'No'
                    WHEN ipd.id is NULL and pf.aire_acondicionado = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.aire_acondicionado = false THEN 'No'
                END
            ) as lbl_aire_acondicionado,
            (
                CASE
                    WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = true THEN 'Si'
                    WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = false THEN 'No'
                    WHEN ipd.id is NULL and pf.calefaccion = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.calefaccion = false THEN 'No'
                END
            ) as lbl_calefaccion,
            (
                CASE
                    WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = true THEN 'Si'
                    WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = false THEN 'No'
                    WHEN ipd.id is NULL and pf.ascensor= true THEN 'Si'
                    WHEN ipd.id is NULL and pf.ascensor = false THEN 'No'
                END
            ) as lbl_ascensor,
            (
                CASE
                    WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = true THEN 'Si'
                    WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = false THEN 'No'
                    WHEN ipd.id is NULL and pf.discapacidad = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.discapacidad = false THEN 'No'
                END
            ) as lbl_discapacidad
            FROM
            (
            SELECT
            p.id,
            p.ubicacion_mapa,
            p.pais,
            p.ciudad,
            p.codigo_postal,
            p.direccion,
            p.nro_edificio,
            p.nro_piso,
            p.estado,
            p.etiqueta,
            p.observaciones,
            p.ocupacion_maxima,
            p.m2,
            p.nro_dormitorios,
            p.nro_camas,
            p.nro_banios,
            p.nro_sofacama,
            p.discapacidad,
            p.ascensor,
            p.calefaccion,
            p.aire_acondicionado,
            p.descripcion_camas,
            p.descripcion_banios,
            p.descripcion_sofacama,
            STRING_AGG(d.type, '|') as dispositivos_str,
            (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
            FROM ${Constants.tbl_piso_sql} p
            LEFT JOIN (
                SELECT disp.id, disp.idpiso, tdisp.codigo as type  
                FROM ${Constants.tbl_dispositivo_sql} disp
                INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                WHERE disp.estado = 1 AND disp.estado IS NOT NULL
            ) d ON (d.idpiso = p.id)
            WHERE p.estado >= $1 AND 
            p.estado IS NOT NULL AND
            p.tipo LIKE 'piso' AND 
            (
                UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                UNACCENT(lower( replace(trim(   COALESCE(p.ciudad, '') || ',' ||
                                                COALESCE(p.codigo_postal, '') || ','  || 
                                                COALESCE(p.direccion, '') || ',' || 
                                                COALESCE(p.nro_edificio, '') || ',' ||
                                                COALESCE(p.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                $2 = ''
            )
             
            GROUP BY p.id
            ORDER BY p.etiqueta ASC ) as pf
            LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.id = ipd.id
            ORDER BY pf.etiqueta ASC 
                        `,
            values: [this.filterStatus,
            _search_all === '' ? '' : `%${_search_all}%`
            ]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    async getAllWithPaginationColaborador(): Promise<Array<IApartment> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }
        
        const _search_all = this.infoExtra!.filter!.search_all || ''
        let _limit = this.infoExtra.filter.limit || 50
        let _offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1

        const _nro_habitaciones = isNaN(parseInt(this.infoExtra!.filter!.nro_habitaciones)) ? -1 : parseInt(this.infoExtra!.filter!.nro_habitaciones)
        const _capacidad_maxima = isNaN(parseInt(this.infoExtra!.filter!.capacidad_maxima)) ? -1 : parseInt(this.infoExtra!.filter!.capacidad_maxima)
        const _nro_banios = isNaN(parseInt(this.infoExtra!.filter!.nro_banios)) ? -1 : parseInt(this.infoExtra!.filter!.nro_banios)

        let _total_start = isNaN(parseFloat(this.infoExtra!.filter!.total_start)) ? 0 : parseFloat(this.infoExtra!.filter!.total_start)
        let _total_end = isNaN(parseFloat(this.infoExtra!.filter!.total_end)) ? 10000000 : parseFloat(this.infoExtra!.filter!.total_end)

        _total_start = _total_start > -1 ? _total_start : 0
        _total_end = _total_end > -1 ? _total_end : 10000000

        const queryData = {
            name: 'get-apartments-colaborador',
            text: `SELECT                   pf.*,		
                                            ipd.cp_ocupacion_maxima,
                                            ipd.cp_m2,
                                            ipd.ds_nro_dormitorios,
                                            ipd.ds_nro_camas,
                                            ipd.bs_nro_banios,
                                            ipd.ca_aire_acondicionado,
                                            ipd.ds_nro_sofacama,
                                            ipd.ca_calefaccion,
                                            ipd.cp_ascensor,
                                            ipd.ca_discapacidad,
                                            ipd.ds_descripcion_camas,
                                            ipd.bs_nro_aseos,
                                            ipd.bs_descripcion_banios,
                                            ipd.ds_descripcion_sofacama,
                                            (
                                                CASE
                                                    WHEN ipd.ca_aire_acondicionado = true THEN 'Si'
                                                    WHEN ipd.ca_aire_acondicionado = false THEN 'No'
                                                END
                                            ) as lbl_aire_acondicionado,
                                            (
                                                CASE
                                                    WHEN ipd.ca_calefaccion = true THEN 'Si'
                                                    WHEN ipd.ca_calefaccion = false THEN 'No'
                                                END
                                            ) as lbl_calefaccion,
                                            (
                                                CASE
                                                    WHEN ipd.cp_ascensor = true THEN 'Si'
                                                    WHEN ipd.cp_ascensor = false THEN 'No'
                                                END
                                            ) as lbl_ascensor,
                                            (
                                                CASE
                                                    WHEN ipd.ca_discapacidad = true THEN 'Si'
                                                    WHEN ipd.ca_discapacidad = false THEN 'No'
                                                END
                                            ) as lbl_discapacidad
                                            FROM(

                                SELECT vc.variablesreserva, vc.total_str, p.*, ipc.estado_general  
                                            
                                    FROM (
                                        SELECT p.id,
                                        p.ubicacion_mapa,
                                        p.pais,
                                        p.ciudad,
                                        p.codigo_postal,
                                        p.direccion,
                                        p.nro_edificio,
                                        p.nro_piso,
                                        p.estado,
                                        p.etiqueta,
                                        p.ocupacion_maxima,
                                        p.m2,
                                        p.nro_dormitorios,
                                        p.nro_camas,
                                        p.nro_banios,
                                        p.nro_sofacama,
                                        p.aire_acondicionado,
                                        p.calefaccion,
                                        p.ascensor,
                                        p.discapacidad,
                                        p.descripcion_camas,
                                        p.nro_aseos,
                                        p.descripcion_banios,
                                        p.descripcion_sofacama,
                                        (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
                                        FROM ${Constants.tbl_piso_sql} p
                                        WHERE p.estado = 1 AND
                                        p.tipo LIKE 'piso' AND
                                        p.visible_rmg = 1 AND
                                        (
                                            UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR
                                            UNACCENT(lower( replace(trim(   COALESCE(p.ciudad, '') || ',' ||
                                                                            COALESCE(p.codigo_postal, '') || ','  || 
                                                                            COALESCE(p.direccion, '') || ',' || 
                                                                            COALESCE(p.nro_edificio, '') || ',' ||
                                                                            COALESCE(p.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($1),' ','') )) OR 
                                            $1 = ''
                                        )
                                        GROUP BY p.id
                                        ORDER BY p.etiqueta ASC
                                    ) p
                                    INNER JOIN ${Constants.tbl_info_piso_comercial_rmg_sql} ipc ON (p.id = ipc.idpiso)
                                    INNER JOIN (
                                        SELECT ipc.idpiso,
                                        (CASE
                                            WHEN count(vr.*) > 0 THEN jsonb_agg(json_build_object(  'id', vr.id,
                                                                                                    'precio_alquiler', vr.precio_alquiler,
                                                                                                    'precio_muebles', vr.precio_muebles,
                                                                                                    'total', vr.total
                                                                                                ))
                                            WHEN count(vr.*) = 0 THEN '[]'
                                        END
                                        ) as variablesreserva,
                                        STRING_AGG( COALESCE(vr.total, 0)::text, ' | ') as total_str
                                        FROM ${Constants.tbl_info_piso_comercial_rmg_sql} ipc
                                        LEFT JOIN (
                                            SELECT * 
                                            FROM ${Constants.tbl_variables_reserva_rmg_sql} vr 
                                            WHERE vr.estado = 1 
                                            ORDER BY fecha_creacion DESC, id DESC 
                                        ) vr ON (ipc.id = vr.idinfopisocom)
                                        WHERE ipc.estado = 1
                                        GROUP BY ipc.idpiso
                                    ) vc ON (vc.idpiso = p.id)
                                ) as pf
                                    LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.id = ipd.id 
                                    WHERE pf.estado_general = 1 AND 
                                    (
                                        ipd.ds_nro_dormitorios = $2 OR $2 = -1
                                    ) AND
                                    (
                                        $3 <= ipd.cp_ocupacion_maxima OR $3 = -1
                                    ) AND
                                    (
                                        ipd.bs_nro_banios = $4 OR $4 = -1
                                    ) AND
                                    ( 
                                        ( CAST(COALESCE(pf.total_str, '0') as double precision) BETWEEN $5 AND $6 ) OR
                                        ( CAST(COALESCE(pf.total_str, '0') as double precision)::integer BETWEEN ($5)::integer AND ($6)::integer )
                                    )
                                    ORDER BY CAST(COALESCE(pf.total_str, '0') as double precision) ASC, pf.etiqueta ASC
                                    LIMIT $7 OFFSET $8                    

                                                `,
            values: [
                _search_all === '' ? '' : `%${_search_all}%`,
                _nro_habitaciones,
                _capacidad_maxima,
                _nro_banios,
                _total_start,
                _total_end,
                _limit,
                _offset
            ]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * NO TOCAR
     * Retorna los pisos con sus respectivos dispositivos y a su vez el estado de conexión del dispositivo
     * VARIABLE TEMPORAL [Offline]. PARA GENERAR EL REPORTE
     * @param idReport Id de reporte que se desea generar
     * @returns 
     */
    async getPisosDeviceStatusReport(idReport: BigInt): Promise<Array<IApartment> | IErrorResponse> {
        const queryData = {
            name: 'get-apartments-with-status-devices-report',
            text: `
                        SELECT p.etiqueta,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object( 
                                                                                'type', d.type, 
                                                                                'state', d.state 
                                                                                ))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM (
                            SELECT dr.id_piso
                            FROM tbl_detalle_reporte_atic dr
                            WHERE dr.id_reporte = $1
                            GROUP BY dr.id_piso
                        ) pr
                        INNER JOIN tbl_piso p ON (p.id = pr.id_piso)
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, COALESCE(dr.state, '') as state
                            FROM tbl_dispositivo disp
                            INNER JOIN tbl_tipo_dispositivo tdisp ON (tdisp.id = disp.idtipodispositivo)
                            INNER JOIN tbl_detalle_reporte_atic dr ON (dr.id_device = disp.id AND dr.id_reporte = $1)
                        ) d ON (d.idpiso = p.id)
                        WHERE p.tipo IN ('piso', 'oficina')
                        GROUP BY p.id, p.etiqueta
                        ORDER BY p.etiqueta ASC
                        `,
            values: [idReport]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    /**
     * NO TOCAR
     * Retorna el estado de dispositivos por piso, para la respectiva edición
     * @param idReport 
     * @param lTypeDeviceCodes 
     * @returns 
     */
    async getPisosDeviceStatusReportEdit(idReport: BigInt, lTypeDeviceCodes?: Array<TypeDeviceType>): Promise<Array<IApartment> | IErrorResponse> {
        let _lTypesDevicesCodes = lTypeDeviceCodes || []

        const queryData = {
            name: 'get-apartments-with-status-devices-report',
            text: `
                        SELECT p.id, p.etiqueta,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object(
                                                                                'id', d.id,
                                                                                'iddetallereporte', d.idrd, 
                                                                                'type', d.type, 
                                                                                'state', d.state 
                                                                                ))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM (
                            SELECT dr.id_piso
                            FROM tbl_detalle_reporte_atic dr
                            WHERE dr.id_reporte = $1
                            GROUP BY dr.id_piso
                        ) pr
                        INNER JOIN tbl_piso p ON (p.id = pr.id_piso)
                        LEFT JOIN (
                            SELECT disp.id, dr.id as idrd, disp.idpiso, tdisp.codigo as type, COALESCE(dr.state, '') as state
                            FROM tbl_dispositivo disp
                            INNER JOIN tbl_tipo_dispositivo tdisp ON (tdisp.id = disp.idtipodispositivo)
                            INNER JOIN tbl_detalle_reporte_atic dr ON (dr.id_device = disp.id AND dr.id_reporte = $1)
                            WHERE (tdisp.codigo = ANY($2::character varying[]) OR $3 = 0)
                        ) d ON (d.idpiso = p.id)
                        WHERE p.tipo IN ('piso', 'oficina')
                        GROUP BY p.id, p.etiqueta
                        ORDER BY p.etiqueta ASC
                        `,
            values: [
                idReport,
                _lTypesDevicesCodes,
                _lTypesDevicesCodes.length
            ]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    async AsociarDispositivos(idpiso: BigInt, ldispositivos: Array<number>): Promise<IApartment | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            
            // Desacoplar todos los dispositivos del piso
            let queryUpdateToNull = {
                name: 'update-devices-piso-null',
                text: `
                        UPDATE ${Constants.tbl_dispositivo_sql} SET
                            idpiso=null,
                            fecha_ultimo_cambio=$2
                        WHERE idpiso = $1
                        `,
                values: [
                    idpiso,
                    timeStampCurrent
                ]
            }
            await client.query(queryUpdateToNull)

            // Asignamos los dispositivos al PISO
            for ( let i = 0; i < ldispositivos.length; i++ ) {
                let queryData = {
                    name: 'update-asociar-device-to-piso',
                    text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                            idpiso=$1,
                            fecha_ultimo_cambio=$2
                            WHERE id = $3 RETURNING *`,
                    values: [
                        idpiso,
                        timeStampCurrent,
                        ldispositivos[i]
                    ]
                }
                await client.query(queryData)
            }

            return [ {id: parseInt(idpiso.toString())} ] // retornamos el id del piso
        })

        return (responseD[0]) as IApartment | IErrorResponse
    }

    /**
     * Obtener dispositivos asociados al piso
     * @param idpiso 
     * @returns 
     */
    async getDevicesByPisoId(idpiso: BigInt): Promise<IApartment | IErrorResponse> {
        const queryData = {
            name: 'get-devices-by-apartment',
            text: ` 
                    SELECT p.id, p.etiqueta,
                    (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion,
                    pxd.dispositivos
                    FROM ${Constants.tbl_piso_sql} p
                    INNER JOIN (
                        SELECT p.id,
                        (CASE
                            WHEN count(d.*) > 0 THEN jsonb_agg(json_build_object('id', d.id, 
                                                                                'type', d.type, 
                                                                                'codigo', d.codigo, 
                                                                                'nombre', d.nombre,
                                                                                'estado', d.estado,
                                                                                'etiqueta_dispositivo', d.etiqueta_dispositivo))
                            WHEN count(d.*) = 0 THEN '[]'
                        END) AS dispositivos
                        FROM ${Constants.tbl_piso_sql} p
                        LEFT JOIN (
                            SELECT disp.id, disp.idpiso, tdisp.codigo as type, 
                            disp.codigo, disp.nombre, disp.etiqueta_dispositivo, disp.estado  
                            FROM ${Constants.tbl_dispositivo_sql} disp
                            INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                            ORDER BY tdisp.codigo
                        ) d ON (d.idpiso = p.id AND d.idpiso = $1)
                        WHERE p.estado >= $2 AND p.estado IS NOT NULL AND p.id = $1
                        GROUP BY p.id, p.etiqueta
                    ) pxd ON pxd.id = p.id AND p.id = $1
            `,
            values: [
                idpiso,
                this.filterStatus
            ]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }


    async getAllDAPagination(): Promise<Array<IApartment> | IErrorResponse> { 
        if (!this.infoExtra) this.infoExtra = {}
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        const _search_all = this.infoExtra!.filter!.search_all || ''

        const queryData = {
            name: 'get-apartments-pagination-x-da',
            text: `
            SELECT pf.*, 
            ipd.cp_ocupacion_maxima,
            ipd.cp_m2,
            ipd.ds_nro_dormitorios,
            ipd.ds_nro_camas,
            ipd.bs_nro_banios,
            ipd.ca_aire_acondicionado,
            ipd.ca_calefaccion,
            ipd.cp_ascensor,
            ipd.ca_discapacidad,
            ipd.ds_descripcion_camas,
            ipd.bs_nro_aseos,
            ipd.bs_descripcion_banios,
            ipd.ds_descripcion_sofacama,
            ipd.ds_nro_sofacama,
            ipd.link_source_mantenimiento,
            (
                CASE
                    WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = true THEN 'Si'
                    WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = false THEN 'No'
                    WHEN ipd.id is NULL and pf.aire_acondicionado = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.aire_acondicionado = false THEN 'No'
                END
            ) AS lbl_aire_acondicionado,
            (
                CASE
                    WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = true THEN 'Si'
                    WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = false THEN 'No'
                    WHEN ipd.id is NULL and pf.calefaccion = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.calefaccion = false THEN 'No'
                END
            ) AS lbl_calefaccion,
            (
                CASE
                    WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = true THEN 'Si'
                    WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = false THEN 'No'
                    WHEN ipd.id is NULL and pf.ascensor= true THEN 'Si'
                    WHEN ipd.id is NULL and pf.ascensor = false THEN 'No'
                END
            ) AS lbl_ascensor,
            (
                CASE
                    WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = true THEN 'Si'
                    WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = false THEN 'No'
                    WHEN ipd.id is NULL and pf.discapacidad = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.discapacidad = false THEN 'No'
                END
            ) AS lbl_discapacidad
            FROM 
            (
                SELECT p.id,
                p.ubicacion_mapa,
                p.pais,
                p.ciudad,
                p.codigo_postal,
                p.direccion,
                p.nro_edificio,
                p.nro_piso,
                p.estado,
                p.etiqueta,
                p.ocupacion_maxima,
                p.m2,
                p.nro_dormitorios,
                p.nro_camas,
                p.nro_banios,
                p.nro_sofacama,
                p.aire_acondicionado,
                p.calefaccion,
                p.ascensor,
                p.discapacidad,
                p.descripcion_camas,
                p.nro_aseos,
                p.descripcion_banios,
                p.descripcion_sofacama,
                p.observaciones,
                p.tipo,
                STRING_AGG(d.type, '|') as dispositivos_str,
                (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
                FROM ${Constants.tbl_piso_sql} p
                LEFT JOIN (
                    SELECT disp.id, disp.idpiso, tdisp.codigo as type  
                    FROM ${Constants.tbl_dispositivo_sql} disp
                    INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                    WHERE disp.estado = 1 AND disp.estado IS NOT NULL
                ) d ON (d.idpiso = p.id)
               
                GROUP BY p.id
            ) as pf
            LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.id = ipd.id
            WHERE pf.estado >= $1 AND 
            pf.estado IS NOT NULL AND
            pf.tipo LIKE 'piso' AND 
            (
                UNACCENT(lower( replace(trim(pf.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                UNACCENT(lower( replace(trim(   COALESCE(pf.ciudad, '') || ',' ||
                                                COALESCE(pf.codigo_postal, '') || ','  || 
                                                COALESCE(pf.direccion, '') || ',' || 
                                                COALESCE(pf.nro_edificio, '') || ',' ||
                                                COALESCE(pf.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                $2 = ''
            )
            ORDER BY nullif(regexp_replace(lower(pf.etiqueta), '[^a-z]', '', 'g'),'')::text, 
                    nullif(regexp_replace(pf.etiqueta, '[^0-9]', '', 'g'),'')::int
            LIMIT $3 OFFSET $4
                        `,
            values: [0,
            _search_all === '' ? '' : `%${_search_all}%`,
            limit,
            offset
            ]
        }

        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>
        
        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }

    async getAllSharePagination(): Promise<Array<IApartment> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        const _search_all = this.infoExtra!.filter!.search_all || ''
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1

        const queryData = {
            name: 'get-apartments-by-da',
            text: `SELECT pf.* ,	
                        ipd.cp_ocupacion_maxima,
                        ipd.cp_m2,
                        ipd.ds_nro_dormitorios,
                        ipd.ds_nro_camas,
                        ipd.bs_nro_banios,
                        ipd.ca_aire_acondicionado,
                        ipd.ca_calefaccion,
                        ipd.cp_ascensor,
                        ipd.ca_discapacidad,
                        ipd.ds_descripcion_camas,
                        ipd.bs_nro_aseos,
                        ipd.bs_descripcion_banios,
                        ipd.ds_descripcion_sofacama,
                        ipd.ds_nro_sofacama,
            (
                CASE
                    WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = true THEN 'Si'
                    WHEN ipd.ca_aire_acondicionado is not NULL AND ipd.ca_aire_acondicionado = false THEN 'No'
                    WHEN ipd.id is NULL and pf.aire_acondicionado = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.aire_acondicionado = false THEN 'No'
                END
            ) as lbl_aire_acondicionado,
            (
                CASE
                    WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = true THEN 'Si'
                    WHEN ipd.ca_calefaccion is not NULL and ipd.ca_calefaccion = false THEN 'No'
                    WHEN ipd.id is NULL and pf.calefaccion = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.calefaccion = false THEN 'No'
                END
            ) as lbl_calefaccion,
            (
                CASE
                    WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = true THEN 'Si'
                    WHEN ipd.cp_ascensor  is not NULL AND ipd.cp_ascensor = false THEN 'No'
                    WHEN ipd.id is NULL and pf.ascensor= true THEN 'Si'
                    WHEN ipd.id is NULL and pf.ascensor = false THEN 'No'
                END
            ) as lbl_ascensor,
            (
                CASE
                    WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = true THEN 'Si'
                    WHEN ipd.ca_discapacidad is not NULL AND ipd.ca_discapacidad = false THEN 'No'
                    WHEN ipd.id is NULL and pf.discapacidad = true THEN 'Si'
                    WHEN ipd.id is NULL and pf.discapacidad = false THEN 'No'
                END
            ) as lbl_discapacidad
            FROM
            (
            SELECT
            p.id,
            p.ubicacion_mapa,
            p.pais,
            p.ciudad,
            p.codigo_postal,
            p.direccion,
            p.nro_edificio,
            p.nro_piso,
            p.estado,
            p.etiqueta,
            p.observaciones,
            p.ocupacion_maxima,
            p.m2,
            p.nro_dormitorios,
            p.nro_camas,
            p.nro_banios,
            p.nro_sofacama,
            p.discapacidad,
            p.ascensor,
            p.calefaccion,
            p.aire_acondicionado,
            p.descripcion_camas,
            p.descripcion_banios,
            p.descripcion_sofacama,
            STRING_AGG(d.type, '|') as dispositivos_str,
            (p.ciudad || ', ' || p.codigo_postal || ', ' || p.direccion || ' Nro ' || p.nro_edificio || ', ' || p.nro_piso) as full_direccion
            FROM ${Constants.tbl_piso_sql} p
            LEFT JOIN (
                SELECT disp.id, disp.idpiso, tdisp.codigo as type  
                FROM ${Constants.tbl_dispositivo_sql} disp
                INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} tdisp ON (tdisp.id = disp.idtipodispositivo)
                WHERE disp.estado = 1 AND disp.estado IS NOT NULL
            ) d ON (d.idpiso = p.id)
            WHERE p.estado >= $1 AND 
            p.estado IS NOT NULL AND
            p.tipo LIKE 'piso' AND 
            (
                UNACCENT(lower( replace(trim(p.etiqueta ),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                UNACCENT(lower( replace(trim(   COALESCE(p.ciudad, '') || ',' ||
                                                COALESCE(p.codigo_postal, '') || ','  || 
                                                COALESCE(p.direccion, '') || ',' || 
                                                COALESCE(p.nro_edificio, '') || ',' ||
                                                COALESCE(p.nro_piso, '') ),' ','') )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR 
                $2 = ''
            )
             
            GROUP BY p.id
            ORDER BY p.etiqueta ASC ) as pf
            LEFT JOIN ${Constants.tbl_info_piso_da_sql} ipd ON pf.id = ipd.id
            ORDER BY nullif(regexp_replace(lower(pf.etiqueta), '[^a-z]', '', 'g'),'')::text, 
                    nullif(regexp_replace(pf.etiqueta, '[^0-9]', '', 'g'),'')::int   
            LIMIT $3 OFFSET $4
                        `,
            values: [this.filterStatus,
            _search_all === '' ? '' : `%${_search_all}%`,
            limit,
            offset
            ]
        }
        
        let lData: Array<IApartment | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IApartment | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IApartment>
    }
    
}

export default ApartmentDataAccess