import { IModel } from "../helpers/IModel";

export interface ISucesosDn extends IModel {
      id?: BigInt
      fecha_creacion?: string
      descripcion: string
      estado?: number

      idrol: string
      idusu_creacion?: BigInt
      idusu_suceso: BigInt

      // fields no db
      nombre_usu_creacion?: string
}