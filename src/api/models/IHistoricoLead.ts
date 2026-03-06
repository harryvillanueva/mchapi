import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";

export interface IHistoricoLead extends IModel {
    id?: BigInt
    next_step: string
    last_step: string
    data?: any
    interesa: string
    avance: string
    ocupacion: string
    comentario?: string
    estatus?: StatusDataType
    fecha_creacion?: string
    fecha_creacion_short?: string
    ref_historico_lead?: string
    ref_suceso?: string

    idlead: BigInt
    idusuario_resp: BigInt

    categoria: string

    // Field no DB
    responsable?: string
}