import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType, TypeDeviceType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { IDeviceReportDetails } from "../models/IDeviceReportDetails"
import DeviceReportDetailsDataAccess from "../data/DeviceReportDetailsDataAccess"

class DeviceReportDetailsBusiness implements IDataAccess<IDeviceReportDetails> {
      public dataAccess: DeviceReportDetailsDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAccess = new DeviceReportDetailsDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IDeviceReportDetails> | IErrorResponse> {
            return this.dataAccess.get()
      }

      getById(id: BigInt): Promise<IDeviceReportDetails | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IDeviceReportDetails): Promise<IDeviceReportDetails | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IDeviceReportDetails): Promise<IDeviceReportDetails | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      updateID_reporte(id : BigInt , id_reporte : BigInt , data: IDeviceReportDetails) : Promise<IDeviceReportDetails | IErrorResponse>{

            let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
         
    
            return (error.data?.length === 0) ? this.dataAccess.updateID_reporte(id, id_reporte , data) :
                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }
      delete(id: BigInt): Promise<IDeviceReportDetails | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      async getAllByIdReport(idReport: BigInt, lTypeDeviceCodes?: Array<TypeDeviceType>): Promise<Array<IDeviceReportDetails> | IErrorResponse> {
            return this.dataAccess.getAllByIdReport(idReport, lTypeDeviceCodes)
      }
}

export default DeviceReportDetailsBusiness