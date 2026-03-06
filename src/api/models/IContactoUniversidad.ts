export interface IContactoUniversidad {
  id?: number;
  nombre: string;
  apellido: string;
  telefono: string;
  telefono2?: string;
  universidad: string;
  tipo: string;
  puesto: string;
  notas?: string;
  email: string;
  portal_web?: string;
  ultima_actualizacion?: string; // ISO date
  siguiente_paso?: string;
  ultima_llamada?: string; // ISO date
  departamento: string; // DA, DN, ADE, LEGAL, RMG, ATIC, CRM, RRHH, TODOS
  usuario_portal?: string;
  contrasena_portal?: string;
  firma_convenio_fecha?: string; // ISO date
  firma_convenio_link?: string;
  vencimiento_convenio?: string; // ISO date
  altas_social?: string;
}
