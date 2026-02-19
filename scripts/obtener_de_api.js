/**
 * SCRIPT DEFINITIVO - Dr. Animalitos
 * CONFIGURACIÓN PARA LAS 4 LOTERÍAS:
 * - Guácharo Activo (12 números) ✅ CORREGIDO
 * - Granja Millonaria (10 números) ✅ FUNCIONA
 * - Granjazo Millonario (10 números) ✅ FUNCIONA
 * - Lotto Activo (12 números) ✅ CORREGIDO
 * 
 * MI AMOR, AHORA SÍ, TODAS VAN A FUNCIONAR 🚀
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN DE LAS 4 LOTERÍAS
// ============================================
const CONFIG = {
  // 🦜 GUÁCHARO ACTIVO (12 números) - CORREGIDO
  guacharo: {
    apiUrl: 'https://api.lotterly.co/v1/results/guacharo-activo/',
    numeros: 12,
    nombre: 'Guácharo Activo',
    procesar: async (fecha) => {
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      const url = `${CONFIG.guacharo.apiUrl}?exact_date=${fechaStr}&extended=true&_t=${Date.now()}`;
      
      console.log(`   📡 URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DrAnimalitosBot/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length === 12) {
        return data.map(sorteo => {
          const resultado = sorteo.results?.[0]?.result;
          return resultado === "00" ? "00" : parseInt(resultado);
        });
      }
      return null;
    }
  },

  // 🐔 GRANJA MILLONARIA (10 números) - YA FUNCIONA
  granja: {
    apiUrl: 'http://www.granjamillonaria.com/Resource?a=animalitos-hoy',
    numeros: 10,
    nombre: 'Granja Millonaria',
    procesar: async () => {
      const response = await fetch(CONFIG.granja.apiUrl, {
        headers: {
          'User-Agent': 'DrAnimalitosBot/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (!data.rss || !Array.isArray(data.rss)) return null;
      
      const numeros = data.rss
        .filter(item => item.nu)
        .map(item => parseInt(item.nu))
        .slice(0, 10);
      
      return numeros.length === 10 ? numeros : null;
    }
  },

  // 🦁 GRANJAZO MILLONARIO (10 números) - YA FUNCIONA
  granjazo: {
    apiUrl: 'http://www.granjamillonaria.com/Resource?a=granjazo-hoy',
    numeros: 10,
    nombre: 'Granjazo Millonario',
    procesar: async () => {
      const response = await fetch(CONFIG.granjazo.apiUrl, {
        headers: {
          'User-Agent': 'DrAnimalitosBot/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (!data.rss || !Array.isArray(data.rss)) return null;
      
      const numeros = data.rss
        .filter(item => item.nu)
        .map(item => parseInt(item.nu))
        .slice(0, 10);
      
      return numeros.length === 10 ? numeros : null;
    }
  },

  // 🎲 LOTTO ACTIVO (12 números) - CORREGIDO
  lotto: {
    apiUrl: 'https://resultados365.com/api/v1/resultados',
    numeros: 12,
    nombre: 'Lotto Activo',
    procesar: async (fecha) => {
      const fechaStr = fecha.toISOString().split('T')[0];
      const url = `https://resultados365.com/api/v1/resultados?tipo=1&fecha=${fechaStr}`;
      
      console.log(`   📡 URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DrAnimalitosBot/1.0',
          'Accept': 'application/json',
          'Referer': 'https://resultados365.com/',
          'Origin': 'https://resultados365.com',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.result && Array.isArray(data.data)) {
        const lottoSort = data.data.filter(item => 
          item.nombre && item.nombre.includes('Lotto Activo')
        );
        
        if (lottoSort.length === 12) {
          return lottoSort.map(item => parseInt(item.ganador));
        }
      }
      return null;
    }
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene resultados para una fecha específica
 */
