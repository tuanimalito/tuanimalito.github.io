import json
import os
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Configuración
URL = "https://loteria.guru/resultados-loteria-florida"

# Mapeo de nombres en la página a IDs únicos para nuestra web
LOTERIAS = {
    "Mega Millions": "mega-millions",
    "Powerball": "powerball",
    "Lotto Florida": "lotto-florida",
    "Jackpot Triple Play": "jackpot-triple-play",
    "Fantasy 5 FL": "fantasy-5",
    "Pick 5 FL": "pick-5",
    "Pick 4 FL": "pick-4",
    "Pick 3 FL": "pick-3",
    "Cash Pop FL": "cash-pop",
    "Pick 2 FL": "pick-2",
    "Cash4Life FL": "cash4life"
}

def obtener_datos():
    """Extrae los resultados de loteria.guru"""
    print(f"Extrayendo datos de: {URL}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    
    try:
        respuesta = requests.get(URL, headers=headers, timeout=30)
        respuesta.raise_for_status()
    except Exception as e:
        print(f"Error al obtener la página: {e}")
        return None

    soup = BeautifulSoup(respuesta.text, 'html.parser')
    datos_extraidos = []

    # Encontramos todas las tarjetas de lotería
    tarjetas = soup.find_all('div', class_='lg-card')

    for tarjeta in tarjetas:
        # --- 1. Extraer el NOMBRE de la lotería ---
        nombre_elem = tarjeta.find('h3', class_='lg-name')
        if not nombre_elem:
            continue
        nombre_completo = nombre_elem.text.strip()
        
        nombre_loteria = None
        for nombre_clave in LOTERIAS:
            if nombre_clave in nombre_completo:
                nombre_loteria = nombre_clave
                break
        
        if not nombre_loteria:
            continue

        # --- 2. Extraer la FECHA del último sorteo ---
        fecha_elem = tarjeta.find('span', class_='lg-date')
        dia_semana_elem = tarjeta.find('span', class_='lg-day')
        fecha_texto = fecha_elem.text.strip() if fecha_elem else ""
        dia_semana_texto = dia_semana_elem.text.strip() if dia_semana_elem else ""

        # --- 3. Extraer los NÚMEROS de forma segura ---
        numeros = []
        numero_extra = None
        for num_elem in tarjeta.find_all('li', class_='lg-number'):
            num_texto = num_elem.text.strip()
            
            try:
                valor_num = int(num_texto)
            except ValueError:
                valor_num = num_texto

            if 'lg-reversed' in num_elem.get('class', []):
                numero_extra = valor_num
            else:
                numeros.append(valor_num)

        # --- 4. Extraer el PRÓXIMO SORTEO (LÓGICA MEJORADA) ---
        proximo_dia = ""
        proximo_fecha = ""
        
        # Buscamos en todas las filas de datos de la tarjeta de forma insensible a mayúsculas
        for fila in tarjeta.find_all('div', class_='lg-card-row'):
            texto_fila = fila.text.lower()
            if 'próximo' in texto_fila or 'proximo' in texto_fila:
                dias = fila.find_all('span', class_='lg-day')
                fechas = fila.find_all('span', class_='lg-date')
                
                # Si la fila contiene etiquetas estructuradas de fecha, las extraemos
                if dias:
                    proximo_dia = dias[-1].text.strip()
                if fechas:
                    proximo_fecha = fechas[-1].text.strip()
                
                # Si no estaban en etiquetas span (texto plano), limpiamos la fila
                if not proximo_fecha:
                    texto_limpio = fila.text.replace("Próximo sorteo:", "").replace("Próximo Sorteo:", "").strip()
                    proximo_fecha = texto_limpio
                break

        # --- 5. Extraer el BOTE ---
        bote_elem = tarjeta.find('div', class_='lg-sum')
        bote = bote_elem.text.strip() if bote_elem else ""

        # --- 6. Extraer el LOGO ---
        logo = ""
        logo_div = tarjeta.find('div', class_='lg-logo')
        if logo_div:
            img = logo_div.find('img')
            if img and img.get('src'):
                logo = urljoin(URL, img.get('src'))

        # Guardamos los datos
        datos_extraidos.append({
            "id": LOTERIAS[nombre_loteria],
            "nombre": nombre_loteria,
            "logo": logo,
            "ultimo_sorteo": {
                "dia": dia_semana_texto,
                "fecha": fecha_texto,
                "numeros": numeros,
                "numero_extra": numero_extra
            },
            "proximo_sorteo": {
                "dia": proximo_dia,
                "fecha": proximo_fecha
            },
            "bote": bote
        })
        print(f"  Datos extraídos para: {nombre_loteria} (Próximo: {proximo_dia} {proximo_fecha})")

    return {
        "metadata": {
            "ultima_actualizacion": datetime.now().isoformat(),
            "total_loterias": len(datos_extraidos),
            "fuente": URL
        },
        "loterias": datos_extraidos
    }

def datos_han_cambiado(nuevos_datos):
    """Compara los nuevos datos con el JSON local."""
    ruta_completa = os.path.join("data", "tuloteria.json")
    
    if not os.path.exists(ruta_completa):
        return True
        
    try:
        with open(ruta_completa, "r", encoding="utf-8") as f:
            datos_locales = json.load(f)
    except Exception:
        return True

    ultimo_sorteo_local = {l["id"]: l.get("ultimo_sorteo", {}) for l in datos_locales.get("loterias", [])}
    proximo_sorteo_local = {l["id"]: l.get("proximo_sorteo", {}) for l in datos_locales.get("loterias", [])}
    botes_locales = {l["id"]: l.get("bote", "") for l in datos_locales.get("loterias", [])}
    
    for loteria_nueva in nuevos_datos.get("loterias", []):
        id_loteria = loteria_nueva["id"]
        
        if id_loteria not in ultimo_sorteo_local:
            return True
            
        sorteo_local = ultimo_sorteo_local[id_loteria]
        sorteo_nuevo = loteria_nueva.get("ultimo_sorteo", {})
        
        prox_local = proximo_sorteo_local.get(id_loteria, {})
        prox_nuevo = loteria_nueva.get("proximo_sorteo", {})
        
        # Agregamos validación por si cambia la fecha del próximo sorteo en la web
        if sorteo_local.get("fecha") != sorteo_nuevo.get("fecha") or \
           sorteo_local.get("numeros") != sorteo_nuevo.get("numeros") or \
           prox_local.get("fecha") != prox_nuevo.get("fecha") or \
           botes_locales.get(id_loteria) != loteria_nueva.get("bote", ""):
            print(f"🔄 Cambio detectado en datos de: {loteria_nueva['nombre']}")
            return True

    return False

def guardar_json(datos):
    ruta_completa = os.path.join("data", "tuloteria.json")
    os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
    with open(ruta_completa, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)
    print(f"Datos guardados correctamente en {ruta_completa}")

def main():
    print("--- INICIANDO ACTUALIZACIÓN DE LOTERÍA ---")
    datos_nuevos = obtener_datos()
    
    if datos_nuevos and len(datos_nuevos.get("loterias", [])) > 0:
        if datos_han_cambiado(datos_nuevos):
            guardar_json(datos_nuevos)
            print("--- ACTUALIZACIÓN COMPLETADA: Nuevos cambios aplicados ---")
        else:
            print("--- PROCESO FINALIZADO: El archivo local está al día ---")
    else:
        print("--- ERROR: No se pudieron obtener datos válidos ---")

if __name__ == "__main__":
    main()