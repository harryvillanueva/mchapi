/* eslint-disable */
const axios = require('axios');

async function diagnosticoOficialWeLock() {
  console.log("1. Conectando con los servidores oficiales de WeLock...");
  
  try {
    // PASO 1: Login según la nueva documentación
    const authRes = await axios.post('https://api.we-lock.com/API/Auth/Token', {
      appID: 'WELOCK2202161033',
      secret: '349910dfcdfac75df0fd1cf2cbb02adb' // <-- Espacio corregido aquí
    });

    if (authRes.data.code !== 0) {
      console.log("? WeLock rechazó las credenciales:", authRes.data);
      return;
    }
    
    const token = authRes.data.data.accessToken;
    console.log("? ¡Conexión exitosa! Token WeLock generado:", token);

    // PASO 2: Buscar las cerraduras de tu cuenta (DeviceLibrary)
    console.log("\n2. Buscando cerraduras en tu cuenta MyCityHome...");
    const libraryRes = await axios.post('https://api.we-lock.com/API/Device/DeviceLibrary', 
      {
        appID: 'WELOCK2202161033'
      }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log("?? Cerraduras encontradas (Librería):");
    console.dir(libraryRes.data, { depth: null });

  } catch (error) {
    console.log("? Error de red HTTP:", error.message);
    if (error.response) console.log(error.response.data);
  }
}

diagnosticoOficialWeLock();