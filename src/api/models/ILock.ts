import { IModel } from "../helpers/IModel";
import { IDevice } from "./IDevice";

export interface ILock extends IDevice, IModel {
      mac: string
      codigo_permanente: string
      bateria?: number
      idcodigo?: BigInt
}