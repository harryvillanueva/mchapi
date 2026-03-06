

import { IDataAccess } from "../helpers/IDataAccess"
import { IKey } from "../models/IKey"
import KeyDataAccess from "../data/KeyDataAccess"
import { ILock } from "../models/ILock"
import { ErrorFieldType, LocationDataType, StatusDataType, TypeCardType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ValidationsInstance from "../helpers/Validations"
import Constants from "../helpers/Constants"

class KeyBusiness implements IDataAccess<IKey> {
      public dataAccess: KeyDataAccess
      
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAccess = new KeyDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IKey> | IErrorResponse> {
            return this.dataAccess.get()
      }

      getById(id: BigInt): Promise<IKey | IErrorResponse> {
            return this.dataAccess.getById(id)
      }

      insert(data: IKey): Promise<IKey | IErrorResponse> {
            // Validaciones de usuario y de campos
            return this.dataAccess.insert(data)
      }

      update(id: BigInt, data: IKey): Promise<IKey | IErrorResponse> {
            // Validaciones de usuario y de campos
            return this.dataAccess.update(id, data)
      }

      delete(id: BigInt): Promise<IKey | IErrorResponse> {
            return this.dataAccess.delete(id)   
      }

      getLockXKey(id: number): Promise<Array<ILock> | IErrorResponse> {
            return this.dataAccess.getLockXKey(id)
      }

      getAllWithPagination(): Promise<Array<IKey> | IErrorResponse> {
            return this.dataAccess.getAllWithPagination()
      }

     

      private async validate(data:IKey, error:IErrorResponse){
            let _ValidationUrlBusiness: KeyBusiness = new KeyBusiness(this.idUserLogin,1,false);
            

            if(ValidationsInstance.isEmpty(data.ubicacion)){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '',
                        field: 'ubicacion',
                        label: 'ubicacion',
                        msg: 'Porfavor seleccione una Ubicación',
                        })
            }else if (!ValidationsInstance.checkLocationTypes((data.ubicacion || '')as LocationDataType)){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: "",
                        field: "ubicacion",
                        label: "ubicacion",
                        msg: "La Ubicacion no esta correctamente ingresado  ",
                    })
            }

            if(ValidationsInstance.isEmpty(data.tipo_tarjeta)){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '',
                        field: 'tipo_tarjeta',
                        label: 'tipo_tarjeta',
                        msg: 'Porfavor seleccione un Tipo de Tarjerta',
                        })
            }else if(!ValidationsInstance.checkTypeCard((data.tipo_tarjeta||'')as TypeCardType)){
                  error.data?.push({
                      type: Constants.error_type_custom as ErrorFieldType,
                      code: "",
                      field: "tipo_tarjeta",
                      label: "Tipo de Tarjeta",
                      msg: "El Type no esta correctamente ingresado "
                  })
              }

            if(ValidationsInstance.isEmpty(data.idqr)){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: "",
                        field: "idqr",
                        label: "idqr",
                        msg: "Porfavor ingresa el  Id del QR",
                        })
            }else if(!ValidationsInstance.checkStartStr(data.idqr , "M")){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: "",
                        field: "idqr",
                        label: "idqr",
                        msg: "El Id Qr debe de Comenzar con la letra M"
                  }) 
            }else if(!ValidationsInstance.checkLengthStr(data.idqr, 13) ) {
                  error.data?.push({
                      type: Constants.error_type_custom as ErrorFieldType,
                      code: "",
                      field: "idqr",
                      label: "idqr",
                      msg: "El Id Qr permite números  13 caracteres"
                  }
                  )
            }else if(!ValidationsInstance.checkSymbol(data.idqr)){
                  error.data?.push({
                      type:Constants.error_type_custom as ErrorFieldType,
                      code:"",
                      field:"idqr",
                      label:"idqr",
                      msg: "El Campo de Id Qr no permite Simbolos pero si permite guiones bajos y guion"
                  })
              }


            
            if(ValidationsInstance.isEmpty(data.qr)){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '',
                        field: 'qr',
                        label: 'qr',
                        msg: 'Porfavor ingresa el QR',
                        })
            }else if(!ValidationsInstance.checkUrl(data.qr)){
                  error.data?.push({
                  type: Constants.error_type_custom as ErrorFieldType,
                  code: '',
                  field: 'qr',
                  label: 'qr',
                  msg: 'Ingresaste una QR inválida',
                  })
            }
      }
      async insertKey(data:IKey):Promise <IKey | IErrorResponse>{
            let error:IErrorResponse = {error:'Error al ingresar los datos, Verifiquelos ' , data :[]}
            await this.validate(data,error);
            return (error.data?.length === 0) ? this.dataAccess.insert(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }
      async updateKey(id:BigInt , data:IKey  ):Promise <IKey | IErrorResponse > {
            let error:IErrorResponse = {error:'Error al ingresar los datos, Verifiquelos ', data:[]}
            await this.validate(data,error);
            return (error.data?.length === 0 ) ? this.dataAccess.update(id,data) : new Promise<IErrorResponse>((resolve,reject) => { resolve(error)})
      }

      getAllAppMCHWithFilter(): Promise<Array<IKey> | IErrorResponse> {
            return this.dataAccess.getAllAppMCHWithFilter()
      }
}

export default KeyBusiness