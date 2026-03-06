import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface ICategoria extends IModel {
      id?: BigInt
      codigo: string
      nombre: string
      observacion: string
      estado: StatusDataType
}