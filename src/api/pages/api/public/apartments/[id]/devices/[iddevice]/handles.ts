// Re-exportar el handler desde la carpeta 'handles' para evitar conflicto entre
// archivo y directorio con el mismo nombre. Esto asegura que la ruta
// `/api/public/apartments/[id]/devices/[iddevice]/handles` use el handler
// implementado en `handles/index.ts`.

export { default } from './handles/index';
