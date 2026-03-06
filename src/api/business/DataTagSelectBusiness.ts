import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { IDataTagSelect } from "../modelsextra/IDataTagSelect"
import DataTagSelectDataAccess from "../data/DataTagSelectDataAccess"

class DataTagSelectBusiness implements IDataAccess<IDataTagSelect> {
      public dataAcces: DataTagSelectDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new DataTagSelectDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IDataTagSelect> | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getById(id: BigInt): Promise<IDataTagSelect | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IDataTagSelect): Promise<IDataTagSelect | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IDataTagSelect): Promise<IDataTagSelect | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IDataTagSelect | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getAllPisos(): Promise<Array<IDataTagSelect> | IErrorResponse> {
            return this.dataAcces.getAllPisos()
      }

      getAllTypeDevices(): Promise<Array<IDataTagSelect> | IErrorResponse> {
            return this.dataAcces.getAllTypeDevices()
      }

      getPersonasOficina(): Promise<Array<IDataTagSelect> | IErrorResponse> {
            return this.dataAcces.getPersonasOficina()
      }
}

export default DataTagSelectBusiness