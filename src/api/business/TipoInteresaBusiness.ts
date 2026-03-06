import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ITipoInteresa } from "../models/ITipoInteresa"
import TipoInteresaDataAccess from "../data/TipoInteresaDataAccess"

class TipoInteresaBusiness implements IDataAccess<ITipoInteresa> {
      public dataAcces: TipoInteresaDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new TipoInteresaDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ITipoInteresa> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ITipoInteresa | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: ITipoInteresa): Promise<ITipoInteresa | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: ITipoInteresa): Promise<ITipoInteresa | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<ITipoInteresa | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
}

export default TipoInteresaBusiness