import crypto from 'crypto'

const hash256 = (password: string) => {
    let hash = crypto.createHash('sha256');
    let originalValue = hash.update(password, 'utf-8');
    return originalValue.digest('hex');

}

export default async function loginHandler(req: any, res: any) {
    res.json(hash256(req.query.password))
}