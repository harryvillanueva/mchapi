import { IModel } from "../helpers/IModel"
import { CodeRoleType, StatusDataType } from "../types/GlobalTypes"

export interface IApi extends IModel {
      id: BigInt
      method: string
      path: string
      descripcion?: string
      filterstatus: number
      estado: StatusDataType
      idrol: CodeRoleType
}