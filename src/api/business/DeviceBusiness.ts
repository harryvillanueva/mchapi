import { resolve } from "path";
import DeviceDataAccess from "../data/DeviceDataAccess";
import Constants from "../helpers/Constants";
import { IDataAccess } from "../helpers/IDataAccess";
import DataDataAccess from '../data/DataDataAccess';
import { IModel } from "../helpers/IModel";
import UtilInstance from "../helpers/Util";
import ValidationsInstance from "../helpers/Validations";

import { IDevice } from "../models/IDevice";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import { ErrorFieldType, StatusDataType, TypeDeviceType } from "../types/GlobalTypes";
import { ifError, rejects } from "assert";
import { error } from 'console';
import { IData } from "../modelsextra/IData";
import { ITelefonillo } from "../models/ITelefonillo";
import { ILock } from "../models/ILock";
import { ICamara } from "../models/ICamara";
import { IMovil } from "../models/IMovil";
import { ISwitchOnOff } from "../models/ISwitchOnOff";
import { IRole } from "../models/IRole";
import { IRouter } from "../models/IRouter";
import { validateHeaderValue } from "http";

class DeviceBusiness implements IDataAccess<IDevice> {

    public dataAccess: DeviceDataAccess

    constructor(
        public idUserLogin: BigInt,
        public filterStatus: StatusDataType,
        public isTransactions: boolean,
        public infoExtra?: any) {
        this.dataAccess = new DeviceDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)

    }

    get(): Promise<IErrorResponse | IDevice[]> {
        return this.dataAccess.get()
    }

    //Para devolver solo las manijas 
    getLock(): Promise<IErrorResponse | IDevice[]> {
        return this.dataAccess.getLock()
    }

    getById(id: BigInt): Promise<IDevice | IErrorResponse> {
        return this.dataAccess.getById(id);
    }

    insert(data: IDevice): Promise<IDevice | IErrorResponse> {
        // throw new Error("Method not implemented.")
        return this.dataAccess.insert(data);
    }

    update(id: BigInt, data: IDevice): Promise<IDevice | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    delete(id: BigInt): Promise<IDevice | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    getDeviceByIdAndIdPiso(id: BigInt, idPiso: BigInt): Promise<IDevice | IErrorResponse> {
        return this.dataAccess.getDeviceByIdAndIdPiso(id, idPiso)
    }

    getSOnOffById(id: BigInt): Promise<IDevice | IErrorResponse> {
        return this.dataAccess.getSOnOffById(id)
    }

    /***************************** INSERTS para devices ***************************************/

    /**
    * Metodo para insertar devices
    * @param data 
    * @returns 
    */
    insertDevice(data: IDevice): Promise<IDevice | IErrorResponse> {
        console.log("lock insertado\n")
        return this.dataAccess.insertDevice(data);
    }

    /**********************************************************************************************************************/

    getAllWithPagination(): Promise<Array<IDevice> | IErrorResponse> {
        return this.dataAccess.getAllWithPagination()
    }

    getAllDevicesDisponibles(code: string): Promise<Array<IDevice> | IErrorResponse> {
        return this.dataAccess.getAllDevicesDisponibles(code)
    }


    async insertDeviceType(data: IDevice): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }

        return (error.data?.length === 0) ? this.dataAccess.insertDevice(data) :
            new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })

    }


    /**
     * Retorna listado de dispositivos, filtrados por la columna codigo
     * @param lCodes 
     * @returns 
     */

    getByListCodes(lCodes: Array<string>): Promise<Array<IDevice> | IErrorResponse> {
        return this.dataAccess.getByListCodes(lCodes)
    }

    private validateIp(data: ITelefonillo, error: IErrorResponse) {
        let _ValidationUrlBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);
        //  let ValidationUrl =  _ValidationUrlBusiness.insertTelefonillo()
        // console.log(data.ip_arduino,ValidationsInstance.checkIp(data.ip_arduino.toString()))

        if (!ValidationsInstance.checkIp(data.ip_arduino.toString())) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'ip_arduino',
                label: 'ip_arduino',
                msg: 'Ingresaste una URL inválida',
            })
        }
    }

    private async validateStatus(data: IDevice, error: IErrorResponse) {
        let _ValidationUrlBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);
        if (!ValidationsInstance.checkStatus((parseInt(data.estado!.toString())) as StatusDataType)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'estado',
                label: 'estado',
                msg: 'Ingresaste un estado Incorrecto',
            })
        }
    }

    private async ValidatePermaCod(data: ILock, error: IErrorResponse) {
        let _ValidationUrlBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);
        if (!ValidationsInstance.checkLengthStr(data.codigo_permanente!.toString(), 6)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'Codigo-Permanente',
                label: 'codigo_permanente',
                msg: 'Por favor Ingresa el codigo permanente de solo 6 digitos',
            })
        }
    }
    private MovilVersion_App(data: IMovil, error: IErrorResponse) {
        let _ValidationVersionBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);

        if (ValidationsInstance.isEmpty(data.version_app || '')) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'Version-App',
                label: 'version_app',
                msg: 'Por favor Ingresa la version de la app',
            })
        }
    }

    private MovilIp(data: IMovil, error: IErrorResponse) {
        let _ValidationIpBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);

        if (ValidationsInstance.isEmpty(data.ip || '')) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'IP',
                label: 'IP',
                msg: 'Por favor Ingresa la IP DEL MOVIL',
            })
        }
    }

    private MovilMacWifi(data: IMovil, error: IErrorResponse) {
        let _ValidationMacWifiBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);

        if (ValidationsInstance.isEmpty(data.macwifi || '')) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'MACWIFI',
                label: 'macwifi',
                msg: 'Por favor Ingresa EL MAC DEL MOVIL',
            })
        }
    }
    private MAC(data: ILock, error: IErrorResponse) {
        let _ValidationVersionBusiness: DeviceDataAccess = new DeviceDataAccess(this.idUserLogin, 1, false);

        if (ValidationsInstance.isEmpty(data.mac)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'MAC',
                label: 'MAC',
                msg: 'Por favor Ingresa la MAC',
            })
        }

        if (!ValidationsInstance.checkLengthStr(data.mac!.toString(), 17)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: '',
                field: 'MAC',
                label: 'MAC',
                msg: 'La longitud de la mac es muy largo , solo admite 17 caracteres',
            })
        }
    }


    private BateriaLock(data: ILock, error: IErrorResponse) {
        let _ValidationUrlBusiness: DeviceBusiness = new DeviceBusiness(this.idUserLogin, 1, false);
        let bateria = `${data.bateria}`

        if (!ValidationsInstance.checkNumberRange(Number(data.bateria), 0, 100) && ValidationsInstance.checkNumberMayorOIgualACero(Number(data.bateria))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: "",
                field: "Bateria",
                label: "Bateria",
                msg: "La Bateria permite numeros desde el 0 hasta el 100"
            }

            )
        }

        if (data.bateria !== undefined) {


            if (isNaN(parseInt(bateria))) {

                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'Bateria',
                    label: 'Bateria',
                    msg: 'El numero que ingresaste no es un numero'
                })
            } else if (parseInt(bateria) < 0) {

                error.data?.push({
                    type: Constants.error_type_custom as ErrorFieldType,
                    code: '',
                    field: 'Bateria',
                    label: 'Bateria',
                    msg: 'Solo Permito numeros positivos'
                })
            }


        }



    }


    private async validate(data: IDevice, error: IErrorResponse) {
        // Codigo
        if (!(ValidationsInstance.checkMinLetters(data.codigo, 2) &&
            ValidationsInstance.checkMaxLetters(data.codigo, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: "",
                field: "Código",
                label: "Código",
                msg: "El codigo debe contener al menos 2 caracteres y maximo 50!"
            }

            )
        }

        if (!ValidationsInstance.checkSymbol(data.codigo)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: "",
                field: "",
                label: "Codigo",
                msg: "El Campo de Codigo no permite Simbolos pero si permite guiones bajos y guion"
            })
        }

        // Nombre



        if (!(ValidationsInstance.checkMinLetters(data.nombre, 2)) &&
            (ValidationsInstance.checkMaxLetters(data.nombre, 50))) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: "",
                field: "nombre",
                label: "Nombre del dispositivo",
                msg: "El campo nombre debe de contener al menos 2 caracteres y maximo 50!"
            }
            )
        }

        if (!ValidationsInstance.checkSymbol(data.nombre)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: "",
                field: "",
                label: "Nombre",
                msg: "El Campo de Nombre no permite Simbolos"
            })
        }

        // ID del tipo de dispositivo
        // Esta para revisar 




        // if (!ValidationsInstance.checkNumberRange(Number(data.idtipodispositivo), 1, 15)) {
        //     error.data?.push({
        //         type: Constants.error_type_custom as ErrorFieldType,
        //         code: "",
        //         field: "idtipodispositivo",
        //         label: "Tipo de dispositivo",
        //         msg: "El dispositivo debe de pertenecer a un tipo de dispositivo"
        //     }

        //     )
        // }


        if (!ValidationsInstance.checkTypeDevice((data.type || '') as TypeDeviceType)) {
            error.data?.push({
                type: Constants.error_type_custom as ErrorFieldType,
                code: "",
                field: "type",
                label: "Tipo de dispositivo",
                msg: "El Type no esta correctamente ingresado "
            })
        }





        // Estado


        // ValidationsInstance.checkStatus((parseInt(data.estado!.toString())) as StatusDataType) ||
        //     (error.data?.push({
        //         type: Constants.error_type_custom as ErrorFieldType,
        //         code: '',
        //         field: 'estado',
        //         label: 'Estado',
        //         msg: 'El campo estado es invalido!'
        //     }
        //     )
        //     )

    }

    async updateDevice(id: BigInt, data: IDevice): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: "Error , integridad de datos", data: [] }
        await this.validate(data, error)
        return (error.data?.length === 0) ? this.dataAccess.updateDevice(id, data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }


    deleteDeviceById(id: BigInt): Promise<IDevice | IErrorResponse> {
        return this.dataAccess.deleteOneDeviceByID(id)
    }

    getByTypeDeviceCode(lTypeDeviceCodes: Array<TypeDeviceType>): Promise<Array<IDevice> | IErrorResponse> {
        return this.dataAccess.getByTypeDeviceCode(lTypeDeviceCodes)
    }
    async insertTelefonillo(data: ITelefonillo): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        this.validateIp(data, error)
        await this.validate(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertTelefonillo(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async insertLock(data: ILock): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        await this.validate(data, error)
        this.ValidatePermaCod(data, error)
        this.BateriaLock(data, error)
        this.MAC(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertLock(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async insertTTLock(data: ILock): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        await this.validate(data, error)
        this.ValidatePermaCod(data, error)
        this.BateriaLock(data, error)
        this.MAC(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertTTLock(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async insertCam(data: ICamara): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        await this.validate(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertCam(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async insertMovil(data: IMovil): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        await this.validate(data, error)
        this.MovilVersion_App(data, error)
        this.MovilIp(data, error)
        this.MovilMacWifi(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertMovil(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async insertSonoff(data: ISwitchOnOff): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        await this.validate(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertSonoff(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async insertRouter(data: IRouter): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error al ingresar los datos verifiquelos', data: [] }
        await this.validate(data, error)
        return (error.data?.length === 0) ? this.dataAccess.insertRouter(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async updateTelefonillo(id: BigInt, data: ITelefonillo): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        this.validateIp(data, error)
        await this.validate(data, error)
        this.validateStatus(data, error) //pendiente validar el idpiso para que no sea un character
        return (error.data?.length === 0) ? this.dataAccess.updateTelefonillo(id, data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
    }
    async updateLock(id: BigInt, data: ILock): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        await this.validate(data, error)
        this.ValidatePermaCod(data, error)
        this.BateriaLock(data, error)
        this.MAC(data, error)
        this.validateStatus(data, error)
        return (error.data?.length === 0) ? this.dataAccess.updateLock(id, data) : new Promise<IErrorResponse>((resolve, rejects) => { resolve(error) })
    }
    async updateCam(id: BigInt, data: ICamara): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        await this.validate(data, error)
        this.validateStatus(data, error)
        return (error.data?.length === 0) ? this.dataAccess.updateCam(id, data) : new Promise<IErrorResponse>((resolve, rejects) => { resolve(error) })
    }
    async updateMovil(id: BigInt, data: IMovil): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error , integridad de datos', data: [] }
        await this.validate(data, error)
        this.MovilVersion_App(data, error)
        this.MovilIp(data, error)
        this.MovilMacWifi(data, error)
        this.validateStatus(data, error)
        return (error.data?.length === 0) ? this.dataAccess.updateMovil(id, data) : new Promise<IErrorResponse>((resolve, rejects) => { resolve(error) })
    }
    async updateSonoff(id: BigInt, data: ISwitchOnOff): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error, integridad de datos', data: [] }
        await this.validate(data, error)
        this.validateStatus(data, error)
        return (error.data?.length === 0) ? this.dataAccess.updateSonoff(id, data) : new Promise<IErrorResponse>((resolve, rejects) => { resolve(error) })
    }
    async updateRouter(id: BigInt, data: IRouter): Promise<IDevice | IErrorResponse> {
        let error: IErrorResponse = { error: 'Error , integridad de datos', data: [] }
        await this.validate(data, error)
        this.validateStatus(data, error)
        return (error.data?.length === 0) ? this.dataAccess.updateRouter(id, data) : new Promise<IErrorResponse>((resolve, rejects) => { resolve(error) })
    }

}


export default DeviceBusiness