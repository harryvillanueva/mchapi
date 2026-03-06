import { IModel } from "../helpers/IModel";

export interface IDeviceReportDetails extends IModel {
      id?: BigInt
      id_reporte?: BigInt
      id_piso?: BigInt
      id_device?: BigInt
      state: string
      fecha_ultimo_cambio?: string
}