import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'

import UtilInstance from '@/api/helpers/Util'
import DeviceBusiness from '@/api/business/DeviceBusiness'
import { IResponse } from '@/api/modelsextra/IResponse'
import { IErrorResponse } from '@/api/modelsextra/IErrorResponse'

const handler = nc({
    onError: (err, req: NextApiRequest, res: NextApiResponse, next) => {
        console.error(err.stack)
        res.status(500).end('Something broke!')
    },
    onNoMatch: (req, res) => {
        res.status(404).end('Page is not found')
    }
})

// GET /api/public/ewelink/map?deviceid=10011e7308
.get(async (req: NextApiRequest, res: NextApiResponse<IResponse | IErrorResponse>) => {
    const { idUserLogin, filterState } = UtilInstance.getDataRequest(req)
    const { deviceid } = req.query
    if (!deviceid) return res.status(400).json({ error: 'deviceid query param required' } as any)

    const lCodes = (deviceid as string).toString().split(',').map(s => s.trim()).filter(s => s.length > 0)
    try {
        const db = new DeviceBusiness(idUserLogin, filterState, false)
        const result = await db.getByListCodes(lCodes)
        return res.json({ data: result })
    } catch (err) {
        console.error('[EWELINK MAP] error', err)
        return res.status(500).json({ error: 'internal' } as any)
    }
})

export default handler
