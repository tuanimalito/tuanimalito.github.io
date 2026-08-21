/**
 * SCRIPT PARA ACTUALIZAR SECUENCIA_GRANJA.JSON
 * Específico para Granja Millonaria (10 sorteos por día)
 * Cuenta números ÚNICOS que se repiten:
 * - Un número que aparece 2 o más veces (en cualquier combinación) se cuenta UNA VEZ
 * - Umbral: >= 4 repeticiones (adaptado a 10 sorteos)
 */

const fs = require('fs');
const path = require('path');

// ============================================
// RUTAS DE ARCHIVOS
// ============================================
const RUTA_GRANJA = path.join(__dirname, '../data/granja.json');
const RUTA_SECUENCIA_GRANJA = path.join(__dirname, '../data/secuencia_granja.json');

// ============================================
// CONFIGURACIÓN ESPECÍFICA
// ============================================
const CONFIG = {
    NUMEROS_POR_SORTEO: 10,  // Granja Millonaria tiene 10 sorteos por día
    UMBRAL_REPETICIONES: 4,   // Umbral para activar la secuencia (>= 4)
    MAX_SECUENCIAS: 3         // Máximo de secuencias a mantener
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Encuentra TODOS los números que se repiten (único por número)
 * Un número que aparece 2+ veces en el total de los 2 días se cuenta UNA VEZ
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
            // Mantener el formato original (00 como string, números como número)
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
 * Aplica la regla de secuencia para Granja Millonaria:
 * - Cuenta números ÚNICOS que se repiten (2+ veces en total)
 * - Si total >= 4: elimina la más antigua y agrega los números repetidos
 * - Mantiene máximo 3 secuencias
 */
function aplicarReglaSecuenciaGranja(granjaResultados, secuenciaActual) {
    if (!granjaResultados || granjaResultados.length < 2) {
        console.log('⚠️ No hay suficientes resultados en granja.json para analizar');
        return secuenciaActual;
    }

    // Tomar los 2 más recientes (últimos 2 elementos)
    const ultimo = granjaResultados[granjaResultados.length - 1];
    const penultimo = granjaResultados[granjaResultados.length - 2];

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

    // ✅ Si hay 4 o más números ÚNICOS que se repiten, actualizar la secuencia
    if (totalRepeticiones >= CONFIG.UMBRAL_REPETICIONES) {
        console.log(`✅ ${totalRepeticiones} números únicos se repiten (>= ${CONFIG.UMBRAL_REPETICIONES}) → Aplicando rotación`);

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
        console.log(`ℹ️ ${totalRepeticiones} números únicos se repiten (< ${CONFIG.UMBRAL_REPETICIONES}) → No se aplica rotación`);
        console.log('   Manteniendo secuencias actuales');
    }

    // Limitar a máximo 3 secuencias
    while (nuevaSecuencia.length > CONFIG.MAX_SECUENCIAS) {
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

function actualizarSecuenciaGranja() {
    console.log('🔄 ACTUALIZANDO SECUENCIA_GRANJA.JSON (Granja Millonaria)');
    console.log('==========================================');
    console.log(`📅 ${new Date().toLocaleString('es-VE')}`);
    console.log(`📌 Configuración: ${CONFIG.NUMEROS_POR_SORTEO} sorteos/día | Umbral: >= ${CONFIG.UMBRAL_REPETICIONES}`);
    console.log('');

    // 1. Leer granja.json
    const granjaData = leerJSON(RUTA_GRANJA);
    if (!granjaData || !granjaData.resultados || granjaData.resultados.length < 2) {
        console.error('❌ No hay datos suficientes en granja.json');
        console.log('   Se necesitan al menos 2 resultados para analizar');
        return false;
    }

    console.log(`📊 granja.json tiene ${granjaData.resultados.length} resultados`);
    console.log(`   Último sorteo: [${granjaData.resultados[granjaData.resultados.length - 1].join(', ')}]`);
    console.log(`   Penúltimo:     [${granjaData.resultados[granjaData.resultados.length - 2].join(', ')}]`);
    console.log('');

    // 2. Leer secuencia_granja.json (si existe)
    let secuenciaData = leerJSON(RUTA_SECUENCIA_GRANJA);
    let secuenciaActual = [];

    if (secuenciaData && secuenciaData.resultados) {
        secuenciaActual = secuenciaData.resultados;
        console.log(`📊 secuencia_granja.json tiene ${secuenciaActual.length} secuencias`);
        if (secuenciaActual.length > 0) {
            console.log(`   Última secuencia: [${secuenciaActual[secuenciaActual.length - 1].join(', ')}]`);
        }
    } else {
        console.log('📊 secuencia_granja.json está vacío o no existe, se creará uno nuevo');
        secuenciaActual = [];
    }
    console.log('');

    // 3. Aplicar la regla de secuencia
    const nuevaSecuencia = aplicarReglaSecuenciaGranja(granjaData.resultados, secuenciaActual);
    console.log('');

    // 4. Verificar si hubo cambios
    const huboCambios = JSON.stringify(secuenciaActual) !== JSON.stringify(nuevaSecuencia);

    if (!huboCambios) {
        console.log('ℹ️ No hubo cambios en secuencia_granja.json');
        return true;
    }

    // 5. Guardar el nuevo archivo
    const nuevoData = {
        resultados: nuevaSecuencia,
        fecha_actualizacion: new Date().toISOString()
    };

    if (escribirJSON(RUTA_SECUENCIA_GRANJA, nuevoData)) {
        console.log('');
        console.log('🎉 SECUENCIA_GRANJA.JSON ACTUALIZADO EXITOSAMENTE');
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
    const success = actualizarSecuenciaGranja();
    process.exit(success ? 0 : 1);
}

module.exports = { 
    actualizarSecuenciaGranja, 
    encontrarNumerosRepetidosUnicos, 
    contarRepeticionesUnicas, 
    aplicarReglaSecuenciaGranja,
    CONFIG
};