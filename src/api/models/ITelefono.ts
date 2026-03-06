import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface ITelefono extends IModel {
    id?: BigInt
    numero: string
    estado: StatusDataType
    fecha_creacion: string
    idlead: BigInt
}