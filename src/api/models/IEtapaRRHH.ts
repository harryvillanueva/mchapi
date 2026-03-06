import { IModel } from "../helpers/IModel";
import { CodeRoleType , StatusDataType } from "../types/GlobalTypes";
import { IRole } from "./IRole";

export interface IEtapa extends IModel{
    id : BigInt
    id_usuario : BigInt
    etapa : string
    fecha_inicio : string
    fecha_final : string
}