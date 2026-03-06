import { IModel } from "../helpers/IModel";
import { IUser } from "./IUser";

export interface IGrupoPropietario extends IModel {
      id?: BigInt
      nombre: string
      whatsapp?: string
      nro_llamadas?: number
      estado?: number
      fecha_creacion?: string
      fecha_ultimo_cambio?: string
      next_step?: string

      // Fiels propietarios contratados
      administrador?: string
      presidente?: string
      vecinos?: string
      portero?: string
      otros?: string
      acceso_intranet?: string
      
      //Data propietarios
      propietarios?: Array<IUser>
      
      //field usuario creacion
      comentario_suceso?: string

      //Propietario to Lead
      propietarios_to_lead?: Array<number>

      //Field no DB for filter
      telefonos_usu?: string
      nombres_usu?: string
}