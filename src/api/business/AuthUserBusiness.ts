import AuthUserDataAccess from "../data/AuthUserDataAccess"
import Constants from "../helpers/Constants"
import UtilInstance from "../helpers/Util"
import ValidationsInstance from "../helpers/Validations"
import { IAuthUser } from "../modelsextra/IAuthUser"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { ErrorFieldType } from "../types/GlobalTypes"

class AuthUserBusiness {
      public dataAcces: AuthUserDataAccess
      
      constructor() {
            this.dataAcces = new AuthUserDataAccess()
      }

      authUser(email: string, password: string): Promise<IAuthUser | IErrorResponse> {
            // Validaciones
            password = UtilInstance.encryptDataHash256(password.trim())
            return this.dataAcces.authUser(email, password)
      }
      
      resetPassword(id: BigInt, password: string, idUserLogin: BigInt, filterStatus: number): Promise<IAuthUser | IErrorResponse> {
            return this.dataAcces.resetPassword(id, password, idUserLogin, filterStatus)
      }

      changePassword(id: BigInt, passwordCurrent: string, passwordNew: string, idUserLogin: BigInt): Promise<IAuthUser | IErrorResponse> {
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[]}

            // password current
            if (  !(ValidationsInstance.checkMinLetters( passwordCurrent, 4 ) && 
                  ValidationsInstance.checkMaxLetters( passwordCurrent, 15 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'password-current',
                              label: 'Contraseña actual', 
                              msg: 'El campo password actual, debe contener al menos 4 caracteres y máximo 15!' } 
                  )
            }

            // password new
            if (  !(ValidationsInstance.checkMinLetters( passwordNew, 4 ) && 
                  ValidationsInstance.checkMaxLetters( passwordNew, 15 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'password-new',
                              label: 'Contraseña nueva', 
                              msg: 'El campo password nuevo, debe contener al menos 4 caracteres y máximo 15!' } 
                  )
            }

            passwordCurrent = UtilInstance.encryptDataHash256(passwordCurrent)
            passwordNew = UtilInstance.encryptDataHash256(passwordNew)
            
            return (error.data?.length === 0) ? this.dataAcces.changePassword(id, passwordCurrent, passwordNew, idUserLogin) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })

      }
}

export default AuthUserBusiness