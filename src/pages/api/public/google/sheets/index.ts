import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import path from 'path'
import fs from 'fs'
import * as crypto from 'crypto'
import { SignJWT } from 'jose'

const handler = nc()

// Allow simple CORS for public usage from the client
handler.use((req: NextApiRequest, res: NextApiResponse, next: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
})

async function getServiceAccount() {
  // Path: go up one from mchApi-main to workspace root, then to mchapp-new-main/modules/credentials
  const credsPath = path.join(process.cwd(), '..', 'mchapp-new-main', 'modules', 'credentials', 'GoogleAPI.json')
  if (!fs.existsSync(credsPath)) return null
  const raw = fs.readFileSync(credsPath, 'utf8')
  try {
    const sa = JSON.parse(raw)
    // Normalize private_key newlines if necessary (some JSON keep them escaped)
    if (sa.private_key && typeof sa.private_key === 'string') {
      sa.private_key = sa.private_key.replace(/\\n/g, '\n')
    }
    return sa
  } catch (e) {
    return null
  }
}

async function getAccessToken(sa: any) {
  const now = Math.floor(Date.now() / 1000)
  const iat = now
  const exp = now + 3600

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly'
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(await importPrivateKey(sa.private_key))

  const params = new URLSearchParams()
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  params.append('assertion', jwt)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  if (!tokenRes.ok) {
    const txt = await tokenRes.text()
    throw new Error(`token request failed ${tokenRes.status} ${txt}`)
  }
  const data = await tokenRes.json()
  return data.access_token
}

async function importPrivateKey(pem: string) {
  // jose accepts PKCS8 PEM directly via importSPKI/importPKCS8, but SignJWT.sign accepts a KeyLike.
  // Use Node's crypto to create a KeyObject.
  return crypto.createPrivateKey({ key: pem, format: 'pem', type: 'pkcs8' })
}

handler.get(async (req: NextApiRequest, res: NextApiResponse) => {
  const { spreadsheetId, range } = req.query
  if (!spreadsheetId || !range) {
    res.status(400).json({ error: 'spreadsheetId and range query parameters are required' })
    return
  }

  const sa = await getServiceAccount()
  if (!sa) {
    res.status(500).json({ error: 'Service account credentials not found on server' })
    return
  }

  try {
    console.debug('[sheets] using service account:', sa.client_email)
    const token = await getAccessToken(sa)
    const encodedRange = encodeURIComponent(String(range))
    const sheetId = encodeURIComponent(String(spreadsheetId))
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}`
    console.debug('[sheets] requesting url=', url)
    const sheetRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!sheetRes.ok) {
      const txt = await sheetRes.text()
      res.status(sheetRes.status).json({ error: txt })
      return
    }
    const data = await sheetRes.json()
    res.json({ data })
  } catch (err: any) {
    console.error('Error fetching sheet', err)
    res.status(500).json({ error: err.message || String(err) })
  }
})

export default handler
