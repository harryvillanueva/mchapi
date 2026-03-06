import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ITipoEstancia } from "../models/ITipoEstancia"
import TipoEstanciaDataAccess from "../data/TipoEstanciaDataAccess"

class TipoEstanciaBusiness implements IDataAccess<ITipoEstancia> {
      public dataAcces: TipoEstanciaDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new TipoEstanciaDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ITipoEstancia> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ITipoEstancia | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: ITipoEstancia): Promise<ITipoEstancia | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: ITipoEstancia): Promise<ITipoEstancia | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<ITipoEstancia | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
}

export default TipoEstanciaBusiness