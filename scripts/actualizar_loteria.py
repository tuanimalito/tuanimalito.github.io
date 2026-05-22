#!/usr/bin/env python3
# scripts/actualizar_loteria.py
# Actualiza los resultados de lotería desde loteria.guru

import json
import os
import re
import requests
from datetime import datetime
from bs4 import BeautifulSoup

URL_LOTERIA = "https://loteria.guru/resultados-loteria-florida"

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

def obtener_datos_loteria():
    """Obtiene los datos actualizados de loteria.guru"""
    print(f"Obteniendo datos de: {URL_LOTERIA}")
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    
    try:
        response = requests.get(URL_LOTERIA, headers=headers, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"Error al obtener la página: {e}")
        return None
    
    soup = BeautifulSoup(response.text, 'html.parser')
    loterias_data = []
    cards = soup.find_all('div', class_='lg-card')
    
    for card in cards:
        nombre_elem = card.find('h3', class_='lg-name')
        if not nombre_elem:
            continue
        
        nombre = nombre_elem.get_text(strip=True)
        config = next((c for c in LOTERIAS_CONFIG if c["nombre"].lower() in nombre.lower()), None)
        if not config:
            continue
        
        dia_elem = card.find('span', class_='lg-day')
        fecha_elem = card.find('span', class_='lg-date')
        dia = dia_elem.get_text(strip=True) if dia_elem else ""
        fecha = fecha_elem.get_text(strip=True) if fecha_elem else ""
        
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
        
        proximo_dia = ""
        proximo_fecha = ""
        for row in card.find_all('div', class_='lg-card-row'):
            if 'Próximo Sorteo' in row.get_text():
                dias = row.find_all('span', class_='lg-day')
                fechas = row.find_all('span', class_='lg-date')
                if len(dias) > 1:
                    proximo_dia = dias[1].get_text(strip=True)
                if len(fechas) > 1:
                    proximo_fecha = fechas[1].get_text(strip=True)
                break
        
        bote_elem = card.find('div', class_='lg-sum')
        bote = bote_elem.get_text(strip=True) if bote_elem else ""
        
        logo = ""
        logo_parent = card.find('div', class_='lg-logo')
        if logo_parent:
            img = logo_parent.find('img')
            if img and img.get('src'):
                logo = img.get('src')
        
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
            "ultimaActualizacion": datetime.now().isoformat(),
            "totalLoterias": len(loterias_data),
            "fuente": URL_LOTERIA
        },
        "loterias": loterias_data
    }

def guardar_datos(data, ruta="data/tuloteria.json"):
    """Guarda los datos en el archivo JSON"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    ruta_completa = os.path.join(project_root, ruta)
    os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
    with open(ruta_completa, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Datos guardados en {ruta}")
    print(f"Total loterías actualizadas: {data['metadata']['totalLoterias']}")

def main():
    print("=" * 60)
    print(f"ACTUALIZANDO RESULTADOS DE LOTERÍA - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    datos = obtener_datos_loteria()
    if datos:
        guardar_datos(datos)
        print("\n" + "=" * 60)
        print("ACTUALIZACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
    else:
        print("\nERROR: No se pudieron obtener los datos")

if __name__ == "__main__":
    main()