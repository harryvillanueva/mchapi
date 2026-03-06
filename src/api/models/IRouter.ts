import { TypeConnectionRouter } from "../types/GlobalTypes";
import { IDevice } from "./IDevice";

export interface IRouter extends IDevice {
      iddispositivo:number,
      tipo_conexion: TypeConnectionRouter,
      nombre_red: string
      password_red: string
      proveedor: string
      contacto?: string
      telefono?: string
      nro_sim?: string
      puk?: string
      pin?: string
      departamento?: string
}