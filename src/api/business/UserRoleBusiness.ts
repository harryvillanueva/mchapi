import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import UserRolDataAccess from "../data/UserRoleDataAccess"
import { IUserRol } from "../models/IUserRol"

class UserRoleBusiness implements IDataAccess<IUserRol> {
      public dataAcces: UserRolDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new UserRolDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }
      get(): Promise<IErrorResponse | IUserRol[]> {
            throw new Error("Method not implemented.")
      }
      getById(id: BigInt): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
      insert(data: IUserRol): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
      update(id: BigInt, data: IUserRol): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
      delete(id: BigInt): Promise<IUserRol | IErrorResponse> {
            throw new Error("Method not implemented.")
      }
      getUserRoleByRole(idrole: string): Promise<Array<IUserRol> | IErrorResponse> {
            return this.dataAcces.getUserRoleByRole(idrole)
      } 
}

export default UserRoleBusiness