import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { IPlataformaComercial } from "../models/IPlataformaComercial"
import PlataformaComercialDataAccess from "../data/PlataformaComercialDataAccess"

class PlataformaComercialBusiness implements IDataAccess<IPlataformaComercial> {
      public dataAcces: PlataformaComercialDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new PlataformaComercialDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IPlataformaComercial> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<IPlataformaComercial | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IPlataformaComercial): Promise<IPlataformaComercial | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IPlataformaComercial): Promise<IPlataformaComercial | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IPlataformaComercial | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
}

export default PlataformaComercialBusiness