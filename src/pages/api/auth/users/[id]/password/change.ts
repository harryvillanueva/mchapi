import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import AuthUserBusiness from '@/api/business/AuthUserBusiness'
import { IAuthUser } from '@/api/modelsextra/IAuthUser'

const handler = nc({
      onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
            console.error(err.stack);
            res.status(500).end("Something broke!");
      },
      onNoMatch: (req: NextApiRequest, res: NextApiResponse) => {
            res.status(404).end("Page is not found");
      }
})
.use(MiddlewareInstance.verifyToken)
.patch(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => { 
      const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)
      let el: AuthUserBusiness = new AuthUserBusiness()

      const _id = BigInt(parseInt(req.query.id as string))
      const _passwordCurrent = req.body.password_current || ''
      const _passwordNew = req.body.password_new || ''
      
      let dataDB: IAuthUser | IErrorResponse = await el.changePassword(_id, _passwordCurrent, _passwordNew, idUserLogin)
            
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