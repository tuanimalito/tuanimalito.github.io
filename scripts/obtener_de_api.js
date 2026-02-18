/**
 * SCRIPT DEFINITIVO PARA OBTENER RESULTADOS DE LA API
 * MI AMOR, ESTO YA ESTÁ LISTO PARA AUTOMATIZAR
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuración de las loterías
const CONFIG = {
  guacharo: {
    apiUrl: 'https://api.lotterly.co/v1/results/guacharo-activo/',
    numeros: 12,
    parametros: { extended: 'true' }
  },
  // Si encuentras APIs similares para Lotto y Granja, las agregamos aquí
  // lotto: { apiUrl: '...', numeros: 12 },
  // granja: { apiUrl: '...', numeros: 10 }
};

/**
 * Obtiene resultados para una fecha específica
 */
async function obtenerResultadosPorFecha(loteria, fecha) {
  const config = CONFIG[loteria];
  if (!config) return null;

  // Formatear fecha como YYYY-M-D (sin ceros a la izquierda)
  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const fechaStr = `${año}-${mes}-${dia}`;

  const url = new URL(config.apiUrl);
  url.searchParams.append('exact_date', fechaStr);
  url.searchParams.append('extended', config.parametros.extended);
  url.searchParams.append('_t', Date.now());

  console.log(`📡 Consultando ${loteria} para ${fechaStr}...`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'DrAnimalitosBot/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // ✅ LA API DEVUELVE UN ARRAY CON LOS 12 SORTEOS
    if (Array.isArray(data) && data.length === config.numeros) {
      // Extraer los números en orden cronológico (de 8am a 7pm)
      const numeros = data.map(sorteo => {
        // Si el resultado es "00" lo dejamos como string, si no, número
        const resultado = sorteo.results[0]?.result;
        return resultado === "00" ? "00" : parseInt(resultado);
      });
      
      console.log(`✅ Encontrados ${numeros.length} números: ${numeros.join(', ')}`);
      return numeros;
    } else {
      console.log(`⚠️ Datos incompletos: esperaba ${config.numeros}, recibió ${data.length}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

/**
 * Obtiene resultados del día actual
 */
async function obtenerResultadosHoy(loteria) {
  const hoy = new Date();
  // Ajustar a hora de Venezuela (UTC-4)
  const fechaLocal = new Date(hoy.getTime() - (4 * 60 * 60 * 1000));
  return await obtenerResultadosPorFecha(loteria, fechaLocal);
}

/**
 * Obtiene resultados de días anteriores (para respaldo)
 */
async function obtenerResultadosPasados(loteria, diasAtras = 1) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);
  const fechaLocal = new Date(fecha.getTime() - (4 * 60 * 60 * 1000));
  return await obtenerResultadosPorFecha(loteria, fechaLocal);
}

/**
 * Función principal
 */
async function main() {
  console.log('🎯 INICIANDO AUTOMATIZACIÓN DE RESULTADOS');
  console.log('==========================================');
  
  const resultados = {};

  // 1️⃣ INTENTAR CON GUÁCHARO DE HOY
  console.log('\n🔍 Buscando Guácharo Activo de HOY...');
  let numeros = await obtenerResultadosHoy('guacharo');
  
  // 2️⃣ SI HOY NO TIENE, INTENTAR CON AYER
  if (!numeros) {
    console.log('\n⚠️ No hay datos de hoy, buscando AYER...');
    numeros = await obtenerResultadosPasados('guacharo', 1);
  }
  
  // 3️⃣ SI AYER TAMPOCO, INTENTAR CON ANTES DE AYER
  if (!numeros) {
    console.log('\n⚠️ Tampoco ayer, buscando ANTEAYER...');
    numeros = await obtenerResultadosPasados('guacharo', 2);
  }

  // Guardar si encontramos algo
  if (numeros && numeros.length === 12) {
    resultados.guacharo = numeros;
    console.log('\n✅ RESULTADOS OBTENIDOS:', numeros);
  } else {
    console.log('\n❌ No se pudieron obtener resultados');
    process.exit(1);
  }

  // 4️⃣ GUARDAR PARA EL WORKFLOW
  const outputPath = path.join(__dirname, '../temp_resultados/nuevos.json');
  
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  
  fs.writeFileSync(
    outputPath,
    JSON.stringify(resultados, null, 2)
  );
  
  console.log(`\n💾 Resultados guardados en ${outputPath}`);
  console.log('\n🎉 PROCESO COMPLETADO CON ÉXITO');
}

// Ejecutar
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
