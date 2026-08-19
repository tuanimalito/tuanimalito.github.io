/**
 * SCRIPT PARA ACTUALIZAR SECUENCIA.JSON
 * Cuenta números ÚNICOS que se repiten:
 * - Un número que aparece 2 o más veces (en cualquier combinación) se cuenta UNA VEZ
 * - Ejemplo: si el 21 aparece 3 veces, se cuenta como 1 repetición
 */

const fs = require('fs');
const path = require('path');

// ============================================
// RUTAS DE ARCHIVOS
// ============================================
const RUTA_LOTTO = path.join(__dirname, '../data/lotto.json');
const RUTA_SECUENCIA = path.join(__dirname, '../data/secuencia.json');

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Encuentra TODOS los números que se repiten (único por número)
 * Un número que aparece 2+ veces se cuenta UNA VEZ
 */
function encontrarNumerosRepetidosUnicos(ultimo, penultimo) {
    if (!ultimo || !penultimo || !Array.isArray(ultimo) || !Array.isArray(penultimo)) {
        return [];
    }

    // Contar frecuencia de cada número en ambos días combinados
    const frecuencia = {};
    
    // Contar en el último día
    for (let val of ultimo) {
        const key = String(val);
        frecuencia[key] = (frecuencia[key] || 0) + 1;
    }
    
    // Contar en el penúltimo día
    for (let val of penultimo) {
        const key = String(val);
        frecuencia[key] = (frecuencia[key] || 0) + 1;
    }
    
    // Seleccionar números que aparecen 2 o más veces (en total)
    const numerosRepetidos = [];
    for (let [key, count] of Object.entries(frecuencia)) {
        if (count >= 2) {
            // Mantener el formato original
            numerosRepetidos.push(key === "00" ? "00" : parseInt(key));
        }
    }
    
    return numerosRepetidos;
}

/**
 * Cuenta cuántos números ÚNICOS se repiten (2 o más veces en total)
 */
function contarRepeticionesUnicas(ultimo, penultimo) {
    if (!ultimo || !penultimo || !Array.isArray(ultimo) || !Array.isArray(penultimo)) {
        return {
            total: 0,
            numeros: [],
            detalle: 'No hay datos suficientes'
        };
    }

    // Contar frecuencia de cada número en ambos días combinados
    const frecuencia = {};
    
    // Contar en el último día
    for (let val of ultimo) {
        const key = String(val);
        frecuencia[key] = (frecuencia[key] || 0) + 1;
    }
    
    // Contar en el penúltimo día
    for (let val of penultimo) {
        const key = String(val);
        frecuencia[key] = (frecuencia[key] || 0) + 1;
    }
    
    // Seleccionar números que aparecen 2 o más veces
    const numerosRepetidos = [];
    let totalRepeticiones = 0;
    
    for (let [key, count] of Object.entries(frecuencia)) {
        if (count >= 2) {
            const numero = key === "00" ? "00" : parseInt(key);
            numerosRepetidos.push(numero);
            totalRepeticiones++;
        }
    }
    
    // Estadísticas detalladas
    const stats = {
        total: totalRepeticiones,
        numeros: numerosRepetidos,
        detalle: `Total de números únicos que se repiten: ${totalRepeticiones}`
    };
    
    // Agregar información de frecuencia
    const detalleFrecuencia = [];
    for (let [key, count] of Object.entries(frecuencia)) {
        if (count >= 2) {
            const numero = key === "00" ? "00" : parseInt(key);
            detalleFrecuencia.push(`${numero} (${count} veces)`);
        }
    }
    stats.detalleFrecuencia = detalleFrecuencia.join(', ');
    
    return stats;
}

/**
 * Aplica la regla de secuencia:
 * - Cuenta números ÚNICOS que se repiten (2+ veces en total)
 * - Si total >= 5: elimina la más antigua y agrega los números repetidos
 * - Mantiene máximo 3 secuencias
 */
function aplicarReglaSecuencia(lottoResultados, secuenciaActual) {
    if (!lottoResultados || lottoResultados.length < 2) {
        console.log('⚠️ No hay suficientes resultados en lotto.json para analizar');
        return secuenciaActual;
    }

    // Tomar los 2 más recientes (últimos 2 elementos)
    const ultimo = lottoResultados[lottoResultados.length - 1];
    const penultimo = lottoResultados[lottoResultados.length - 2];

    // CONTAR NÚMEROS ÚNICOS QUE SE REPITEN (2+ veces en total)
    const estadisticas = contarRepeticionesUnicas(ultimo, penultimo);
    const totalRepeticiones = estadisticas.total;
    const numerosRepetidos = estadisticas.numeros;
    
    console.log(`📊 Estadísticas de repeticiones (números únicos):`);
    console.log(`   Total de números que se repiten: ${totalRepeticiones}`);
    console.log(`   Detalle de frecuencia: ${estadisticas.detalleFrecuencia || 'Ninguno'}`);
    console.log(`   Números repetidos: [${numerosRepetidos.join(', ')}]`);

    // Copia de seguridad de la secuencia actual
    let nuevaSecuencia = secuenciaActual ? [...secuenciaActual] : [];

    // ✅ Si hay 5 o más números ÚNICOS que se repiten, actualizar la secuencia
    if (totalRepeticiones >= 5) {
        console.log(`✅ ${totalRepeticiones} números únicos se repiten (>= 5) → Aplicando rotación`);

        // 1. Eliminar la más antigua (primer elemento)
        if (nuevaSecuencia.length > 0) {
            const eliminada = nuevaSecuencia.shift();
            console.log(`   🗑️ Secuencia eliminada: [${eliminada.join(', ')}]`);
        } else {
            console.log('   ℹ️ No había secuencias para eliminar');
        }

        // 2. Agregar SOLO los números repetidos como nueva secuencia
        nuevaSecuencia.push([...numerosRepetidos]);
        console.log(`   ➕ Secuencia agregada: [${numerosRepetidos.join(', ')}]`);

    } else {
        console.log(`ℹ️ ${totalRepeticiones} números únicos se repiten (< 5) → No se aplica rotación`);
        console.log('   Manteniendo secuencias actuales');
    }

    // Limitar a máximo 3 secuencias
    while (nuevaSecuencia.length > 3) {
        const eliminada = nuevaSecuencia.shift();
        console.log(`   ⚠️ Excediendo límite, eliminando: [${eliminada.join(', ')}]`);
    }

    return nuevaSecuencia;
}

