import DbConnection from "../helpers/DbConnection"
import { IDataAccess } from "../helpers/IDataAccess"
import { StatusDataType } from "../types/GlobalTypes"
import { IErrorResponse } from "../modelsextra/IErrorResponse"
import UtilInstance from "../helpers/Util"
import { IModel } from "../helpers/IModel"
import Constants from "../helpers/Constants"
import { IData } from "../modelsextra/IData"
import { IEstadisticaDn } from "../models/IEstadisticaDn"

class EstadisticaDnDataAccess implements IDataAccess<IEstadisticaDn> {
    public client: DbConnection

    constructor(
                    public idUserLogin: BigInt,
                    public filterStatus: StatusDataType,
                    public isTransactions: boolean,
                    public infoExtra?: any ) {
        this.client = new DbConnection(isTransactions)
    }

    async get(): Promise<Array<IEstadisticaDn> | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async getById(id: BigInt): Promise<IEstadisticaDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async insert(data: IEstadisticaDn): Promise<IEstadisticaDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async update(id: BigInt, data: IEstadisticaDn): Promise<IEstadisticaDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async delete(id: BigInt): Promise<IEstadisticaDn | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    /**
     * Retorna una estadistica al dia de hoy
     */
    async getEstadisticaCurrent(): Promise<Array<IEstadisticaDn> | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise <Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            const _dateCurrent = UtilInstance.getDateCurrent().fecha
            const _dateYesterday = UtilInstance.actionAddAndDismissDays(_dateCurrent, -1).fecha

            const [filter_m_start, filter_m_end] = ['1900-01-01', _dateYesterday]

            let dataResult: Array<IEstadisticaDn> = []

            // ===== ALL_LEADS =======
                const queryData = {
                    name : "get-all-leads-report",
                    text : `
                            SELECT count(l.*) as total_data 
                            FROM ${Constants.tbl_lead_dn_sql} l
                            WHERE l.estatus = $1`,
                    values : [
                        1
                    ]
                }
                const lDataAllLeads = (await client.query(queryData)).rows as Array <IData | IErrorResponse>
                
