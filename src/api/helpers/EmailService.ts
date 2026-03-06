import nodemailer from 'nodemailer';
import Constants from './Constants';

class EmailService {
    private _userEmailDefault = "proyectosatic@mycityhome.es"
    private _passEmailDefault = "ohxwqlxqxucwlzul"
    private _emailToDefault = Constants.email_atic

    private _emailFrom = "My City Home"
    private _emailSubject = "My City Home"
    private _bodyEmail = "<h1>Bienvenido a MCH!! &#128520;&#128520; jajajaja</h1>"

    private transporter = nodemailer.createTransport({
        tls: {
              rejectUnauthorized: false
        },
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: this._userEmailDefault,
            pass: this._passEmailDefault
        }
    })

    private mail_options = {
        from: this._emailFrom,
        subject: this._emailSubject,
        html: this._bodyEmail,
        to: this._emailToDefault
    }

    constructor() {}

    /**
     * Configuración de los parametros para envio de correo electronico.
     * Se puede cambiar la configuración de la cuenta de envio de correo
     * @param from  : Parametro para el envio al correo
     * @param subject : Parametro para envio al correo
     * @param templateHtml : Parametro para envio al correo
     * @param emailConfig : Parametro configuracion cliente envio correo
     * @param passConfig : Parametro configuracion cliente envio pass
     */
    changeMailOptions = (from: string, subject: string, templateHtml: string, emailConfig: string = '', passConfig: string = '') => {
        from && (this.mail_options.from = from)
        subject && (this.mail_options.subject = subject)
        templateHtml && (this.mail_options.html = templateHtml)
        
        // cambiar la configuración de envio de correos
        if ( emailConfig.length !== 0 && passConfig.length !== 0 ) {
            this.transporter = nodemailer.createTransport({
                tls: {
                      rejectUnauthorized: false
                },
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: emailConfig,
                    pass: passConfig
                }
            })
        }
    }

    /**
     * Método que envia correo electronico
     * @param emails 
     * @returns 
     */
    sendEmail = (emails: string = this._emailToDefault): boolean => {
        if ( emails.length === 0 ) return false
        this.mail_options.to = emails
        try {
            this.transporter.sendMail(this.mail_options, (error, info) => {
                if (error) {
                    console.log(error);
                    return false
                } else console.log('El correo se envío correctamente ' + info.response);
            })
        } catch(err) {
            console.log('Error al enviar email!!')
            return false
        }
        return true
    }
}

const EmailServiceInstance = new EmailService()
Object.freeze(EmailServiceInstance)

export default EmailServiceInstance