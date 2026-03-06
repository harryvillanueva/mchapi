import DbConnection from "../helpers/DbConnection";
import { IDataAccess } from "../helpers/IDataAccess";
import { StatusDataType, jornadaType } from "../types/GlobalTypes";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import Constants from "../helpers/Constants";
import { IFichajeOficina } from "../models/IFichajeOficina";
import UtilInstance from "../helpers/Util";
import { IModel } from "../helpers/IModel";
import { IUser } from "../models/IUser";
import { DateTime } from "luxon";

class FichajeOficinaDAL implements IDataAccess<IFichajeOficina> {
    public client: DbConnection;

    constructor(
        public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any
    ) {
        this.client = new DbConnection(isTransactions);
    }

    async get(): Promise<Array<IFichajeOficina> | IErrorResponse> {
        const queryData = {
            name: 'get-categoria',
            text: ` SELECT cat.*
                    FROM ${Constants.tbl_categoria_dn_sql} cat
                    WHERE cat.estado >= $1
                    ORDER BY cat.nombre ASC
                    `,
            values: [this.filterStatus]
        };

        let lData: Array<IFichajeOficina | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IFichajeOficina | IErrorResponse>;

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse;

        return lData as Array<IFichajeOficina>;
    }

    async getById(id: BigInt): Promise<IFichajeOficina | IErrorResponse> {
        const queryData = {
            name: 'get-fichajeoficina-x-id',
            text: `
                SELECT fo.id, fo.idusuario,
                fo.fecha,
                fo.observacion,
                COALESCE(to_char(fo.entrada, 'YYYY-MM-DD HH24:MI'), '') as entrada,
                COALESCE(to_char(fo.salida, 'YYYY-MM-DD HH24:MI'), '') as salida,
                COALESCE(to_char(fo.entrada, 'HH24:MI'), '') as h_entrada,
                COALESCE(to_char(fo.salida, 'HH24:MI'), '') as h_salida
                FROM ${Constants.tbl_fichaje_oficina_sql} fo
                WHERE fo.estado = 1 AND
                fo.id = $1
            `,
            values: [id]
        };

        let lData: Array<IFichajeOficina | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IFichajeOficina | IErrorResponse>;

        return lData[0];
    }

