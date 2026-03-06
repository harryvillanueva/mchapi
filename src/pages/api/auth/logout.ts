import { serialize } from "cookie";

export default function logoutHandler(req: any, res: any) {
    // En lugar de dar error si no hay token, simplemente limpiamos y salimos.
    // Así evitamos el 401 que rompe el frontend.
    
    const serialized = serialize('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict', 
        maxAge: 0, // Esto borra la cookie inmediatamente
        path: '/'
    })

    res.setHeader('Set-Cookie', serialized)
    
    // Devolvemos siempre 200 para que el Frontend no explote
    return res.status(200).json({ message: 'Logout successfully' })
}