import { IUser } from "../models/IUser";
import { IEtapa } from "../models/IEtapaRRHH";
import { ILate } from "../models/ILate";
import { ISalario } from "../models/ISalario";
import { IDataAccess } from "../helpers/IDataAccess";
import DbConnection from "../helpers/DbConnection";
import { StatusDataType } from "../types/GlobalTypes";
import { IErrorResponse } from "../modelsextra/IErrorResponse";


class SalarioDataAccess implements IDataAccess<ISalario>{
    public client : DbConnection

    constructor(
        public idUserLogin : BigInt,
        public filterStatus : StatusDataType,
        public isTransaction : boolean,
        public infoExtra?: any
    ){
        this.client = new DbConnection(isTransaction)
    }

    async get(): Promise <Array< ISalario> | IErrorResponse>{
        throw new Error("Method not implemented.")
    }

    getById(id: BigInt): Promise<ISalario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    insert(data: ISalario): Promise<ISalario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    update(id: BigInt, data: ISalario): Promise<ISalario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<ISalario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }




    /////////// LATES ////////////////

    async getLate(): Promise <Array<ILate> | IErrorResponse>{
        throw new Error("Method not implemented.")
    }

    insertLate(data : ILate): Promise<ILate | IErrorResponse>{
        throw new Error("Method not implemented.")
    }

    updateLate(id : BigInt , data : ILate): Promise <ILate | IErrorResponse>{
        throw new Error("Method not implemented.")
    }

    deleteLate(id : BigInt): Promise <ILate | IErrorResponse>{
        throw new Error("Method not implemented.")
    }
}

export default SalarioDataAccess