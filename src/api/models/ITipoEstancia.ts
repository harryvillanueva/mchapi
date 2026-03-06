import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface ITipoEstancia extends IModel {
    id?: BigInt
    codigo: string
    nombre: string
    minimo: number
    maximo?: number 
    estado: StatusDataType
    observacion: string
    fecha_creacion?: string
    fecha_ultimo_cambio?: string
}