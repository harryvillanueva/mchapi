import { IDataAccess } from "../helpers/IDataAccess";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import ValidationsInstance from "../helpers/Validations";
import Constants from "../helpers/Constants";
import { IInventario } from "../models/IInventario";
import UserRolDataAccess from "../data/UserRoleDataAccess";
import { IUserRol } from "../models/IUserRol";
import { rejects } from "assert";
import InventarioDataAccess from "../data/InventarioDataAccess";
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes";
import { IArticulo } from "../models/IArticulo";
import { IGrupoInventario } from "../models/IGrupoInventario";
import { IResponseGeneral } from "../modelsextra/IResponseGeneral";



class InventarioBusiness implements IDataAccess <IInventario>{
    public dataAcces : InventarioDataAccess

    constructor(
        public idUserLogin : BigInt,
        public filterStatus : StatusDataType,
        public isTransactions : boolean,
        public infoExtra? : any
    ){
        this.dataAcces = new InventarioDataAccess(idUserLogin,filterStatus,isTransactions, infoExtra)
    }

   
   
   
    get() : Promise <Array<IInventario> | IErrorResponse>{
        return this.dataAcces.get()
    }
    
    // private async validate(data : IInventario, error: IErrorResponse) : Promise <number>{

    //         // STOCK //
    //         ValidationsInstance.checkNumberMayorOIgualACero(data.stock || 0) ||
    //         (error.data?.push({
    //        type: Constants.error_type_custom as ErrorFieldType,
    //         code: '',
    //         field: 'stock',
    //       msg: 'El campo stock tiene que ser superior o igual a 0'
    //        })
    //      )

    //     return 0
    // }
    
    async getById(id: BigInt): Promise<IInventario | IErrorResponse> {
        return this.dataAcces.getById(id)
    }

    async getByIdPiso(id: BigInt): Promise <Array<IInventario>| IErrorResponse> {
        return this.dataAcces.getByIdPiso(id)
    }

    getInventarioPag() : Promise <Array<IInventario> | IErrorResponse>{
        return this.dataAcces.getInventarioPag()
    }
    async insert(data: IInventario): Promise<IInventario | IErrorResponse> {

        let error : IErrorResponse = {error : "Error , integridad de datos ", data :[]}
        return (error.data?.length === 0 ) ? this.dataAcces.insert(data) :
                                             new Promise <IErrorResponse>((resolve, reject) => {resolve(error)})
    }

    
    
    async update(id: BigInt, data: IInventario): Promise<IInventario | IErrorResponse> {

        let error : IErrorResponse = {error : "Error, integridad de datos " , data : []}

        return (error.data?.length === 0 ) ? this.dataAcces.update(id,data) :
        new Promise <IErrorResponse>((resolve, reject) => { resolve(error) })
    }

   
   
    async deletedeleteFromOficeToPiso(data: IGrupoInventario): Promise<IResponseGeneral | IErrorResponse> {

        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }


        // await this.validate(data, error)
        // return (error.data?.length === 0) ? this.dataAcces.deleteFromOficeToPiso(resta,data) : 
        return (error.data?.length === 0) ? this.dataAcces.deleteFromOficeToPiso(data) :
        new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    } 
        
        async delete(id: BigInt): Promise<IInventario | IErrorResponse> {
        return this.dataAcces.delete(id)
    }

    async añadirProductoComprado(data : IGrupoInventario) : Promise <IResponseGeneral | IErrorResponse>{
        let error : IErrorResponse = { error : 'Error , integridad de datos', data : []}

        return (error.data?.length === 0) ? this.dataAcces.añadirArticulosComprado(data) : 
        new Promise <IErrorResponse>((resolve , reject) =>{resolve(error)})
    }

    async updateRuptura(data : IGrupoInventario) : Promise <IResponseGeneral | IErrorResponse>{
        let error : IErrorResponse = {error : 'Error, integridad de datos' , data :[]}

        return (error.data?.length === 0) ? this.dataAcces.updateRuptura(data) :
        new Promise <IErrorResponse>((resolve , reject) => {resolve(error)})
    }

    async updateRoto(data : IGrupoInventario) : Promise <IResponseGeneral | IErrorResponse>{
        let error : IErrorResponse = {error : 'Error , integridad de datos' , data : []}
        
        return (error.data?.length === 0 ) ? this.dataAcces.updateRoto(data) :
        new Promise <IErrorResponse>((resolve , reject)=> {resolve(error)})
    }
}

export default InventarioBusiness