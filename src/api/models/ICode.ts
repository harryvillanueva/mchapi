import { IModel } from "../helpers/IModel"

export interface ICode extends IModel {
      id?: BigInt
      codigo: string
      dias: number
      timestamp_inicio: number
      timestamp_fin: number
      fecha_vig_inicio: string
      fecha_vig_fin: string
      fecha_creacion?: string
      idusuario: BigInt
      idmanija: BigInt
      estado: number
      idtipocodigo: BigInt
      codigo_tipocodigo?: string
}