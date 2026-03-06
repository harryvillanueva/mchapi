import { ActionType, CityType, CodeRoleType, CountryType, LocationDataType, ResultType, StatusDataType, TypeActionCardType, TypeCardType } from "../types/GlobalTypes"

const Constants = { 


      // actions all
      code_action_go_back_lead: 'go_back_lead',

      // Types Lead
      code_lead_todos: 'Todos',
      code_lead_propietario: 'Propietario',
      code_lead_colaborador: 'Colaborador',     
      // Roles
      code_rol_admin: 'admin',
      code_rol_propietario: 'propietario',
      code_rol_colaborador: 'colaborador',
      code_rol_crm: 'crm',
      code_rol_default: 'default',
      code_rol_superadmin: 'superadmin',
      code_rol_dn: 'dn',
      code_rol_atic: 'atic',
      code_rol_oficina: 'oficina',
      code_rol_rrhh: 'rrhh',
      code_rol_ceo: 'ceo',
      code_rol_dn_master: 'dnmaster',
      code_rol_rmg: 'rmg',
      code_rol_rrhh_master: 'rrhhmaster',
      code_rol_limpieza: 'limpieza',
      code_rol_da: 'da',
      code_rol_ade: 'ade',
      code_rol_mantenimiento: 'mantenimiento',
      code_rol_crmmaster : 'crmmaster',
      code_rol_aticmaster : 'aticmaster',
      code_rol_rmgmaster : 'rmgmaster',
      code_rol_damaster : 'damaster',
      code_rol_ademaster: 'ademaster',
      

      // datos acceso public [id superadmin debe existir en db, para evitar errores]
      code_public_id_superadmin: 1,
      code_public_status_superadmin: 0,
      code_public_username_superadmin: 'sadmin',

      // Estados
      code_status_alta: 1,
      code_status_baja: 0,
      code_status_delete: -1,
      code_status_no_valid: 403,

      // life time token
      token_life_time: 60 * 60 * 24 * 5, // 60 * 60 * 24 * 5 -> 5 dias
      //token_life_time: 60 * 10, // 1min
      token_life_app: 60 * 5, // 5mim 

      // key secret token default
      token_key_secret_default: 'secret',

      // errores sql
      error_field_not_null_sql: '23502',
      error_field_duplicate_sql: '23505',
      error_field_no_existe_key_sql: '23503',

      // Error Custom Forzando su ejecucion
      error_field_stock_no_disponible_sql: '-2323',
      error_field_cantidad_no_disponible_sql: '-3333',
      // type error 'SQL' | 'CUSTOM'
      error_type_sql: 'SQL',
      error_type_custom: 'CUSTOM',

      // Tables DB
      tbl_usuario_sql: 'tbl_usuario',
      tbl_rol_sql: 'tbl_rol',
      tbl_usuario_x_rol_sql: 'tbl_usuario_x_rol',
      tbl_piso_sql: 'tbl_piso',
      tbl_info_piso_da_sql: 'tbl_info_piso_da',
      tbl_piso_x_usuario_sql: 'tbl_piso_x_usuario',
      tbl_dispositivo_sql: 'tbl_dispositivo',
      tbl_tipo_dispositivo_sql: 'tbl_tipo_dispositivo',
      tbl_llave_sql: 'tbl_llave',
      tbl_llave_x_manija_sql: 'tbl_llave_x_manija',
      tbl_manija_sql: 'tbl_manija',
      tbl_ttlock_sql: 'tbl_ttlock',
      tbl_codigo_sql: 'tbl_codigo',
      tbl_logs_piso_sql: 'tbl_logs_piso',
      tbl_tipo_codigo_sql: 'tbl_tipo_codigo',
      tbl_responsable_lead_dn_sql: 'tbl_responsable_lead_dn',
      tbl_tipo_interesa_dn_sql: 'tbl_tipo_interesa_dn',
      tbl_tipo_ocupacion_dn_sql: 'tbl_tipo_ocupacion_dn',
      tbl_tipo_avance_dn_sql: 'tbl_tipo_avance_dn',
      tbl_lead_dn_sql: 'tbl_lead_dn',
      tbl_telefono_dn_sql: 'tbl_telefono_dn',
      tbl_correo_dn_sql: 'tbl_correo_dn',
      tbl_historico_lead_dn_sql: 'tbl_historico_lead_dn',
      tbl_categoria_dn_sql: 'tbl_categoria_dn',
      tbl_plataforma_comercial_rmg_sql: 'tbl_plataforma_comercial_rmg',
      tbl_tipo_estancia_rmg_sql: 'tbl_tipo_estancia_rmg',
      tbl_info_piso_comercial_rmg_sql: 'tbl_info_piso_comercial_rmg',
      tbl_plataforma_infopiso_rmg_sql: 'tbl_plataforma_infopiso_rmg',
      tbl_variables_reserva_rmg_sql: 'tbl_variables_reserva_rmg',
      tbl_suceso_dn_sql: 'tbl_suceso_dn',
      tbl_articulos_da_sql: 'tbl_articulos_da',
      tbl_inventario_da_sql: 'tbl_inventario_da',
      // Tablas RRHH 
      tbl_usuario_rrhh_sql: 'tbl_usuario_rrhh',
      tbl_etapa_usuario_rrhh_sql: 'tbl_etapa_usuario_rrhh',
      tbl_salario_rrhh_sql: 'tbl_salario_rrhh',
      tbl_solicitud_rrhh_sql: 'tbl_solicitud_rrhh',
      // Tablas de sucesos para el prescriptor
      tbl_prescriptor_dn_sql: 'tbl_prescriptor_dn',
      tbl_grupo_prescriptor_dn_sql: 'tbl_grupo_prescriptor_dn',
      tbl_suceso_prescriptor_dn_sql: 'tbl_suceso_prescriptor_dn',
      // Tablas de sucesos para el propietario
      tbl_propietario_dn_sql: 'tbl_propietario_dn',
      tbl_grupo_propietario_dn_sql: 'tbl_grupo_propietario_dn',
      tbl_suceso_propietario_dn_sql: 'tbl_suceso_propietario_dn',
      // Tabla control de marcacion limpieza
      tbl_control_horario_limpieza_sql: 'tbl_control_horario_limpieza',
      tbl_parametros_generales_sql: 'tbl_parametros_generales',
      tbl_sonoff_sql: 'tbl_sonoff',

      // tablas de reporte de estados dispositivos
      tbl_reporte_atic_sql: 'tbl_reporte_atic',
      tbl_detalle_reporte_atic_sql: 'tbl_detalle_reporte_atic',

      // table de solicitud de precio [RMG]
      tbl_solicitud_precio_sql: 'tbl_solicitud_precio',

      // tabla de Devices
      tbl_telefonillo_sql: 'tbl_telefonillo',
      tbl_router_sql: 'tbl_router',
      tbl_camara_sql: 'tbl_camara',
      tbl_movil_sql: "tbl_movil",




      // Tabla reporte de leads DN
      tbl_estadistica_dn_sql: 'tbl_estadistica_dn',

      // Tabla fichaje Oficina
      tbl_fichaje_oficina_sql: 'tbl_fichaje_oficina',

      // country
      country_espania: 'España',
      country_portugal: 'Portugal',
      country_francia: 'Francia',
      country_italia: 'Italia',

      // Ciudades
      city_madrid: 'Madrid',
      city_marbella: 'Marbella',
      city_barcelona: 'Barcelona',
      city_leganes: 'Leganes',
      city_retiro: 'Retiro',
      city_chamartin: 'Chamartín',
      city_homes_marbella: 'Homes Marbella',
      city_chamberi: 'Chamberí',
      city_salamanca: 'Salamanca',
      city_tetuan: 'Tetuán',
      city_centro: 'Centro',
      city_arganzuela: 'Arganzuela',

      // Accciones piso
      action_openLock: 'openLock',
      action_syncTime: 'syncTime',
      action_newCode: 'setCode',
      action_setCard: 'setCard',
      action_openPortal: 'openPortal',
      action_toggleLight: 'toggleLight',

      // Result action
      action_result_correcto: 'Correcto',
      action_result_fallido: 'Fallido',

      // Location card
      card_location_oficina: 'Oficina',
      card_location_piso: 'Piso',

      // Type card
      card_type_normal: 'Normal',
      card_type_maestra: 'Maestra',

      // Type card accion
      card_type_action_add: 1,
      card_type_action_delete: 2,

      // Type exce log
      log_type_execute_automatico: 'Automatico',
      log_type_execute_manual: 'Manual',

      // Type Device
      type_device_lock: 'lock',
      type_device_telefonillo: 'telefonillo',
      type_device_movil: 'movil',
      type_device_router: 'router',
      type_device_sonoff: 'sonoff',
      type_device_camara: 'camara',
      type_device_ttlock: 'ttlock',

      // TypeCode
      type_code_temporal: 'COD_TMP',

      // Value password: reset
      reset_password_value: 'welcome1',

      // Count lead_id
      contador_id_lead: 1000,

      // fichaje
      entrada_fichar: 'entrada',
      salida_fichar: 'salida',

      // Emails
      email_rmg: 'rmg@mycityhome.es',
      email_atic: 'proyectosatic@mycityhome.es',

      getRoles: (): Array<CodeRoleType> => {
            return [
                  Constants.code_rol_admin as CodeRoleType,
                  Constants.code_rol_propietario as CodeRoleType,
                  Constants.code_rol_colaborador as CodeRoleType,
                  Constants.code_rol_crm as CodeRoleType,
                  Constants.code_rol_default as CodeRoleType,
                  Constants.code_rol_superadmin as CodeRoleType,
                  Constants.code_rol_dn as CodeRoleType,
                  Constants.code_rol_atic as CodeRoleType,
                  Constants.code_rol_oficina as CodeRoleType,
                  Constants.code_rol_rrhh as CodeRoleType,
                  Constants.code_rol_ceo as CodeRoleType,
                  Constants.code_rol_dn_master as CodeRoleType,
                  Constants.code_rol_rmg as CodeRoleType,
                  Constants.code_rol_rrhh_master as CodeRoleType,
                  Constants.code_rol_limpieza as CodeRoleType,
                  Constants.code_rol_da as CodeRoleType,
                  Constants.code_rol_ade as CodeRoleType,
                  Constants.code_rol_mantenimiento as CodeRoleType
            ]
      },

      getStatus: (): Array<StatusDataType> => {
            return [
                  Constants.code_status_alta as StatusDataType,
                  Constants.code_status_baja as StatusDataType,
                  Constants.code_status_delete as StatusDataType
            ]
      },

      getCountries: (): Array<CountryType> => {
            return [
                  Constants.country_espania as CountryType,
                  Constants.country_portugal as CountryType,
                  Constants.country_francia as CountryType,
                  Constants.country_italia as CountryType
            ]
      },

      getCities: (): Array<CityType> => {
            return [
                  Constants.city_madrid as CityType,
                  Constants.city_marbella as CityType,
                  Constants.city_barcelona as CityType,
                  Constants.city_leganes as CityType,
                  Constants.city_retiro as CityType,
                  Constants.city_chamartin as CityType,
                  Constants.city_homes_marbella as CityType,
                  Constants.city_chamberi as CityType,
                  Constants.city_salamanca as CityType,
                  Constants.city_tetuan as CityType,
                  Constants.city_centro as CityType,
                  Constants.city_arganzuela as CityType,
            ]
      },

      getActions: (): Array<ActionType> => {
            return [
                  Constants.action_openLock as ActionType,
                  Constants.action_syncTime as ActionType,
                  Constants.action_newCode as ActionType,
                  Constants.action_setCard as ActionType,
                  Constants.action_openPortal as ActionType,
                  Constants.action_toggleLight as ActionType
            ]
      },

      getResultsAction: (): Array<ResultType> => {
            return [
                  Constants.action_result_correcto as ResultType,
                  Constants.action_result_fallido as ResultType
            ]
      },

      getLocationCard: (): Array<LocationDataType> => {
            return [
                  Constants.card_location_oficina as LocationDataType,
                  Constants.card_location_piso as LocationDataType
            ]
      },

      getTypeCard: (): Array<TypeCardType> => {
            return [
                  Constants.card_type_maestra as TypeCardType,
                  Constants.card_type_normal as TypeCardType
            ]
      },

      getTypeActionCard: (): Array<TypeActionCardType> => {
            return [
                  Constants.card_type_action_add as TypeActionCardType,
                  Constants.card_type_action_delete as TypeActionCardType
            ]
      }
}

export default Constants;