    async insert(data: IFichajeOficina): Promise<IFichajeOficina | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL();
            const queryData = {
                name: 'insert-fichaje-manual',
                text: `INSERT INTO ${Constants.tbl_fichaje_oficina_sql}(
                        usuario,
                        fecha,
                        entrada,
                        salida,
                        token,
                        tipo_ejecucion,
                        observacion,
                        fecha_ultimo_cambio,
                        idusuario,
                        idusuario_ultimo_cambio)
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                values: [
                    data.usuario,
                    data.fecha,
                    data.entrada,
                    data.salida,
                    data.token,
                    data.tipo_ejecucion,
                    data.observacion,
                    timeStampCurrent,
                    data.idusuario,
                    this.idUserLogin
                ]
            };
            let lData = (await client.query(queryData)).rows as Array<IFichajeOficina | IErrorResponse>;

            return lData;
        });

        return (responseD[0]) as IFichajeOficina | IErrorResponse;
    }

    async update(id: BigInt, data: IFichajeOficina): Promise<IFichajeOficina | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL();
            let queryData = {
                name: 'update-fichaje-oficina',
                text: `UPDATE ${Constants.tbl_fichaje_oficina_sql} SET
                        fecha = $1,
                        entrada = $2,
                        salida = $3,
                        observacion = $4,
                        idusuario_ultimo_cambio = $5,
                        fecha_ultimo_cambio = $6,
                        token = $7,
                        tipo_ejecucion = $8
                        WHERE id = $9 RETURNING *`,
                values: [
                    data.fecha,
                    data.entrada,
                    data.salida,
                    data.observacion,
                    this.idUserLogin,
                    timeStampCurrent,
                    data.token,
                    data.tipo_ejecucion,
                    id
                ]
            };
            let lData = (await client.query(queryData)).rows as Array<IFichajeOficina | IErrorResponse>;

            return lData;
        });

        return (responseD[0]) as IFichajeOficina | IErrorResponse;
    }

    async delete(id: BigInt): Promise<IFichajeOficina | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL();
            const queryData = {
                name: 'delete-fichaje-oficina',
                text: `UPDATE ${Constants.tbl_fichaje_oficina_sql} SET
                        estado = $1,
                        idusuario_ultimo_cambio = $2,
                        fecha_ultimo_cambio = $3
                        WHERE id = $4 RETURNING *`,
                values: [
                    Constants.code_status_delete,
                    this.idUserLogin,
                    timeStampCurrent,
                    id
                ]
            };

            let lData: Array<IFichajeOficina | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IFichajeOficina | IErrorResponse>;

            return lData;
        });

        return (responseD[0]) as IFichajeOficina | IErrorResponse;
    }

    async fichar(data: IFichajeOficina): Promise<IFichajeOficina | IErrorResponse> {
    console.log('🟡 [DAL-FICHAR] Iniciando método fichar()');
    let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
        console.log('🟡 [DAL-FICHAR] Dentro de execQueryPool, cliente obtenido');
        const timeStampCurrent = UtilInstance.getDateCurrentForSQL();
        const { fecha: dateCurrent } = UtilInstance.getDateCurrent();
        console.log('🟡 [DAL-FICHAR] Fecha actual:', dateCurrent, 'Timestamp:', timeStampCurrent);

        let _entrada = timeStampCurrent;
        let _salida = null;
        let _ip = data.ip || null;

        console.log('🟡 [DAL-FICHAR] Consultando usuario RRHH, ID:', this.idUserLogin.toString());
        const queryGetUserRrhh = {
            name: 'get-user-rrhh',
            text: ` SELECT urh.id, urh.jornada, urh.horario
                    FROM ${Constants.tbl_usuario_rrhh_sql} urh
                    WHERE urh.id = $1
                    LIMIT 1`,
            values: [this.idUserLogin]
        };
        let _dataUserRrhh = (await client.query(queryGetUserRrhh)).rows as Array<IUser>;
        console.log('🟡 [DAL-FICHAR] Usuario RRHH encontrado:', _dataUserRrhh.length > 0);
        let _userTypeJornadaDB = (_dataUserRrhh.length !== 0) ? _dataUserRrhh[0].jornada || 'NA' : 'NA';
        let _userTypeHorarioDB = (_dataUserRrhh.length !== 0) ? _dataUserRrhh[0].horario || 'NA' : 'NA';

        console.log('🟡 [DAL-FICHAR] Buscando fichaje previo del día para usuario:', data.usuario);
        const queryGetFichajeXUser = {
            name: 'get-fichaje-x-user',
            text: ` SELECT fu.id, fu.fecha, fu.entrada, fu.salida
                    FROM ${Constants.tbl_fichaje_oficina_sql} fu
                    WHERE fu.usuario LIKE $1 AND
                          fu.fecha = $2
                    LIMIT 1`,
            values: [data.usuario, dateCurrent]
        };
        let _dataFichaje = (await client.query(queryGetFichajeXUser)).rows as Array<IFichajeOficina>;
        console.log('🟡 [DAL-FICHAR] Fichaje previo encontrado:', _dataFichaje.length > 0);
        let _fichajeDB = (_dataFichaje.length !== 0) ? _dataFichaje[0] : undefined;

        let lData: Array<IFichajeOficina | IErrorResponse> = [];

        if (_fichajeDB) {
            // Update fichaje (SALIDA)
            console.log('🟡 [DAL-FICHAR] Actualizando fichaje existente (registrando SALIDA)');
            _salida = timeStampCurrent;
            let _idFichaje = _fichajeDB.id;

            const queryDataUpdate = {
                name: 'update-fichaje',
                text: `UPDATE ${Constants.tbl_fichaje_oficina_sql} SET
                        salida = $1,
                        token = $2,
                        ip = $3,
                        fecha_ultimo_cambio = $4,
                        idusuario_ultimo_cambio = $5,
                        jornada = $6,
                        horario = $7
                        WHERE id = $8 RETURNING *`,
                values: [_salida, data.token, _ip, timeStampCurrent, this.idUserLogin, _userTypeJornadaDB, _userTypeHorarioDB, _idFichaje]
            };
            lData = (await client.query(queryDataUpdate)).rows as Array<IFichajeOficina | IErrorResponse>;
            console.log('🟢 [DAL-FICHAR] Fichaje SALIDA actualizado correctamente');
        } else {
            // Insert fichaje (ENTRADA)
            console.log('🟡 [DAL-FICHAR] Insertando nuevo fichaje (registrando ENTRADA)');
            const entryTime = DateTime.fromSQL(timeStampCurrent, { zone: "Europe/Madrid" });
            const limitTime = DateTime.fromISO(`${dateCurrent}T09:05:00`, { zone: "Europe/Madrid" });

            console.log("🟡 [DAL-FICHAR] DEBUG → entryTime:", entryTime.toISO(),
                        "limitTime:", limitTime.toISO());

            if (entryTime > limitTime) {
                console.log("DEBUG → LLEGADA TARDE detectada:", entryTime.toFormat("HH:mm"), ">", limitTime.toFormat("HH:mm"));
                // TODO: Mover notificación fuera de la transacción para evitar deadlock
                // await this.sendLateArrivalNotification(data.usuario, entryTime.toJSDate());
            }

            const queryDataInsert = {
                name: 'insert-fichaje-oficina',
                text: `INSERT INTO ${Constants.tbl_fichaje_oficina_sql}(
                            usuario, fecha, entrada, salida, token, ip, tipo_ejecucion,
                            observacion, fecha_ultimo_cambio, idusuario, idusuario_ultimo_cambio,
                            jornada, horario
                        )
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                values: [
                    data.usuario,
                    dateCurrent,
                    _entrada,
                    _salida,
                    data.token,
                    _ip,
                    data.tipo_ejecucion,
                    data.observacion,
                    timeStampCurrent,
                    this.idUserLogin,
                    this.idUserLogin,
                    _userTypeJornadaDB,
                    _userTypeHorarioDB
                ]
            };
            lData = (await client.query(queryDataInsert)).rows as Array<IFichajeOficina | IErrorResponse>;
            console.log('🟢 [DAL-FICHAR] Fichaje ENTRADA insertado correctamente');
        }

        console.log('🟡 [DAL-FICHAR] Retornando datos del fichaje');
        return lData;
    });

    console.log('🟢 [DAL-FICHAR] execQueryPool completado, retornando respuesta');
    return (responseD[0]) as IFichajeOficina | IErrorResponse;
}

    private async sendLateArrivalNotification(usuario: string, entryTime: Date): Promise<void> {
        try {
            // Verificar si la tabla tbl_notificaciones existe
            const checkTableQuery = {
                name: 'check-notifications-table',
                text: `
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public'
                        AND table_name = 'tbl_notificaciones'
                    ) as table_exists
                `
            };
            const tableResult = await this.client.exeQuery(checkTableQuery) as Array<{ table_exists: boolean }>;
            const tableExists = tableResult[0].table_exists;

            // Crear la tabla si no existe
            if (!tableExists) {
                const createTableQuery = {
                    name: 'create-notifications-table',
                    text: `
                        CREATE TABLE tbl_notificaciones (
                            id SERIAL PRIMARY KEY,
                            usuario VARCHAR(255) NOT NULL,
                            mensaje TEXT NOT NULL,
                            tipo VARCHAR(50) NOT NULL,
                            fecha_creacion TIMESTAMP NOT NULL,
                            email_destinatario VARCHAR(255),
                            estado VARCHAR(20) DEFAULT 'pendiente'
                        )
                    `
                };
                await this.client.exeQuery(createTableQuery);
                console.log('Tabla tbl_notificaciones creada');
            }

            // Obtener el correo del usuario
            const queryGetUserEmail = {
                name: 'get-user-email',
                text: `SELECT email FROM ${Constants.tbl_usuario_sql} WHERE username = $1 LIMIT 1`,
                values: [usuario]
            };
            const userData = await this.client.exeQuery(queryGetUserEmail) as Array<{ email: string }>;
            const userEmail = userData.length > 0 ? userData[0].email : 'rrhh@empresa.com';

            // Insertar la notificación
            const queryNotification = {
                name: 'insert-notification',
                text: `INSERT INTO tbl_notificaciones (
                            usuario, mensaje, tipo, fecha_creacion, email_destinatario
                        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                values: [
                    usuario,
                    `Has llegado tarde a la oficina a las ${entryTime.toLocaleTimeString('es-ES')} el ${entryTime.toLocaleDateString('es-ES')}.`,
                    'late_arrival',
                    UtilInstance.getDateCurrentForSQL(),
                    userEmail
                ]
            };
            await this.client.exeQuery(queryNotification);
            console.log(`Notificación registrada para ${usuario}`);
        } catch (error) {
            console.error(`Error al registrar notificación para ${usuario}:`, error);
        }
    }

    async getAllWithPagination(): Promise<Array<IFichajeOficina> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} };
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} };

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01';
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01';
        let limit = this.infoExtra.filter.limit || 50;
        let offset = this.infoExtra.filter.offset || 0;
        let search_all = this.infoExtra.filter.search_all || '';

        const queryData = {
            name: 'get-fichaje-oficina',
            text: ` SELECT fo.id, uxr.idrol, rol.nombre as namerol,
                    usu.nombre_completo as full_name,
                    fo.fecha,
                    REPLACE(REPLACE(REPLACE(REPLACE(to_char(fo.fecha, 'DD/mon/YYYY'), 'dec', 'dic'), 'aug', 'ago'),'jan','ene'),'apr','abr') AS fecha_str,
                    COALESCE(to_char(fo.entrada, 'YYYY-MM-DD HH24:MI'), '') as entrada,
                    COALESCE(to_char(fo.salida, 'YYYY-MM-DD HH24:MI'), '') as salida,
                    COALESCE(to_char(fo.entrada, 'HH24:MI'), '') as h_entrada,
                    COALESCE(to_char(fo.salida, 'HH24:MI'), '') as h_salida
                    FROM tbl_fichaje_oficina fo
                    INNER JOIN tbl_usuario usu ON (usu.id = fo.idusuario)
                    INNER JOIN tbl_usuario_x_rol uxr ON (uxr.idusuario = usu.id AND uxr.ismain = true)
                    INNER JOIN tbl_rol rol ON (rol.id = uxr.idrol)
                    WHERE fo.estado = 1 AND
                    fo.fecha BETWEEN $1 AND $2 AND
                    (
                        UNACCENT(lower( replace(trim(usu.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($5),' ','') )) OR
                        $5 = ''
                    )
                    ORDER BY fo.fecha DESC, nullif(regexp_replace(lower(rol.nombre), '[^a-z]', '', 'g'),'')::text, usu.nombre_completo ASC
                    LIMIT $3 OFFSET $4
                    `,
            values: [
                filter_m_start,
                filter_m_end,
                limit,
                offset,
                search_all === '' ? '' : `%${search_all}%`
            ]
        };

        let lData: Array<IFichajeOficina | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IFichajeOficina | IErrorResponse>;

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse;

        return lData as Array<IFichajeOficina>;
    }

    async getEsquemaxRol(): Promise<Array<IFichajeOficina> | IErrorResponse> {
        if (!this.infoExtra) this.infoExtra = { filter: {} };
        else if (!this.infoExtra!.filter) this.infoExtra = { filter: {} };

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01';
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01';
        let limit = this.infoExtra.filter.limit || 50;
        let offset = this.infoExtra.filter.offset || 0;
        let search_all = this.infoExtra.filter.search_all || '';

        const queryData = {
            name: 'get-jornada',
            text: `
                select ur.id, u.nombre_completo as fullname, count(fo.*) , SUM(fo.horas_totales_1) as total, ur.jornada, uxr.idrol,
                (
                    CASE
                    WHEN ur.horario = 'HM' THEN 'Horario de Mañanas'
                    WHEN ur.horario = 'HT' THEN 'Horario de Tardes'
                    WHEN ur.horario = 'HC' THEN 'Horario Completo'
                    END
                ) AS horario
                from tbl_usuario u
                LEFT join tbl_usuario_rrhh ur on u.id = ur.id
                INNER JOIN tbl_usuario_x_rol uxr on u.id = uxr.idusuario
                left join (
                    select fo.*,
                    (
                        CASE
                            when fo.jornada = 'Jornada Completa' THEN ((COALESCE(to_char(fo.salida, 'HH24:MI'), '19:00:00')::time - COALESCE(to_char(fo.entrada, 'HH24:MI'), '09:00:00')::time)) - '02:00:00' :: time
                            when fo.jornada = 'Media Jornada' AND fo.horario = 'HT' THEN ((COALESCE(to_char(fo.salida, 'HH24:MI'), '19:00:00')::time - COALESCE(to_char(fo.entrada, 'HH24:MI'), '14:00:00')::time))
                            when fo.jornada = 'Media Jornada' AND fo.horario = 'HM' THEN ((COALESCE(to_char(fo.salida, 'HH24:MI'), '14:00:00')::time - COALESCE(to_char(fo.entrada, 'HH24:MI'), '09:00:00')::time))
                        END
                    ) as horas_totales_1
                    from tbl_fichaje_oficina fo
                    where fo.fecha BETWEEN $1 AND $2
                    AND fo.estado = 1
                ) fo on fo.idusuario = u.id
                WHERE
                (
                    UNACCENT(lower( replace(trim(u.nombre_completo ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                    UNACCENT(lower( replace(trim(uxr.idrol ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                    UNACCENT(lower( replace(trim(
                        (
                            CASE
                            WHEN ur.horario = 'HM' THEN 'Horario de Mañanas'
                            WHEN ur.horario = 'HT' THEN 'Horario de Tardes'
                            WHEN ur.horario = 'HC' THEN 'Horario Completo'
                            END
                        )
                    ),' ','')  )) LIKE UNACCENT(lower( replace(trim($3),' ','') )) OR
                    $3 = ''
                )
                AND uxr.ismain = true AND u.estado = 1
                AND uxr.idrol NOT IN ('propietario', 'colaborador', 'admin' , 'superadmin','limpieza', 'mantenimiento')
                AND u.id not in (select idusuario_resp from tbl_responsable_lead_dn where idusuario_resp <> 6)
                AND u.username not in ('rrhh','RRHH1', 'rmg', 'rmg1', 'rmg2', 'ade', 'ADE1', 'crm', 'CRM1', 'atic','dn', 'da', 'da1','da2', 'da3', 'da4', 'da5')
                group by ur.id, u.nombre_completo, uxr.idrol
                order by uxr.idrol , u.nombre_completo
                LIMIT $4 OFFSET $5
            `,
            values: [
                filter_m_start,
                filter_m_end,
                search_all === '' ? '' : `%${search_all}%`,
                limit,
                offset
            ]
        };
        let lData: Array<IFichajeOficina | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IFichajeOficina | IErrorResponse>;

        if (({ ...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse;

        return lData as Array<IFichajeOficina>;
    }

    async updateJornada(id: BigInt, data: IUser): Promise<IUser | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL();
            let _nombreCompleto = data.nombre_completo ? data.nombre_completo!.trim() : `${data.nombre.trim()} ${data.apellido.trim()}`;

            let queryData = {
                name: 'update-user',
                text: `
                        UPDATE ${Constants.tbl_usuario_sql} SET
                        email = $1,
                        nombre = $2,
                        apellido = $3,
                        estado = $4,  
                        idusuario = $5,
                        username = $6,
                        nombre_completo = $7
                        WHERE id = $8 AND estado >= $9
                        RETURNING *
                        `,
                values: [
                    data.email,
                    '',
                    '',
                    data.estado,
                    this.idUserLogin,
                    data.username,
                    `${_nombreCompleto}`,
                    id,
                    this.filterStatus
                ]
            };

            let lData = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>;

            let queryDataRRHH = {
                name: 'update-usu-rrhh',
                text: `  
                        UPDATE ${Constants.tbl_usuario_rrhh_sql} SET
                        cumpleanyos = $1,
                        correo_personal = $2,
                        detalles = $3,
                        alta_ss = $4,
                        jornada = $5,
                        fecha_cambio_jornada = $6,
                        horario = $7
                        WHERE id = $8
                        RETURNING *
                        `,
                values: [
                    data.cumpleanyos,
                    data.correo_personal,
                    data.detalles,
                    data.alta_ss,
                    data.jornada,
                    timeStampCurrent,
                    data.horario,
                    id
                ]
            };

            let lData_ = (await client.query(queryDataRRHH)).rows;

            queryData = {
                name: 'delete-role-x-user',
                text: `DELETE FROM ${Constants.tbl_usuario_x_rol_sql} WHERE idusuario = $1`,
                values: [id]
            };
            await client.query(queryData);

            let userDB = lData[0];
            if (userDB) {
                const queryData = {
                    name: 'insert-user-x-role',
                    text: `INSERT INTO ${Constants.tbl_usuario_x_rol_sql} ( idusuario, idrol )
                            VALUES($1,$2) RETURNING *`,
                    values: [id, data.idrol]
                };
                let respTmp = (await client.query(queryData)).rows as Array<IUser | IErrorResponse>;
                if ((respTmp[0] as IErrorResponse).error) lData = respTmp as Array<IErrorResponse>;
            }

            let querySelect = {
                name: 'select-etapa-x-user',
                text: `SELECT etapa FROM ${Constants.tbl_etapa_usuario_rrhh_sql}
                        WHERE idusuario = $1`,
                values: [id]
            };

            let lDataEtapa = (await client.query(querySelect)).rows as Array<IUser>;

            if (lDataEtapa[0].etapa != data.etapa) {
                let queryDataDel = {
                    name: 'update-last-etapa-x-user',
                    text: `UPDATE ${Constants.tbl_etapa_usuario_rrhh_sql} SET
                            fecha_final = $1,
                            estado = $2
                            WHERE idusuario = $3
                            RETURNING *`,
                    values: [timeStampCurrent, 0]
                };
                await client.query(queryDataDel);

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
                };
                await client.query(queryDataInsert);
            }

            return lData_;
        });

        return (responseD[0]) as IUser | IErrorResponse;
    }
}

export default FichajeOficinaDAL;


