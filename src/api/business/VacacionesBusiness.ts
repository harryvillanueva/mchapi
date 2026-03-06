import { IDataAccess } from "../helpers/IDataAccess"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import VacacionesDataAccess from "../data/VacacionesDataAccess"
import { IUser } from "../models/IUser"
import Constants from "../helpers/Constants"
import ValidationsInstance from "../helpers/Validations"
import UtilInstance from "../helpers/Util"
import IVacaciones from "../models/IVacaciones"

class VacacionesBusiness implements IDataAccess<IVacaciones>{
    public dataAcces : VacacionesDataAccess

    constructor(public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean, 
        public infoExtra?: any){
        this.dataAcces = new VacacionesDataAccess(idUserLogin,filterStatus,isTransactions,infoExtra)
                }

    
                
    get(): Promise <Array <IVacaciones> | IErrorResponse>{
        return this.dataAcces.get()
    }




    getById(id: BigInt): Promise<IVacaciones| IErrorResponse> {
        return this.dataAcces.getById(id)
    }


    getByIdxUser(id: BigInt): Promise<IVacaciones| IErrorResponse> {
        return this.dataAcces.getByIdxUser(id)
    }


    getAllWithPagination() : Promise <Array <IVacaciones> | IErrorResponse>{
        return this.dataAcces.getWithPagination()
    }

    getSolicitudxUser(): Promise <Array <IVacaciones> | IErrorResponse>{
        return this.dataAcces.getSolicitudxUser()
    }

    private validate(data: IVacaciones, error: IErrorResponse) {

        
        if( !ValidationsInstance.checkFormatDateSQL(data.fecha_inicio || '') ){
            error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
            code : '',
            field: 'fecha_inicio',
            label: 'Fecha inicio',
            msg: 'Fecha incorrectas. Formato [YYYY-MM-DD]!!'

                             }
        )
        }
        

        if( !ValidationsInstance.checkFormatDateSQL(data.fecha_final || '') ){
            error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
            code : '',
            field: 'fecha_final',
            label : 'Fecha final',
            msg: 'Fecha incorrectas. Formato [YYYY-MM-DD]!!'
                            }
        )
        }

        if(data.fecha_inicio  > data.fecha_final ){
            error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
            code : '',
            field: 'fecha_final',
            label: 'Fecha final',
            msg: 'La fecha final no puede ser inferior a la fecha de inicio'
            } 
            )
        }

        if(new Date(data.fecha_inicio) < new Date(UtilInstance.getDateCurrent().fecha)){
            error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
            code : '',
            field: 'fecha_inicio',
            label: 'Fecha Inicio',
            msg : 'La fecha inicial ha de ser superior a la fecha actual'
         })
        }

       
    }

    async insert(data: IVacaciones): Promise<IVacaciones | IErrorResponse> {

        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        this.validate(data, error)
       
        return (error.data?.length === 0 ) ? this.dataAcces.insert(data) :
                                             new Promise <IErrorResponse>((resolve, reject) => {resolve(error)})
    }



    async update(id: BigInt, data: IVacaciones): Promise<IVacaciones | IErrorResponse> {

        let error : IErrorResponse = {error : "Error, integridad de datos " , data : []}

        this.validate(data , error)

        return (error.data?.length === 0 ) ? this.dataAcces.update(id,data) :
        new Promise <IErrorResponse>((resolve, reject) => { resolve(error) })   
    
    }

    async updateByUser(id : BigInt , data : IVacaciones): Promise <IVacaciones | IErrorResponse>{

        let error : IErrorResponse = {error : "Error, integridad de datos", data : []}

       this.validate(data , error)

        return (error.data?.length === 0) ? this.dataAcces.updateByUser(id,data) :
        new Promise <IErrorResponse>((resolve ,reject)=>{resolve(error) })
    }




    async delete(id: BigInt): Promise<IVacaciones | IErrorResponse> {
        return this.dataAcces.delete(id)
    }
}

export default VacacionesBusiness