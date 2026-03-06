import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import CategoriaDataAccess from "../data/CategoriaDataAccess"
import { ICategoria } from "../models/ICategoria"

class CategoriaBusiness implements IDataAccess<ICategoria> {
      public dataAcces: CategoriaDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new CategoriaDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ICategoria> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ICategoria | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: ICategoria): Promise<ICategoria | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: ICategoria): Promise<ICategoria | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<ICategoria | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
}

export default CategoriaBusiness