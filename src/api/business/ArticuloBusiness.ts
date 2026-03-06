import { IDataAccess } from "../helpers/IDataAccess";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import ValidationsInstance from "../helpers/Validations";
import Constants from "../helpers/Constants";
import { IArticulo } from "../models/IArticulo";
import ArticuloDataAccess from "../data/ArticuloDataAccess";
import UserRoleBusiness from "./UserRoleBusiness";
import { IUserRol } from "../models/IUserRol";
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes";
import { rejects } from "assert";



class ArticuloBusiness implements IDataAccess<IArticulo>{
    public dataAcces: ArticuloDataAccess

    constructor(public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any) {
        this.dataAcces = new ArticuloDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }


    get(): Promise<Array<IArticulo> | IErrorResponse> {
        return this.dataAcces.get()
    }

    async getById(id: BigInt): Promise<IArticulo | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getArticuloPag(): Promise<Array<IArticulo> | IErrorResponse> {
        return this.dataAcces.getArticulsPag()
    }


    private async validate(data : IArticulo, error: IErrorResponse) : Promise <number>{
             // tag


             if (!(ValidationsInstance.checkMinLetters(data.tag, 3) &&
             ValidationsInstance.checkMaxLetters(data.tag, 15))) {
             error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '',
                 field: 'tag',
                 msg: 'El campo tag debe contener al menos 3 caracteres y maximo 15!'
             }
             )
 
         }
 
 
         // // mobiliario 
 
 
         if (!(ValidationsInstance.checkMinLetters(data.mobiliario, 4) &&
             ValidationsInstance.checkMaxLetters(data.mobiliario, 100))) {
             error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '',
                 field: 'mobiliario',
                 msg: 'El campo mobiliario debe contener al menos 4 caracteres y maximo 100'
             }
             )
         }
 
 
         // // Precio
 
 
         ValidationsInstance.checkNumberMayorCero(data.precio) ||
             (error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '',
                 field: 'precio',
                 msg: 'El campo precio tiene que ser superior a 0'
             })
             )
 
         // // fecha de compra 
 
         
         ValidationsInstance.checkFormatDateTimeSQL(data.fecha_compra) ||
          (error.data?.push({
           type: Constants.error_type_custom as ErrorFieldType,
            code: '',
          field: 'fecha_compra',
           msg: ' el campo fecha_compra es invalida'
          })
          )
         
 
 
 
         // // Meses de antiguedad 
 
 
          ValidationsInstance.checkNumberRange(data.meses_antiguedad, 0, 300) ||
             (error.data?.push({
             type: Constants.error_type_custom as ErrorFieldType,
            code: '',
             field: 'meses_anitguedad',
            msg: 'El campo meses_antiguedad ha de tener un valor superior a 0 y maximo 300'
           })
           )
         
 
 
         // // Depreciacion
 
          ValidationsInstance.checkNumberMayorCero(data.depreciacion) ||
           (error.data?.push({
              type: Constants.error_type_custom as ErrorFieldType,
               code: '',
            field: 'depreciacion',
           msg: 'El campo depreciacion tiene que ser superior a 0'
             })
            )
          
 
 
         // // Valor de depreciacion
 
         ValidationsInstance.checkNumberMayorCero(data.valor_depreciacion) ||
              (error.data?.push({
             type: Constants.error_type_custom as ErrorFieldType,
              code: '',
              field: 'valor_depreciacion',
            msg: 'El campo valor_depreciacion tiene que ser superior a 0'
             })
           )
         
         
         // // Propietario
 
 
         if (!(ValidationsInstance.checkMinLetters(data.propietario, 3) &&
          ValidationsInstance.checkMaxLetters(data.propietario, 100))) {
          error.data?.push({
          type: Constants.error_type_custom as ErrorFieldType,
          code: '',
         field: 'propietario',
          msg: 'El campo propietario debe contener al menos 4 caracteres y maximo 100'
              }
              )
              }
         
        // STOCK //
        ValidationsInstance.checkNumberMayorOIgualACero(data.stock || 0) ||
        (error.data?.push({
       type: Constants.error_type_custom as ErrorFieldType,
        code: '',
        field: 'stock',
      msg: 'El campo stock tiene que ser superior o igual a 0'
       })
     )

         // // Total 
 
 
        ValidationsInstance.checkNumberMayorCero(data.total) ||
         (error.data?.push({
         type: Constants.error_type_custom as ErrorFieldType,
         code: '',
         field: 'total',
         msg: 'El campo total tiene que ser superior a 0'
         })
         )

         return 0
    }

    async insert(data: IArticulo): Promise<IArticulo | IErrorResponse> {
        
        let error: IErrorResponse = { error: "Error, integridad de datos", data: [] }

        await this.validate(data, error)

    return (error.data?.length === 0 ) ? this.dataAcces.insert(data) :
                                     new Promise <IErrorResponse>((resolve, reject) => {resolve(error)})
    }



    async update(id : BigInt, data : IArticulo){

        let error : IErrorResponse = {error : "Error, integridad de datos", data:[]}

        await this.validate(data, error)

        return (error.data?.length === 0 ) ? this.dataAcces.update(id,data) :
                                             new Promise <IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    



    async delete(id: BigInt): Promise<IArticulo | IErrorResponse> {

        return this.dataAcces.delete(id)

    }
}

export default ArticuloBusiness