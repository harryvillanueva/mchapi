import { IError } from "./IError"

export interface IErrorResponse {
      code?: number
      error: string
      data?: Array<IError>
}