                // Total de Leads
                if (lDataAllLeads.length !== 0 ) {
                    const _data = (lDataAllLeads as Array<IData>)[0]
                    dataResult.push({ 
                        id: 0,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'all_leads',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 0,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'all_leads',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ===== FIN ALL_LEADS =====

            // ===== NRO PRESCRIPTORES =====
                const queryPrescriptores ={
                    name : "get-prescriptores-count",
                    text : `
                            SELECT count(p.*) as total_data
                            FROM ${Constants.tbl_prescriptor_dn_sql} p
                            WHERE p.estado = $1`,
                    values : [
                        1
                    ]
                }
            
                const lDataAllPrescriptores = (await client.query(queryPrescriptores)).rows as Array <IData | IErrorResponse>

                // Total de prescriptores
                if (lDataAllPrescriptores.length !== 0 ) {
                    const _data = (lDataAllPrescriptores as Array<IData>)[0]
                    dataResult.push({ 
                        id: 1,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'prescriptores_totales',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 1,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'prescriptores_totales',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })

            // ===== FIN NRO PRESCRIPTORES =====


            // ====== NRO WHATSAPP =====
                const queryNroWhatsapp = {
                    name : "get-whatsapp-count",
                    text : `
                            SELECT count(*) as total_data
                            FROM (
                                SELECT gp.*, 
                                REGEXP_MATCHES(gp.whatsapp, '^https://chat.whatsapp.com')::text as whatsappstr
                                FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                                WHERE gp.estado = $1 AND 
                                COALESCE(gp.whatsapp, '') <> ''
                            ) gp
                            WHERE COALESCE(gp.whatsappstr, '') <> ''
                            `,
                    values : [
                        1
                    ]
                }

                const lDataAllWhatsapp = (await client.query(queryNroWhatsapp)).rows as Array <IData | IErrorResponse>

                // Total de prescriptores
                if (lDataAllWhatsapp.length !== 0 ) {
                    const _data = (lDataAllWhatsapp as Array<IData>)[0]
                    dataResult.push({ 
                        id: 2,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'whatsapp_grupo_prescriptor',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 2,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'whatsapp_grupo_prescriptor',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== FIN NRO WHATSAPP =====

            // ====== LEADS ATRASADOS ======
                const queryLeadAtrasados = {
                    name : "get-all-leads-atrasados-report",
                    text : `
                            SELECT l.tipo_lead, count(l.*) as total_data 
                            FROM ${Constants.tbl_lead_dn_sql} l
                            WHERE l.estatus = $1 AND
                            l.next_step BETWEEN $2 AND $3
                            AND idtipointeresa != 1
                            GROUP BY l.tipo_lead
                            `,
                    values : [
                        1,
                        filter_m_start,
                        filter_m_end
                    ]
                }
                const lDataAllLeadsAtrasados = (await client.query(queryLeadAtrasados)).rows as Array <{tipo_lead: string, total_data: number} | IErrorResponse>
            
                // Total de Leads
                if (lDataAllLeadsAtrasados.length !== 0 ) {
                    const _data = (lDataAllLeadsAtrasados as Array<{tipo_lead: string, total_data: number}>)
                    const _dataPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'prescriptor', total_data: 0}
                    const _dataPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'propietario', total_data: 0}
                    
                    dataResult.push({ 
                        id: 3,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_prescriptores',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPrescriptor.total_data || 0.00
                    }, { 
                        id: 4,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_propietarios',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPropietario.total_data || 0.00
                    },{ 
                        id: 5,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_total',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: (_dataPropietario.total_data || 0.00) + (_dataPrescriptor.total_data || 0.00)
                    })
                } else dataResult.push({ 
                        id: 3,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_prescriptores',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: 0.00
                    }, { 
                        id: 4,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_propietarios',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: 0.00
                    }, { 
                        id: 5,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_total',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: 0.00
                    })
            // ====== FIN ======
            
            
            // ====== LLAMADAS LEADS =======
                const queryCallsToday = {
                    name : "get-all-calls-today-report",
                    text : `
                            SELECT l.tipo_lead, count(hl.*) as total_data
                            FROM ${Constants.tbl_historico_lead_dn_sql} hl
                            INNER JOIN ${Constants.tbl_lead_dn_sql} l on hl.idlead = l.id
                            WHERE date(hl.fecha_creacion) = $1 AND hl.ref_historico_lead LIKE 'hl-%'
                            GROUP BY l.tipo_lead
                            `,
                    values : [
                        _dateCurrent
                    ]
                }
                const lDataCallToday = (await client.query(queryCallsToday)).rows as Array <{tipo_lead: string, total_data: number} | IErrorResponse>
        
                if (lDataCallToday.length !== 0 ) {
                    const _data = (lDataCallToday as Array<{tipo_lead: string, total_data: number}>)
                    const _dataPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'colaborador', total_data: 0}
                    const _dataPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'propietario', total_data: 0}
                    
                    dataResult.push({ 
                        id: 6,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_leads_prescriptores',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPrescriptor.total_data || 0.00
                    }, { 
                        id: 7,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_leads_propietarios',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPropietario.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 6,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_leads_prescriptores',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 7,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_leads_propietarios',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== FIN LLAMADAS LEADS ======

            // ====== LLAMADAS PRESCRIPTORES CONTRATADOS =======
                const queryCallsTodayPrescriptor = {
                    name : "get-all-calls-today-prescriptor-report",
                    text : `
                            SELECT count(spre.*) as total_data
                            FROM ${Constants.tbl_suceso_prescriptor_dn_sql} spre
                            WHERE spre.ref_suceso LIKE 'hspre-%' AND
                            date(spre.fecha_creacion) = $1
                            `,
                    values : [
                        _dateCurrent
                    ]
                }
                const lDataCallTodayPrescriptor = (await client.query(queryCallsTodayPrescriptor)).rows as Array <{tipo_lead: string, total_data: number} | IErrorResponse>

                if (lDataCallTodayPrescriptor.length !== 0 ) {
                    const _data = (lDataCallTodayPrescriptor as Array<IData>)
                    const _dataPrescriptor = _data[0]
                    
                    dataResult.push({ 
                        id: 8,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_prescriptores_contratados',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPrescriptor.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 8,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_prescriptores_contratados',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== FIN LLAMADAS PRESCRIPTORES CONTRATADOS ======

            // ======= LLAMADAS PROPIETARIOS CONTRATADOS =======
                const queryCallsTodayPropietario = {
                    name : "get-all-calls-today-propietario-report",
                    text : `
                            SELECT count(spro.*) as total_datos 
                            FROM ${Constants.tbl_suceso_propietario_dn_sql} spro
                            WHERE spro.ref_suceso LIKE 'hspro-%' AND
                            date(spro.fecha_creacion) = $1
                            `,
                    values : [
                        _dateCurrent
                    ]
                }
                const lDataCallTodayPropietario = (await client.query(queryCallsTodayPropietario)).rows as Array <{tipo_lead: string, total_data: number} | IErrorResponse>

                if (lDataCallTodayPropietario.length !== 0 ) {
                    const _data = (lDataCallTodayPropietario as Array<IData>)
                    const _dataPropietario = _data[0]
                    
                    dataResult.push({ 
                        id: 9,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_propietario_contratados',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPropietario.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 9,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_propietario_contratados',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ======= FIN LLAMADAS PROPIETARIOS CONTRATADOS =======

            // ====== LEADS PENDIENTES TODAY ======
                const queryLeadPendiente = {
                    name : "get-all-leads-pendientes-today-report",
                    text : `
                            SELECT count(l.*) as total_data 
                            FROM ${Constants.tbl_lead_dn_sql} l
                            WHERE l.estatus = $1 
                            AND l.next_step = $2
                            `,
                    values : [
                        1,
                        _dateCurrent
                    ]
                }
                const lDataAllLeadsPendientesToday = (await client.query(queryLeadPendiente)).rows as Array <IData | IErrorResponse>
        
                // Total de Leads
                if (lDataAllLeadsPendientesToday.length !== 0 ) {
                    const _data = (lDataAllLeadsPendientesToday as Array<IData>)[0]
                    dataResult.push({ 
                        id: 100,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_pendientes_hoy',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 100,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'leads_pendientes_hoy',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
        // ====== FIN ======

            return dataResult
        })
        
        return [...responseD] as Array<IEstadisticaDn>
    }

    /**
     * Registra los datos estadisticos de los LEADs
     * @returns 
     */
    async insertAutomaticBulk(fechaFilter?: string, tipoFilter?: Array<string>): Promise<Array<IEstadisticaDn> | IErrorResponse> {
        let responseD = await this.client.execQueryPool( async (client): Promise <Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            const {fecha: _dateCurrent, hora: _hourCurrent, timestamp: _timestampCurrent} = UtilInstance.getDateCurrent()
            const _dateYesterday = UtilInstance.actionAddAndDismissDays(_dateCurrent, -1).fecha
            
            const {timestamp: _timestampPivote} = UtilInstance.getDateCustom(_dateCurrent, '09:30:00')

            // Si se ejecuta antes o a las 9am toma la fecha de ayer
            // Si se ejecuta despues de las 9am toma la fecha del dia de hoy
            // Siempre se verifica si ya existe una fecha para sustituir los valores
            let _dateFilter = (_timestampCurrent <= _timestampPivote) ? _dateYesterday : _dateCurrent
            _dateFilter = (fechaFilter !== undefined && fechaFilter !== '') ? fechaFilter : _dateFilter

            let _tipoFilter: Array<string> = tipoFilter !== undefined ? tipoFilter : []

            // Lista que guarda los counts de los Leads
            let dataResult: Array<IEstadisticaDn> = []

            // ===== ALL_LEADS ======= [SI APLICA A TOTAL]
                const queryData = {
                    name : "get-all-leads-report",
                    text : `
                            SELECT count(l.*) as total_data 
                            FROM ${Constants.tbl_lead_dn_sql} l
                            WHERE l.estatus = $1 AND date(l.fecha_creacion) <= $2`,
                    values : [
                        1,
                        _dateFilter
                    ]
                }
                const lDataAllLeads = (await client.query(queryData)).rows as Array <IData | IErrorResponse>
                
                // Total de Leads
                if (lDataAllLeads.length !== 0 ) {
                    const _data = (lDataAllLeads as Array<IData>)[0]
                    dataResult.push({ 
                        id: 0,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'all_leads',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 0,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'all_leads',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ===== FIN ALL_LEADS =====

            // ===== NRO PRESCRIPTORES ===== [SI APLICA A TOTAL]
                const queryPrescriptores ={
                    name : "get-prescriptores-count",
                    text : `
                            SELECT count(p.*) as total_data
                            FROM ${Constants.tbl_prescriptor_dn_sql} p
                            WHERE p.estado = $1 AND date(p.fecha_creacion) <= $2`,
                    values : [
                        1,
                        _dateFilter
                    ]
                }
            
                const lDataAllPrescriptores = (await client.query(queryPrescriptores)).rows as Array <IData | IErrorResponse>

                // Total de prescriptores
                if (lDataAllPrescriptores.length !== 0 ) {
                    const _data = (lDataAllPrescriptores as Array<IData>)[0]
                    dataResult.push({ 
                        id: 1,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'prescriptores_totales',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 1,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'prescriptores_totales',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })

            // ===== FIN NRO PRESCRIPTORES =====


            // ====== NRO WHATSAPP ===== [NO APLICA A FILTAR POR DIA]
                const queryNroWhatsapp = {
                    name : "get-whatsapp-count",
                    text : `
                            SELECT count(*) as total_data
                            FROM (
                                SELECT gp.*, 
                                REGEXP_MATCHES(gp.whatsapp, '^https://chat.whatsapp.com')::text as whatsappstr
                                FROM ${Constants.tbl_grupo_prescriptor_dn_sql} gp
                                WHERE gp.estado = $1 AND 
                                COALESCE(gp.whatsapp, '') <> ''
                            ) gp
                            WHERE COALESCE(gp.whatsappstr, '') <> ''
                            `,
                    values : [
                        1
                    ]
                }

                const lDataAllWhatsapp = (await client.query(queryNroWhatsapp)).rows as Array <IData | IErrorResponse>

                // Total de prescriptores
                if (lDataAllWhatsapp.length !== 0 ) {
                    const _data = (lDataAllWhatsapp as Array<IData>)[0]
                    dataResult.push({ 
                        id: 2,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'whatsapp_grupo_prescriptor',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 2,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'whatsapp_grupo_prescriptor',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== FIN NRO WHATSAPP =====

            // ====== LEADS RETRASADOS ====== [SI APLICA]
                const queryLeadAtrasados = {
                    name : "get-all-leads-atrasados-report",
                    text : `
                            SELECT l.tipo_lead, count(l.*) as total_data 
                            FROM ${Constants.tbl_lead_dn_sql} l
                            WHERE l.estatus = $1 AND
                            l.next_step <= $2
                            AND l.idtipointeresa IN (1, 2, 3)
                            GROUP BY l.tipo_lead
                            `,
                    values : [
                        1,
                        _dateFilter
                    ]
                }
                const lDataAllLeadsAtrasados = (await client.query(queryLeadAtrasados)).rows as Array <{tipo_lead: string, total_data: number} | IErrorResponse>
            
                // Total de Leads
                if (lDataAllLeadsAtrasados.length !== 0 ) {
                    const _data = (lDataAllLeadsAtrasados as Array<{tipo_lead: string, total_data: number}>)
                    const _dataPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'prescriptor', total_data: 0}
                    const _dataPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'propietario', total_data: 0}
                    
                    dataResult.push({ 
                        id: 3,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_prescriptores',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPrescriptor.total_data || 0.00
                    }, { 
                        id: 4,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_propietarios',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPropietario.total_data || 0.00
                    },{ 
                        id: 5,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_total',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: (_dataPropietario.total_data || 0.00) + (_dataPrescriptor.total_data || 0.00)
                    })
                } else dataResult.push({ 
                        id: 3,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_prescriptores',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: 0.00
                    }, { 
                        id: 4,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_propietarios',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: 0.00
                    }, { 
                        id: 5,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'leads_atrasados_total',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: 0.00
                    })
            // ====== FIN ======

            // ====== LLAMADAS LEADS TOTAL GENERAL ======= [ SI APLICA ]
                const queryCallsToday = {
                    name : "get-all-calls-today-report",
                    text : `
                            SELECT l.tipo_lead, count(hl.*) as total_data
                            FROM ${Constants.tbl_historico_lead_dn_sql} hl
                            INNER JOIN ${Constants.tbl_lead_dn_sql} l on hl.idlead = l.id
                            WHERE date(hl.fecha_creacion) = $1 AND hl.ref_historico_lead LIKE 'hl-%'
                            GROUP BY l.tipo_lead
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataCallToday = (await client.query(queryCallsToday)).rows as Array <{tipo_lead: string, total_data: number} | IErrorResponse>
    
                if (lDataCallToday.length !== 0 ) {
                    const _data = (lDataCallToday as Array<{tipo_lead: string, total_data: number}>)
                    const _dataPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'colaborador', total_data: 0}
                    const _dataPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase())) || {tipo_lead: 'propietario', total_data: 0}
                    
                    dataResult.push({ 
                        id: 6000,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_leads_prescriptores',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPrescriptor.total_data || 0.00
                    }, { 
                        id: 7000,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_leads_propietarios',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPropietario.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 6000,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_leads_prescriptores',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 7000,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_leads_propietarios',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== FIN LLAMADAS LEADS TOTAL GENERAL ======

            // ====== LLAMADAS PRESCRIPTORES CONTRATADOS TOTAL GENERAL ======= [ SI APLICA ]
                const queryCallsTodayPrescriptor = {
                    name : "get-all-calls-today-prescriptor-report",
                    text : `
                            SELECT count(spre.*) as total_data
                            FROM ${Constants.tbl_suceso_prescriptor_dn_sql} spre
                            WHERE spre.ref_suceso LIKE 'hspre-%' AND
                            date(spre.fecha_creacion) = $1
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataCallTodayPrescriptor = (await client.query(queryCallsTodayPrescriptor)).rows as Array <IData | IErrorResponse>

                if (lDataCallTodayPrescriptor.length !== 0 ) {
                    const _data = (lDataCallTodayPrescriptor as Array<IData>)
                    const _dataPrescriptor = _data[0]
                    
                    dataResult.push({ 
                        id: 8000,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_prescriptores_contratados',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPrescriptor.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 8000,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_prescriptores_contratados',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== FIN LLAMADAS PRESCRIPTORES CONTRATADOS TOTAL GENERAL ======

            // ======= LLAMADAS PROPIETARIOS CONTRATADOS TOTAL GENERAL ======= [ SI APLICA ]
                const queryCallsTodayPropietario = {
                    name : "get-all-calls-today-propietario-report",
                    text : `
                            SELECT count(spro.*) as total_data 
                            FROM ${Constants.tbl_suceso_propietario_dn_sql} spro
                            WHERE spro.ref_suceso LIKE 'hspro-%' AND
                            date(spro.fecha_creacion) = $1
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataCallTodayPropietario = (await client.query(queryCallsTodayPropietario)).rows as Array <IData | IErrorResponse>

                if (lDataCallTodayPropietario.length !== 0 ) {
                    const _data = (lDataCallTodayPropietario as Array<IData>)
                    const _dataPropietario = _data[0]
                    
                    dataResult.push({ 
                        id: 9000,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'llamadas_propietario_contratados',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataPropietario.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 9000,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'llamadas_propietario_contratados',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ======= FIN LLAMADAS PROPIETARIOS CONTRATADOS TOTAL GENERAL =======
            
            
            // ====== LLAMADAS LEADS X USER ======= [ SI APLICA ]
                const queryCallsUserToday = {
                    name : "get-all-calls-user-today-report",
                    text : `
                            SELECT l.tipo_lead, hl.idusuario_resp, count(hl.*) as total_data
                            FROM ${Constants.tbl_historico_lead_dn_sql} hl
                            INNER JOIN ${Constants.tbl_lead_dn_sql} l on hl.idlead = l.id
                            WHERE date(hl.fecha_creacion) = $1 AND hl.ref_historico_lead LIKE 'hl-%'
                            GROUP BY l.tipo_lead, hl.idusuario_resp
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataCallUserToday = (await client.query(queryCallsUserToday)).rows as Array <{tipo_lead: string, idusuario_resp: number, total_data: number} | IErrorResponse>
        
                if (lDataCallUserToday.length !== 0 ) {
                    const _data = (lDataCallUserToday as Array<{tipo_lead: string, idusuario_resp: number, total_data: number}>)
                    _data.forEach((el, index) => {
                        const _lblTipo = (['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase())) ? 'llamadas_leads_prescriptores_x_user' : 'llamadas_leads_propietarios_x_user'
                        dataResult.push({ 
                            id: 1000 + index,
                            fecha_creacion: timeStampCurrent,
                            tipo: _lblTipo,
                            idusuario: parseInt(this.idUserLogin.toString()),
                            estadistica: el.total_data || 0.00,
                            idusuresp: el.idusuario_resp || null
                        })
                    })
                } 
            // ====== FIN LLAMADAS LEADS X USER ======

            // ====== LLAMADAS PRESCRIPTORES CONTRATADOS X USER ======= [ SI APLICA ]
                const queryCallsUserTodayPrescriptor = {
                    name : "get-all-calls-today-prescriptor-x-user-report",
                    text : `
                            SELECT 'Prescriptor' as tipo_lead, spre.idusuario as idusuario_resp, count(spre.*) as total_data
                            FROM ${Constants.tbl_suceso_prescriptor_dn_sql} spre
                            WHERE spre.ref_suceso LIKE 'hspre-%' AND
                            date(spre.fecha_creacion) = $1
                            GROUP BY spre.idusuario
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataCallUserTodayPrescriptor = (await client.query(queryCallsUserTodayPrescriptor)).rows as Array <{tipo_lead: string, idusuario_resp: number, total_data: number} | IErrorResponse>
    
                if (lDataCallUserTodayPrescriptor.length !== 0 ) {
                    const _data = (lDataCallUserTodayPrescriptor as Array<{tipo_lead: string, idusuario_resp: number, total_data: number}>)
                    
                    _data.forEach((el, index) => {
                        const _lblTipo = 'llamadas_prescriptores_contratados_x_user'
                        dataResult.push({ 
                            id: 2000 + index,
                            fecha_creacion: timeStampCurrent,
                            tipo: _lblTipo,
                            idusuario: parseInt(this.idUserLogin.toString()),
                            estadistica: el.total_data || 0.00,
                            idusuresp: el.idusuario_resp || null
                        })
                    })
                }
            // ====== FIN LLAMADAS PRESCRIPTORES CONTRATADOS X USER ======

            // ======= LLAMADAS PROPIETARIOS CONTRATADOS X USER ======= [ SI APLICA ]
                const queryCallsUserTodayPropietario = {
                    name : "get-all-calls-today-propietario-x-user-report",
                    text : `
                            SELECT 'Propietario' as tipo_lead, spro.idusuario as idusuario_resp, count(spro.*) as total_data 
                            FROM ${Constants.tbl_suceso_propietario_dn_sql} spro
                            WHERE spro.ref_suceso LIKE 'hspro-%' AND
                            date(spro.fecha_creacion) = $1
                            GROUP BY spro.idusuario
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataCallUserTodayPropietario = (await client.query(queryCallsUserTodayPropietario)).rows as Array <{tipo_lead: string, idusuario_resp: number, total_data: number} | IErrorResponse>

                if (lDataCallUserTodayPropietario.length !== 0 ) {
                    const _data = (lDataCallUserTodayPropietario as Array<{tipo_lead: string, idusuario_resp: number, total_data: number}>)

                    _data.forEach((el, index) => {
                        const _lblTipo = 'llamadas_propietarios_contratados_x_user'
                        dataResult.push({ 
                            id: 3000 + index,
                            fecha_creacion: timeStampCurrent,
                            tipo: _lblTipo,
                            idusuario: parseInt(this.idUserLogin.toString()),
                            estadistica: el.total_data || 0.00,
                            idusuresp: el.idusuario_resp || null
                        })
                    })
                }
            // ======= FIN LLAMADAS PROPIETARIOS CONTRATADOS X USER =======

            // ===== NRO PROPIETARIOS ===== [SI APLICA A TOTAL]
                const queryPropietarios ={
                    name : "get-propietarios-count",
                    text : `
                            SELECT count(p.*) as total_data
                            FROM ${Constants.tbl_propietario_dn_sql} p
                            WHERE p.estado = $1 AND date(p.fecha_creacion) <= $2`,
                    values : [
                        1,
                        _dateFilter
                    ]
                }
        
                const lDataAllPropietarios = (await client.query(queryPropietarios)).rows as Array <IData | IErrorResponse>

                // Total de prescriptores
                if (lDataAllPropietarios.length !== 0 ) {
                    const _data = (lDataAllPropietarios as Array<IData>)[0]
                    dataResult.push({ 
                        id: 10,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'propietarios_totales',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _data.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 10,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'propietarios_totales',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ===== FIN NRO PRESCRIPTORES =====

            // ====== ACCIONES ON LEADS ======= [ SI APLICA ]
            // Procesar-Eliminar, Prescriptor-to-Lead, Procesar-Contratar
                const queryActionsOnLeadsToday = {
                    name : "get-all-action-on-leads-today-report",
                    text : `
                            SELECT hl.tipo_accion, l.tipo_lead, count(*) as total_data
                            FROM ${Constants.tbl_historico_lead_dn_sql} hl
                            INNER JOIN ${Constants.tbl_lead_dn_sql} l on l.id = hl.idlead
                            WHERE hl.tipo_accion in ('Procesar-Eliminar', 'Prescriptor-to-Lead', 'Procesar-Contratar') AND
                            date(hl.fecha_creacion) = $1
                            group by hl.tipo_accion, l.tipo_lead
                            `,
                    values : [
                        _dateFilter
                    ]
                }
                const lDataActionsOnLeadsToday = (await client.query(queryActionsOnLeadsToday)).rows as Array <{tipo_accion: string, tipo_lead: string, total_data: number} | IErrorResponse>
                if (lDataActionsOnLeadsToday.length !== 0 ) {
                    const _data = (lDataActionsOnLeadsToday as Array<{tipo_accion: string, tipo_lead: string, total_data: number}>)
                    const _dataDeleteLeadPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase()) && el.tipo_accion.toLocaleLowerCase() === 'procesar-eliminar') || {tipo_lead: 'colaborador', total_data: 0}
                    const _dataGoBackLeadPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase()) && el.tipo_accion.toLocaleLowerCase() === 'prescriptor-to-lead') || {tipo_lead: 'colaborador', total_data: 0}
                    const _dataContratarLeadPrescriptor = _data.find(el => ['colaborador', 'prescriptor'].includes(el.tipo_lead.toLocaleLowerCase()) && el.tipo_accion.toLocaleLowerCase() === 'procesar-contratar') || {tipo_lead: 'colaborador', total_data: 0}

                    const _dataDeleteLeadPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase()) && el.tipo_accion.toLocaleLowerCase() === 'procesar-eliminar') || {tipo_lead: 'propietario', total_data: 0}
                    const _dataGoBackLeadPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase()) && el.tipo_accion.toLocaleLowerCase() === 'prescriptor-to-lead') || {tipo_lead: 'propietario', total_data: 0}
                    const _dataContratarLeadPropietario = _data.find(el => ['propietario'].includes(el.tipo_lead.toLocaleLowerCase()) && el.tipo_accion.toLocaleLowerCase() === 'procesar-contratar') || {tipo_lead: 'propietario', total_data: 0}
                    
                    dataResult.push({ 
                        id: 11,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'nro_prescriptor_lead_delete',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataDeleteLeadPrescriptor.total_data || 0.00
                    }, { 
                        id: 12,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'nro_prescriptor_go_to_lead',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataGoBackLeadPrescriptor.total_data || 0.00
                    }, { 
                        id: 13,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'nro_prescriptor_contratado',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataContratarLeadPrescriptor.total_data || 0.00
                    }, { 
                        id: 14,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'nro_propietario_lead_delete',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataDeleteLeadPropietario.total_data || 0.00
                    }, { 
                        id: 15,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'nro_propietario_go_to_lead',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataGoBackLeadPropietario.total_data || 0.00
                    }, { 
                        id: 16,
                        fecha_creacion: timeStampCurrent,
                        tipo: 'nro_propietario_contratado',
                        idusuario: parseInt(this.idUserLogin.toString()),
                        estadistica: _dataContratarLeadPropietario.total_data || 0.00
                    })
                } else dataResult.push({ 
                    id: 11,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'nro_prescriptor_lead_delete',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 12,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'nro_prescriptor_go_to_lead',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 13,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'nro_prescriptor_contratado',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 14,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'nro_propietario_lead_delete',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 15,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'nro_propietario_go_to_lead',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                }, { 
                    id: 16,
                    fecha_creacion: timeStampCurrent,
                    tipo: 'nro_propietario_contratado',
                    idusuario: parseInt(this.idUserLogin.toString()),
                    estadistica: 0.00
                })
            // ====== ACCIONES ON LEADS ======

            // ===== INSERT DB ========
                // Insert/Update registro de estadisticas en DB
                if ( _tipoFilter.length !== 0 ) dataResult = dataResult.filter(el => _tipoFilter.includes(el.tipo.toLocaleLowerCase()))
                // for( let i = 0; i < dataResult.length; i++ ) {
                //     let queryDataUpdateEstadistica = undefined

                //     if ( dataResult[i].idusuresp !== null && dataResult[i].idusuresp !== undefined ) {
                //         queryDataUpdateEstadistica = {
                //             name: 'update-estadistica',
                //             text: `UPDATE ${Constants.tbl_estadistica_dn_sql} SET 
                //                     fecha_ultimo_cambio = $1,
                //                     estadistica = $2,
                //                     idusuario = $3,
                //                     idusuresp = $4
                //                     WHERE tipo LIKE $5 AND fecha = $6 AND idusuresp = $4 RETURNING *`,
                //             values: [   timeStampCurrent, 
                //                         dataResult[i].estadistica, 
                //                         this.idUserLogin,
                //                         dataResult[i].idusuresp || null, 
                //                         dataResult[i].tipo, 
                //                         _dateFilter ]
                //         }

                //     } else {
                //         queryDataUpdateEstadistica = {
                //             name: 'update-estadistica',
                //             text: `UPDATE ${Constants.tbl_estadistica_dn_sql} SET 
                //                     fecha_ultimo_cambio = $1,
                //                     estadistica = $2,
                //                     idusuario = $3
                //                     WHERE tipo LIKE $4 AND fecha = $5 RETURNING *`,
                //             values: [   timeStampCurrent, 
                //                         dataResult[i].estadistica, 
                //                         this.idUserLogin,
                //                         dataResult[i].tipo, 
                //                         _dateFilter ]
                //         }
                //     }

                //     let _resultUpdate = (await client.query(queryDataUpdateEstadistica)).rows as Array<IEstadisticaDn>
                    
                //     // Insertamos si no existe el registro en DB
                //     if (_resultUpdate && _resultUpdate.length === 0) {
                //         const queryInsertEstadistica = {
                //             name: 'insert-estadistica',
                //             text: `INSERT INTO ${Constants.tbl_estadistica_dn_sql} ( fecha_creacion, tipo, idusuario, data, estadistica, fecha_ultimo_cambio, fecha, idusuresp)
                //                     VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
                //             values: [   timeStampCurrent,            
                //                         dataResult[i].tipo,
                //                         this.idUserLogin,
                //                         {},
                //                         dataResult[i].estadistica,
                //                         timeStampCurrent,
                //                         _dateFilter,
                //                         dataResult[i].idusuresp || null
                //                     ]
                //         }
                //         await client.query(queryInsertEstadistica)
                //     }
                // }

                for( let i = 0; i < dataResult.length; i++ ) {
                    const queryDataUpdateEstadistica = {
                        name: 'update-estadistica',
                        text: `UPDATE ${Constants.tbl_estadistica_dn_sql} SET 
                                fecha_ultimo_cambio = $1,
                                estadistica = $2,
                                idusuario = $3,
                                idusuresp = $4
                                WHERE tipo LIKE $5 AND fecha = $6 AND (idusuresp = $4 OR $4 IS NULL) RETURNING *`,
                        values: [   timeStampCurrent, 
                                    dataResult[i].estadistica, 
                                    this.idUserLogin,
                                    dataResult[i].idusuresp || null, 
                                    dataResult[i].tipo, 
                                    _dateFilter ]
                    }
                    let _resultUpdate = (await client.query(queryDataUpdateEstadistica)).rows as Array<IEstadisticaDn>
                    
                    // Insertamos si no existe el registro en DB
                    if (_resultUpdate && _resultUpdate.length === 0) {
                        const queryInsertEstadistica = {
                            name: 'insert-estadistica',
                            text: `INSERT INTO ${Constants.tbl_estadistica_dn_sql} ( fecha_creacion, tipo, idusuario, data, estadistica, fecha_ultimo_cambio, fecha, idusuresp)
                                    VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
                            values: [   timeStampCurrent,            
                                        dataResult[i].tipo,
                                        this.idUserLogin,
                                        {},
                                        dataResult[i].estadistica,
                                        timeStampCurrent,
                                        _dateFilter,
                                        dataResult[i].idusuresp || null
                                    ]
                        }
                        await client.query(queryInsertEstadistica)
                    }
                }
            // ===== FIN INDERT DB =========

            return dataResult
        })

        return [...responseD] as Array<IEstadisticaDn>
    }

    /**
     * Retorna el historial de las estadisticas definiendo un rango de fecha
     * @returns 
     */
    async getEstadisticaHistorial(): Promise<Array<IEstadisticaDn> | IErrorResponse> {
        if ( !this.infoExtra ) this.infoExtra = { filter: {} }
        else if ( !this.infoExtra!.filter) this.infoExtra = { filter: {} }

        type DataEstadistica = {
            tipo: string,
            nro_elements: number,
            total_estadistica: number,
            usr_responsable?: string,
            idusuresp?: number

        }

        let filter_m_start = this.infoExtra.filter.m_start || '1900-01-01'
        let filter_m_end = this.infoExtra.filter.m_end || '2900-01-01'

        let responseD = await this.client.execQueryPool( async (client): Promise <Array<IModel | IErrorResponse>> => {
            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            let dataResult: Array<IEstadisticaDn> = []

            // Query para sacar una sumatoria de los valores diarios
            const queryEstadisticaHistorico = {
                name : "get-all-estadisticas-historico",
                text : `
                        SELECT e.tipo, count(e.*) as nro_elements, sum(e.estadistica) as total_estadistica
                        FROM ${Constants.tbl_estadistica_dn_sql} e
                        WHERE e.fecha BETWEEN $1 AND $2
                        GROUP BY e.tipo
                    `,
                values : [
                    filter_m_start,
                    filter_m_end
                ]
            }
            const lDataHistorico = (await client.query(queryEstadisticaHistorico)).rows as Array <DataEstadistica | IErrorResponse>
            
            
            if( lDataHistorico && lDataHistorico.length !== 0 ) {
                (lDataHistorico as Array<DataEstadistica>).forEach((el, index) => {
                    if(el.tipo.toLocaleLowerCase() === 'nro_prescriptor_contratado') {
                        dataResult.push({ 
                            id: 100,
                            fecha_creacion: timeStampCurrent,
                            tipo: 'nro_prescriptores_contratados',
                            idusuario: parseInt(this.idUserLogin.toString()),
                            estadistica: el.total_estadistica
                        })
                    } else if(el.tipo.toLocaleLowerCase() === 'nro_propietario_contratado') {
                        dataResult.push({ 
                            id: 100,
                            fecha_creacion: timeStampCurrent,
                            tipo: 'nro_propietarios_contratados',
                            idusuario: parseInt(this.idUserLogin.toString()),
                            estadistica: el.total_estadistica
                        })
                    }
                })
            }

            // ====== QUERY QUE CONSULTA LLAMADAS POR USUARIO =======
            const queryEstadisticaHistoricoXUserCalls = {
                name : "get-all-estadisticas-historico-x-user",
                text : `
                        SELECT usu.nombre_completo as usr_responsable, 'calls_users' as tipo, hxusu.* 
                        FROM (
                            SELECT e.idusuresp, count(e.*) as nro_elements, sum(e.estadistica) as total_estadistica
                            FROM ${Constants.tbl_estadistica_dn_sql} e
                            WHERE e.fecha BETWEEN $1 AND $2 AND e.idusuresp IS NOT NULL AND
                            e.tipo IN ('llamadas_leads_prescriptores_x_user', 'llamadas_leads_propietarios_x_user', 
                                    'llamadas_prescriptores_contratados_x_user',
                                    'llamadas_propietarios_contratados_x_user')
                            GROUP BY e.idusuresp) hxusu
                        INNER JOIN ${Constants.tbl_usuario_sql} usu ON usu.id = hxusu.idusuresp
                        ORDER BY usu.nombre_completo ASC
                    `,
                values : [
                    filter_m_start,
                    filter_m_end
                ]
            }
            const lDataHistoricoXUserCalls = (await client.query(queryEstadisticaHistoricoXUserCalls)).rows as Array <DataEstadistica | IErrorResponse>
            
            if( lDataHistoricoXUserCalls && lDataHistoricoXUserCalls.length !== 0 ) {
                (lDataHistoricoXUserCalls as Array<DataEstadistica>).forEach((el, index) => {
                    dataResult.push({ 
                        id: 666 + index,
                        fecha_creacion: timeStampCurrent,
                        tipo: el.tipo,
                        idusuario: parseInt(this.idUserLogin.toString()),
                        idusuresp: el.idusuresp || 0,
                        usr_responsable: el.usr_responsable || '',
                        estadistica: el.total_estadistica
                    }) 
                })
            }
            // ====== FIN QUERY CONSULTA LLAMADAS POR USUARIO =======

            return dataResult
        })
        
        return [...responseD] as Array<IEstadisticaDn>
    }
}

export default EstadisticaDnDataAccess