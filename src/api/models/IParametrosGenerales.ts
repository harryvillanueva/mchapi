import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface IParametrosGenerales extends IModel {
      id?: BigInt
      codigo: string
      valor: string
      data: any
      observacion: StatusDataType,
      estado: number,
      fecha_ultimo_cambio: string
}