import { IDataAccess } from "../helpers/IDataAccess"
import { IUser } from "../models/IUser"
import UserDataAccess from "../data/UserDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ValidationsInstance from "../helpers/Validations"
import Constants from "../helpers/Constants"
import { CodeRoleType, ErrorFieldType, StatusDataType, jornadaType } from "../types/GlobalTypes"
import UtilInstance from "../helpers/Util"

class UserBusiness implements IDataAccess<IUser> {
      public dataAccess: UserDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAccess = new UserDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IUser> | IErrorResponse> {
            return this.dataAccess.get()
      }

      getRRHH(): Promise<Array<IUser> | IErrorResponse> {
            return this.dataAccess.getRRHH()
      }

      getById(id: BigInt): Promise<IUser | IErrorResponse> {
            return this.dataAccess.getById(id)
      }

      getByIdRRHH(id: BigInt): Promise<IUser | IErrorResponse> {
            return this.dataAccess.getByIdRRHH(id)
      }

      private validate(data: IUser, error: IErrorResponse): void {
            // username
            ValidationsInstance.checkMinLetters( data.username, 3 ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'username', 
                                    msg: 'El campo email es invalido!' } 
                              ) 
            )

            // email
            ValidationsInstance.checkEmail( data.email ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'email', 
                                    msg: 'El campo email es invalido!' } 
                              ) 
            )

            // nombre_completo
            if (  !(ValidationsInstance.checkMinLetters( data.nombre_completo || '', 3 ) && 
                  ValidationsInstance.checkMaxLetters( data.nombre_completo || '', 150 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'nombre_completo', 
                              msg: 'El campo Nombre completo debe contener al menos 3 caracteres y máximo 150!' } 
                  )
            }

            // // nombre
            // if (  !(ValidationsInstance.checkMinLetters( data.nombre, 3 ) && 
            //       ValidationsInstance.checkMaxLetters( data.nombre, 150 )) ) {
            //       error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
            //                   code: '', 
            //                   field:'nombre', 
            //                   msg: 'El campo nombre debe contener al menos 3 caracteres y máximo 150!' } 
            //       )
            // }

            // // apellido
            // if (  !(ValidationsInstance.checkMinLetters( data.apellido, 3 ) && 
            //       ValidationsInstance.checkMaxLetters( data.apellido, 150 )) ) {
            //       error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
            //                   code: '', 
            //                   field:'apellido', 
            //                   msg: 'El campo apellido debe contener al menos 3 caracteres y máximo 150!' } 
            //       )
            // }
      }

      insert(data: IUser): Promise<IUser | IErrorResponse> {
            // Validaciones de usuario y de campos
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            this.validate(data, error)

            // password
            if (  !(ValidationsInstance.checkMinLetters( data.password?data.password:'', 4 ) && 
                  ValidationsInstance.checkMaxLetters( data.password?data.password:'', 15 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'password', 
                              msg: 'El campo password debe contener al menos 4 caracteres y máximo 15!' } 
                  )
            }

            data.password = UtilInstance.encryptDataHash256(data.password!)

            return (error.data?.length === 0) ? this.dataAccess.insert(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertDN(data: IUser): Promise<IUser | IErrorResponse> {
            // Validaciones de usuario y de campos
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            // data.idrol = Constants.code_rol_propietario as CodeRoleType // DN solo puede crear usuarios propietarios


            this.validate(data, error)

            if ( ![Constants.code_rol_colaborador, Constants.code_rol_propietario].includes(data.idrol || '') ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'role', 
                        msg: 'El campo role es incorrecto!' } 
                  )
            }

            // password
            if (  !(ValidationsInstance.checkMinLetters( data.password?data.password:'', 4 ) && 
                  ValidationsInstance.checkMaxLetters( data.password?data.password:'', 15 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'password', 
                              msg: 'El campo password debe contener al menos 4 caracteres y máximo 15!' } 
                  )
            }

            data.password = UtilInstance.encryptDataHash256(data.password!)

            return (error.data?.length === 0) ? this.dataAccess.insert(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      insertRRHH(data: IUser): Promise<IUser | IErrorResponse> {
            // Validaciones de usuario y de campos
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            // rol (no puede agregar propietarios)
            if(data.idrol == "propietario") {
                  error.data?.push({
                  type: Constants.error_type_custom as ErrorFieldType,
                  code: '', 
                  field:'rol', 
                  msg: 'No puede agregar un propietario desde RRHH'
            })}

            // username
            ValidationsInstance.checkMinLetters( data.username, 3 ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'username', 
                                    msg: 'El campo email es invalido!' } 
                              ) 
            )

            // email
            ValidationsInstance.checkEmail( data.email ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'email', 
                                    msg: 'El campo email es invalido!' } 
                              ) 
            )

            // nombre_completo
            if (  !(ValidationsInstance.checkMinLetters( data.nombre_completo || '', 2 ) && 
                  ValidationsInstance.checkMaxLetters( data.nombre_completo || '', 150 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'nombre_completo', 
                              msg: 'El campo Nombre completo debe contener al menos 3 caracteres y máximo 150!' } 
                  )
            }

            // apellido
            // if (  !(ValidationsInstance.checkMinLetters( data.apellido, 3 ) && 
            //       ValidationsInstance.checkMaxLetters( data.apellido, 150 )) ) {
            //       error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
            //                   code: '', 
            //                   field:'apellido', 
            //                   msg: 'El campo apellido debe contener al menos 3 caracteres y máximo 150!' } 
            //       )
            // }

            // password
            if (  !(ValidationsInstance.checkMinLetters( data.password?data.password:'', 4 ) && 
                  ValidationsInstance.checkMaxLetters( data.password?data.password:'', 15 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'password', 
                              msg: 'El campo password debe contener al menos 4 caracteres y máximo 15!' } 
                  )
            }
            data.password = UtilInstance.encryptDataHash256(data.password!)

            return (error.data?.length === 0) ? this.dataAccess.insert(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }


      // NO TOCAR, ESTA POR REVISAR SI FUNCIONA O SE EDITA EN UN FUTURO!!!
      
      ////////////////////// METODOS RECURSOS HUMANOS////////////////////////
      

      getAllRRHH() : Promise <Array <IUser> | IErrorResponse>{
            return this.dataAccess.getAllRRHH()
      }
      getByIdRRHH_(id: BigInt): Promise<IUser | IErrorResponse> {
            return this.dataAccess.getByIdRRHH_(id)
      }

      getAllRRHHWithPagination(): Promise<Array<IUser> | IErrorResponse> {
            return this.dataAccess.getAllRRHHWithPagination()
      }

      insertRRHH_(data: IUser): Promise<IUser | IErrorResponse> {
            // Validaciones de usuario y de campos
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            // rol (no puede agregar propietarios)
            if(data.idrol == "propietario") {
                  error.data?.push({
                  type: Constants.error_type_custom as ErrorFieldType,
                  code: '', 
                  field:'rol', 
                  msg: 'No puede agregar un propietario desde RRHH'
            })}


            //rol (no puede agregar colaboradores)

            if(data.idrol == "colaborador") {
                  error.data?.push({
                  type: Constants.error_type_custom as ErrorFieldType,
                  code: '', 
                  field:'rol', 
                  msg: 'No puede agregar un colaborador desde RRHH'
            })}

            //rol (no puede agregar CEO)

            if(data.idrol == "ceo") {
                  error.data?.push({
                  type: Constants.error_type_custom as ErrorFieldType,
                  code: '', 
                  field:'rol', 
                  msg: 'No puede agregar un CEO desde RRHH'
            })}

            //rol (no puede agregar administradores)


               if(data.idrol == "admin") {
                  error.data?.push({
                  type: Constants.error_type_custom as ErrorFieldType,
                  code: '', 
                  field:'rol', 
                  msg: 'No puede agregar un administrador desde RRHH'
            })}

            // rol (no puede agregar trabajadores del departamento de limpieza)

            if(data.idrol == 'limpieza'){
                  error.data?.push({
                        type : Constants.error_type_custom as ErrorFieldType,
                        code : '',
                        field: 'rol',
                        msg : ' No se puede agregar a un trabajador de limpieza desde RRHH'
                  })
            }

            // rol (no puede agregar trabajadores del departamento de mantenimiento)
            if(data.idrol == 'mantenimiento'){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code : '',
                        field : 'rol',
                        msg : 'No se puede agregar a un trabajador de mantenimiento desde RRHH'
                  })
            }


            // rol (no puede agregar trabajadores con el rol de superadmin)
            if(data.idrol == 'superadmin'){
                  error.data?.push({
                        type: Constants.error_type_custom as ErrorFieldType,
                        code : '',
                        field : 'rol',
                        msg : 'No se puede agregar a un trabajador como superadmin desde RRHH'
                  })
            }

            // username
            ValidationsInstance.checkMinLetters( data.username, 3 ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'username', 
                                    msg: 'El campo email es invalido!' } 
                              ) 
            )

            // email
            ValidationsInstance.checkEmail( data.email ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'email', 
                                    msg: 'El campo email es invalido!' } 
                              ) 
            )
            
            // email personal
            ValidationsInstance.checkEmail( data.correo_personal || '') || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'correo_personal', 
                                    msg: 'El campo correo personal es invalido!' } 
                              ) 
            )
          
            // nombre_completo
            if (  !(ValidationsInstance.checkMinLetters( data.nombre_completo || '', 3 ) && 
                  ValidationsInstance.checkMaxLetters( data.nombre_completo || '', 150 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'nombre_completo', 
                              msg: 'El campo Nombre completo debe contener al menos 3 caracteres y máximo 150!' } 
                  )
            }

       
            
            // cumpleaños

            if ( !ValidationsInstance.checkFormatDateSQL(data.cumpleanyos || '') ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                      code: '', 
                      field:'cumpleaños',
                      label: 'cumpleanyos', 
                      msg: 'Fecha incorrecta. Formato [YYYY-MM-DD]!!' } 
                  )
                  }
         

            //alta ss


            if ( !ValidationsInstance.checkFormatDateSQL(data.alta_ss || '') ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                      code: '', 
                      field:'cumpleaños',
                      label: 'cumpleanyos', 
                      msg: 'Fecha incorrecta. Formato [YYYY-MM-DD]!!' } 
                  )
                  }

            // password
            if (  !(ValidationsInstance.checkMinLetters( data.password?data.password:'', 4 ) && 
                  ValidationsInstance.checkMaxLetters( data.password?data.password:'', 15 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'password', 
                              msg: 'El campo password debe contener al menos 4 caracteres y máximo 15!' } 
                  )
            }
            data.password = UtilInstance.encryptDataHash256(data.password!)

            //Tipo de jornada
            
            if(!ValidationsInstance.checkJornada(data.jornada)){
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                      code: '', 
                      field:'jornada',
                      label: 'Jornada', 
                      msg: 'Valor incorrecto, ha de ser Jornada Completa o Media Jornada' } 
          )
              }

            //Check Etapa

            if(!ValidationsInstance.checkEtapa(data.etapa)){
                  error.data?.push( { type : Constants.error_type_custom as ErrorFieldType,
                        code : '',
                        field:'etapa',
                        label: 'Etapa',
                        msg : 'Valor incorrecto, la etapa seleccionada no es valida'
                                    }
                                  )
            }

            //Check Horario

            if(!ValidationsInstance.checkHorario(data.horario)){
                  error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
                                    code : '',
                                    field: 'horario',
                                    label : 'Horario',
                                    msg : 'El horario ha de ser por las Mañanas, Tardes o Completo'
                              }
                              )
            }


            
           //Si la jornada es completa el horario ha de ser completo

           if(data.jornada == 'Jornada Completa' && data.horario != 'HC'){
            error.data?.push({type : Constants.error_type_custom as ErrorFieldType , 
                  code : '',
                  field : 'horario',
                  label : 'Horario',
                  msg : 'Si la jornada es Jornada completa, el horario ha de ser Horario Completo'})
           }


           //Si la jornada es media jornada el horario tiene que ser de mañanas o de tardes

           if(data.jornada == 'Media Jornada' && data.horario == 'HC'){
            error.data?.push({type : Constants.error_type_custom as ErrorFieldType,
                              code : '',
                              field : 'horario',
                              label : 'Horario',
                              msg : 'Si la jornada es Media Jornada, el horario ha de ser de Mañanas o de Tardes'})
           }
            

            return (error.data?.length === 0) ? this.dataAccess.insertRRHH(data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }



       
      updateRRHH(id: BigInt, data: IUser): Promise<IUser | IErrorResponse> {
           

           // Validaciones de usuario y de campos
           let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

           // rol (no puede agregar propietarios)
           if(data.idrol == "propietario") {
                 error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '', 
                 field:'rol', 
                 msg: 'No puede agregar un propietario desde RRHH'
           })}


           //rol (no puede agregar colaboradores)

           if(data.idrol == "colaborador") {
                 error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '', 
                 field:'rol', 
                 msg: 'No puede agregar un colaborador desde RRHH'
           })}

           //rol (no puede agregar CEO)

           if(data.idrol == "ceo") {
                 error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '', 
                 field:'rol', 
                 msg: 'No puede agregar un CEO desde RRHH'
           })}

           //rol (no puede agregar administradores)


              if(data.idrol == "admin") {
                 error.data?.push({
                 type: Constants.error_type_custom as ErrorFieldType,
                 code: '', 
                 field:'rol', 
                 msg: 'No puede agregar un administrador desde RRHH'
           })}

           // rol (no puede agregar trabajadores del departamento de limpieza)

           if(data.idrol == 'limpieza'){
                 error.data?.push({
                       type : Constants.error_type_custom as ErrorFieldType,
                       code : '',
                       field: 'rol',
                       msg : ' No se puede agregar a un trabajador de limpieza desde RRHH'
                 })
           }

           // rol (no puede agregar trabajadores del departamento de mantenimiento)
           if(data.idrol == 'mantenimiento'){
                 error.data?.push({
                       type: Constants.error_type_custom as ErrorFieldType,
                       code : '',
                       field : 'rol',
                       msg : 'No se puede agregar a un trabajador de mantenimiento desde RRHH'
                 })
           }


           // rol (no puede agregar trabajadores con el rol de superadmin)
           if(data.idrol == 'superadmin'){
                 error.data?.push({
                       type: Constants.error_type_custom as ErrorFieldType,
                       code : '',
                       field : 'rol',
                       msg : 'No se puede agregar a un trabajador como superadmin desde RRHH'
                 })
           }

           // username
           ValidationsInstance.checkMinLetters( data.username, 3 ) || 
           ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                   code: '', 
                                   field:'username', 
                                   msg: 'El campo email es invalido!' } 
                             ) 
           )

           // email
           ValidationsInstance.checkEmail( data.email ) || 
           ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                   code: '', 
                                   field:'email', 
                                   msg: 'El campo email es invalido!' } 
                             ) 
           )
           
           // email personal
           ValidationsInstance.checkEmail( data.correo_personal || '') || 
           ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                   code: '', 
                                   field:'correo_personal', 
                                   msg: 'El campo correo personal es invalido!' } 
                             ) 
           )
         
           // nombre_completo
           if (  !(ValidationsInstance.checkMinLetters( data.nombre_completo || '', 3 ) && 
                 ValidationsInstance.checkMaxLetters( data.nombre_completo || '', 150 )) ) {
                 error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                             code: '', 
                             field:'nombre_completo', 
                             msg: 'El campo Nombre completo debe contener al menos 3 caracteres y máximo 150!' } 
                 )
           }

      
           
           // cumpleaños

           if ( !ValidationsInstance.checkFormatDateSQL(data.cumpleanyos || '') ) {
                 error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                     code: '', 
                     field:'cumpleaños',
                     label: 'cumpleanyos', 
                     msg: 'Fecha incorrecta. Formato [YYYY-MM-DD]!!' } 
                 )
                 }
        

           //alta ss


           if ( !ValidationsInstance.checkFormatDateSQL(data.alta_ss || '') ) {
                 error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                     code: '', 
                     field:'cumpleaños',
                     label: 'cumpleanyos', 
                     msg: 'Fecha incorrecta. Formato [YYYY-MM-DD]!!' } 
                 )
                 }


           //Tipo de jornada
           
           if(!ValidationsInstance.checkJornada(data.jornada)){
                 error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                     code: '', 
                     field:'jornada',
                     label: 'Jornada', 
                     msg: 'Valor incorrecto, ha de ser Jornada Completa o Media Jornada' } 
         )
             }

             //Etapa

           if(!ValidationsInstance.checkEtapa(data.etapa)){
                 error.data?.push( { type : Constants.error_type_custom as ErrorFieldType,
                       code : '',
                       field:'etapa',
                       label: 'Etapa',
                       msg : 'Valor incorrecto, la etapa seleccionada no es valida'
                                   }
                                 )
           }

           //Si la jornada es completa el horario ha de ser completo

           if(data.jornada == 'Jornada Completa' && data.horario != 'HC'){
            error.data?.push({type : Constants.error_type_custom as ErrorFieldType , 
                  code : '',
                  field : 'horario',
                  label : 'Horario',
                  msg : 'Si la jornada es Jornada completa, el horario ha de ser Horario Completo'})
           }


           //Si la jornada es media jornada el horario tiene que ser de mañanas o de tardes

           if(data.jornada == 'Media Jornada' && data.horario == 'HC'){
            error.data?.push({type : Constants.error_type_custom as ErrorFieldType,
                              code : '',
                              field : 'horario',
                              label : 'Horario',
                              msg : 'Si la jornada es Media Jornada, el horario ha de ser de Mañanas o de Tardes'})
           }

           //Check horario

           if(!ValidationsInstance.checkHorario(data.horario)){
                 error.data?.push( {type : Constants.error_type_custom as ErrorFieldType,
                                   code : '',
                                   field: 'horario',
                                   label : 'Horario',
                                   msg : 'El horario ha de ser por las Mañanas, Tardes o Completo'
                             }
                             )
           }
            
            return (error.data?.length === 0) ? this.dataAccess.updateRRHH(id, data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

     


      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



      update(id: BigInt, data: IUser): Promise<IUser | IErrorResponse> {
            // Validaciones de usuario y de campos
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            // email
            ValidationsInstance.checkEmail( data.email ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'email', 
                                    msg: 'El campo email es invalido!' } 
                              )
            )

            // nombre_completo
            if (  !(ValidationsInstance.checkMinLetters( data.nombre_completo || '', 3 ) && 
                  ValidationsInstance.checkMaxLetters( data.nombre_completo || '', 150 )) ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                              code: '', 
                              field:'nombre_completo', 
                              msg: 'El campo Nombre completo debe contener al menos 3 caracteres y máximo 150!' } 
                  )
            }

            // // nombre
            // if (  !(ValidationsInstance.checkMinLetters( data.nombre, 3 ) && 
            //       ValidationsInstance.checkMaxLetters( data.nombre, 150 )) ) {
            //       error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
            //                   code: '', 
            //                   field:'nombre', 
            //                   msg: 'El campo nombre debe contener al menos 3 caracteres y máximo 150!' } 
            //       )
            // }

            // // apellido
            // if (  !(ValidationsInstance.checkMinLetters( data.apellido, 3 ) && 
            //       ValidationsInstance.checkMaxLetters( data.apellido, 150 )) ) {
            //       error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
            //                   code: '', 
            //                   field:'apellido', 
            //                   msg: 'El campo apellido debe contener al menos 3 caracteres y máximo 150!' } 
            //       )
            // }

            // Estado
            ValidationsInstance.checkStatus( (parseInt(data.estado!.toString())) as StatusDataType ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'estado', 
                                    msg: 'El campo estado es invalido!' } 
                              ) 
            )

            return (error.data?.length === 0) ? this.dataAccess.update(id, data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      updateDN(id: BigInt, data: IUser): Promise<IUser | IErrorResponse> {
            // Validaciones de usuario y de campos
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            // data.idrol = Constants.code_rol_propietario as CodeRoleType // DN solo puede crear usuarios propietarios

            this.validate(data, error)

            if ( ![Constants.code_rol_colaborador, Constants.code_rol_propietario].includes(data.idrol || '') ) {
                  error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'rol', 
                        msg: 'El campo rol es incorrecto!' }
                  )
            }

            // Validación adicional para DN
            ValidationsInstance.checkStatus( (parseInt(data.estado!.toString())) as StatusDataType ) || 
            ( error.data?.push( {   type: Constants.error_type_custom as ErrorFieldType,
                                    code: '', 
                                    field:'estado', 
                                    msg: 'El campo estado es invalido!' } 
                              ) 
            )

            return (error.data?.length === 0) ? this.dataAccess.update(id, data) : 
                                                new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      delete(id: BigInt): Promise<IUser | IErrorResponse> {
            return this.dataAccess.delete(id)
      }

      deleteRRHH(id: BigInt): Promise<IUser | IErrorResponse> {
            return this.dataAccess.deleteRRHH(id)
      }
      

      getUsersByRole(idrole: string): Promise<Array<IUser> | IErrorResponse> {
            return this.dataAccess.getUsersByRole(idrole)
      }

      /**
       * Retorna todos los usuarios [datos basicos] que tienen el rol de propietario
       * @returns 
       */
      getUsersDN(): Promise<Array<IUser> | IErrorResponse> {
            // return this.getUsersByRole(Constants.code_rol_propietario)
            return this.dataAccess.getUsersDN()
      }

      getResponsablesDN(): Promise<Array<IUser> | IErrorResponse> {
            return this.dataAccess.getResponsablesDN()
      }

  

      getWithPagination(): Promise<Array<IUser> | IErrorResponse> {
            return this.dataAccess.getWithPagination()
      }
}

export default UserBusiness