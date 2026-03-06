import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import { IUser } from '@/api/models/IUser'
import UserBusiness from '@/api/business/UserBusiness'
import UtilInstance from '@/api/helpers/Util'
import { jornadaType } from '@/api/types/GlobalTypes'

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
      // .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
      //       const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
      //       let el: UserBusiness = new UserBusiness(idUserLogin, filterState, false)
      //       let dataDB: Array<IUser> | IErrorResponse = await el.getRRHH()

      //       // If es null
      //       if ( !dataDB ) {
      //             res.status(204).json({ error: 'data not found' })
      //             return
      //       }
      //       // Si hay error query
      //       if ( ({ ...dataDB } as IErrorResponse).error ) {
      //             let _d = dataDB as IErrorResponse
      //             if (_d.code === 403) res.status(403).json(_d)
      //             else res.status(404).json(_d)
      //             return
      //       }
      //       // Si la lista es vacia
      //       if ( (dataDB as Array<IUser>).length === 0 ) {
      //             res.status(204).json({ error: 'data not found' })
      //             return
      //       }
      //       res.json({ data: dataDB })
      // })
      .get(async (req , res : NextApiResponse <IResponse  | IErrorResponse>)=>{
            const {idUserLogin , filterState} = UtilInstance.getDataRequest(req)
            let el : UserBusiness = new UserBusiness(idUserLogin , filterState, false)
            let dataDB : Array <IUser> | IErrorResponse = await el.getAllRRHH()

            //Si es null
            if(!dataDB){
                  res.status(204).json({error : 'data not found'})
                  return
            }

            //Si hay un error en la query

            if(({...dataDB} as IErrorResponse).error){
                  let _d = dataDB as IErrorResponse
                  if(_d.code === 403) res.status(403).json(_d)
                  else res.status(404).json(_d)
                  return
            }

            //Si el array esta vacio

            if((dataDB as Array <IUser>).length === 0){
                  res.status(204).json({ error : 'data not found'})
                  return
            }

            res.json({data : dataDB})
      })
      // .post(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => { 
      //       const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
      //       let el: UserBusiness = new UserBusiness(idUserLogin, filterState, true)
      //       let data: IUser = {
      //             email: req.body.email ||  '',
      //             password: req.body.password ||  '',
      //             nombre: req.body.nombre ||  '',
      //             apellido: req.body.apellido ||  '',
      //             idrol: req.body.idrol ||  '',
      //             username: req.body.username ||  '',
      //             idusuario: idUserLogin,
      //             nombre_completo: req.body.nombre_completo || ''
      //       }
      //       let dataDB: IUser | IErrorResponse = await el.insertRRHH(data)
      //       if ( !dataDB ) {
      //             res.status(204).json({ error: 'data not found' })
      //             return
      //       }
      //       if ( ({ ...dataDB } as IErrorResponse).error ) {
      //             // 409: conflicto con los datos enviados
      //             res.status(409).json(dataDB as IErrorResponse)
      //             return
      //       }
            
      //       res.json({ data: dataDB })
      // })


      // HAY QUE ESPERAR A QUE SE METAN LOS NUEVOS CAMPOS EN EL FRONT, NO TOCAR!! Y PARA PRUEBAS
      // DESCOMENTAR LO DE ABAJO PERO ASEGURARSE QUE SE DESCOMENTA LO DE ARRIBA ANTES DE SUBIR 
      .post(async(req, res : NextApiResponse <IResponse | IErrorResponse>)=>{
            const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)

            let el: UserBusiness = new UserBusiness(idUserLogin, filterState, true)

            let data : IUser = {
                username : req.body.username || '',
                email : req.body.email || '',
                password : req.body.password || '',
                nombre : req.body.nombre || '',
                apellido : req.body.apellido || '',
                idusuario : idUserLogin,
                cumpleanyos : req.body.cumpleanyos || '',
                correo_personal : req.body.correo_personal || '',
                detalles : req.body.detalles || '',
                alta_ss : req.body.alta_ss || '',
                etapa : req.body.etapa || '',
                jornada : req.body.jornada || '',
                nombre_completo : req.body.nombre_completo || '',
                idrol : req.body.idrol || '',
                horario : req.body.horario || ''
            }

            let dataDB: IUser | IErrorResponse = await el.insertRRHH_(data)
            if ( !dataDB ) {
                  res.status(204).json({ error: 'data not found' })
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