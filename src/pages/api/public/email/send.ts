import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'
import { IResponse } from '@/api/modelsextra/IResponse'
import UtilInstance from '@/api/helpers/Util'
import ParametrosGeneralesBusiness from '@/api/business/ParametrosGeneralesBusiness';
import { IParametrosGenerales } from '@/api/models/IParametrosGenerales';
import EmailServiceInstance from '@/api/helpers/EmailService'

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
    .get(async (req, res: NextApiResponse<IResponse | IErrorResponse>) => {
        const {idUserLogin, filterState} = UtilInstance.getDataRequest(req)

        // Recuperar datos de db [Parametros generales]
        // let el: ParametrosGeneralesBusiness = new ParametrosGeneralesBusiness(idUserLogin, filterState, false)
        // let dataDB: IParametrosGenerales | IErrorResponse = await el.getByCode('TOKEN-EWELINK')
        // dataDB = dataDB as IParametrosGenerales
        
        const response = EmailServiceInstance.sendEmail()

        res.json({ data: response })
    })

export default handler