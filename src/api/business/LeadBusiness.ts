import { IDataAccess } from "../helpers/IDataAccess"
import { ErrorFieldType, StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import LeadDataAccess from "../data/LeadDataAccess"
import { ILead } from "../models/ILead"
import TipoOcupacionBusiness from "./TipoOcupacionBusiness"
import { ITipoOcupacion } from "../models/ITipoOcupacion"
import Constants from "../helpers/Constants"
import TipoAvanceBusiness from "./TipoAvanceBusiness"
import { ITipoAvance } from "../models/ITipoAvance"
import TipoInteresaBusiness from "./TipoInteresaBusiness"
import { ITipoInteresa } from "../models/ITipoInteresa"
import CategoriaBusiness from "./CategoriaBusiness"
import { ICategoria } from "../models/ICategoria"
import { IResponseGeneral } from "../modelsextra/IResponseGeneral"

class LeadBusiness implements IDataAccess<ILead> {
      public dataAcces: LeadDataAccess
      
      constructor(      public idUserLogin: BigInt,
                        public filterStatus: StatusDataType,
                        public isTransactions: boolean, 
                        public infoExtra?: any) {
            this.dataAcces = new LeadDataAccess(idUserLogin, filterStatus, isTransactions, infoExtra)
      }

      get(): Promise<Array<ILead> | IErrorResponse> {
            return this.dataAcces.get()
      }

      getById(id: BigInt): Promise<ILead | IErrorResponse> {
            // throw new Error("Method not implemented.")
            return this.dataAcces.getById(id)
      }

      private async getTiposLead(data: ILead, error: IErrorResponse): Promise<{ name_tocupacion: string, 
                                                                  name_tavance: string, 
                                                                  name_tinteresa: string,
                                                                  name_categoria: string }> {
            let name_tocupacion = 'NA'
            let name_tavance = 'NA'
            let name_tinteresa = 'NA'
            let name_categoria = 'NA'

            let _typeOcupacion: TipoOcupacionBusiness = new TipoOcupacionBusiness(this.idUserLogin, 0, false)
            let lOcupacion = await _typeOcupacion.get()
            if (  (lOcupacion as IErrorResponse).error || 
                  (lOcupacion as Array<ITipoOcupacion>).length === 0 
            ) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'idtipoocupacion', 
                        msg: 'No se puede verificar el tipo de ocupación!' 
                  })
            }
            name_tocupacion = (((lOcupacion as Array<ITipoOcupacion>).filter(el => el.id?.toString() === data.idtipoocupacion?.toString().trim())[0]) || {}).nombre || 'NA'

            let _typeAvance: TipoAvanceBusiness = new TipoAvanceBusiness(this.idUserLogin, 0, false)
            let lAvance = await _typeAvance.get()
            if (  (lAvance as IErrorResponse).error || 
                  (lAvance as Array<ITipoAvance>).length === 0 
            ) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'idtipoavance', 
                        msg: 'No se puede verificar el tipo de avance!' 
                  })
            }
            name_tavance = (((lAvance as Array<ITipoAvance>).filter(el => el.id?.toString() === data.idtipoavance?.toString().trim())[0]) || {}).nombre || 'NA'
            
            let _typeInteresa: TipoInteresaBusiness = new TipoInteresaBusiness(this.idUserLogin, 0, false)
            let lInteresa = await _typeInteresa.get()
            if (  (lInteresa as IErrorResponse).error || 
                  (lInteresa as Array<ITipoInteresa>).length === 0 
            ) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'idtipointeresa', 
                        msg: 'No se puede verificar el tipo de interesa!' 
                  })
            }
            name_tinteresa = (((lInteresa as Array<ITipoInteresa>).filter(el => el.id?.toString() === data.idtipointeresa?.toString().trim())[0]) || {}).nombre || 'NA'

            let _typeCategoria: CategoriaBusiness = new CategoriaBusiness(this.idUserLogin, 0, false)
            let lCategoria = await _typeCategoria.get()
            if (  (lCategoria as IErrorResponse).error || 
                  (lCategoria as Array<ICategoria>).length === 0 
            ) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'idcategoria', 
                        msg: 'No se puede verificar el tipo de categoria!' 
                  })
            }
            name_categoria = (((lCategoria as Array<ICategoria>).filter(el => el.id?.toString() === data.idcategoria?.toString().trim())[0]) || {}).nombre || 'NA'
            
            
            return { name_tocupacion, name_tavance, name_tinteresa, name_categoria }
      }

      async insert(data: ILead): Promise<ILead | IErrorResponse> {
            // Validaciones
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            let { name_tavance, name_tinteresa, name_tocupacion, name_categoria } = await this.getTiposLead(data, error)
            
            data.name_tavance = name_tavance
            data.name_tocupacion = name_tocupacion
            data.name_tinteresa = name_tinteresa
            data.name_categoria = name_categoria

            if (  !data.tipo_lead || (data.tipo_lead !== Constants.code_lead_propietario &&  data.tipo_lead !== Constants.code_lead_colaborador)) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'tipo_lead', 
                        msg: 'Valores incorrectos!' 
                  })
            }

            if ( data.tipo_lead!.toString() === Constants.code_lead_propietario ) {
                  data.empresa = undefined
                  data.idcategoria = undefined
                  data.name_categoria = 'NA'
            } else if( data.tipo_lead!.toString() === Constants.code_lead_colaborador ) {
                  data.idtipoocupacion = undefined
                  data.name_tocupacion = 'NA'
                  data.precio = undefined
                  data.m2 = undefined
                  data.direccion = undefined
                  data.nro_edificio = undefined
                  data.nro_piso = undefined
                  data.codigo_postal = undefined
                  data.localidad = undefined
            }
            
            this.dataAcces.infoExtra = { data: {} } // Vacío para registros nuevos
            
            return (error.data?.length === 0) ? this.dataAcces.insert(data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      async update(id: BigInt, data: ILead): Promise<ILead | IErrorResponse> {
            // Validaciones
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            let { name_tavance, name_tinteresa, name_tocupacion, name_categoria } = await this.getTiposLead(data, error)
            
            data.name_tavance = name_tavance
            data.name_tocupacion = name_tocupacion
            data.name_tinteresa = name_tinteresa
            data.name_categoria = name_categoria
            
            // Carga valores del lead antes de ser modificado
            let _leadCurrent: LeadBusiness = new LeadBusiness(this.idUserLogin, 0, false)
            let leadDB = await _leadCurrent.getByIdForHistory(id)
            if (  !leadDB || (leadDB as IErrorResponse).error ) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'id', 
                        msg: 'No se puede verificar la información del lead actual!' 
                  })
            }

            if (  !data.tipo_lead || (data.tipo_lead !== Constants.code_lead_propietario &&  data.tipo_lead !== Constants.code_lead_colaborador)) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'tipo_lead', 
                        msg: 'Valores incorrectos!' 
                  })
            }

            if ( data.tipo_lead!.toString() === Constants.code_lead_propietario ) {
                  data.empresa = undefined
                  data.idcategoria = undefined
                  data.name_categoria = 'NA'
            } else if( data.tipo_lead!.toString() === Constants.code_lead_colaborador ) {
                  data.idtipoocupacion = undefined
                  data.name_tocupacion = 'NA'
                  data.precio = undefined
                  data.m2 = undefined
                  data.direccion = undefined
                  data.nro_edificio = undefined
                  data.nro_piso = undefined
                  data.codigo_postal = undefined
                  data.localidad = undefined
            }

            this.dataAcces.infoExtra = { data: (leadDB as ILead) || {} } // Vacío para registros nuevos

            return (error.data?.length === 0) ? this.dataAcces.update(id, data) : new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      delete(id: BigInt): Promise<ILead | IErrorResponse> {
            throw new Error("Method not implemented.")
      }

      getByIdForHistory(id: BigInt): Promise<ILead | IErrorResponse> {
            return this.dataAcces.getByIdForHistory(id)
      }

      getMyLeads(): Promise<Array<ILead> | IErrorResponse> {
            return this.dataAcces.getMyLeads()
      }

      async updateDNCall(id: BigInt, data: ILead): Promise<ILead | IErrorResponse> {
            // Obtener informacion previa para la respectiva cambio de datos
            // Validaciones
            let error: IErrorResponse = { error: 'Error, integridad de datos', data:[] }

            let { name_tavance, name_tinteresa, name_tocupacion, name_categoria } = await this.getTiposLead(data, error)
            
            data.name_tavance = name_tavance
            data.name_tocupacion = name_tocupacion
            data.name_tinteresa = name_tinteresa
            data.name_categoria = name_categoria
            
            // Carga valores del lead antes de ser modificado
            let _leadCurrent: LeadBusiness = new LeadBusiness(this.idUserLogin, 0, false)
            let leadDB = await _leadCurrent.getByIdForHistory(id)
            if (  !leadDB || (leadDB as IErrorResponse).error ) {
                  error.data?.push({   
                        type: Constants.error_type_custom as ErrorFieldType,
                        code: '', 
                        field:'id', 
                        msg: 'No se puede verificar la información del lead actual!' 
                  })
            }

            leadDB = leadDB as ILead
            data.last_step = leadDB.next_step
            data.nro_llamadas = (leadDB.nro_llamadas ? leadDB.nro_llamadas : 0) + 1
            let _tipo_lead = leadDB.tipo_lead || ''

            if ( _tipo_lead.toString() === Constants.code_lead_propietario ) {
                  data.empresa = undefined
                  data.idcategoria = undefined
                  data.name_categoria = 'NA'
            } else if( _tipo_lead.toString() === Constants.code_lead_colaborador ) {
                  data.idtipoocupacion = undefined
                  data.name_tocupacion = 'NA'
                  data.precio = undefined
                  data.m2 = undefined
                  data.direccion = undefined
                  data.nro_edificio = undefined
                  data.nro_piso = undefined
                  data.codigo_postal = undefined
                  data.localidad = undefined
            }

            this.dataAcces.infoExtra = { data: (leadDB as ILead) || {} } // Vacío para registros nuevos

            return (error.data?.length === 0) ? this.dataAcces.updateDNCall(id, data) : 
                              new Promise<IErrorResponse>((resolve, reject) => { resolve(error) })
      }

      getAllWithPagination(): Promise<Array<ILead> | IErrorResponse> {
            return this.dataAcces.getAllWithPagination()
      }

      getMyLeadsWithPagination(): Promise<Array<ILead> | IErrorResponse> {
            return this.dataAcces.getMyLeadsWithPagination()
      }

      leadEstadistica() : Promise <IResponseGeneral | IErrorResponse>{
            return this.dataAcces.leadsEstadistica()
      }
}

export default LeadBusiness