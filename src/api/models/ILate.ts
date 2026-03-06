import { IModel } from "../helpers/IModel";

export interface ILate extends IModel{
    id : BigInt
    id_usuario : BigInt
    fecha : string
    precio : number
    comentarios ?: string
}