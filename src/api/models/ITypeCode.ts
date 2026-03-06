import { IModel } from "../helpers/IModel"

export interface ITypeCode extends IModel {
    id?: BigInt
    codigo: string
    nombre: string
    index_lock: number
    user_lock: number
    times_lock: number
    estado: number
    descripcion: string
}