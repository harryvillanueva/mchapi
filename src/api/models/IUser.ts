import { IModel } from "../helpers/IModel";
import { CodeRoleType, StatusDataType, etapaType, horarioType, jornadaType } from "../types/GlobalTypes";
import { IRole } from "./IRole";

export interface IUser extends IModel {
      id?: BigInt
      username: string
      email: string
      password?: string
      nombre: string
      apellido: string
      estado?: StatusDataType
      fecha_creacion?: string
      fecha_ultimo_cambio?: string
      idrol?: CodeRoleType
      idusuario: BigInt
      nombrerol?: string,
      roles?: Array<IRole>
      ref_lead?: string
      telefono?: string
      nombre_completo?: string
      multilogin? : boolean 

      // fiels copy of lead
      empresa?: string
      idcategoria?: number

      // Info RRHH

      fecha_inicio ?: string
      fecha_fin? : string
      alta_ss? : string
      cumpleanyos?: string
      correo_personal? : string
      mail_mch?: string
      detalles ?: string
      etapa ? : etapaType
      sueldo_base ? : number
      acciones ? : number
      jornada ? : jornadaType
      fecha_cambio_jornada ? : string
      horario? : horarioType

      // usuario WP
      user_wp?: string
}