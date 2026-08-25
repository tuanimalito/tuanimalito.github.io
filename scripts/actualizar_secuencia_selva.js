/**
 * SCRIPT PARA ACTUALIZAR secuencia_selva.json
 * 
 * Toma los datos de selva.json y genera las secuencias
 * para el Generador GSM de "Selva Plus"
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================
const RUTA_SELVA = path.join(__dirname, '../data/selva.json');
const RUTA_SECUENCIA = path.join(__dirname, '../data/secuencia_selva.json');
const CANTIDAD_NUMEROS_POR_SECUENCIA = 5; // Números a tomar de cada día

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function actualizarSecuenciaSelva() {
    console.log('🔄 Actualizando secuencia_selva.json...');
    console.log(`📂 Origen: ${RUTA_SELVA}`);
    console.log(`📂 Destino: ${RUTA_SECUENCIA}`);

    try {
        // 1. Verificar que existe selva.json
        if (!fs.existsSync(RUTA_SELVA)) {
            console.error(`❌ No se encuentra el archivo: ${RUTA_SELVA}`);
            return false;
        }

        // 2. Leer y parsear selva.json
        const selvaData = JSON.parse(fs.readFileSync(RUTA_SELVA, 'utf8'));
        const resultados = selvaData.resultados;

        if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
            console.error('❌ No hay datos válidos en selva.json');
            return false;
        }

        console.log(`📊 Se encontraron ${resultados.length} días de resultados`);

        // 3. Extraer secuencias de cada día
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

        // 4. Verificar que se generaron secuencias válidas
        const secuenciasValidas = secuencias.filter(seq => seq.length > 0);
        if (secuenciasValidas.length === 0) {
            console.error('❌ No se pudieron generar secuencias válidas');
            return false;
        }

        // 5. Crear el objeto para guardar
        const secuenciaData = {
            resultados: secuencias,
            fecha_actualizacion: new Date().toISOString(),
            metadata: {
                origen: 'selva.json',
                numeros_por_secuencia: CANTIDAD_NUMEROS_POR_SECUENCIA,
                total_secuencias: secuencias.length,
                generado_por: 'actualizar_secuencia_selva.js'
            }
        };

        // 6. Guardar en secuencia_selva.json
        fs.writeFileSync(
            RUTA_SECUENCIA, 
            JSON.stringify(secuenciaData, null, 2),
            'utf8'
        );

        console.log(`\n✅ secuencia_selva.json actualizado correctamente`);
        console.log(`   📝 Total de secuencias: ${secuencias.length}`);
        console.log(`   📅 Fecha: ${secuenciaData.fecha_actualizacion}`);
        console.log(`   📋 Contenido:`);
        secuencias.forEach((seq, i) => {
            console.log(`      Día ${i + 1}: [${seq.join(', ')}]`);
        });

        return true;

    } catch (error) {
        console.error('❌ Error actualizando secuencia_selva.json:', error.message);
        console.error(error.stack);
        return false;
    }
}

// ============================================
// EJECUTAR
// ============================================

if (require.main === module) {
    const exitCode = actualizarSecuenciaSelva() ? 0 : 1;
    process.exit(exitCode);
}

module.exports = { actualizarSecuenciaSelva };