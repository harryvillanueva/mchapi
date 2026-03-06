import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import TypeCodeDataAccess from "../data/TypeCodeDataAccess"
import { ITypeCode } from "../models/ITypeCode"

class TypeCodeBusiness implements IDataAccess<ITypeCode> {
      public dataAcces: TypeCodeDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new TypeCodeDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ITypeCode> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ITypeCode | IErrorResponse> {
            return this.dataAcces.getById(id)
      }

      insert(data: ITypeCode): Promise<ITypeCode | IErrorResponse> {
            // Validaciones de usuario y de campos
            return this.dataAcces.insert(data)
      }

      update(id: BigInt, data: ITypeCode): Promise<ITypeCode | IErrorResponse> {
            // Validaciones de usuario y de campos
            return this.dataAcces.update(id, data)
      }

      delete(id: BigInt): Promise<ITypeCode | IErrorResponse> {
            return this.dataAcces.delete(id)
      }
}

export default TypeCodeBusiness