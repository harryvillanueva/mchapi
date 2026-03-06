import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface IResponsableLead extends IModel {
      id?: BigInt
      codigo: string
      nombre: string
      observacion: string
      estado: StatusDataType
      idusuario_resp?: BigInt
      tipo_lead: string
      orden?: number

      // Fields no DB
      responsable?: string
      nro_leads?: number
}