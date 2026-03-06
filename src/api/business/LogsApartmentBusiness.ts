import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import LogsApartmentDataAccess from "../data/LogsApartmentDataAccess"
import { ILogsApartment } from "../models/ILogsApartment"

class LogsApartmentBusiness implements IDataAccess<ILogsApartment> {
      public dataAcces: LogsApartmentDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new LogsApartmentDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ILogsApartment> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ILogsApartment | IErrorResponse> {
            // return this.dataAcces.getById(id)
            throw new Error("Method not implemented.")
      }

      insert(data: ILogsApartment): Promise<ILogsApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: ILogsApartment): Promise<ILogsApartment | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<ILogsApartment | IErrorResponse> {
            // return this.dataAcces.delete(id)
            throw new Error("Method not implemented.")
      }

      getAllByApartment(): Promise<Array<ILogsApartment> | IErrorResponse> {
            return this.dataAcces.getAllByApartment()
      }
}

export default LogsApartmentBusiness