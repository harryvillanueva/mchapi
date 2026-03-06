import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface ITipoInteresa extends IModel {
      id?: BigInt
      codigo: number
      nombre: string
      observacion: string
      estado: StatusDataType
}