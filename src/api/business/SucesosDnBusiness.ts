import { IDataAccess } from "../helpers/IDataAccess"
import { IUser } from "../models/IUser"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ValidationsInstance from "../helpers/Validations"
import Constants from "../helpers/Constants"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import UtilInstance from "../helpers/Util"
import { ISucesosDn } from "../models/ISucesosDn"
import SucesosDnDataAccess from "../data/SucesosDnDataAccess"

class SucesosDnBusiness implements IDataAccess<ISucesosDn> {
    public dataAccess: SucesosDnDataAccess
    
    constructor(      public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean, 
                    public infoExtra?: any) {
        this.dataAccess = new SucesosDnDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<ISucesosDn> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getById(id: BigInt): Promise<ISucesosDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    private validate(data: ISucesosDn, error: IErrorResponse): void {
        // descripcion
        !ValidationsInstance.isEmpty( data.descripcion ) || 
        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                code: '', 
                                field:'descripcion', 
                                msg: 'El campo descripcion es invalido!' } 
                          ) 
        )

        // rol
        if ( ValidationsInstance.isEmpty( data.idrol ) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'idrol', 
                msg: 'El campo idrol es invalido!' } 
            )
        } else if ( !(['colaborador', 'propietario'].includes(data.idrol)) ) {
            error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                code: '', 
                field:'idrol', 
                msg: 'El campo idrol es invalido, rol no permitido!' } 
            )
        }

        // idusu_suceso
        ValidationsInstance.checkNumberMayorCero(parseInt(data.idusu_suceso.toString())) || 
        ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
            code: '', 
            field:'idusu_suceso', 
            msg: 'El campo idusu_suceso es invalido!' } 
            )  
        )
    }

    insert(data: ISucesosDn): Promise<ISucesosDn | IErrorResponse> {
        // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

        this.validate(data, error)

        return (error.data?.length === 0) ? this.dataAccess.insert(data) : 
                                            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    update(id: BigInt, data: ISucesosDn): Promise<ISucesosDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<ISucesosDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getByUserSuceso(idUser: BigInt): Promise<IErrorResponse | Array<ISucesosDn>> {
        return this.dataAccess.getByUserSuceso(idUser)
    }
}

export default SucesosDnBusiness