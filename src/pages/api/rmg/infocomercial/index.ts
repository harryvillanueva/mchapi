import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import InfoPisoComercialBusiness from '@/api/business/InfoPisoComercialBusiness'
import { IInfoPisoComercial } from '@/api/models/IInfoPisoComercial'

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

        let dataFilter = {
            search_all: req.query.search_all as string || '',
            nro_habitaciones: req.query.ds_nro_dormitorios as string || '',
            capacidad_maxima: req.query.cp_ocupacion_maxima as string || '',
            nro_camas: req.query.ds_nro_camas as string || '',
            nro_banios: req.query.bs_nro_banios as string || '',
            total: req.query.total as string || '',
            total_start: req.query.total_start as string || '',
            total_end: req.query.total_end as string || '',
            estado_general: parseInt(req.query.estado_general as string) || -2,
        }

        let el: InfoPisoComercialBusiness = new InfoPisoComercialBusiness(idUserLogin, filterState, false, { filter: dataFilter })
        let dataDB: Array<IInfoPisoComercial> | IErrorResponse | undefined = undefined
        dataDB = await el.getAllPisoAll()

        // If es null
        if ( !dataDB ) {
                res.status(404).json({ error: 'data not found' })
                return
        }
        // Si hay error query
        if ( ({ ...dataDB } as IErrorResponse).error ) {
                let _d = dataDB as IErrorResponse
                if (_d.code === 403) res.status(403).json(_d)
                else res.status(404).json(_d)
                return
        }
        // Si la lista es vacia
        if ( (dataDB as Array<IInfoPisoComercial>).length === 0 ) {
            res.status(404).json({ error: 'data not found' })
            return
        }
        res.json({ data: dataDB })
    })
    .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: InfoPisoComercialBusiness = new InfoPisoComercialBusiness(idUserLogin, filterState, true)
        // 1 -> Activo
        let estado_general = req.body.estado_general ? parseInt(req.body.estado_general) : 1
        let idPiso = parseInt(req.body.idpiso as string) || 0 // Permite NULL
        let typeSaved = req.body.type_saved as string || '' // Verificar el tipo de guardado

        let data: IInfoPisoComercial = {
            nombre_comercial: req.body.nombre_comercial || '',
            link_nombre_comercial: req.body.link_nombre_comercial || '',
            estado_general,
            link_tour_virtual: req.body.link_tour_virtual || '',
            link_calendario_disponibilidad: req.body.link_calendario_disponibilidad || '',
            link_repositorio: req.body.link_repositorio || '',
            tiene_anuncio: req.body.tiene_anuncio || false,
            anuncio_usuario: req.body.anuncio_usuario || '',
            anuncio_contrasenia: req.body.anuncio_contrasenia || '',
            anuncio_plataforma: req.body.anuncio_plataforma || '',
            anuncio_link: req.body.anuncio_link || '',
            idpiso: BigInt(idPiso),

            plataformas: req.body.plataformas || [],
            variablesreserva: req.body.variablesreserva || []
        }

        let dataDB: IInfoPisoComercial | IErrorResponse | undefined = undefined

        // Identificar que campo se va a guardar
        switch( typeSaved ) {
            case 'plataforma': // Solo plataformas
                dataDB = await el.insertByPlataforma(data)
                break
            case 'info-comercial-estado_general': // Solo estado_general
                dataDB = await el.insertByEstadoGeneral(data)
                break
            case 'info-comercial-precio-alquiler': // // Solo precio alquiler [total como daño colateral]
                dataDB = await el.insertByAlquiler(data)
                break
            case 'info-comercial-precio-mueble': // Solo precio de mueble [total como daño colaterial]
                dataDB = await el.insertByPrecioMueble(data)
                break
            case 'info-comercial-precio-limite': // Solo precio limite
                dataDB = await el.insertByPrecioLimite(data)
                break
            default:
                dataDB = undefined
        }

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
    .patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: InfoPisoComercialBusiness = new InfoPisoComercialBusiness(idUserLogin, filterState, true)
        // 1 -> Activo
        let estado_general = (req.body.estado_general === undefined || req.body.estado_general === '' ? 1 : parseInt(req.body.estado_general))
        let idPiso = parseInt(req.body.idpiso as string) || 0 // Permite NULL
        let typeSaved = req.body.type_saved as string || '' // Verificar el tipo de guardado

        let data: IInfoPisoComercial = {
            id: BigInt(req.body.id || 0),
            nombre_comercial: req.body.nombre_comercial || '',
            link_nombre_comercial: req.body.link_nombre_comercial || '',
            estado_general,
            link_tour_virtual: req.body.link_tour_virtual || '',
            link_calendario_disponibilidad: req.body.link_calendario_disponibilidad || '',
            link_repositorio: req.body.link_repositorio || '',
            tiene_anuncio: req.body.tiene_anuncio || false,
            anuncio_usuario: req.body.anuncio_usuario || '',
            anuncio_contrasenia: req.body.anuncio_contrasenia || '',
            anuncio_plataforma: req.body.anuncio_plataforma || '',
            anuncio_link: req.body.anuncio_link || '',
            idpiso: BigInt(idPiso),

            plataformas: req.body.plataformas || [],
            variablesreserva: req.body.variablesreserva || []
        }

        let dataDB: IInfoPisoComercial | IErrorResponse | undefined = undefined

        // Identificar que campo se va a guardar
        switch( typeSaved ) {
            case 'plataforma': // Solo plataformas
                dataDB = await el.updateByPlataforma(BigInt(req.body.id || 0), data)
                break
            case 'info-comercial-estado_general': // Solo estado_general
                dataDB = await el.updateByEstadoGeneral(BigInt(req.body.id || 0), data)
                break
            case 'info-comercial-precio-alquiler': // Solo precio alquiler [total como daño colateral]
                dataDB = await el.updateByAlquiler(BigInt(req.body.id || 0), data)
                break
            case 'info-comercial-precio-mueble': // Solo precio de mueble [total como daño colaterial]
                dataDB = await el.updateByPrecioMueble(BigInt(req.body.id || 0), data)
                break
            case 'info-comercial-precio-limite': // Solo precio limite
                dataDB = await el.updateByPrecioLimite(BigInt(req.body.id || 0), data)
                break
            default:
                dataDB = undefined
        }

        
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
      
export default handler