import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"

export interface IDataAccess<T> {
      idUserLogin: BigInt
      filterStatus: StatusDataType
      infoExtra?: any
      
      // Metodos principales
      get(): Promise<Array<T> | IErrorResponse>
      getById(id: BigInt): Promise<T | IErrorResponse>
      insert(data: T): Promise<T | IErrorResponse>
      update(id: BigInt, data: T): Promise<T | IErrorResponse>
      delete(id: BigInt): Promise<T | IErrorResponse>

      // Nuevos metodos escribir en las propias clases [Negocio|DB]
}