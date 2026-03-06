import { IModel } from "../helpers/IModel";

export interface IControlHorarioLimpieza extends IModel {
    id?: BigInt
    fecha?: string
    entrada?: string
    salida?: string
    idusuario: BigInt
    idpiso: BigInt
    exec_entrada_lock?: boolean
    exec_salida_lock?: boolean
    estado?: number
    observacion?: string

    idusuario_ultimo_cambio?: BigInt
    fecha_ultimo_cambio?: string
    tipo_ejecucion?: string

    etiqueta_piso?: string
    f_fecha?: string

    // fields reporte
    full_name?: string
    str_lhorario?: string // nomenclatura <entrada>TO<salida>|<entrada>TO<salida>|....|<entrada>TO<salida>
    h_entrada?: string
    h_salida?: string
}