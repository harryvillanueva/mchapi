import { IModel } from "../helpers/IModel"
import { CodeRoleType } from "../types/GlobalTypes"

export interface IRole extends IModel {
      id: CodeRoleType
      nombre: string
      descripcion?: string
}