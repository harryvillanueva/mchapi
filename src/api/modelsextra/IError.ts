import { ErrorFieldType } from "../types/GlobalTypes"

export interface IError {
      type: ErrorFieldType
      code: string
      field: string
      msg: string
      label?: string
}