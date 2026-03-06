import { ifError } from "assert";
import Constants from "../helpers/Constants";
import DbConnection from "../helpers/DbConnection";
import { IDataAccess } from "../helpers/IDataAccess";
import UtilInstance from "../helpers/Util";
import { IDevice } from "../models/IDevice";
import { ILock } from "../models/ILock";
import { IMovil } from "../models/IMovil";
import { IRouter } from "../models/IRouter";
import { ISwitchOnOff } from "../models/ISwitchOnOff";
import { ITelefonillo } from "../models/ITelefonillo";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import { StatusDataType, TypeDeviceType } from "../types/GlobalTypes";
import { IModel } from "../helpers/IModel";
import { timeStamp, error } from 'console';
import { IError } from "../modelsextra/IError";
import { ICamara } from "../models/ICamara";
class DeviceDataAccess implements IDataAccess<IDevice> {

    public client: DbConnection

    constructor(
        public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IDevice> | IErrorResponse> {
        const queryData = {
            name: 'get-devices',
            text: `SELECT dev.id, dev.nombre, dev.idtipodispositivo, dev.fecha_creacion, dev.fecha_ultimo_cambio, mtype.codigo, dev.ubicacion
                    FROM ${Constants.tbl_dispositivo_sql} dev
                    JOIN ${Constants.tbl_tipo_dispositivo_sql} mtype on (dev.idtipodispositivo = mtype.id)
                    WHERE dev.estado >= $1 AND dev.estado IS NOT NULL`,
            values: [this.filterStatus]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>


        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IDevice>

    }

    // Marcos: implementando busqueda por id
    async getById(id: BigInt): Promise<IDevice | IErrorResponse> {
        const queryData = {
            name: 'get-device-by-id',
            text: `
            SELECT d.id, d.idtipodispositivo, d.idpiso, d.codigo, d.nombre, d.ubicacion,d.estado,d.descripcion ,td.codigo as type,
            (
            CASE
                    WHEN td.codigo LIKE 'lock' AND count(dl.*) <> 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'mac' , dl.mac, 
                                                                'bateria' ,dl.bateria,
                                                                'codigo_permanente' ,dl.codigo_permanente
                                                            ))
                    WHEN td.codigo LIKE 'ttlock' AND count(dl.*) <> 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'mac' , dl.mac, 
                                                                'bateria' ,dl.bateria,
                                                                'codigo_permanente' ,dl.codigo_permanente
                                                            ))
                    WHEN td.codigo LIKE 'movil' AND count(dm.*) <> 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'version_app', dm.version_app,
                                                                'ip', dm.ip,
                                                                'macwifi',dm.macwifi
                                                            ))
                    WHEN td.codigo LIKE 'router' AND count(dr.*) <> 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'tipo_conexion', dr.tipo_conexion
                                                            ))
                    WHEN td.codigo LIKE 'sonoff' AND count(ds.*) <> 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'na', 'na'
                                                            ))
                    WHEN td.codigo LIKE 'telefonillo' AND count(dt.*) <> 0 THEN jsonb_agg(
                                                                json_build_object(
                                                                'ip_arduino', dt.ip_arduino
                                                            ))
                    ELSE '{}'
                END
            ) as info_extra
            FROM tbl_dispositivo d
            INNER JOIN tbl_tipo_dispositivo td ON (td.id = d.idtipodispositivo)
            LEFT JOIN tbl_manija dl ON (dl.iddispositivo = d.id)
            LEFT JOIN tbl_movil dm ON (dm.iddispositivo = d.id)
            LEFT JOIN tbl_router dr ON (dr.iddispositivo = d.id)
            LEFT JOIN tbl_sonoff ds ON (ds.iddispositivo = d.id)
            LEFT JOIN tbl_telefonillo dt ON (dt.iddispositivo = d.id)
            WHERE d.id = $1  AND d.estado IS NOT NULL
            GROUP BY d.id, td.codigo`,
            values: [id]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>
        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse
        return lData[0]
    }

    //Para consultar desde el movil
    async getByRefCode(refCode: String) {

    }

    async insert(data: IDevice): Promise<IDevice | IErrorResponse> {
        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        const queryData = {
            name: 'insert-device',
            text: `INSERT INTO ${Constants.tbl_dispositivo_sql}(
                          codigo,
                          nombre,
                          ubicacion,
                          estado,  
                          fecha_creacion, 
                          fecha_ultimo_cambio)
                          VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            values: [
                data.codigo,
                data.nombre,
                data.ubicacion,
                this.filterStatus,
                timeStampCurrent,
                timeStampCurrent,
                this.idUserLogin
            ]
        }
        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    update(id: BigInt, data: IDevice): Promise<IDevice | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<IDevice | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     *      Mismas funciones con dispositivos de tipo "lock"
 
     * @returns 
     */

    //Pedir solo los dispositivos de tipo manijas
    async getLock(): Promise<Array<IDevice> | IErrorResponse> {

        const queryData = {
            name: 'get-locks',
            text: `SELECT dev.id, dev.nombre, dev.idtipodispositivo, dev.fecha_creacion, dev.fecha_ultimo_cambio, dev.ubicacion
                        FROM ${Constants.tbl_dispositivo_sql} dev
                        JOIN ${Constants.tbl_tipo_dispositivo_sql} mtype on (dev.idtipodispositivo = mtype.id)
                        WHERE dev.estado >= $1 AND dev.estado IS NOT NULL AND (mtype.codigo LIKE 'lock' OR mtype.codigo LIKE 'ttlock')`,
            values: [this.filterStatus]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IDevice>
    }

    /**
     * Retorna información del dispositivo SonOff
     * @param id -> Id del dispositivo [Se verifica que sea un SONOFF]
     * @returns 
     */
    async getSOnOffById(id: BigInt): Promise<IDevice | IErrorResponse> {
        const queryData = {
            name: 'get-sonoffid',
            text: ` SELECT dev.id, dev.nombre, dev.codigo
                    FROM ${Constants.tbl_dispositivo_sql} dev
                    LEFT JOIN ${Constants.tbl_sonoff_sql} sonoff on (sonoff.iddispositivo = dev.id)
                    WHERE dev.estado >= $1 AND dev.estado IS NOT NULL AND dev.id = $2`,
            values: [this.filterStatus, id]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0] as IDevice
    }
    async InsertDeviceByIdInsertERP(data: ITelefonillo): Promise<IDevice | IErrorResponse> {
        const queryData = {
            name: 'Insert-Device-ERP',
            text: `INSERT INTO ${Constants.type_device_telefonillo}(
                ip_arduino)
                VALUES($1)
                RETURNING *`,
            values: [
                data.ip_arduino
            ]
        }
        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]

    }

    async getDeviceByIdAndIdPiso(id: BigInt, idPiso: BigInt): Promise<IDevice | IErrorResponse> {
        console.log('ddd')
        const queryData = {
            name: 'get-device-by-piso',
            text: `
                    SELECT d.id, d.idtipodispositivo, d.idpiso, d.codigo, d.nombre, d.ubicacion, td.codigo as type,
                    (
                        CASE
                            WHEN td.codigo LIKE 'lock' AND count(dl.*) <> 0 THEN jsonb_agg(
                                                                        json_build_object(
                                                                        'mac', dl.mac
                                                                    ))
                            WHEN td.codigo LIKE 'ttlock' AND count(dl.*) <> 0 THEN jsonb_agg(
                                                                        json_build_object(
                                                                        'mac', dl.mac
                                                                    ))
                            WHEN td.codigo LIKE 'movil' AND count(dm.*) <> 0 THEN jsonb_agg(
                                                                        json_build_object(
                                                                        'version_app', dm.version_app,
                                                                        'ip', dm.ip,
                                                                        'macwifi', dm.macwifi
                                                                    ))
                            WHEN td.codigo LIKE 'router' AND count(dr.*) <> 0 THEN jsonb_agg(
                                                                        json_build_object(
                                                                        'tipo_conexion', dr.tipo_conexion
                                                                    ))
                            WHEN td.codigo LIKE 'sonoff' AND count(ds.*) <> 0 THEN jsonb_agg(
                                                                        json_build_object(
                                                                        'na', 'na'
                                                                    ))
                            WHEN td.codigo LIKE 'telefonillo' AND count(dt.*) <> 0 THEN jsonb_agg(
                                                                        json_build_object(
                                                                        'ip_arduino', dt.ip_arduino
                                                                    ))
                            ELSE '[]'
                        END

                    ) as data_son

                    FROM tbl_dispositivo d
                    INNER JOIN tbl_tipo_dispositivo td ON (td.id = d.idtipodispositivo)
                    LEFT JOIN tbl_manija dl ON (dl.iddispositivo = d.id)
                    LEFT JOIN tbl_movil dm ON (dm.iddispositivo = d.id)
                    LEFT JOIN tbl_router dr ON (dr.iddispositivo = d.id)
                    LEFT JOIN tbl_sonoff ds ON (ds.iddispositivo = d.id)
                    LEFT JOIN tbl_telefonillo dt ON (dt.iddispositivo = d.id)
                    WHERE d.id = $1 AND d.idpiso = $2 AND d.estado = 1 AND d.estado IS NOT NULL
                    GROUP BY d.id, td.codigo`,
            values: [id, idPiso]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        return lData[0]
    }

    /**
     * 
     * @returns 
     */

    async getAllWithPagination(): Promise<Array<IDevice> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} }
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} }

        let limit = this.infoExtra.filter.limit || 50
        let offset = this.infoExtra.filter.offset || 0 // inicia en 0 ... n-1
        let search_all = this.infoExtra.filter.search_all || ''

        const queryData = {
            name: 'get-all-devices',
            text: ` SELECT
                    d.id,
                    d.codigo,
                    d.nombre,
                    d.estado,
                    d.idpiso,
                    d.etiqueta,
                    d.tdevice,
                    COALESCE((d.descripcion), '') as descripcion,
                    estado_piso
                    FROM (
                        SELECT d.*, 
                        COALESCE((p.etiqueta), 'Libre') as etiqueta, 
                        td.codigo as tdevice, 
                        td.nombre as nametdevice,
                        COALESCE((l.mac), 'XX:XX:XX:XX:XX:XX') as mac,
                        p.estado as estado_piso
                        FROM tbl_dispositivo d
                        LEFT JOIN tbl_piso p ON (p.id = d.idpiso)
                        LEFT JOIN tbl_manija l ON (l.iddispositivo = d.id)
                        INNER JOIN tbl_tipo_dispositivo td ON (td.id = d.idtipodispositivo)
                    ) d
                    WHERE d.estado >= $1 AND 
                    (
                        UNACCENT(lower( replace(trim(d.codigo),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.nombre),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.tdevice),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.nametdevice),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.etiqueta),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        UNACCENT(lower( replace(trim(d.mac),' ','')  )) LIKE UNACCENT(lower( replace(trim($2),' ','') )) OR
                        $2 = ''
                    )
                    ORDER BY d.estado DESC, d.etiqueta ASC, d.tdevice ASC
                    LIMIT $3 OFFSET $4
                    `,
            values: [
                this.filterStatus,
                search_all === '' ? '' : `%${search_all}%`,
                limit,
                offset
            ]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>
        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IDevice>
    }

    /**
     * ************************************agrupacion de inserciones de Devices**************************************/





    // 1.lock 2.telefonillo 3.movil 4.router 5.sonoff 6.camara

    /**
     * Inserta una manija/lock
     * @param data 
     * @returns 
     */
    async insertDevice(data: IDevice): Promise<IDevice | IErrorResponse> {
        const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
        const queryData = {
            name: 'insert-device',
            text: `INSERT INTO ${Constants.tbl_dispositivo_sql} 
            (codigo, nombre, ubicacion, descripcion, estado, 
            fecha_creacion, fecha_ultimo_cambio, 
            idpiso, idtipodispositivo, propietario) 
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,

            values: [
                data.codigo,
                data.nombre,
                data.ubicacion,
                data.descripcion,
                data.estado,
                timeStampCurrent,
                timeStampCurrent,
                data.idpiso,
                data.idtipodispositivo,
                data.propietario,

            ]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData[0]
    }

    /**
     * Este metodo esta para retornar todos los dispositivos disponibles por tipo de dispositivo [codigo]
     * @param code 
     * @returns 
     */
    async getAllDevicesDisponibles(code: string): Promise<Array<IDevice> | IErrorResponse> {
        const queryData = {
            name: 'get-all-devices-disponibles',
            text: ` SELECT d.id ,d.nombre, d.codigo, d.estado, t.codigo as type
                    FROM tbl_dispositivo d
                    INNER JOIN tbl_tipo_dispositivo t ON t.id=d.idtipodispositivo
                    WHERE  estado = $2 AND 
                    idpiso IS NULL AND
                    t.codigo LIKE $1
                    ORDER BY d.nombre ASC`,
            values: [
                code || '',
                this.filterStatus
            ]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>
        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IDevice>
    }

    /**
     * Retorna listado de dispositivos, filtrados por la columna codigo, donde deben estar activos el PISO y DISPOSITIVOS
     * @param lCodes 
     * @returns 
     */
    async getByListCodes(lCodes: Array<string>): Promise<Array<IDevice> | IErrorResponse> {
        const queryData = {
            name: 'get-all-devices',
            text: ` SELECT d.id ,d.codigo, d.idpiso
                    FROM ${Constants.tbl_dispositivo_sql} d
                    INNER JOIN ${Constants.tbl_piso_sql} p ON p.id = d.idpiso
                    WHERE d.idpiso IS NOT NULL AND
                    p.estado = 1 AND
                    d.estado = 1 AND 
                    d.codigo = ANY($1::character varying[])`,
            values: [
                lCodes
            ]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IDevice>
    }

    /**
     * Retorna todos los dispositivos por un tipo o un listado de tipos
     * ESTE METODO DEBERIA SUSTITUIR EL ANTERIOR [getByListCodes]
     * @param typeDeviceCodes [lock, movil, telefonillo, camara, sonoff]
     * @returns 
     */
    async getByTypeDeviceCode(lTypeDeviceCodes: Array<TypeDeviceType>): Promise<Array<IDevice> | IErrorResponse> {
        const queryData = {
            name: 'get-all-devices-by-typecode',
            text: `
                    SELECT d.id ,d.codigo, d.idpiso, p.id_dispositivo_ref AS code_piso, td.codigo AS type
                    FROM ${Constants.tbl_dispositivo_sql} d
                    INNER JOIN ${Constants.tbl_tipo_dispositivo_sql} td ON td.id = d.idtipodispositivo
                    INNER JOIN ${Constants.tbl_piso_sql} p ON p.id = d.idpiso
                    WHERE d.idpiso IS NOT NULL AND
                    d.estado = 1 AND
                    p.estado = 1 AND
                    td.codigo = ANY($1::character varying[])
                    `,
            values: [
                lTypeDeviceCodes
            ]
        }

        let lData: Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

        return lData as Array<IDevice>
    }


    /**
     * 
     * @param id 
     * @returns 
     */
    async deleteOneDeviceByID(id: BigInt): Promise<IDevice | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL();

            const queryGetDevice = {
                name: "get-device",
                text: `SELECT idtipodispositivo,
                        idpiso 
                        FROM ${Constants.tbl_dispositivo_sql}
                        WHERE id = $1 `,
                values: [id]
            }

            let _dataDevice = (await client.query(queryGetDevice)).rows as Array<IDevice>;
            let dataDeviceDB = (_dataDevice.length !== 0) ? _dataDevice[0] : {} as IDevice


            const queryData = {
                name: "delete-one-device",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET 
                estado = $1,
                idtipodispositivo = $2,
                fecha_ultimo_cambio= $3,
                idpiso = $4
                WHERE id = $5 RETURNING *`,

                values: [
                    Constants.code_status_delete,
                    dataDeviceDB.idtipodispositivo,
                    timeStampCurrent,
                    dataDeviceDB.idpiso,
                    id
                ]
            }
            // let lData : Array<IDevice | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IDevice | IErrorResponse>
            // console.log(lData)
            // return lData
            let lData = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            return lData
        })
        return (responseD[0]) as IDevice | IErrorResponse

    }

    /**
     * 
     * @param id 
     * @param data 
     * @returns 
     */
    async updateDevice(id: BigInt, data: IDevice): Promise<IDevice | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let queryData = {
                name: "update Device",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                idpiso = $1,
                idtipodispositivo = $2,
                codigo = $3,
                nombre = $4,
                ubicacion = $5,
                ref_dispositivo = $6,
                etiqueta_dispositivo = $7,
                descripcion = $8,
                estado = $9,
                marca = $10,
                modelo = $11, 
                ubicacion_piso = $12                
                WHERE id = $13 RETURNING *`,

                values: [
                    data.idpiso,
                    data.idtipodispositivo,
                    data.codigo,
                    data.nombre,
                    data.ubicacion,
                    data.ref_dispositivo,
                    data.etiqueta_dispositivo,
                    data.descripcion,
                    data.estado,
                    data.marca,
                    data.modelo,
                    data.ubicacion_piso,
                    id
                ]
            };

            let lData = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            return lData
        })
        return (responseD[0]) as IDevice | IErrorResponse
    }

    /**
     *  solo inserta el  tipo telefonillo 
     * @param data  
     * @returns 
     */
    async insertTelefonillo(data: ITelefonillo): Promise<IDevice | IErrorResponse> {
        let responseDIT = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }
            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<ITelefonillo>)[0]
                const queryData = {
                    name: "Insert-device-telefonillo",
                    text: `
                            INSERT INTO ${Constants.tbl_telefonillo_sql}
                            (iddispositivo,ip_arduino)
                            VALUES($1,$2) RETURNING *`,

                    values: [
                        _data.id,
                        data.ip_arduino
                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIT as Array<IDevice>)[0]
    }

    /**
     *  solo inserta el tipo de Lock
     * @param data 
     * @returns
     */
    async insertLock(data: ILock): Promise<IDevice | IErrorResponse> {
        let responseDIL = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }
            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>


            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<ILock>)[0]
                const queryData = {
                    name: "Insert-device-lock",
                    text: `
                            INSERT INTO ${Constants.tbl_manija_sql}
                            (iddispositivo,mac,codigo_permanente,bateria)
                            VALUES($1,$2,$3,$4) RETURNING *`,

                    values: [
                        _data.id,
                        data.mac,
                        data.codigo_permanente,
                        data.bateria || 0,
                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIL as Array<IDevice>)[0]
    }
    async insertTTLock(data: ILock): Promise<IDevice | IErrorResponse> {
        let responseDIL = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }
            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>


            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<ILock>)[0]
                const queryData = {
                    name: "Insert-device-lock",
                    text: `
                            INSERT INTO ${Constants.tbl_ttlock_sql}
                            (id,mac,codigo_permanente,bateria)
                            VALUES($1,$2,$3,$4) RETURNING *`,

                    values: [
                        _data.id,
                        data.mac,
                        data.codigo_permanente,
                        data.bateria || 0,
                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIL as Array<IDevice>)[0]
    }


    /**
     * Solo inserta el tipo de camara 
     * @param data
     */
    async insertCam(data: ICamara): Promise<IDevice | IErrorResponse> {
        let responseDIC = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }
            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<ICamara>)[0]
                const queryData = {
                    name: "Insert-device-camara",
                    text: `
                            INSERT INTO ${Constants.tbl_camara_sql}
                            (iddispositivo)
                            VALUES($1) RETURNING *`,

                    values: [
                        _data.id
                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIC as Array<IDevice>)[0]
    }

    /**
     * solo inserta el tipo de movil
     * @param data 
     */
    async insertMovil(data: IMovil): Promise<IDevice | IErrorResponse> {
        let responseDIM = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<IMovil>)[0]
                const queryData = {
                    name: "Insert-device-movil",
                    text: `
                            INSERT INTO ${Constants.tbl_movil_sql}
                            (iddispositivo,version_app,ip,macwifi)
                            VALUES($1,$2,$3,$4) RETURNING *`,

                    values: [
                        _data.id,
                        data.version_app,
                        data.ip,
                        data.macwifi,
                    ],
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIM as Array<IDevice>)[0]
    }

    /**
     * Solo inserta el tipo de Sonoff
     * @param data 
     */
    async insertSonoff(data: ISwitchOnOff): Promise<IDevice | IErrorResponse> {
        let responseDIS = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }
            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<ISwitchOnOff>)[0]
                const queryData = {
                    name: "Insert-device-Sonoff",
                    text: `
                            INSERT INTO ${Constants.tbl_sonoff_sql}
                            (iddispositivo)
                            VALUES($1) RETURNING *`,

                    values: [
                        _data.id,
                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIS as Array<IDevice>)[0]
    }

    /**
     * solo inserta el tipo de Router Pero no esta implementado s
     * @param data 
     */
    async insertRouter(data: IRouter): Promise<IDevice | IErrorResponse> {
        let responseDIR = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())
            let dataResult: Array<IDevice> = []

            const queryData = {
                name: "Insert-device",
                text: `
                     INSERT INTO ${Constants.tbl_dispositivo_sql}
                     (codigo,nombre,idtipodispositivo,fecha_creacion,fecha_ultimo_cambio,descripcion,idpiso)
                     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.idtipodispositivo,
                    timeStampCurrent,
                    timeStampCurrent,
                    data.descripcion,
                    _idpiso,

                ]
            }
            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const _data = (LDataAllDevice as Array<IRouter>)[0]
                const queryData = {
                    name: "Insert-device-Router",
                    text: `
                            INSERT INTO ${Constants.tbl_router_sql}
                            (iddispositivo,nombre_red,password_red,proveedor,tipo_conexion)
                            VALUES($1,$2,$3,$4,$5) RETURNING *`,

                    values: [
                        _data.id,
                        data.nombre_red,
                        data.password_red,
                        data.proveedor,
                        data.tipo_conexion,
                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })
            return LDataAllDevice
        })
        return (responseDIR as Array<IDevice>)[0]
    }
    /**
     * Update Device Telefonillo
     * @param id 
     * @param data 
     * @returns 
     */
    async updateTelefonillo(id: BigInt, data: ITelefonillo): Promise<IDevice | IErrorResponse> {
        let responseDUT = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const queryData = {
                    name: "update-device-Telefonillo",
                    text: `
                            UPDATE ${Constants.tbl_telefonillo_sql} SET 
                            ip_arduino = $1
                            WHERE iddispositivo = $2 RETURNING *`,

                    values: [
                        data.ip_arduino,
                        id

                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })

            return LDataAllDevice
        })
        return (responseDUT as Array<IDevice>)[0]
    }
    /**
     * Update Device Lock
     * @param id 
     * @param data 
     * @returns 
     */
    async updateLock(id: BigInt, data: ILock): Promise<IDevice | IErrorResponse> {
        let responseDUL = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const queryData = {
                    name: "update-device-Lock",
                    text: `
                            UPDATE ${Constants.tbl_manija_sql} SET 
                            codigo_permanente = $1,
                            bateria = $2,
                            mac = $3
                            WHERE iddispositivo = $4 RETURNING *`,

                    values: [
                        data.codigo_permanente,
                        data.bateria || 0,
                        data.mac,
                        id

                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })

            return LDataAllDevice
        })
        return (responseDUL as Array<IDevice>)[0]
    }
    /**
     * Update Device TTLock
     * @param id 
     * @param data 
     * @returns 
     */
    async updateTTLock(id: BigInt, data: ILock): Promise<IDevice | IErrorResponse> {
        let responseDUTTL = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const queryData = {
                    name: "update-device-Lock",
                    text: `
                            UPDATE ${Constants.tbl_manija_sql} SET 
                            codigo_permanente = $1,
                            bateria = $2,
                            mac = $3
                            WHERE iddispositivo = $4 RETURNING *`,

                    values: [
                        data.codigo_permanente,
                        data.bateria || 0,
                        data.mac,
                        id

                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })

            return LDataAllDevice
        })
        return (responseDUTTL as Array<IDevice>)[0]
    }
    /**
     * Update Device Camara  pero por el momento No tiene Caracteristicas adicionales 
     * @param id 
     * @param data 
     * @returns 
     */
    async updateCam(id: BigInt, data: ICamara): Promise<IDevice | IErrorResponse> {
        let responseDUC = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            //Este codigo se va a utilizar siempre y  cuando  Camara tenga Caracteres Adicionales ↓

            //     if(LDataAllDevice.length !== 0){
            //             const queryData = {
            //                 name:"update-device-cam",
            //                 text:`
            //                     UPDATE ${Constants.tbl_camara_sql} 
            //                     //No hay Caracter adicional
            //                     WHERE iddispositivo = $1 RETURNING *`,

            //                     values:[

            //                         id

            //                     ]
            //             }
            //             await client.query(queryData)
            //     }else ({
            //         throw: new Error ('Error ',{
            //             cause:{
            //                 code:Constants.error_type_custom,
            //                 detail:"Error en columna",
            //                 msg:'test'
            //             }
            //         })
            //     })

            return LDataAllDevice
        })
        return (responseDUC as Array<IDevice>)[0]
    }
    /**
     * Update Device Movil
     * @param id 
     * @param data 
     * @returns 
     */
    async updateMovil(id: BigInt, data: IMovil): Promise<IDevice | IErrorResponse> {
        let responseDUM = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const queryData = {
                    name: "update-device-Movil",
                    text: `
                            UPDATE ${Constants.tbl_movil_sql} SET 
                            version_app = $1,
                            ip=$2,
                            macwifi=$3
                            WHERE iddispositivo = $4 RETURNING *`,

                    values: [
                        data.version_app,
                        data.ip, // inclui el campo ip en los valores
                        data.macwifi, // inclui el campo macwifi en los valores
                        id

                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })

            return LDataAllDevice
        })
        return (responseDUM as Array<IDevice>)[0]
    }
    /**
     * Update Device Sonoff  pero por el momento No hay Caracteres Adicionales
     * @param id 
     * @param data 
     * @returns 
     */
    async updateSonoff(id: BigInt, data: ISwitchOnOff): Promise<IDevice | IErrorResponse> {
        let responseDUS = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            //Este codigo se va a utilizar siempre y  cuando  Sonoff tenga Caracteres Adicionales ↓

            // if(LDataAllDevice.length !== 0){
            //         const queryData = {
            //             name:"update-device-sonoff",
            //             text:`
            //                 UPDATE ${Constants.tbl_sonoff_sql} SET  
            //                 NO HAY CARACTERES ADICIONALES 
            //                 WHERE iddispositivo = $1 RETURNING *`,

            //                 values:[

            //                     id

            //                 ]
            //         }
            //         await client.query(queryData)
            // }else ({
            //     throw: new Error ('Error ',{
            //         cause:{
            //             code:Constants.error_type_custom,
            //             detail:"Error en columna",
            //             msg:'test'
            //         }
            //     })
            // })

            return LDataAllDevice
        })
        return (responseDUS as Array<IDevice>)[0]
    }
    /**
     * Update Router
     * @param id 
     * @param data 
     * @returns 
     */
    async updateRouter(id: BigInt, data: IRouter): Promise<IDevice | IErrorResponse> {
        let responseDUR = await this.client.execQueryPool(async (client): Promise<Array<IDevice | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()
            let _idpiso = data.idpiso === undefined ? null : BigInt(data.idpiso.toString())

            let queryData = {
                name: "Device-update",
                text: `UPDATE ${Constants.tbl_dispositivo_sql} SET
                codigo = $1,
                nombre = $2,
                descripcion = $3,
                estado = $4,
                fecha_ultimo_cambio = $5,
                idpiso = $6 
                WHERE id = $7 RETURNING *`,

                values: [
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.estado,
                    timeStampCurrent,
                    _idpiso,
                    id
                ]
            };

            let LDataAllDevice = (await client.query(queryData)).rows as Array<IDevice | IErrorResponse>

            if (LDataAllDevice.length !== 0) {
                const queryData = {
                    name: "update-device-router",
                    text: `
                            UPDATE ${Constants.tbl_router_sql} SET 
                            nombre_red = $1,
                            password_red = $2,
                            proveedor = $3,
                            tipo_conexion = $4
                            WHERE iddispositivo = $5 RETURNING *`,

                    values: [
                        data.nombre_red,
                        data.password_red,
                        data.proveedor,
                        data.tipo_conexion,
                        id

                    ]
                }
                await client.query(queryData)
            } else ({
                throw: new Error('Error ', {
                    cause: {
                        code: Constants.error_type_custom,
                        detail: "Error en columna",
                        msg: 'test'
                    }
                })
            })

            return LDataAllDevice
        })
        return (responseDUR as Array<IDevice>)[0]
    }
}



export default DeviceDataAccess