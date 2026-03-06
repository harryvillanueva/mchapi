import { IModel } from "../helpers/IModel"
import { IPlataformaComercial } from "./IPlataformaComercial"
import { IVariablesReserva } from "./IVariablesReserva"

export interface IInfoPisoComercial extends IModel {
    id?: BigInt
    nombre_comercial?: string
    link_nombre_comercial?: string
    estado_general?: number
    link_tour_virtual?: string
    link_calendario_disponibilidad?: string
    link_repositorio?: string
    tiene_anuncio?: boolean
    anuncio_usuario?: string
    anuncio_contrasenia?: string
    anuncio_plataforma?: string
    anuncio_link?: string
    fecha_creacion?: string
    fecha_ultimo_cambio?: string

    plataformas: Array<IPlataformaComercial>
    variablesreserva: Array<IVariablesReserva>
    
    // Relaciones
    idusuario_ult_cambio?: BigInt
    idpiso: BigInt

    // apartment data
    a_etiqueta?: string
    a_codigo?: string
    a_localidad?: string
    a_codigo_postal?: string
    a_full_direccion?: string

    // detalle piso DA
    ocupacion_maxima?: number
    m2?: number
    nro_dormitorios?: number
    nro_camas?: number
    nro_banios?: number
    nro_aseos?: number
    nro_sofacama?: number
    lbl_aire_acondicionado?: string
    lbl_calefaccion?: string
    lbl_ascensor?: string
    lbl_discapacidad?: string
    descripcion_camas?: string
    descripcion_sofacama?: string
    ubicacion_mapa?: string
    zonas?: string
}