import { IModel } from "../helpers/IModel"
import { ActionType, ResultType, TypeExecLogType } from "../types/GlobalTypes"

export interface ILogsApartment extends IModel {
      id?: BigInt
      accion: ActionType
      resultado: ResultType
      timestamp: number
      data: any
      fecha_creacion?: string
      iddispositivo?: BigInt
      idpiso: BigInt
      idusuario: BigInt
      fecha: string
      usuario: string
      idllave?: BigInt
      idcodigo?: BigInt
      id_dispositivo_ref?: string
      tipo_ejecucion: TypeExecLogType | null
      observacion: string | null
      etiqueta_dispositivo?: string
      dispositivo_ejecucion: string | null
}