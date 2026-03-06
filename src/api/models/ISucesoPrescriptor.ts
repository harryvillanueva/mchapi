import { IModel } from "../helpers/IModel";

export interface ISucesoPrescriptor extends IModel {
      id?: BigInt
      fecha_creacion?: string
      comentario: string
      data?: any
      estado?: number
      idusuario: BigInt
      idgrupo: BigInt

      nro_visitas?: number
      nro_reservas?: number
      valor?: number
      flag_vr?: string

      // fields no db [ responsable que registro el suceso ]
      responsable?: string
      fecha_creacion_short?: string

      // fields para obtener referencia de los comentarios
      lead_id?: string
      ref_historico_lead?: string
      ref_suceso?: string
}