/**
 * SCRIPT PARA ACTUALIZAR secuencia_granjita.json
 * 
 * Toma los datos de granjita.json y genera las secuencias
 * para el Generador GSM de "La Granjita"
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================
const RUTA_GRANJITA = path.join(__dirname, '../data/granjita.json');
const RUTA_SECUENCIA = path.join(__dirname, '../data/secuencia_granjita.json');
const CANTIDAD_NUMEROS_POR_SECUENCIA = 5; // Números a tomar de cada día

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function actualizarSecuenciaGranjita() {
    console.log('🔄 Actualizando secuencia_granjita.json...');
    console.log(`📂 Origen: ${RUTA_GRANJITA}`);
    console.log(`📂 Destino: ${RUTA_SECUENCIA}`);

    try {
        // 1. Verificar que existe granjita.json
        if (!fs.existsSync(RUTA_GRANJITA)) {
            console.error(`❌ No se encuentra el archivo: ${RUTA_GRANJITA}`);
            return false;
        }

        // 2. Leer y parsear granjita.json
        const granjitaData = JSON.parse(fs.readFileSync(RUTA_GRANJITA, 'utf8'));
        const resultados = granjitaData.resultados;

        if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
            console.error('❌ No hay datos válidos en granjita.json');
            return false;
        }

        console.log(`📊 Se encontraron ${resultados.length} días de resultados`);

        // 3. Extraer secuencias de cada día
        const secuencias = resultados.map((dia, index) => {
            // Asegurar que el día sea un array
            if (!Array.isArray(dia)) {
                console.warn(`⚠️ El día ${index + 1} no es un array válido`);
                return [];
            }

            // Tomar los primeros N números del día
            const numeros = dia.slice(0, CANTIDAD_NUMEROS_POR_SECUENCIA).map(num => {
                // Si es "00", mantenerlo como string
                if (num === "00" || num === "0") return "00";
                // Si es string numérico, convertirlo a número
                if (typeof num === 'string' && !isNaN(parseInt(num))) {
                    return parseInt(num);
                }
                // Si ya es número, dejarlo igual
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
                origen: 'granjita.json',
                numeros_por_secuencia: CANTIDAD_NUMEROS_POR_SECUENCIA,
                total_secuencias: secuencias.length,
                generado_por: 'actualizar_secuencia_granjita.js'
            }
        };

        // 6. Guardar en secuencia_granjita.json
        fs.writeFileSync(
            RUTA_SECUENCIA, 
            JSON.stringify(secuenciaData, null, 2),
            'utf8'
        );

        console.log(`\n✅ secuencia_granjita.json actualizado correctamente`);
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

// Si se ejecuta directamente (no importado)
if (require.main === module) {
    const exitCode = actualizarSecuenciaGranjita() ? 0 : 1;
    process.exit(exitCode);
}

// Exportar para uso como módulo
module.exports = { actualizarSecuenciaGranjita };