async function obtenerResultadosPorFecha(loteria, fecha) {
  const config = CONFIG[loteria];
  if (!config) return null;

  try {
    console.log(`📡 Consultando ${config.nombre}...`);

    // Cada lotería tiene su propia lógica de procesamiento
    return await config.procesar(fecha);
    
  } catch (error) {
    console.error(`❌ Error en ${config.nombre}:`, error.message);
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

// ============================================
// ACTUALIZACIÓN DE ARCHIVOS JSON
// ============================================

/**
 * Actualiza un archivo JSON con nuevos resultados
 */
function actualizarJSON(loteria, nuevosNumeros) {
  const ruta = path.join(__dirname, `../data/${loteria}.json`);
  
  if (!fs.existsSync(ruta)) {
    console.error(`❌ No existe ${ruta}`);
    return false;
  }

  try {
    const actual = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const [diaViejo, diaMedio, diaReciente] = actual.resultados;
    
    // Rotar: [día medio, día reciente, día nuevo]
    actual.resultados = [diaMedio, diaReciente, nuevosNumeros];
    actual.fecha_actualizacion = new Date().toISOString();
    
    fs.writeFileSync(ruta, JSON.stringify(actual, null, 2));
    console.log(`✅ ${loteria}.json actualizado`);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando ${loteria}.json:`, error.message);
    return false;
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
  console.log('🎯 INICIANDO AUTOMATIZACIÓN DE RESULTADOS');
  console.log('==========================================');
  console.log('📅 Fecha:', new Date().toLocaleString('es-VE'));
  console.log('');

  const resultados = {};
  const loterias = ['guacharo', 'granja', 'granjazo', 'lotto'];
  const numerosEsperados = { guacharo: 12, granja: 10, granjazo: 10, lotto: 12 };

  // 1️⃣ INTENTAR CON HOY PARA CADA LOTERÍA
  for (const loteria of loterias) {
    console.log(`\n🔍 Buscando ${CONFIG[loteria].nombre}...`);
    
    let numeros = await obtenerResultadosHoy(loteria);
    
    // Si hoy no tiene, intentar con ayer
    if (!numeros || numeros.length !== numerosEsperados[loteria]) {
      console.log(`⚠️ No hay datos de hoy, buscando ayer...`);
      numeros = await obtenerResultadosPasados(loteria, 1);
    }
    
    // Si ayer tampoco, intentar con anteayer
    if (!numeros || numeros.length !== numerosEsperados[loteria]) {
      console.log(`⚠️ Tampoco ayer, buscando anteayer...`);
      numeros = await obtenerResultadosPasados(loteria, 2);
    }

    if (numeros && numeros.length === numerosEsperados[loteria]) {
      resultados[loteria] = numeros;
      console.log(`✅ ${CONFIG[loteria].nombre}: ${numeros.length} números obtenidos`);
      console.log('   Números:', numeros.join(', '));
    } else {
      console.log(`❌ No se pudieron obtener resultados para ${CONFIG[loteria].nombre}`);
    }
  }

  // 2️⃣ ACTUALIZAR ARCHIVOS JSON
  console.log('\n📦 ACTUALIZANDO ARCHIVOS JSON...');
  console.log('==========================================');
  
  let actualizados = 0;
  for (const loteria of loterias) {
    if (resultados[loteria]) {
      if (actualizarJSON(loteria, resultados[loteria])) {
        actualizados++;
      }
    }
  }

  // 3️⃣ RESUMEN FINAL
  console.log('\n🎉 RESUMEN FINAL');
  console.log('==========================================');
  console.log(`✅ Loterías actualizadas: ${actualizados} de ${loterias.length}`);
  console.log(`📊 Detalle:`);
  for (const loteria of loterias) {
    const estado = resultados[loteria] ? '✅' : '❌';
    console.log(`   ${estado} ${CONFIG[loteria].nombre}`);
  }
  console.log('');
  console.log('⏰ Próxima ejecución: Esta noche a las 11:00 PM');
  console.log('==========================================');
}

// Ejecutar
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
