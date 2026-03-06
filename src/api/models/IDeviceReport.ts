import { IModel } from "../helpers/IModel";
import { IDeviceReportDetails } from "./IDeviceReportDetails";

export interface IDeviceReport extends IModel {
      id?: BigInt
      fecha?: string
      tipo: string

      // Data adicional para obtener cantidad de dispositivos online/offline/error
      ldetalle?: Array<IDeviceReportDetails>

      // data NO DB
      onlydate?: string
}