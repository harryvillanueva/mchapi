import { IModel } from "../helpers/IModel";
import { CityType, CountryType, StatusDataType } from "../types/GlobalTypes";
import { IDevice } from "./IDevice";
import { IVariablesReserva } from "./IVariablesReserva";

export interface IApartment extends IModel {
    id?: BigInt
    pais: CountryType
    ciudad: CityType
    codigo_postal: string
    direccion: string
    nro_edificio?: string
    nro_piso?: string
    id_dispositivo_ref: string
    ubicacion_mapa?: string
    observaciones?: string
    estado?: StatusDataType
    fecha_creacion?: string
    fecha_ultimo_cambio?: string
    idusuario: BigInt
    etiqueta: string
    config_dispositivo?: string
    propietarios?: Array<{ id: BigInt, nombre?: string, apellido?: string }>
    dispositivos?: Array<IDevice>
    dispositivos_str?: string
    full_direccion?: string,
    tipo? : string
    // datos rmg
    nombre_comercial?: string
    link_nombre_comercial?: string
    estado_general?: number
    variablesreserva?: Array<IVariablesReserva>

    // detalle DA


    ocupacion_maxima?: number
    m2?: number
    nro_dormitorios?: number
    nro_camas?: number
    nro_banios?: number
    nro_aseos?: number // FIELD SIN USO
    nro_sofacama?: number
    aire_acondicionado?: boolean
    lbl_aire_acondicionado?: string
    calefaccion?: boolean
    lbl_calefaccion?: string
    ascensor?: boolean
    lbl_ascensor?: string
    discapacidad?: boolean
    lbl_discapacidad?: string
    descripcion_camas?: string
    descripcion_banios?: string
    descripcion_sofacama?: string
    zonas?: string
    link_source_mantenimiento? : string









 //// Campos a añadir cuando este listo el front

    cp_ocupacion_maxima?: number
    cp_m2?: number
    ds_nro_dormitorios?: number
    ds_nro_camas?: number
    bs_nro_banios?: number
    // nro_aseos?: number // FIELD SIN USO
    ds_nro_sofacama?: number
    ca_aire_acondicionado?: boolean
    ca_calefaccion?: boolean
    cp_ascensor?: boolean
    ca_discapacidad?: boolean
    ds_descripcion_camas?: string
    ds_descripcion_sofacama?: string
    if_zonas?: string
    if_clase ?: string,
    if_vista ?: string,
    cp_estancia_total ?: number,
    cp_cerradura_puertas ? : boolean,
    cp_nro_plantas ? : number,
    co_clase_cocina ? : string,
    co_tipo_cocina ? : string,
    co_tipo_cafetera ? : string,
    co_freidora ? : boolean,
    co_horno ? : boolean,
    ah_entrada_independiente ? : boolean,
    ah_chimenea ? : boolean,
    ah_lavadora ? : string,
    ah_caja_fuerte ? : boolean,
    ah_minibar ? : boolean,
    ah_tipo_tv ? : string,
    ah_ventilador_techo ? : boolean,
    ah_tipo_internet ? : string,
    ca_aparcamiento_instalaciones ? : boolean,
    ca_nro_plazas ? : number,
    ca_ubicacion_calefaccion ? : string,
    ca_tipo_calefaccion ? : string,
    ca_alarma ? : boolean,
    ca_alarma_incendios ? : boolean,
    ca_balcon ? : boolean ,
    ca_terraza ? : boolean,
    ca_jardin ? : boolean,
    ca_piscina ? : string,
    ca_patio_interior ? : boolean,
    cu_zona_bbq ? : boolean,
    cu_zona_infantil ? : boolean,
    cu_spa ? : boolean,
    cu_gimnasio ? : boolean,
    plano ? : string
    if_tipo ? : string,
    bs_nro_aseos? : number,
    bs_descripcion_banios? : string
    // info_general? : string
}