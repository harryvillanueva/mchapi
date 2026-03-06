import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ITipoOcupacion } from "../models/ITipoOcupacion"
import TipoOcupacionDataAccess from "../data/TipoOcupacionDataAccess"

class TipoOcupacionBusiness implements IDataAccess<ITipoOcupacion> {
      public dataAcces: TipoOcupacionDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new TipoOcupacionDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ITipoOcupacion> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ITipoOcupacion | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: ITipoOcupacion): Promise<ITipoOcupacion | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: ITipoOcupacion): Promise<ITipoOcupacion | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<ITipoOcupacion | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
}

export default TipoOcupacionBusiness