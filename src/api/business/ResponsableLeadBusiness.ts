import { IDataAccess } from "../helpers/IDataAccess"
import { IKey } from "../models/IKey"
import KeyDataAccess from "../data/KeyDataAccess"
import { ILock } from "../models/ILock"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { IResponsableLead } from "../models/IResponsableLead"
import ResponsableLeadDataAccess from "../data/ResponsableLeadDataAccess"

class ResponsableLeadBusiness implements IDataAccess<IResponsableLead> {
      public dataAcces: ResponsableLeadDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new ResponsableLeadDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IResponsableLead> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<IResponsableLead | IErrorResponse> {
            return this.dataAcces.getById(id)
      }

      insert(data: IResponsableLead): Promise<IResponsableLead | IErrorResponse> {
            // Validaciones de usuario y de campos
            return this.dataAcces.insert(data)
      }

      update(id: BigInt, data: IResponsableLead): Promise<IResponsableLead | IErrorResponse> {
            // throw new Error("Method not implemented.")
            // // Validaciones de usuario y de campos
            return this.dataAcces.update(id, data)
      }

      delete(id: BigInt): Promise<IResponsableLead | IErrorResponse> {
            throw new Error("Method not implemented.")
            // return this.dataAcces.delete(id)
      }

      getAllWithPagination(): Promise<Array<IResponsableLead> | IErrorResponse> {
            return this.dataAcces.getAllWithPagination()
      }
}

export default ResponsableLeadBusiness