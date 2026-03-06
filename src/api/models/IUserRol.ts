import { IModel } from "../helpers/IModel"
import { CodeRoleType } from "../types/GlobalTypes"

export interface IUserRol extends IModel {
      idusuario: BigInt
      idrol: CodeRoleType
}