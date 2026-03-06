import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";
import { ICorreo } from "./ICorreo";
import { IHistoricoLead } from "./IHistoricoLead";
import { ITelefono } from "./ITelefono";

export interface ILead extends IModel {
    id?: BigInt
    lead_id?: string
    timestamp?: string
    next_step: string
    last_step: string
    semana?: string
    nombre?: string
    apellido?: string
    grupo_wpp?: string
    referencia?: string
    precio?: string
    m2?: string
    codigo_postal?: string
    direccion?: string
    nro_edificio?: string
    nro_piso?: string
    localidad?: string
    estatus?: StatusDataType
    nro_llamadas?: number
    fecha_creacion?: string
    fecha_ult_cambio?: string
    nombre_completo?: string
    comentario_historico?: string

    idtipoavance?: BigInt
    idresponsable?: BigInt
    idtipoocupacion?: BigInt
    idtipointeresa?: BigInt
    idusuario_creacion?: BigInt
    idusuario_ult_cambio?: BigInt

    telefonos: Array<ITelefono>
    correos: Array<ICorreo>
    historico?: Array<IHistoricoLead>

    tipo_accion?: string

    // data agentes
    tipo_lead: string
    idcategoria?: BigInt
    empresa?: string

    // Field no DB
    responsable?: string
    name_tavance?: string
    name_tocupacion?: string
    name_tinteresa?: string
    name_categoria?:string
    persona?: string
    telefonos_str?: string
    lbl_orden?: string

    // Field for other table
    comentario?: string

    grupo?: { id: number, nombre: string }
}