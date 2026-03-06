import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface IFichajeOficina extends IModel {
    id?: BigInt
    usuario: string
    fecha?: string
    entrada?: string
    salida?: string
    token: string
    ip?: string
    tipo_ejecucion: string
    estado?: StatusDataType
    observacion?: string
    fecha_ultimo_cambio?: string
    idusuario: BigInt
    idusuario_ultimo_cambio: BigInt
    jornada?: string
    horario?: string

    idrol?: string
    lblrol?: string
    fecha_str?: string

    // field by front no existe on db
    full_name?: ''
    h_entrada?: ''
    h_salida?: ''

    caballo?: ''
    caballogh?: ''
}