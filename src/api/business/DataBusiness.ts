import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import { IData } from "../modelsextra/IData"
import DataDataAccess from "../data/DataDataAccess"

class DataBusiness implements IDataAccess<IData> {
      public dataAcces: DataDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new DataDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<IData> | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getById(id: BigInt): Promise<IData | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      insert(data: IData): Promise<IData | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      update(id: BigInt, data: IData): Promise<IData | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      delete(id: BigInt): Promise<IData | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getNroLeads(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getNroLeads()
      }

      moverLeads(): Promise<IData | IErrorResponse> {
            return this.dataAcces.moverLeads()
      }

      getTotalControlLimpieza(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalControlLimpieza()
      }

      getTotalAllLeads(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalAllLeads()
      }

      getTotaMyLeads(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotaMyLeads()
      }

      getTotalUsersRRHH(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalUsersRRHH()
      }

      getTotalApartmentsCOLABORADOR(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalApartmentsCOLABORADOR()
      }

      getTotalUserAdmin(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalUserAdmin()
      }

      getTotalPerfilesDN(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalPerfilesDN()
      }

      getTotalDevices(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalDevices()
      }

      getTotalDeviceReport(): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalDeviceReport()
      }
      
      getTotalArticulosInventario(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalArticulosInventario()
      }

      getTotalArticulos(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalArticulos()
      }

      // Seguir siempre la nomenclatura de tener los mismos nombres para no perder el hilo
      getTotalGrupoPrescriptores(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalGrupoPrescriptores()
      }

      getTotalGrupoPropietarios(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalGrupoPropietarios()
      }

      getTotalKeys(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalKeys()
      }

      getTotalFichajeOficina(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalFichajeOficina()
      }

      _getTotalUsersRRHH(): Promise <IData | IErrorResponse>{
            return this.dataAcces._getTotalUsersRRHH()
      }

      getTotalInfoComercial(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalInfoComercial()
      }

      getTotalPisosDA(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalPisosDA()
      }

      getTotalPisosShare(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalShare()
      }

      getTotalVacaciones(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalVacaciones()
      }

      getTotalSolicitudLimitePrecio(): Promise <IData | IErrorResponse>{
            return this.dataAcces.getTotalSolicitudLimitePrecio()
      }

      getTotalSolicitudLimitePrecioByEstadoSol(estadoSol: number): Promise<IData | IErrorResponse> {
            return this.dataAcces.getTotalSolicitudLimitePrecioByEstadoSol(estadoSol)
      }

      getTotalEsquema(): Promise<IData | IErrorResponse>{
            return this.dataAcces.getTotalEsquema()
      }
}

export default DataBusiness