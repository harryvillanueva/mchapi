import { IModel } from "../helpers/IModel"
import { LocationDataType, TypeActionCardType, TypeCardType } from "../types/GlobalTypes"

export interface IKey extends IModel {
      id?: BigInt
      ubicacion: LocationDataType
      tipo_tarjeta: TypeCardType
      idqr: string
      qr: string
      imagenqr?: string
      estado?: number
      observacion?: string
      fecha_creacion?: string
      fecha_ultimo_cambio?: string
      idusuario?: BigInt
      pisos?: Array<string>
      type_action?: TypeActionCardType
      nro_locks?:number
      
      // Fields NOT DB
      pisos_str?:string

      // Fields for validate logs
      is_mine?: string
}