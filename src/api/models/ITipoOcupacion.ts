import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface ITipoOcupacion extends IModel {
      id?: BigInt
      codigo: number
      nombre: string
      observacion: string
      estado: StatusDataType
}