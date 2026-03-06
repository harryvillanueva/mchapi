import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import LeadBusiness from '@/api/business/LeadBusiness'
import { ILead } from '@/api/models/ILead'

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
            let el: LeadBusiness = new LeadBusiness(idUserLogin, filterState, false)
            
            let dataDB: ILead | IErrorResponse = await el.getById(BigInt(parseInt(req.query.id as string)))
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  let _d = dataDB as IErrorResponse
                  if (_d.code === 403) res.status(403).json(_d)
                  else res.status(404).json(_d)
                  return
            }
            res.json({ data: dataDB })
      })
      .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
            let el: LeadBusiness = new LeadBusiness(idUserLogin, filterState, true)

            let idTipoAvance = parseInt(req.body.idtipoavance as string) || 0 // Permite NULL
            let idResponsable = parseInt(req.body.idresponsable as string) || 0 // Permite NULL
            let idTipoOcupacion = parseInt(req.body.idtipoocupacion as string) || 0 // Permite NULL
            let idTipoInteresa = parseInt(req.body.idtipointeresa as string) || 0 // Permite NULL
            let idCategoria = parseInt(req.body.idcategoria as string) || 0 // Permite NULL

            let estatus = (req.body.estatus && (req.body.estatus == 1 || req.body.estatus == 0)) ? req.body.estatus : -2

            let precio = parseFloat(req.body.precio as string) || -1.00
            let m2 = parseFloat(req.body.m2 as string) || -1.00

            let tipo_accion = req.body.tipo_accion ? req.body.tipo_accion as string : 'Procesar'

            if (tipo_accion === 'Procesar' || tipo_accion === 'Nuevo' || tipo_accion === 'Edicion') estatus = 1
            else if (tipo_accion === 'Procesar-Eliminar' || tipo_accion === 'Procesar-Contratar') estatus = 0


            let data: ILead = {
                  next_step: req.body.next_step || '',
                  last_step: req.body.last_step || '',
                  idtipoavance: idTipoAvance > 0 ? BigInt(idTipoAvance): undefined,
                  idresponsable: idResponsable > 0 ? BigInt(idResponsable): undefined,
                  idtipoocupacion: idTipoOcupacion > 0 ? BigInt(idTipoOcupacion): undefined,
                  idtipointeresa: idTipoInteresa > 0 ? BigInt(idTipoInteresa): undefined,
                  comentario: req.body.comentario || '',

                  nombre: req.body.nombre || '',
                  apellido: req.body.apellido || '',
                  nombre_completo: req.body.nombre_completo || '',
                  grupo_wpp: req.body.grupo_wpp || '',
                  referencia: req.body.referencia || '',
                  estatus: estatus,
                  telefonos: req.body.telefonos || [],
                  correos: req.body.correos || [],

                  precio: precio >= 0 ? precio.toFixed(2) : undefined,
                  m2: m2 >= 0 ? m2.toFixed(2) : undefined,
                  direccion: req.body.direccion || '',
                  nro_edificio: req.body.nro_edificio || '',
                  nro_piso: req.body.nro_piso || '',
                  codigo_postal: req.body.codigo_postal || '',
                  localidad: req.body.localidad || '',

                  // tipo_accion: 'Edicion',
                  tipo_accion,
                  tipo_lead: req.body.tipo_lead || '',
                  empresa: req.body.empresa || '',
                  idcategoria: idCategoria > 0 ? BigInt(idCategoria): undefined,
                  grupo: req.body.grupo || undefined
            }
            
            let dataDB: ILead | IErrorResponse = await el.update(BigInt(parseInt(req.query.id as string)), data)
            if ( !dataDB ) {
                  res.status(404).json({ error: 'data not found' })
                  return
            }
            if ( ({ ...dataDB } as IErrorResponse).error ) {
                  // 409: conflicto con los datos enviados
                  res.status(409).json(dataDB as IErrorResponse)
                  return
            }
            
            res.json({ data: dataDB })
      })
      // .delete(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
      //       const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
      //       let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false)
            
      //       let dataDB: IApartment | IErrorResponse = await el.delete(BigInt(parseInt(req.query.id as string)))
      //       if ( !dataDB ) {
      //             res.status(404).json({ error: 'data not found' })
      //             return
      //       }
      //       if ( ({ ...dataDB } as IErrorResponse).error ) {
      //             let _d = dataDB as IErrorResponse
      //             if (_d.code === 403) res.status(403).json(_d)
      //             else res.status(404).json(_d)
      //             return
      //       }
      //       res.json({ data: dataDB }) 
      // })

export default handler