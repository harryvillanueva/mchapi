import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import MiddlewareInstance from '@/api/helpers/Middleware'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import { IUser } from '@/api/models/IUser'
import UserBusiness from '@/api/business/UserBusiness'
// import UtilInstance from '@/api/helpers/Util'
import Constants from '@/api/helpers/Constants'
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
            const idUserLogin = BigInt((req.headers.iduser)? parseInt(req.headers.iduser as string): 0)
            console.debug('[share/profile] headers.iduser=', req.headers.iduser, ' token=', req.headers.token)
            const filterStatus = (( req.headers.filterStatus ) ? req.headers.filterStatus : Constants.code_status_no_valid) as StatusDataType
            let el: UserBusiness = new UserBusiness(idUserLogin, filterStatus, false)

            let dataDB: IUser | IErrorResponse = await el.getById(idUserLogin)
            console.debug('[share/profile] dataDB result:', dataDB ? 'present' : 'null/undefined')
            
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

export default handler