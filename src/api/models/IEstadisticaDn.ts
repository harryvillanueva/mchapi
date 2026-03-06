import { IModel } from "../helpers/IModel";

export interface IEstadisticaDn extends IModel {
      id?: number 
      fecha_creacion?: string
      tipo: string
      idusuario?: number
      data?: any
      estadistica: number
      idusuresp?: number | null
      usr_responsable?: string
}