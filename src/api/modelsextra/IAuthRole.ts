import { IModel } from "../helpers/IModel"
import { ApiType } from "../types/GlobalTypes"
import { IRole } from "../models/IRole"

export interface IAuthRole extends IModel, IRole {
      lengthapi?: number
      api?: Array<ApiType>
      ismain?: boolean
}