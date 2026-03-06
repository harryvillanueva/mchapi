import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ITipoAvance } from "../models/ITipoAvance"
import TipoAvanceDataAccess from "../data/TipoAvanceDataAccess"

class TipoAvanceBusiness implements IDataAccess<ITipoAvance> {
      public dataAcces: TipoAvanceDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new TipoAvanceDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ITipoAvance> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ITipoAvance | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: ITipoAvance): Promise<ITipoAvance | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: ITipoAvance): Promise<ITipoAvance | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<ITipoAvance | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
}

export default TipoAvanceBusiness