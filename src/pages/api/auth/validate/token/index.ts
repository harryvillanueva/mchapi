import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import MiddlewareInstance from '@/api/helpers/Middleware'

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
      .use(MiddlewareInstance.validateToken)
      .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
            res.json( { data: {
                                    id: parseInt(req.headers.iduser as string), 
                                    username: req.headers.username}, 
                                    token: (req.headers.token as string),
                                    exp: (parseInt(req.headers.exp as string)) 
                  })
      })

export default handler