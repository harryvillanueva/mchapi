import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface IPlataformaComercial extends IModel {
    id?: BigInt
    codigo: string
    nombre: string
    comision: string
    contacto?: string
    correo_contacto?: string
    telefono_contacto?: string
    link: string
    observacion?: string
    estado: StatusDataType
    fecha_creacion?: string
    fecha_ultimo_cambio?: string
}