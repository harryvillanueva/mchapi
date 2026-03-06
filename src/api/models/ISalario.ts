import { IModel } from "../helpers/IModel";
import { ILate } from "./ILate";

export interface ISalario extends IModel{
    id : BigInt
    id_usuario : BigInt
    sueldo_base : number
    etapa : string
    late ?: Array <ILate>
    fecha_pago ?: string
    total ?: number
    acciones ?: number
}