import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { StatusDataType } from "../types/GlobalTypes"
import { IRole } from "../models/IRole"
import RoleDataAccess from "../data/RoleDataAccess"

class RoleBusiness implements IDataAccess<IRole> {
    // public dataAcces: UserRolDataAccess
    public dataAcces: RoleDataAccess
    
    constructor(      public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAcces = new RoleDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }
    get(): Promise<IErrorResponse | IRole[]> {
        return this.dataAcces.get()
    }
    getById(id: BigInt): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
    insert(data: IRole): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
    update(id: BigInt, data: IRole): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
    delete(id: BigInt): Promise<IRole | IErrorResponse> {
        throw new Error("Method not implemented.")
    } 
}

export default RoleBusiness