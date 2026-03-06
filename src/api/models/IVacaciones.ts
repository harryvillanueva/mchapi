import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface IVacaciones extends IModel{
    id ?: BigInt
    idusuario? : BigInt
    fecha_inicio : string
    fecha_final : string
    estado ?: StatusDataType
    fecha_ultimo_cambio? : string
    idrrhh ?: BigInt
    descripcion : string
    fecha_creacion ?: string
    estado_solicitud? : number
}

export default IVacaciones