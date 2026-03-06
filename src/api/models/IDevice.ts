import { IModel } from "../helpers/IModel";
import { LocationDataType, StatusDataType, TypeDeviceType } from "../types/GlobalTypes";
import { ILock } from "./ILock";
import { IMovil } from "./IMovil";
import { ITelefonillo } from "./ITelefonillo";

export interface IDevice extends IModel {
    id?: BigInt
    idpiso?: BigInt
    idtipodispositivo: BigInt
    codigo: string
    nombre: string
    ubicacion?: LocationDataType
    ref_dispositivo?: string
    etiqueta_dispositivo?: string
    descripcion?: string
    estado?: StatusDataType
    fecha_ultimo_cambio?: string
    fecha_creacion?: string
    propietario?: string
    marca?: string
    modelo?: string
    ubicacion_piso?: string


    // Fields no DB
    type?: TypeDeviceType
    data_son?: Array<any>
    etiqueta?: string
    tdevice?: string
    nametdevice?: string
    mac?: string
    estado_piso?: number

    info_extra?: IMovil | ILock | ITelefonillo

    // Field report state devices: Online, Offline
    state?: string
    code_piso?: string // referencia a la columna 'id_dispositivo_ref' [tbl_piso]
}