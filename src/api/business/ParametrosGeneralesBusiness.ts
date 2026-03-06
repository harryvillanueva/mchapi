import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ICategoria } from "../models/ICategoria"
import ParametrosGeneralesDataAccess from "../data/ParametrosGeneralesDataAccess"
import { IParametrosGenerales } from "../models/IParametrosGenerales"

class ParametrosGeneralesBusiness implements IDataAccess<IParametrosGenerales> {
      public dataAcces: ParametrosGeneralesDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new ParametrosGeneralesDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IParametrosGenerales> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<IParametrosGenerales | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IParametrosGenerales): Promise<IParametrosGenerales | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IParametrosGenerales): Promise<IParametrosGenerales | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IParametrosGenerales | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getByCode(codigo: string): Promise<IParametrosGenerales | IErrorResponse> {
            return this.dataAcces.getByCode(codigo)
      }
}

export default ParametrosGeneralesBusiness