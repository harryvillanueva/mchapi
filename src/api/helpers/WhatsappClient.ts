import { Client, LocalAuth } from 'whatsapp-web.js';

export const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    // Opcional: parámetros para entornos de producción o restricciones de sandbox
    args: ['--no-sandbox', 
      '--disable-setuid-sandbox',    
    ]
  }
});

// Registra los eventos globalmente (se ejecutan una sola vez)
client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('disconnected', (reason: string) => {
  console.log('Client disconnected:', reason);
});

client.on('auth_failure', (msg: string) => {
  console.error('Authentication failure:', msg);
});

client.on('change_state', (state: any) => {
  console.log('Client state changed:', state);
});

client.on('browser_close', () => {
  console.error('Browser was closed unexpectedly');
});

// Inicializa el cliente una única vez
client.initialize().catch(err => console.error('Error during client.initialize():', err));

