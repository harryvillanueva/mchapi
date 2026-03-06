export type CodeRoleType = 'admin' |
      'propietario' |
      'colaborador' |
      'crm' |
      'default' |
      'superadmin' |
      'dn' |
      'atic' |
      'oficina' |
      'rrhh' |
      'ceo' |
      'dnmaster' |
      'rmg' |
      'rrhhmaster' |
      'limpieza' |
      'da' |
      'ade' |
      'mantenimiento'

export type StatusDataType = -1 | 0 | 1

export type ErrorFieldType = 'SQL' | 'CUSTOM'

export type ApiType = {
      method: string
      path: string
      filterstatus: StatusDataType
}

export type DataRequestType = {
      idUserLogin: BigInt
      filterState: StatusDataType
      usernameLogin: string
}

export type IDsType = {
      id: BigInt
}

export type CountryType = 'España' |
      'Portugal' |
      'Francia' |
      'Italia'

export type CityType = 'Madrid' |
      'Marbella' |
      'Barcelona' |
      'Leganes' |
      'Retiro' |
      'Chamartín' |
      'Homes Marbella' |
      'Chamberí' |
      'Salamanca' |
      'Tetuán' |
      'Centro' |
      'Arganzuela'

export type TypeDeviceType = 'lock' | 'telefonillo' | 'movil' | 'router' | 'sonoff' | 'camara' |'ttlock'

// marcos: tipo para controlar el switch que controla  el tipo de device en Bussiness
export type numberTypeDevice = 1 | 2

export type LocationDataType = 'Oficina' | 'Piso'

export type TypeCardType = 'Normal' | 'Maestra'

export type ActionType = 'openLock' |
      'syncTime' |
      'newCode' |
      'setCard' |
      'openPortal' |
      'toggleLight'

export type ResultType = 'Correcto' | 'Fallido'

export type TypeActionCardType = 1 | 2 // [1 -> add], [2 -> delete]

export type TypeExecLogType = 'Automatico' | 'Manual'

export type TypeConnectionRouter = 'Sim' | 'Fibra'

export type resulteWeLink = {
      error: number,
      msg: string,
      data?: {
            name?: string,
            deviceid?: string,
            online?: boolean,
            params:
            {
                  switch: string,
                  pulse: string
            }
      }
}

export type deviceWeLink = {
      name: string,
      deviceid: string,
      online: boolean,
      params: {
            switch: string,
            pulse: string
      }
}

export type deviceTypeMovil = {
      index: number,
      dateConnection: string,
      name: string,
      inProcessing: boolean,
      typeDeviceCode: number,
      typeDevice: string,
      status: string
}

export type jornadaType = 'Jornada Completa' |
      'Media Jornada'

export type etapaType = 'Prácticas Estudiantes' |
      'Período de Prueba' |
      'Profesional' |
      'Empleado Categoría 1' |
      'Empleado Categoría 2'

export type horarioType = 'HM' |
      'HT' |
      'HC'