import { IModel } from "../helpers/IModel";
import { IUser } from "./IUser";

export interface IGrupoPrescriptor extends IModel {
      id?: BigInt
      nombre: string
      whatsapp?: string
      nro_visitas?: number
      nro_reservas?: number
      valor?: number
      estado?: number
      fecha_creacion?: string
      fecha_ultimo_cambio?: string
      valor_propietario?: number
      next_step?: string

      // fields de prescriptores contratados
      acceso_intranet?: string

      // Data prescriptores no DB on table
      prescriptores?: Array<IUser>

      // Data suceso no DB on table
      comentario_suceso?: string
      flag_vr?: string

      // Prescriptores to Lead
      prescriptores_to_lead?: Array<number>

      // Field no DB for filter
      telefonos_usu?: string
      nombres_usu?: string
}