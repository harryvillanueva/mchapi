const TemplateEmails = {
    getHtmlDefault: () => {
          return `
                <div>
                      <img width="50%" style="text-align: center;" class="txt-center" src="https://i.ibb.co/FxhfMzh/Logo-4.png" alt="MyCityHome">
                      <div>
                            <b>Bienvenido a MyCityHome!!</b>
                            <br />
                            <br />
                            <p class="msg-no-respo" style="font-size: 12px;">Por favor, no responda a este mensaje, ha sido enviada de forma automática. Gracias</p>
                      </div>
                </div>`
    },

    getHtmlSendSolicituLimitePrecio: (piso: string, precioLimite: string, porcentajepl: string) => {
      return `
            <div>
                  <img width="80%" style="text-align: center;" class="txt-center" src="https://i.ibb.co/FxhfMzh/Logo-4.png" alt="MyCityHome">
                  <div>
                        <br />
                        <p style="font-size: 15px;">Le informamos que su solicitud ha sido recibida por nuestro departamento de RMG.</p>
                        <br />
                        <h3>Datos de la solicitud</h3>
                        <p><label style="font-weight: bold; padding-left: 10px;">Piso</label>: ${piso}</p>
                        <p><label style="font-weight: bold; padding-left: 10px;">Precio límite</label>: ${precioLimite} €</p> 
                        <p><label style="font-weight: bold; padding-left: 10px;">% Precio límite</label>: ${porcentajepl} %</p> 
                        <br />
                        <br />
                        <hr />
                        <p class="msg-no-respo" style="font-size: 12px;">Por favor, no responda a este mensaje, ha sido enviado de forma automática. Gracias</p>
                  </div>
            </div>
      `
    },

    getHtmlResponseSolicituLimitePrecio: (piso: string, precioLimite: string, porcentajepl: string, estado: string, observaciones: string) => {
      return `
            <div>
                  <img width="80%" style="text-align: center;" class="txt-center" src="https://i.ibb.co/FxhfMzh/Logo-4.png" alt="MyCityHome">
                  <div>
                        <br />
                        <p style="font-size: 15px;">Le informamos que su solicitud ha sido <span style="font-weight: bold;">${estado}</span></p>
                        <br />
                        <h3>Datos de la solicitud</h3>
                        <p><label style="font-weight: bold; padding-left: 10px;">Piso</label>: ${piso}</p>
                        <p><label style="font-weight: bold; padding-left: 10px;">Precio límite</label>: ${precioLimite} €</p> 
                        <p><label style="font-weight: bold; padding-left: 10px;">% Precio límite</label>: ${porcentajepl} %</p> 
                        <br />
                        <h3>Comentarios</h3>
                        <p>${observaciones || 'Sin comentarios.'}</p>
                        <br />
                        <hr />
                        <p class="msg-no-respo" style="font-size: 12px;">Por favor, no responda a este mensaje, ha sido enviado de forma automática. Gracias</p>
                  </div>
            </div>
      `
    }
}

export default TemplateEmails