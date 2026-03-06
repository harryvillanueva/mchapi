import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import DataBusiness from '@/api/business/DataBusiness'
import { IData } from '@/api/modelsextra/IData'
import UtilInstance from '@/api/helpers/Util'

const handler = nc(
      {
            onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
                  console.error(err.stack);
                  res.status(500).end("Something broke!");
            },
            onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
              res.status(404).end("Page is not found");
            }
      })
      .use(MiddlewareInstance.verifyToken)
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)

            // En este caso es importante definir un [TIPO], para poder ingrersar al metodo correspondiente
            // el valor del [TIPO] lo definen ustedes (sea descriptivo) y este valor le indican al FROnNT
            // para que ellos lo envien por GET

            let dataFilter = {
                  ns_start: req.query.ns_start || '1900-01-01',
                  ns_end: req.query.ns_end || '2900-01-01',
                  idresponsable_source: parseInt(req.query.idresponsable_source as string) || -2,
                  tipo_lead: req.query.tipo_lead as string || '-2',
                  tipo: req.query.tipo as string || 'NA',
                  idtipointeres: parseInt(req.query.idtipointeres as string) || -2
            }

            let dataDB: IData | IErrorResponse | undefined = undefined
            if (dataFilter.tipo === 'leads') { // migrar leads
                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: dataFilter })
                  dataDB = await el.getNroLeads()
            } else if(dataFilter.tipo === 'control_limpieza') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || '',
                        m_start: req.query.m_start || '1900-01-01',
                        m_end: req.query.m_end || '2900-01-01',
                        iduser: req.query.iduser || 0,
                  }
                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalControlLimpieza()
            } else if(dataFilter.tipo === 'all_leads') {
                  let estatus = (req.query.estatus && (req.query.estatus.toString() == '1' || req.query.estatus.toString() == '0')) ? parseInt(req.query.estatus as string) : -2
                  let _dataFilter = {
                        ns_start: req.query.ns_start || '1900-01-01',
                        ns_end: req.query.ns_end || '2900-01-01',
                        idresponsable: parseInt(req.query.idresponsable as string) || -2,
                        tipo_lead: req.query.tipo_lead as string || '-2',
                        estatus,
                        search_all: req.query.search_all as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalAllLeads()
            } else if(dataFilter.tipo === 'my_leads') {
                  let _dataFilter = {
                        ns_start: req.query.ns_start || '1900-01-01',
                        ns_end: req.query.ns_end || '2900-01-01',
                        idresponsable: parseInt(req.query.idresponsable as string) || -2,
                        tipo_lead: req.query.tipo_lead as string || '-2',
                        search_all: req.query.search_all as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotaMyLeads()
            } else if(dataFilter.tipo === 'users_rrhh') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalUsersRRHH()
            } else if(dataFilter.tipo === 'pisos_colaborador') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || '',
                        nro_habitaciones: req.query.ds_nro_dormitorios as string || '',
                        capacidad_maxima: req.query.cp_ocupacion_maxima as string || '',
                        nro_banios: req.query.bs_nro_banios as string || '',
                        total_start: req.query.total_start as string || '',
                        total_end: req.query.total_end as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalApartmentsCOLABORADOR()
            } else if(dataFilter.tipo === 'users_superadmin') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalUserAdmin()
            } else if(dataFilter.tipo === 'perfiles_dn') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalPerfilesDN()
            } else if(dataFilter.tipo === 'all_devices') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || ''
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalDevices()
            // Total de todos los reportes [estados de dispositivos]
            } else if(dataFilter.tipo === 'all_device_report') {
                  let _dataFilter = {
                        ns_start: req.query.ns_start || '1900-01-01',
                        ns_end: req.query.ns_end || '2900-01-01',
                  }

                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalDeviceReport()
            } else if(dataFilter.tipo === 'all_inventario_articulos'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }
                  let el : DataBusiness = new DataBusiness(idUserLogin, filterState, false, {filter : _dataFilter})
                  dataDB = await el.getTotalArticulosInventario()
            } else if(dataFilter.tipo === 'all_articulos'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }
                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false , { filter : _dataFilter})
                  dataDB = await el.getTotalArticulos()
            } else if(dataFilter.tipo === 'all_grupo_prescriptores'){ // nuevo tipo para obtener total de GRUPO PRESCRIPTORES
                  // este parametro se lo recupera es porque es un listado con filtro
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }
                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false , { filter : _dataFilter})
                  dataDB = await el.getTotalGrupoPrescriptores() // Llaman al metodo correspondiente
            } else if(dataFilter.tipo === 'all_grupo_propietarios'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }
                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false , { filter : _dataFilter})
                  dataDB = await el.getTotalGrupoPropietarios()
            } else if(dataFilter.tipo === 'all_keys'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }
                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false , { filter : _dataFilter})
                  dataDB = await el.getTotalKeys()
            } else if(dataFilter.tipo === 'fichaje_oficina') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || '',
                        m_start: req.query.m_start || '1900-01-01',
                        m_end: req.query.m_end || '2900-01-01'
                  }
                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el.getTotalFichajeOficina()
            } 
            else if(dataFilter.tipo === 'all_users_rrhh') {
                  let _dataFilter = {
                        search_all: req.query.search_all as string || ''
                  }
                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState, false, { filter: _dataFilter })
                  dataDB = await el._getTotalUsersRRHH()
            }
            else if(dataFilter.tipo === 'all_info_comercial'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }
                  let el: DataBusiness = new DataBusiness(idUserLogin, filterState , false, {filter : _dataFilter})
                  dataDB = await el.getTotalInfoComercial()
            }
            else if(dataFilter.tipo === 'all_pisos_da'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }

                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false ,{filter : _dataFilter})
                  dataDB = await el.getTotalPisosDA()
            }
            else if(dataFilter.tipo === 'all_pisos_share'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || ''
                  }

                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false ,{filter : _dataFilter})
                  dataDB = await el.getTotalPisosShare()
            }
            else if(dataFilter.tipo === 'all_vacaciones'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || '',
                        m_start: req.query.m_start || '1900-01-01',
                        m_end: req.query.m_end || '2900-01-01'
                  }

                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false ,{filter : _dataFilter})
                  dataDB = await el.getTotalVacaciones()
            } else if(dataFilter.tipo === 'all_solicitud_limite_precio') {
                  let _dataFilter = {
                        search_all : req.query.search_all as string || '',
                        m_start: req.query.m_start || '1900-01-01',
                        m_end: req.query.m_end || '2900-01-01',
                        state_sol: parseInt(req.query.state_sol as string) || 0,
                  }

                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false ,{filter : _dataFilter})
                  dataDB = await el.getTotalSolicitudLimitePrecio()
            } else if (dataFilter.tipo === 'total_solicitides_pl_pendientes') {
                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false)
                  dataDB = await el.getTotalSolicitudLimitePrecioByEstadoSol(1)
            }
            else if(dataFilter.tipo === 'all_esquema'){
                  let _dataFilter = {
                        search_all : req.query.search_all as string || '',
                        m_start: req.query.m_start || '1900-01-01',
                        m_end: req.query.m_end || '2900-01-01'
                        // iduser: req.query.iduser || 0

                  }

                  let el : DataBusiness = new DataBusiness(idUserLogin , filterState , false ,{filter : _dataFilter})
                  dataDB = await el.getTotalEsquema()
            }
            
            else {
                  dataDB = { total_data: 0 }
            }
            
            if ( !dataDB ) {
                  res.status(204).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  let _d = dataDB as IErrorResponse
                  if (_d.code === 403) res.status(403).json(_d)
                  else res.status(204).json(_d)
                  return
            }
            res.json({ data: dataDB })
      })

export default handler