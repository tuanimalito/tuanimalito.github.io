/**
 * SCRIPT DEFINITIVO CON FETCH FUNCIONANDO EN NODE.JS
 */

// ✅ IMPORTANTE: Agregamos esta línea para que fetch funcione
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuración de las loterías
const CONFIG = {
  guacharo: {
    apiUrl: 'https://api.lotterly.co/v1/results/guacharo-activo/',
    numeros: 12,
    parametros: { extended: 'true' }
  }
};

/**
 * Obtiene resultados para una fecha específica
 */
async function obtenerResultadosPorFecha(loteria, fecha) {
  const config = CONFIG[loteria];
  if (!config) return null;

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
    
    if (Array.isArray(data) && data.length === config.numeros) {
      const numeros = data.map(sorteo => {
        const resultado = sorteo.results[0]?.result;
        return resultado === "00" ? "00" : parseInt(resultado);
      });
      console.log(`✅ Encontrados ${numeros.length} números`);
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

async function obtenerResultadosHoy(loteria) {
  const hoy = new Date();
  const fechaLocal = new Date(hoy.getTime() - (4 * 60 * 60 * 1000));
  return await obtenerResultadosPorFecha(loteria, fechaLocal);
}

async function obtenerResultadosPasados(loteria, diasAtras = 1) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);
  const fechaLocal = new Date(fecha.getTime() - (4 * 60 * 60 * 1000));
  return await obtenerResultadosPorFecha(loteria, fechaLocal);
}

async function main() {
  console.log('🎯 INICIANDO AUTOMATIZACIÓN DE RESULTADOS');
  console.log('==========================================');
  
  const resultados = {};

  console.log('\n🔍 Buscando Guácharo Activo de HOY...');
  let numeros = await obtenerResultadosHoy('guacharo');
  
  if (!numeros) {
    console.log('\n⚠️ No hay datos de hoy, buscando AYER...');
    numeros = await obtenerResultadosPasados('guacharo', 1);
  }
  
  if (!numeros) {
    console.log('\n⚠️ Tampoco ayer, buscando ANTEAYER...');
    numeros = await obtenerResultadosPasados('guacharo', 2);
  }

  if (numeros && numeros.length === 12) {
    resultados.guacharo = numeros;
    console.log('\n✅ RESULTADOS OBTENIDOS:', numeros);
  } else {
    console.log('\n❌ No se pudieron obtener resultados');
    process.exit(1);
  }

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

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
