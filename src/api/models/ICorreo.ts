import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface ICorreo extends IModel {
    id?: BigInt
    correo: string
    estado: StatusDataType
    fecha_creacion: string
    idlead: BigInt
}