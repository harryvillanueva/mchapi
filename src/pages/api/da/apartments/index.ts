import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ApartmentBusiness from '@/api/business/ApartmentBusiness'
import { IApartment } from '@/api/models/IApartment'
import { StatusDataType } from '@/api/types/GlobalTypes'

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
                const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
                
                let dataFilter = {
                        search_all: req.query.search_all as string || ''
                }

                let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, false, { filter: dataFilter })
                let dataDB: Array<IApartment> | IErrorResponse = await el.getAllDA()
                
                // If es null
                if (!dataDB) {
                        res.status(404).json({ error: 'data not found' })
                        return
                }
                // Si hay error query
                if (({ ...dataDB } as IErrorResponse).error) {
                        let _d = dataDB as IErrorResponse
                        if (_d.code === 403) res.status(403).json(_d)
                        else res.status(404).json(_d)
                        return
                }
                // Si la lista es vacia
                if ((dataDB as Array<IApartment>).length === 0) {
                        res.status(404).json({ error: 'data not found' })
                        return
                }
                res.json({ data: dataDB })
        })
        // NO TOCAR
        // .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        //         const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        //         let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, true)
        //         let _estado = ((req.body.estado && (req.body.estado.toString() == '1' || req.body.estado.toString() == '0')) ? parseInt(req.body.estado as string) : -2) as StatusDataType
                
        //         let data: IApartment = {
        //                 pais: req.body.pais || '',
        //                 ciudad: req.body.ciudad || '',
        //                 codigo_postal: req.body.codigo_postal || '',
        //                 direccion: req.body.direccion || '',
        //                 nro_edificio: req.body.nro_edificio || '',
        //                 nro_piso: req.body.nro_piso || '',
        //                 id_dispositivo_ref: req.body.id_dispositivo_ref || '',
        //                 ubicacion_mapa: req.body.ubicacion_mapa || '',
        //                 observaciones: req.body.observaciones || '',
        //                 idusuario: idUserLogin,
        //                 etiqueta: req.body.etiqueta || '',
        //                 estado: _estado,
        //                 ocupacion_maxima: req.body.ocupacion_maxima || 0,
        //                 m2: req.body.m2 || 0.00,
        //                 nro_dormitorios: req.body.nro_dormitorios || 0,
        //                 nro_camas: req.body.nro_camas || 0,
        //                 nro_banios: req.body.nro_banios || 0,
        //                 aire_acondicionado: (req.body.aire_acondicionado === undefined || req.body.aire_acondicionado == '-2') ? false : req.body.aire_acondicionado,
        //                 calefaccion: (req.body.calefaccion === undefined || req.body.calefaccion == '-2') ? false : req.body.calefaccion,
        //                 ascensor: (req.body.ascensor === undefined || req.body.ascensor == '-2') ? false : req.body.ascensor,
        //                 discapacidad: (req.body.discapacidad === undefined || req.body.discapacidad == '-2') ? false : req.body.discapacidad,
        //                 descripcion_camas: req.body.descripcion_camas || '',
        //                 descripcion_banios: req.body.descripcion_banios || '',
        //                 nro_sofacama: req.body.nro_sofacama || 0,
        //                 descripcion_sofacama: req.body.descripcion_sofacama || '',
        //                 zonas: req.body.zonas || '',
        //                 propietarios: req.body.propietarios || []
        //         }
        //         let dataDB: IApartment | IErrorResponse = await el.insertDA(data)
        //         if ( !dataDB ) {
        //                 res.status(404).json({ error: 'data not found' })
        //                 return
        //         }
        //         if ( ({ ...dataDB } as IErrorResponse).error ) {
        //                 // 409: conflicto con los datos enviados
        //                 res.status(409).json(dataDB as IErrorResponse)
        //                 return
        //         }
                
        //         res.json({ data: dataDB })
        //     })
            //Añadir esta funcion cuando el front tenga los campos que hay que añadir 
        .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
               
                
                const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
                let el: ApartmentBusiness = new ApartmentBusiness(idUserLogin, filterState, true)
                let _estado = ((req.body.estado && (req.body.estado.toString() == '1' || req.body.estado.toString() == '0')) ? parseInt(req.body.estado as string) : -2) as StatusDataType

                let data: IApartment = {
                        pais: req.body.pais || '',
                        ciudad: req.body.ciudad || '',
                        codigo_postal: req.body.codigo_postal || '',
                        direccion: req.body.direccion || '',
                        nro_edificio: req.body.nro_edificio || '',
                        nro_piso: req.body.nro_piso || '',
                        id_dispositivo_ref: req.body.id_dispositivo_ref || '',
                        ubicacion_mapa: req.body.ubicacion_mapa || '',
                        observaciones: req.body.observaciones || '',
                        idusuario: idUserLogin,
                        etiqueta: req.body.etiqueta || '',
                        estado: _estado,      
                        tipo : req.body.tipo || '',              
                        cp_ocupacion_maxima: parseInt(req.body.cp_ocupacion_maxima) || 0,
                        cp_m2: req.body.cp_m2 || 0.00,
                        ds_nro_dormitorios: parseInt(req.body.ds_nro_dormitorios) || 0,
                        ds_nro_camas: parseInt(req.body.ds_nro_camas) || 0,
                        bs_nro_banios: parseInt(req.body.bs_nro_banios) || 0,
                        ca_aire_acondicionado: (req.body.ca_aire_acondicionado === undefined || req.body.ca_aire_acondicionado == '-2') ? false : req.body.ca_aire_acondicionado,
                        ca_calefaccion: (req.body.ca_calefaccion === undefined || req.body.ca_calefaccion == '-2') ? false : req.body.ca_calefaccion,
                        cp_ascensor: (req.body.cp_ascensor === undefined || req.body.cp_ascensor == '-2') ? false : req.body.cp_ascensor,
                        ca_discapacidad: (req.body.ca_discapacidad === undefined || req.body.ca_discapacidad == '-2') ? false : req.body.ca_discapacidad,
                        ds_descripcion_camas: req.body.ds_descripcion_camas || '',
                        // descripcion_banios: req.body.descripcion_banios || '',
                        ds_nro_sofacama: parseInt(req.body.ds_nro_sofacama) || 0,
                        ds_descripcion_sofacama: req.body.ds_descripcion_sofacama || '',
                        if_zonas: req.body.if_zonas || '',
                        propietarios: req.body.propietarios || [],
                        if_clase: req.body.if_clase || '',
                        if_vista: req.body.if_vista || '',
                        cp_estancia_total : parseInt(req.body.cp_estancia_total) || 0,
                        cp_cerradura_puertas: (req.body.cp_cerradura_puertas === undefined || req.body.cp_cerradura_puertas == '-2') ? false : req.body.cp_cerradura_puertas,
                        cp_nro_plantas: parseInt(req.body.cp_nro_plantas) || 0,
                        co_clase_cocina: req.body.co_clase_cocina || '',
                        co_tipo_cocina: req.body.co_tipo_cocina || '',
                        co_tipo_cafetera: req.body.co_tipo_cafetera || '',
                        co_freidora: (req.body.co_freidora === undefined || req.body.co_freidora == '-2') ? false : req.body.co_freidora,
                        co_horno: (req.body.co_horno === undefined || req.body.co_horno == '-2') ? false : req.body.co_horno,
                        ah_entrada_independiente: (req.body.ah_entrada_independiente === undefined || req.body.ah_entrada_independiente == '-2') ? false : req.body.ah_entrada_independiente,
                        ah_chimenea: (req.body.ah_chimenea === undefined || req.body.ah_chimenea == '-2') ? false : req.body.ah_chimenea,
                        ah_lavadora: req.body.ah_lavadora || '',
                        ah_caja_fuerte: (req.body.ah_caja_fuerte === undefined || req.body.ah_caja_fuerte == '-2') ? false : req.body.ah_caja_fuerte,
                        ah_minibar: (req.body.ah_minibar === undefined || req.body.ah_minibar == '-2') ? false : req.body.ah_minibar,
                        ah_tipo_tv: req.body.ah_tipo_tv || '',
                        ah_ventilador_techo: (req.body.ah_ventilador_techo === undefined || req.body.ah_ventilador_techo == '-2') ? false : req.body.ah_ventilador_techo,
                        ah_tipo_internet: req.body.ah_tipo_internet || '',
                        ca_aparcamiento_instalaciones: (req.body.ca_aparcamiento_instalaciones === undefined || req.body.ca_aparcamiento_instalaciones == '-2') ? false : req.body.ca_aparcamiento_instalaciones,
                        ca_nro_plazas: parseInt(req.body.ca_nro_plazas) || 0,
                        ca_ubicacion_calefaccion: req.body.ca_ubicacion_calefaccion || '',
                        ca_tipo_calefaccion: req.body.ca_tipo_calefaccion || '',
                        ca_alarma: (req.body.ca_alarma === undefined || req.body.ca_alarma == '-2') ? false : req.body.ca_alarma,
                        ca_alarma_incendios : (req.body.ca_alarma_incendios === undefined || req.body.ca_alarma_incendios == '-2') ? false : req.body.ca_alarma_incendios,
                        ca_balcon: (req.body.ca_balcon === undefined || req.body.ca_balcon == '-2') ? false : req.body.ca_balcon,
                        ca_terraza: (req.body.ca_terraza === undefined || req.body.ca_terraza == '-2') ? false : req.body.ca_terraza,
                        ca_jardin: (req.body.ca_jardin === undefined || req.body.ca_jardin == '-2') ? false : req.body.ca_jardin,
                        ca_piscina: req.body.ca_piscina || '',
                        ca_patio_interior: (req.body.ca_patio_interior === undefined || req.body.ca_patio_interior == '-2') ? false : req.body.ca_patio_interior,
                        cu_zona_bbq: (req.body.cu_zona_bbq === undefined || req.body.cu_zona_bbq == '-2') ? false : req.body.cu_zona_bbq,
                        cu_zona_infantil: (req.body.cu_zona_infantil === undefined || req.body.cu_zona_infantil == '-2') ? false : req.body.cu_zona_infantil,
                        cu_spa: (req.body.cu_spa === undefined || req.body.cu_spa == '-2') ? false : req.body.cu_spa,
                        cu_gimnasio: (req.body.cu_gimnasio === undefined || req.body.cu_gimnasio == '-2') ? false : req.body.cu_gimnasio,
                        plano: req.body.plano || '',
                        if_tipo: req.body.if_tipo || '',
                        bs_nro_aseos : req.body.bs_nro_aseos || 0,
                        bs_descripcion_banios : req.body.bs_descripcion_banios || '',
                        link_source_mantenimiento : req.body.link_source_mantenimiento || ''
                }
        
                let dataDB : IApartment | IErrorResponse = await el.insertDA_info(data)
                if (!dataDB) {
                        res.status(404).json({ error: 'data not found' })
                        return
                }
                if (({ ...dataDB } as IErrorResponse).error) {
                        // 409: conflicto con los datos enviados
                   
                        res.status(409).json(dataDB as IErrorResponse)
                        return
                }

                res.json({ data: dataDB })
        })


export default handler