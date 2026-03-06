import type { NextApiRequest, NextApiResponse } from 'next'
import Constants from '@/api/helpers/Constants'
import UserBusiness from '@/api/business/UserBusiness'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      try {
            const headers = req.headers || {}
            const rawId = (headers.idlogin || (headers['x-idlogin'] as string) || headers.iduser || '0') as string
            const idLogin = BigInt(parseInt(rawId as string || '0'))
            const rawFilter = (headers.filterstatus || (headers['filterStatus'] as string) || '') as string
            const filterStatus = (rawFilter ? parseInt(rawFilter) : 1) as any // force 1 for testing if not provided

            // Intentamos consultar la DB usando UserBusiness.getById para el idLogin
            let dbResult: any = null
            if (idLogin && idLogin > 0) {
                  const ub = new UserBusiness(idLogin, filterStatus, false)
                  dbResult = await ub.getById(idLogin)
            }

            res.status(200).json({
                  ok: true,
                  headers: headers,
                  idLogin: idLogin.toString(),
                  filterStatus: filterStatus,
                  dbResult: dbResult
            })
      } catch (err) {
            console.error('[debug/headers] error:', err)
            res.status(500).json({ error: 'internal error', detail: err })
      }
}
