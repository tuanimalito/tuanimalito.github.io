/**
 * SCRIPT PARA ACTUALIZAR secuencia_guacharito.json
 * 
 * Toma los datos de granjita.json (que ahora es Guacharito) y genera las secuencias
 * para el Generador GSM de "Guacharito"
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================
const RUTA_GUACHARITO = path.join(__dirname, '../data/granjita.json');  // ← Usa el mismo archivo
const RUTA_SECUENCIA = path.join(__dirname, '../data/secuencia_granjita.json'); // ← Usa el mismo archivo
const CANTIDAD_NUMEROS_POR_SECUENCIA = 5;

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function actualizarSecuenciaGuacharito() {
    console.log('🔄 Actualizando secuencia_granjita.json (Guacharito)...');
    console.log(`📂 Origen: ${RUTA_GUACHARITO}`);
    console.log(`📂 Destino: ${RUTA_SECUENCIA}`);

    try {
        if (!fs.existsSync(RUTA_GUACHARITO)) {
            console.error(`❌ No se encuentra el archivo: ${RUTA_GUACHARITO}`);
            return false;
        }

        const data = JSON.parse(fs.readFileSync(RUTA_GUACHARITO, 'utf8'));
        const resultados = data.resultados;

        if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
            console.error('❌ No hay datos válidos en granjita.json');
            return false;
        }

        console.log(`📊 Se encontraron ${resultados.length} días de resultados`);

        const secuencias = resultados.map((dia, index) => {
            if (!Array.isArray(dia)) {
                console.warn(`⚠️ El día ${index + 1} no es un array válido`);
                return [];
            }

            const numeros = dia.slice(0, CANTIDAD_NUMEROS_POR_SECUENCIA).map(num => {
                if (num === "00" || num === "0") return "00";
                if (typeof num === 'string' && !isNaN(parseInt(num))) {
                    return parseInt(num);
                }
                return num;
            });

            console.log(`   Día ${index + 1}: [${numeros.join(', ')}]`);
            return numeros;
        });

        const secuenciasValidas = secuencias.filter(seq => seq.length > 0);
        if (secuenciasValidas.length === 0) {
            console.error('❌ No se pudieron generar secuencias válidas');
            return false;
        }

        const secuenciaData = {
            resultados: secuencias,
            fecha_actualizacion: new Date().toISOString(),
            metadata: {
                origen: 'granjita.json (Guacharito)',
                numeros_por_secuencia: CANTIDAD_NUMEROS_POR_SECUENCIA,
                total_secuencias: secuencias.length,
                generado_por: 'actualizar_secuencia_guacharito.js'
            }
        };

        fs.writeFileSync(
            RUTA_SECUENCIA, 
            JSON.stringify(secuenciaData, null, 2),
            'utf8'
        );

        console.log(`\n✅ secuencia_granjita.json actualizado correctamente (Guacharito)`);
        console.log(`   📝 Total de secuencias: ${secuencias.length}`);
        console.log(`   📅 Fecha: ${secuenciaData.fecha_actualizacion}`);
        console.log(`   📋 Contenido:`);
        secuencias.forEach((seq, i) => {
            console.log(`      Día ${i + 1}: [${seq.join(', ')}]`);
        });

        return true;

    } catch (error) {
        console.error('❌ Error actualizando secuencia_granjita.json:', error.message);
        console.error(error.stack);
        return false;
    }
}

// ============================================
// EJECUTAR
// ============================================

if (require.main === module) {
    const exitCode = actualizarSecuenciaGuacharito() ? 0 : 1;
    process.exit(exitCode);
}

module.exports = { actualizarSecuenciaGuacharito };