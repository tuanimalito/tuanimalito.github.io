#!/usr/bin/env python3
# scripts/scrape_loteria.py
# Workflow que extrae datos de loteria.guru

import json
import os
import re
import requests
from datetime import datetime
from bs4 import BeautifulSoup

# Configuración
URL_LOTERIA = "https://loteria.guru/resultados-loteria-florida"

# Mapeo de IDs y nombres
LOTERIAS_CONFIG = [
    {"id": "mega-millions", "nombre": "Mega Millions"},
    {"id": "powerball", "nombre": "Powerball"},
    {"id": "lotto-florida", "nombre": "Lotto Florida"},
    {"id": "jackpot-triple-play", "nombre": "Jackpot Triple Play"},
    {"id": "fantasy-5", "nombre": "Fantasy 5 FL"},
    {"id": "pick-5", "nombre": "Pick 5 FL"},
    {"id": "pick-4", "nombre": "Pick 4 FL"},
    {"id": "pick-3", "nombre": "Pick 3 FL"},
    {"id": "cash-pop", "nombre": "Cash Pop FL"},
    {"id": "pick-2", "nombre": "Pick 2 FL"},
    {"id": "cash4life", "nombre": "Cash4Life FL"}
]

def extraer_numeros(texto):
    """Extrae números de un texto"""
    numeros = re.findall(r'\b\d{1,3}\b', texto)
    return [int(n) for n in numeros if 1 <= int(n) <= 99][:10]

def scrape_loteria_guru():
    """Extrae los datos de loteria.guru"""
    print(f"Obteniendo datos de: {URL_LOTERIA}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(URL_LOTERIA, headers=headers, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"Error al obtener la página: {e}")
        return None
    
    soup = BeautifulSoup(response.text, 'html.parser')
    loterias_data = []
    
    # Buscar todas las tarjetas de lotería
    cards = soup.find_all('div', class_='lg-card')
    
    for card in cards:
        # Extraer nombre
        nombre_elem = card.find('h3', class_='lg-name')
        if not nombre_elem:
            continue
        
        nombre = nombre_elem.get_text(strip=True)
        
        # Buscar configuración por nombre
        config = next((c for c in LOTERIAS_CONFIG if c["nombre"].lower() in nombre.lower()), None)
        if not config:
            continue
        
        # Extraer día y fecha del último sorteo
        dia_elem = card.find('span', class_='lg-day')
        fecha_elem = card.find('span', class_='lg-date')
        dia = dia_elem.get_text(strip=True) if dia_elem else ""
        fecha = fecha_elem.get_text(strip=True) if fecha_elem else ""
        
        # Extraer números
        numeros_elems = card.find_all('li', class_='lg-number')
        numeros = []
        numero_extra = None
        
        for num_elem in numeros_elems:
            num_text = num_elem.get_text(strip=True)
            if 'lg-reversed' in num_elem.get('class', []):
                numero_extra = int(num_text) if num_text.isdigit() else None
            else:
                if num_text.isdigit():
                    numeros.append(int(num_text))
        
        # Extraer próximo sorteo
        proximo_dia = ""
        proximo_fecha = ""
        info_rows = card.find_all('div', class_='lg-card-row')
        
        for row in info_rows:
            if 'Próximo Sorteo' in row.get_text():
                dias = row.find_all('span', class_='lg-day')
                fechas = row.find_all('span', class_='lg-date')
                if len(dias) > 1:
                    proximo_dia = dias[1].get_text(strip=True)
                if len(fechas) > 1:
                    proximo_fecha = fechas[1].get_text(strip=True)
                break
        
        # Extraer bote
        bote_elem = card.find('div', class_='lg-sum')
        bote = bote_elem.get_text(strip=True) if bote_elem else ""
        
        # Extraer logo
        logo = ""
        logo_parent = card.find('div', class_='lg-logo')
        if logo_parent:
            img = logo_parent.find('img')
            if img and img.get('src'):
                logo = img.get('src')
        
        if not logo:
            fallback = card.find('img', class_='lg-logo-img')
            if fallback and fallback.get('src'):
                logo = fallback.get('src')
        
        loterias_data.append({
            "id": config["id"],
            "nombre": nombre,
            "logo": logo,
            "ultimoSorteo": {
                "dia": dia,
                "fecha": fecha,
                "numeros": numeros,
                "numeroExtra": numero_extra
            },
            "proximoSorteo": {
                "dia": proximo_dia,
                "fecha": proximo_fecha
            },
            "bote": bote
        })
    
    return {
        "metadata": {
            "lastUpdate": datetime.now().isoformat(),
            "totalLoterias": len(loterias_data),
            "source": URL_LOTERIA
        },
        "loterias": loterias_data
    }

def guardar_json(data, ruta="data/loteria.json"):
    """Guarda el JSON en la ruta especificada"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    ruta_completa = os.path.join(project_root, ruta)
    
    os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
    
    with open(ruta_completa, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"JSON guardado en {ruta}")
    print(f"Total loterías extraídas: {data['metadata']['totalLoterias']}")

def main():
    print("=" * 60)
    print(f"SCRAPING LOTERIA.GURU - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    datos = scrape_loteria_guru()
    if datos:
        guardar_json(datos)
        print("\n" + "=" * 60)
        print("SCRAPING COMPLETADO EXITOSAMENTE")
        print("=" * 60)
    else:
        print("\nERROR: No se pudieron extraer los datos")
        print("Verificando posibles causas...")
        print("1. La página puede haber cambiado su estructura")
        print("2. Puede haber bloqueado el acceso")
        print("3. Verificar conexión a internet")

if __name__ == "__main__":
    main()