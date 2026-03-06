import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import { IUser } from '@/api/models/IUser'
import UserBusiness from '@/api/business/UserBusiness'
import UtilInstance from '@/api/helpers/Util'
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
      .delete(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
        let el: UserBusiness = new UserBusiness(idUserLogin, filterState, true)
        
        let dataDB: IUser | IErrorResponse = await el.deleteRRHH(BigInt(parseInt(req.query.id as string)))
        if ( !dataDB ) {
              res.status(404).json({ error: 'data not found' })
              return
        }
        if ( ({ ...dataDB } as IErrorResponse).error ) {
              // No conflicto, verificar el status del error y ver si el usuario puede eliminar el registro
              res.status(409).json(dataDB as IErrorResponse)
              return
        }
        res.json({ data: dataDB })
  })

export default handler