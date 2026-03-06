import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
// import { IPlataformaComercial } from "../models/IPlataformaComercial"
import { IVariablesReserva } from "../models/IVariablesReserva"
import VariablesReservaDataAccess from "../data/VariablesReservaDataAccess"

class VariablesReservaBusiness implements IDataAccess<IVariablesReserva> {
      public dataAcces: VariablesReservaDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new VariablesReservaDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IVariablesReserva> | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getById(id: BigInt): Promise<IVariablesReserva | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IVariablesReserva): Promise<IVariablesReserva | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IVariablesReserva): Promise<IVariablesReserva | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IVariablesReserva | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      // getAllByIdPiso(idPiso: BigInt): Promise<Array<IVariablesReserva> | IErrorResponse> {
      //       return this.dataAcces.getAllByIdPiso(idPiso)
      // }

      getByIdAndIdPiso(id: BigInt, idPiso: BigInt): Promise<IVariablesReserva | IErrorResponse> {
            return this.dataAcces.getByIdAndIdPiso(id, idPiso)
      }
}

export default VariablesReservaBusiness