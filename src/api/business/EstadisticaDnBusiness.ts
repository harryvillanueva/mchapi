import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import EstadisticaDnDataAccess from "../data/EstadisticaDnDataAccess"
import { IEstadisticaDn } from "../models/IEstadisticaDn"
import UtilInstance from "../helpers/Util"
import ValidationsInstance from "../helpers/Validations"

class EstadisticaDnBusiness implements IDataAccess<IEstadisticaDn> {
      public dataAcces: EstadisticaDnDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new EstadisticaDnDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IEstadisticaDn> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<IEstadisticaDn | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IEstadisticaDn): Promise<IEstadisticaDn | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IEstadisticaDn): Promise<IEstadisticaDn | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IEstadisticaDn | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      async getEstadisticaCurrent(): Promise<Array<IEstadisticaDn> | IErrorResponse> {
            return this.dataAcces.getEstadisticaCurrent()
      }

      async insertAutomaticBulk(fechaFilter?: string, tipoFilter?: Array<string>): Promise<Array<IEstadisticaDn> | IErrorResponse> {
            return this.dataAcces.insertAutomaticBulk(
                              ValidationsInstance.checkFormatDateSQL(fechaFilter || '') ? fechaFilter : undefined,
                              tipoFilter
                              )
      }

      async getEstadisticaHistorial(): Promise<Array<IEstadisticaDn> | IErrorResponse> {
            return this.dataAcces.getEstadisticaHistorial()
      }
}

export default EstadisticaDnBusiness