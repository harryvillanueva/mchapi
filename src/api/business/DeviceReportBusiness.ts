import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import DeviceReportDataAccess from "../data/DeviceReportDataAccess"
import { IDeviceReport } from "../models/IDeviceReport"

class DeviceReportBusiness implements IDataAccess<IDeviceReport> {
      public dataAccess: DeviceReportDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAccess = new DeviceReportDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IDeviceReport> | IErrorResponse> {
            return this.dataAccess.get()
      }

      getById(id: BigInt): Promise<IDeviceReport | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IDeviceReport): Promise<IDeviceReport | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IDeviceReport): Promise<IDeviceReport | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IDeviceReport | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insertBulk(data: IDeviceReport): Promise<IDeviceReport | IErrorResponse> {
            return this.dataAccess.insertBulk(data)
      }

      async getAllWithPagination(): Promise<Array<IDeviceReport> | IErrorResponse> {
            return this.dataAccess.getAllWithPagination()
      }

      async getLastReport(): Promise<IDeviceReport | IErrorResponse> {
            return this.dataAccess.getLastReport()
      }
}

export default DeviceReportBusiness