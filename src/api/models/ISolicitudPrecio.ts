import { IModel } from "../helpers/IModel";

export interface ISolicitudPrecio extends IModel {
    id?: BigInt
    limite_precio: number
    porcentaje_limite_precio: number
    username_wp?: string
    estado?: number
    estado_solicitud?: number
    observacion?: string
    fecha_creacion?: string
    fecha_ultimo_cambio?: string
    idpropietario?: BigInt
    idusuario: BigInt
    idpiso: BigInt

    // filds extras
    f_fecha_creacion?: string
    lbl_estado_solicitud?: string
    propietario?: string
    piso?: string
}