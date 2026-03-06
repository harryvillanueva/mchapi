declare module 'next' {
  import type { IncomingMessage, ServerResponse } from 'http'
  export type NextApiRequest = IncomingMessage & { body?: any; query?: any; cookies?: any }
  export type NextApiResponse<T = any> = ServerResponse & { json: (body: T) => void; status: (code: number) => NextApiResponse<T>; setHeader: (name: string, value: string) => void }
}

declare module 'next-connect' {
  import type { NextApiRequest, NextApiResponse } from 'next'
  type NextHandler = (err?: any) => void
  interface NextConnectOptions {
    onError?: (err: any, req: NextApiRequest, res: NextApiResponse, next: NextHandler) => void
    onNoMatch?: (req: NextApiRequest, res: NextApiResponse) => void
  }
  function nc(opts?: NextConnectOptions): any
  export default nc
}