/**
 * Lee un archivo JSON de forma segura
 */
function leerJSON(ruta) {
    try {
        if (!fs.existsSync(ruta)) {
            console.log(`⚠️ El archivo ${ruta} no existe, se creará uno nuevo`);
            return null;
        }
        const contenido = fs.readFileSync(ruta, 'utf8');
        return JSON.parse(contenido);
    } catch (error) {
        console.error(`❌ Error al leer ${ruta}:`, error.message);
        return null;
    }
}

/**
 * Escribe un archivo JSON de forma segura
 */
function escribirJSON(ruta, data) {
    try {
        const dir = path.dirname(ruta);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(ruta, JSON.stringify(data, null, 2));
        console.log(`✅ ${path.basename(ruta)} actualizado correctamente`);
        return true;
    } catch (error) {
        console.error(`❌ Error al escribir ${ruta}:`, error.message);
        return false;
    }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function actualizarSecuencia() {
    console.log('🔄 ACTUALIZANDO SECUENCIA.JSON (NÚMEROS ÚNICOS REPETIDOS)');
    console.log('==========================================');
    console.log(`📅 ${new Date().toLocaleString('es-VE')}`);
    console.log('');

    // 1. Leer lotto.json
    const lottoData = leerJSON(RUTA_LOTTO);
    if (!lottoData || !lottoData.resultados || lottoData.resultados.length < 2) {
        console.error('❌ No hay datos suficientes en lotto.json');
        console.log('   Se necesitan al menos 2 resultados para analizar');
        return false;
    }

    console.log(`📊 lotto.json tiene ${lottoData.resultados.length} resultados`);
    console.log(`   Último sorteo: [${lottoData.resultados[lottoData.resultados.length - 1].join(', ')}]`);
    console.log(`   Penúltimo:     [${lottoData.resultados[lottoData.resultados.length - 2].join(', ')}]`);
    console.log('');

    // 2. Leer secuencia.json (si existe)
    let secuenciaData = leerJSON(RUTA_SECUENCIA);
    let secuenciaActual = [];

    if (secuenciaData && secuenciaData.resultados) {
        secuenciaActual = secuenciaData.resultados;
        console.log(`📊 secuencia.json tiene ${secuenciaActual.length} secuencias`);
        if (secuenciaActual.length > 0) {
            console.log(`   Última secuencia: [${secuenciaActual[secuenciaActual.length - 1].join(', ')}]`);
        }
    } else {
        console.log('📊 secuencia.json está vacío o no existe, se creará uno nuevo');
        secuenciaActual = [];
    }
    console.log('');

    // 3. Aplicar la regla de secuencia
    const nuevaSecuencia = aplicarReglaSecuencia(lottoData.resultados, secuenciaActual);
    console.log('');

    // 4. Verificar si hubo cambios
    const huboCambios = JSON.stringify(secuenciaActual) !== JSON.stringify(nuevaSecuencia);

    if (!huboCambios) {
        console.log('ℹ️ No hubo cambios en secuencia.json');
        return true;
    }

    // 5. Guardar el nuevo archivo
    const nuevoData = {
        resultados: nuevaSecuencia,
        fecha_actualizacion: new Date().toISOString()
    };

    if (escribirJSON(RUTA_SECUENCIA, nuevoData)) {
        console.log('');
        console.log('🎉 SECUENCIA.JSON ACTUALIZADO EXITOSAMENTE');
        console.log(`   Secuencias guardadas: ${nuevaSecuencia.length}`);
        if (nuevaSecuencia.length > 0) {
            console.log(`   Última secuencia: [${nuevaSecuencia[nuevaSecuencia.length - 1].join(', ')}]`);
        }
        return true;
    }

    return false;
}

// ============================================
// EJECUCIÓN
// ============================================

if (require.main === module) {
    const success = actualizarSecuencia();
    process.exit(success ? 0 : 1);
}

module.exports = { actualizarSecuencia, encontrarNumerosRepetidosUnicos, contarRepeticionesUnicas, aplicarReglaSecuencia };
