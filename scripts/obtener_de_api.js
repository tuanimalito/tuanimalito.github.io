/**
 * SCRIPT DEFINITIVO - Dr. Animalitos
 * CONFIGURACIÓN PARA LAS 4 LOTERÍAS:
 * - Guácharo Activo (12 números) ✅ API oficial
 * - Granja Millonaria (10 números) ✅ API oficial con fecha
 * - Granjazo Millonario (10 números) ✅ API oficial con fecha
 * - Lotto Activo (12 números) ✅ API OFICIAL (lottoactivo.com)
 * 
 * MI REY, AHORA SÍ, TODO FUNCIONA PERFECTO 🚀
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN DE LAS 4 LOTERÍAS
// ============================================
const CONFIG = {
  // 🦜 GUÁCHARO ACTIVO (12 números)
  guacharo: {
    apiUrl: 'https://api.lotterly.co/v1/results/guacharo-activo/',
    numeros: 12,
    nombre: 'Guácharo Activo',
    procesar: async (fecha) => {
      const fechaStr = fecha.toISOString().split('T')[0];
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

  // 🐔 GRANJA MILLONARIA (10 números) - VERSIÓN CON FECHA
  granja: {
    apiUrl: 'http://www.granjamillonaria.com/Resource',
    numeros: 10,
    nombre: 'Granja Millonaria',
    procesar: async (fecha) => {
      const fechaStr = fecha.toISOString().split('T')[0];
      const url = `http://www.granjamillonaria.com/Resource?a=animalitos-hoy&fecha=${fechaStr}&_t=${Date.now()}`;
      
      console.log(`   📡 URL: ${url}`);
      
      const response = await fetch(url, {
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

  // 🦁 GRANJAZO MILLONARIO (10 números) - VERSIÓN CON FECHA
  granjazo: {
    apiUrl: 'http://www.granjamillonaria.com/Resource',
    numeros: 10,
    nombre: 'Granjazo Millonario',
    procesar: async (fecha) => {
      const fechaStr = fecha.toISOString().split('T')[0];
      const url = `http://www.granjamillonaria.com/Resource?a=granjazo-hoy&fecha=${fechaStr}&_t=${Date.now()}`;
      
      console.log(`   📡 URL: ${url}`);
      
      const response = await fetch(url, {
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

  // 🎲 LOTTO ACTIVO (12 números) - VERSIÓN OFICIAL
  lotto: {
    apiUrl: 'https://lottoactivo.com/core/process.php',
    numeros: 12,
    nombre: 'Lotto Activo',
    procesar: async (fecha) => {
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Este es el option que usa la página oficial para obtener los resultados con imágenes
      const formData = new URLSearchParams();
      formData.append('option', 'WDNxcnFwcnNPb1lrd3VTSXEyYll0USRMNFJSNm50dzBHbTZxd1d3VjI4b0ZvVEY4djEyNElpNWpIenpsTWlqY1pKdENLT2E4dlZpaWV1SXk3WThTMkZmMVl6WUZudXNFMTcrUzJYMmhiL0xOQT09');
      formData.append('loteria', 'lotto_activo');
      formData.append('fecha', fechaStr);
      
      console.log(`   📡 Enviando petición a process.php para ${fechaStr}`);
      
      const response = await fetch('https://lottoactivo.com/core/process.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DrAnimalitosBot/1.0'
        },
        body: formData
      });
      
      if (!response.ok) {
        console.log(`   ❌ Respuesta HTTP: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      // Verificar que tenemos datos
      if (!data.datos || !Array.isArray(data.datos)) {
        console.log('   ❌ No hay datos en la respuesta');
        return null;
      }
      
      console.log(`   ✅ Recibidos ${data.datos.length} sorteos`);
      
      // La página oficial ordena por hora, nosotros también
      const ordenados = data.datos.sort((a, b) => {
        const horaA = parseInt(a.time_s.split(':')[0]);
        const horaB = parseInt(b.time_s.split(':')[0]);
        return horaA - horaB;
      });
      
      // Extraer los números (ya vienen con el formato correcto)
      const numeros = ordenados.map(item => {
        const num = item.number_animal;
        // Si es "00" lo dejamos como string, si no, número
        return num === "00" ? "00" : parseInt(num);
      });
      
      // Verificar que tenemos 12 números
      if (numeros.length === 12) {
        console.log(`   ✅ Números obtenidos: ${numeros.join(', ')}`);
        return numeros;
      } else {
        console.log(`   ⚠️ Solo se obtuvieron ${numeros.length} de 12 números`);
        return null;
      }
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
