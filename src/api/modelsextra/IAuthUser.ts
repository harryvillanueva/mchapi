import { IModel } from "../helpers/IModel"
import { CodeRoleType } from "../types/GlobalTypes"
import { IAuthRole } from "./IAuthRole"

export interface IAuthUser extends IModel {
      id?: BigInt
      username: string
      nombre: string
      apellido: string
      email: string
      estado: number
      idrol?: CodeRoleType
      nombrerol?: string
      roles?: Array<IAuthRole>
      api?: string
      password?: string
      multilogin: boolean
      department: string
}