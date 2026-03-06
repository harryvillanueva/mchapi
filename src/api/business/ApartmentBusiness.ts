import { IDataAccess } from "../helpers/IDataAccess"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import ValidationsInstance from "../helpers/Validations"
import Constants from "../helpers/Constants"
import { CountryType, ErrorFieldType, StatusDataType, TypeDeviceType } from "../types/GlobalTypes"
import { IApartment } from "../models/IApartment"
import ApartmentDataAccess from "../data/ApartmentDataAccess"
import UserRoleBusiness from "./UserRoleBusiness"
import { IUserRol } from "../models/IUserRol"
import { IApartmentDetails } from "../modelsextra/IApartmentDetails"

class ApartmentBusiness implements IDataAccess<IApartment> {
    public dataAcces: ApartmentDataAccess

    constructor(public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any) {
        this.dataAcces = new ApartmentDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
    }

    get(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.get()
    }

    getAllPublic(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getAllPublic()
    }

    getByDeviceCodePublic(code: string): Promise<IApartment | IErrorResponse> {
        return this.dataAcces.getByDeviceCodePublic(code)
    }

    getById(id: BigInt): Promise<IApartment | IErrorResponse> {
        return this.dataAcces.getById(id)
    }

    async insert(data: IApartment): Promise<IApartment | IErrorResponse> {
        // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }

        // pais (*)
        if (!(ValidationsInstance.checkCountry(data.pais as CountryType))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'pais',
                msg: 'El campo pais es invalido!!'
            }
            )
        }

        // ciudad (*)
        if (!(ValidationsInstance.checkCity(data.ciudad))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'ciudad',
                msg: 'El campo ciudad is invalido!!'
            }
            )
        }

        // Código postal (*)
        if (!(ValidationsInstance.checkMinLetters(data.codigo_postal, 5) &&
            ValidationsInstance.checkMaxLetters(data.codigo_postal, 10))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'codigo_postal',
                msg: 'El campo codigo_postal debe contener al menos 5 caracteres y máximo 10!'
            }
            )
        }

        // direccion (*)
        if (!(ValidationsInstance.checkMinLetters(data.direccion, 10) &&
            ValidationsInstance.checkMaxLetters(data.direccion, 100))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'direccion',
                msg: 'El campo direccion debe contener al menos 10 caracteres y máximo 100!'
            }
            )
        }

        // nro_edificio
        if (data.nro_edificio && data.nro_edificio!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.nro_edificio, 1) &&
                ValidationsInstance.checkMaxLetters(data.nro_edificio, 5))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'nro_edificio',
                    msg: 'El campo nro_edificio debe contener al menos 1 caracter y máximo 5!'
                }
                )
            }
        }

        // nro_piso
        if (data.nro_piso && data.nro_piso!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.nro_piso, 1))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'nro_piso',
                    msg: 'El campo nro_piso debe contener al menos 1 caracter y máximo 5!'
                }
                )
            }
        }

        // id_dispositivo_ref (*)
        if (!(ValidationsInstance.checkMinLetters(data.id_dispositivo_ref, 3) &&
            ValidationsInstance.checkMaxLetters(data.id_dispositivo_ref, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'id_dispositivo_ref',
                msg: 'El campo id_dispositivo_ref debe contener al menos 3 caracteres y máximo 50!'
            }
            )
        }

        // etiqueta (*)
        if (!(ValidationsInstance.checkMinLetters(data.etiqueta, 3) &&
            ValidationsInstance.checkMaxLetters(data.etiqueta, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'etiqueta',
                msg: 'El campo etiqueta debe contener al menos 3 caracteres y máximo 50!'
            }
            )
        }

        // ubicacion_mapa
        if (data.ubicacion_mapa && data.ubicacion_mapa!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.ubicacion_mapa, 5) &&
                ValidationsInstance.checkMaxLetters(data.ubicacion_mapa, 500))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'ubicacion_mapa',
                    msg: 'El campo nro_piso debe contener al menos 5 caracteres y máximo 500!'
                }
                )
            }
        }
        // CHECK URL link_source_mantenimiento
        if (data.link_source_mantenimiento?.trim()) {

            ValidationsInstance.checkUrl(data.link_source_mantenimiento || '') || error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'observaciones',
                label : 'Mantenimiento',
                msg: 'El campo observaciones debe contener al menos 5 caracteres y máximo 500!'
            }
            )
        }
        // observaciones
        if (data.observaciones && data.observaciones!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.observaciones, 5) &&
                ValidationsInstance.checkMaxLetters(data.observaciones, 500))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'observaciones',
                    msg: 'El campo observaciones debe contener al menos 5 caracteres y máximo 500!'
                }
                )
            }
        }

        // Propietario
        if (data.propietarios && data.propietarios!.length !== 0) {
            let _iUserRole: UserRoleBusiness = new UserRoleBusiness(this.idUserLogin, 1, false)
            let lUsers = await _iUserRole.getUserRoleByRole(Constants.code_rol_propietario)
            if ((lUsers as IErrorResponse).error || (lUsers as Array<IUserRol>).length === 0) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'propietarios',
                    msg: 'No se puede verificar el rol de propietario!'
                })
            }

            let idUsers = (lUsers as Array<IUserRol>).map(el => el.idusuario)
            let propietarios = data.propietarios!.map(el => el.id)

            let _errPropietario = false
            for (let i = 0; i < propietarios.length; i++) {
                if (idUsers.indexOf(propietarios[i]) === -1) {
                    _errPropietario = !_errPropietario
                    break
                }
            }

            if (_errPropietario) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'propietarios',
                    msg: 'Usuario(s) sin rol de propietario!!'
                })
            }
        }

        return (error.data?.length === 0) ? this.dataAcces.insert(data) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    async update(id: BigInt, data: IApartment): Promise<IApartment | IErrorResponse> {
        // Validaciones de usuario y de campos
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }

        // pais (*)
        if (!(ValidationsInstance.checkCountry(data.pais as CountryType))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'pais',
                msg: 'El campo pais es invalido!!'
            }
            )
        }

        // ciudad (*)
        if (!(ValidationsInstance.checkCity(data.ciudad))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'ciudad',
                msg: 'El campo ciudad is invalido!!'
            }
            )
        }

        // Código postal (*)
        if (!(ValidationsInstance.checkMinLetters(data.codigo_postal, 5) &&
            ValidationsInstance.checkMaxLetters(data.codigo_postal, 10))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'codigo_postal',
                msg: 'El campo codigo_postal debe contener al menos 5 caracteres y máximo 10!'
            }
            )
        }

        // direccion (*)
        if (!(ValidationsInstance.checkMinLetters(data.direccion, 10) &&
            ValidationsInstance.checkMaxLetters(data.direccion, 100))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'direccion',
                msg: 'El campo direccion debe contener al menos 10 caracteres y máximo 100!'
            }
            )
        }

        // nro_edificio
        if (data.nro_edificio && data.nro_edificio!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.nro_edificio, 1) &&
                ValidationsInstance.checkMaxLetters(data.nro_edificio, 5))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'nro_edificio',
                    msg: 'El campo nro_edificio debe contener al menos 1 caracter y máximo 5!'
                }
                )
            }
        }

        // nro_piso
        if (data.nro_piso && data.nro_piso!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.nro_piso, 1))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'nro_piso',
                    msg: 'El campo nro_piso debe contener al menos 1 caracter!'
                }
                )
            }
        }

        // id_dispositivo_ref (*)
        if (!(ValidationsInstance.checkMinLetters(data.id_dispositivo_ref, 3) &&
            ValidationsInstance.checkMaxLetters(data.id_dispositivo_ref, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'id_dispositivo_ref',
                msg: 'El campo id_dispositivo_ref debe contener al menos 3 caracteres y máximo 50!'
            }
            )
        }

        // etiqueta (*)
        if (!(ValidationsInstance.checkMinLetters(data.etiqueta, 3) &&
            ValidationsInstance.checkMaxLetters(data.etiqueta, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'etiqueta',
                msg: 'El campo etiqueta debe contener al menos 3 caracteres y máximo 50!'
            }
            )
        }

        // ubicacion_mapa
        if (data.ubicacion_mapa && data.ubicacion_mapa!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.ubicacion_mapa, 5) &&
                ValidationsInstance.checkMaxLetters(data.ubicacion_mapa, 500))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'ubicacion_mapa',
                    msg: 'El campo nro_piso debe contener al menos 5 caracteres y máximo 500!'
                }
                )
            }
        }

        // CHECK URL link_source_mantenimiento
        if (data.link_source_mantenimiento?.trim()) {

            ValidationsInstance.checkUrl(data.link_source_mantenimiento || '') || error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'observaciones',
                msg: 'El campo observaciones debe contener al menos 5 caracteres y máximo 500!'
            }
            )
        }
        // observaciones
        if (data.observaciones && data.observaciones!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.observaciones, 5) &&
                ValidationsInstance.checkMaxLetters(data.observaciones, 500))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'observaciones',
                    msg: 'El campo observaciones debe contener al menos 5 caracteres y máximo 500!'
                }
                )
            }
        }

        // Propietario
        if (data.propietarios && data.propietarios!.length !== 0) {
            let _iUserRole: UserRoleBusiness = new UserRoleBusiness(this.idUserLogin, 1, false)
            let lUsers = await _iUserRole.getUserRoleByRole(Constants.code_rol_propietario)
            if ((lUsers as IErrorResponse).error || (lUsers as Array<IUserRol>).length === 0) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'propietarios',
                    msg: 'No se puede verificar el rol de propietario!'
                })
            }

            let idUsers = (lUsers as Array<IUserRol>).map(el => el.idusuario)
            let propietarios = data.propietarios!.map(el => el.id)

            let _errPropietario = false
            for (let i = 0; i < propietarios.length; i++) {
                if (idUsers.indexOf(propietarios[i]) === -1) {
                    _errPropietario = !_errPropietario
                    break
                }
            }

            if (_errPropietario) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'propietarios',
                    msg: 'Usuario(s) sin rol de propietario!!'
                })
            }
        }

        return (error.data?.length === 0) ? this.dataAcces.update(id, data) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    delete(id: BigInt): Promise<IApartment | IErrorResponse> {
        // Validar que rol de rrhh, admin y superadmin, puede eliminar usuarios
        return this.dataAcces.delete(id)
    }

    getAllByUser(idUser: BigInt): Promise<Array<IApartment> | IErrorResponse> {
        // Validar que rol de rrhh, admin y superadmin, puede eliminar usuarios
        return this.dataAcces.getAllByUser(idUser)
    }

    getDetailsById(id: BigInt): Promise<IApartmentDetails | IErrorResponse> {
        return this.dataAcces.getDetailsById(id)
    }

    getDetailsByIdAndIdLock(id: BigInt, idLock: BigInt): Promise<IApartmentDetails | IErrorResponse> {
        return this.dataAcces.getDetailsByIdAndIdLock(id, idLock)
    }

    getByIdAndUser(id: BigInt, idUser: BigInt): Promise<IApartment | IErrorResponse> {
        return this.dataAcces.getByIdAndUser(id, idUser)
    }

    getByIdReferencial(): Promise<IApartment | IErrorResponse> {
        return this.dataAcces.getByIdReferencial()
    }

    getByUserWP(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getByUserWP()
    }

    getByGestionPiso(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getByGestionPiso()
    }

    async getAllAppMovil(): Promise<Array<IApartment> | IErrorResponse> {
        // De acuerdo al rol retorno un listado de pisos o un solo piso
        return this.dataAcces.getAllAppMovil()
    }

    async getAllWithDetailsLocksAppMovil(): Promise<Array<IApartment> | IErrorResponse> {
        // De acuerdo al rol retorno un listado de pisos o un solo piso
        return this.dataAcces.getAllWithDetailsLocksAppMovil()
    }


    private async validate(data: IApartment, error: IErrorResponse): Promise<number> {
        // pais (*)
        if (!(ValidationsInstance.checkCountry(data.pais as CountryType))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'pais',
                label: 'País',
                msg: 'El campo pais es invalido!!'
            }
            )
        }

        // ciudad (*)
        if (!(ValidationsInstance.checkCity(data.ciudad))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'ciudad',
                label: 'Ciudad',
                msg: 'El campo ciudad is invalido!!'
            }
            )
        }

        // Código postal (*)
        if (!(ValidationsInstance.checkMinLetters(data.codigo_postal, 5) &&
            ValidationsInstance.checkMaxLetters(data.codigo_postal, 10))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'codigo_postal',
                label: 'Código postal',
                msg: 'El campo codigo_postal debe contener al menos 5 caracteres y máximo 10!'
            }
            )
        }

        // Estado
        ValidationsInstance.checkStatus((parseInt(data.estado!.toString())) as StatusDataType) ||
            (error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'estado',
                label: 'Estado',
                msg: 'El campo estado es invalido!'
            }
            )
            )

        // direccion (*)
        if (!(ValidationsInstance.checkMinLetters(data.direccion, 5) &&
            ValidationsInstance.checkMaxLetters(data.direccion, 150))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'direccion',
                label: 'Dirección',
                msg: 'El campo direccion debe contener al menos 10 caracteres y máximo 100!'
            }
            )
        }

        // nro_edificio
        if (data.nro_edificio && data.nro_edificio!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.nro_edificio, 1) &&
                ValidationsInstance.checkMaxLetters(data.nro_edificio, 5))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'nro_edificio',
                    label: 'Nro edificio',
                    msg: 'El campo nro_edificio debe contener al menos 1 caracter y máximo 5!'
                }
                )
            }
        }

        // nro_piso
        if (data.nro_piso && data.nro_piso!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.nro_piso, 1))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'nro_piso',
                    label: 'Nro piso',
                    msg: 'El campo nro_piso debe contener al menos 1 caracter!'
                }
                )
            }
        }

        // id_dispositivo_ref (*)
        if (!(ValidationsInstance.checkMinLetters(data.id_dispositivo_ref, 3) &&
            ValidationsInstance.checkMaxLetters(data.id_dispositivo_ref, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'id_dispositivo_ref',
                label: 'Código',
                msg: 'El campo id_dispositivo_ref debe contener al menos 3 caracteres y máximo 50!'
            }
            )
        }

        // etiqueta (*)
        if (!(ValidationsInstance.checkMinLetters(data.etiqueta, 3) &&
            ValidationsInstance.checkMaxLetters(data.etiqueta, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'etiqueta',
                label: 'Nombre del piso',
                msg: 'El campo etiqueta debe contener al menos 3 caracteres y máximo 50!'
            }
            )
        }

        // ubicacion_mapa
        if (data.ubicacion_mapa && data.ubicacion_mapa!.trim().length !== 0) {
            if (!(ValidationsInstance.checkMinLetters(data.ubicacion_mapa, 5) &&
                ValidationsInstance.checkMaxLetters(data.ubicacion_mapa, 500))) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'ubicacion_mapa',
                    label: 'Ubicación mapa',
                    msg: 'El campo nro_piso debe contener al menos 5 caracteres y máximo 500!'
                }
                )
            }
        }

        // observaciones
        if (data.observaciones && data.observaciones!.trim().length !== 0) {
            if (!ValidationsInstance.checkMaxLetters(data.observaciones, 500)) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'observaciones',
                    label: 'Observaciones',
                    msg: 'El campo observaciones debe contener al menos 5 caracteres y máximo 500!'
                }
                )
            }
        }

        //plano
        if (data.plano?.trim()) {

            ValidationsInstance.checkUrl(data.plano || '') || error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'plano',
                label : 'Plano',
                msg: 'El campo plano debe contener al menos 5 caracteres y máximo 500!'
            }
            )
        }

        if (data.link_source_mantenimiento?.trim()) {

            ValidationsInstance.checkUrl(data.link_source_mantenimiento || '') || error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'observaciones',
                label : 'Mantenimiento',
                msg: 'El campo observaciones debe contener al menos 5 caracteres y máximo 500!'
            }
            )
        }

        // Propietario [Deshabilitado]
        // DAs no podra asignar propietario al PISO [26/feb/2024]
        // if (data.propietarios && data.propietarios!.length !== 0) {
        //     let _iUserRole: UserRoleBusiness = new UserRoleBusiness(this.idUserLogin, 1, false)
        //     let lUsers = await _iUserRole.getUserRoleByRole(Constants.code_rol_propietario)
        //     if ((lUsers as IErrorResponse).error || (lUsers as Array<IUserRol>).length === 0) {
        //         error.data?.push({
        //             type: Constants.error_type_custom as ErrorFieldType,
        //             code: '',
        //             field: 'propietarios',
        //             label: 'Propietario',
        //             msg: 'No se puede verificar el rol de propietario!'
        //         })
        //     }

        //     let idUsers = (lUsers as Array<IUserRol>).map(el => el.idusuario)
        //     let propietarios = data.propietarios!.map(el => el.id)

        //     let _errPropietario = false
        //     for (let i = 0; i < propietarios.length; i++) {
        //         if (idUsers.indexOf(propietarios[i]) === -1) {
        //             _errPropietario = !_errPropietario
        //             break
        //         }
        //     }

        //     if (_errPropietario) {
        //         error.data?.push({
        //             type: Constants.error_type_custom as ErrorFieldType,
        //             code: '',
        //             field: 'propietarios',
        //             label: 'Propietario',
        //             msg: 'Usuario(s) sin rol de propietario!!'
        //         })
        //     }
        // }

        return 0
    }


    async getAllDA(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getAllDA()
    }

    async insertDA(data: IApartment): Promise<IApartment | IErrorResponse> {

        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        await this.validate(data, error)

        return (error.data?.length === 0) ? this.dataAcces.insertDA(data) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    async insertDA_info(data : IApartment) : Promise <IApartment | IErrorResponse>{
        let error : IErrorResponse = {error : 'Error, integridad de datos' , data : []}
        await this.validate(data , error)
        return (error.data?.length === 0) ? this.dataAcces.insertDA_info(data) : 
                new Promise<IErrorResponse>((resolve, reject) =>{resolve(error)})
    }
    async updateDA(id: BigInt, data: IApartment): Promise<IApartment | IErrorResponse> {
        // return this.dataAcces.updateDA(id, data)
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        await this.validate(data, error)

        return (error.data?.length === 0) ? this.dataAcces.updateDA(id, data) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    async updateDA_info(id: BigInt, data: IApartment): Promise<IApartment | IErrorResponse> {
        // return this.dataAcces.updateDA(id, data)
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        await this.validate(data, error)

        return (error.data?.length === 0) ? this.dataAcces.updateDA_info(id, data) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    getByIdDA(id: BigInt): Promise<IApartment | IErrorResponse> {
        return this.dataAcces.getByIdDA(id)
    }

    getAllDAPagination(): Promise <Array<IApartment> |IErrorResponse>{
        return this.dataAcces.getAllDAPagination()
    }
    /**
     * Extrae información de los pisos, para los distintos roles
     * @returns 
     */
    async getAllShare(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getAllShare()
    }

    async getAllSharePagination(): Promise <Array<IApartment>| IErrorResponse>{
        return this.dataAcces.getAllSharePagination()
    }
    async getAllWithPaginationColaborador(): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getAllWithPaginationColaborador()
    }

    /**
     * Retorna el detalle del reporte
     * @param idReport 
     * @returns 
     */
    async getPisosDeviceStatusReport(idReport: BigInt): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getPisosDeviceStatusReport(idReport)
    }

    /**
     * Retorna el detalle del reporte para la respectiva edición
     * @param idReport 
     * @param lTypeDeviceCodes 
     * @returns 
     */
    async getPisosDeviceStatusReportEdit(idReport: BigInt, lTypeDeviceCodes?: Array<TypeDeviceType>): Promise<Array<IApartment> | IErrorResponse> {
        return this.dataAcces.getPisosDeviceStatusReportEdit(idReport, lTypeDeviceCodes)
    }

    async AsociarDispositivos(idpiso: BigInt, ldispositivos: Array<number>): Promise<IApartment | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error,integridad de datos', data: [] }

        //Validacion de ldispositivos: [Permite un listado vacio]
        for ( let i = 0; i < ldispositivos.length; i++ ) {
            if (isNaN(ldispositivos[i])) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'ldispositivos',
                    msg: 'No es un Numero !!'
                })
                break;
            } else if (ldispositivos[i] === 0) {
                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'ldispositivos',
                    msg: 'Datos erroneos ,reviselo !!'
                })
                break;
            }
        }
        
        return (error.data?.length === 0) ? this.dataAcces.AsociarDispositivos(idpiso, ldispositivos) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }

    async getDevicesByPisoId(idpiso: BigInt): Promise<IApartment | IErrorResponse> {
        return this.dataAcces.getDevicesByPisoId(idpiso)
    }
}

export default ApartmentBusiness