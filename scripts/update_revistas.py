#!/usr/bin/env python3
# scripts/update_revistas.py
import json
import os
import urllib.request
import re
from datetime import datetime

def descargar_de_respaldo(nombre_hipodromo, nombre_archivo, destino_carpeta):
    """
    Intenta buscar y descargar el PDF desde la fuente alternativa (El Oasis)
    """
    print(f"  --> Intentando buscar respaldo para {nombre_hipodromo} en El Oasis...")
    url_oasis = "http://eloasiss.com/revistas_gac.php"
    
    try:
        # Configurar un agente de usuario para simular un navegador web
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url_oasis, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        # Diccionario para mapear nombres comunes de hipódromos con los archivos de El Oasis
        # Se buscan patrones comunes en las URLs de las gacetas
        palabra_clave = nombre_hipodromo.lower().replace(" ", "").replace("park", "").replace("downs", "")
        
        # Buscar todos los enlaces a archivos PDF en el código HTML de El Oasis
        enlaces = re.findall(r'href=["\'](.*?\.pdf)["\']', html, re.IGNORECASE)
        
        url_respaldo = None
        for enlace in enlaces:
            # Si el enlace es relativo, completarlo
            if palavra_clave in enlace.lower():
                if enlace.startswith('http'):
                    url_respaldo = enlace
                else:
                    url_respaldo = f"http://eloasiss.com/{enlace}"
                break
                
        if url_respaldo:
            print(f"    ✅ ¡Enlace de respaldo encontrado!: {url_respaldo}")
            ruta_final = os.path.join(destino_carpeta, nombre_archivo)
            
            # Descargar el PDF de respaldo
            req_pdf = urllib.request.Request(url_respaldo, headers=headers)
            with urllib.request.urlopen(req_pdf, timeout=20) as resp_pdf:
                with open(ruta_final, 'wb') as f:
                    f.write(resp_pdf.read())
            return True
        else:
            print(f"    ❌ No se encontró un enlace coincidente para '{nombre_hipodromo}' en el HTML de respaldo.")
            return False
            
    except Exception as e:
        print(f"    ⚠️ Error buscando en el servidor de respaldo: {str(e)}")
        return False


def main():
    print("=" * 60)
    print(f"PROCESANDO REVISTAS (CON RESPALDO INTELIGENTE) - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    ruta_originales = os.path.join(project_root, "data", "urls_originales.json")
    ruta_salida = os.path.join(project_root, "data", "revistas.json")
    ruta_pdfs = os.path.join(project_root, "pdfs")
    
    if not os.path.exists(ruta_originales):
        print(f"ERROR CRÍTICO: No existe el archivo {ruta_originales}")
        return

    with open(ruta_originales, "r", encoding="utf-8") as f:
        fuente_data = json.load(f)
        
    data_web = {
        "metadata": {
            "lastUpdate": datetime.now().isoformat(),
            "totalHipodromos": len(fuente_data.get("hipodromos", [])),
            "version": "1.2.0"
        },
        "hipodromos": [],
        "errores": None
    }
    
    for hipo in fuente_data.get("hipodromos", []):
        url_pdf = hipo.get("url_pdf", "")
        nombre_archivo = os.path.basename(url_pdf) if url_pdf else ""
        ruta_fisica_pdf = os.path.join(ruta_pdfs, nombre_archivo)
        
        # 1. Verificar si el workflow ya lo descargó con éxito de la fuente principal
        esta_activo = False
        if nombre_archivo and os.path.exists(ruta_fisica_pdf):
            if os.path.getsize(ruta_fisica_pdf) > 1024:
                esta_activo = True
                
        # 2. SISTEMA DE RESPALDO: Si la fuente principal falló, intentamos El Oasis
        if not esta_activo:
            exito_respaldo = descargar_de_respaldo(hipo["nombre"], nombre_archivo, ruta_pdfs)
            if exito_respaldo:
                esta_activo = True
        
        ruta_local_pdf = f"pdfs/{nombre_archivo}" if esta_activo else "#"
        
        data_web["hipodromos"].append({
            "id": hipo["id"],
            "nombre": hipo["nombre"],
            "logo": hipo["logo"],
            "revistas": {
                "espanol": ruta_local_pdf,
                "winnersChoice": ruta_local_pdf
            },
            "activo": esta_activo,
            "ultimaActualizacion": datetime.now().strftime("%Y-%m-%d")
        })
        
        estado_txt = "ACTIVO ✅" if esta_activo else "NO DISPONIBLE ❌"
        print(f"  -> Hipódromo: {hipo['nombre']} | Estado: {estado_txt}")
        
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(data_web, f, indent=2, ensure_ascii=False)
        
    print("=" * 60)
    print("¡Sincronización con sistema de respaldo completada!")
    print("=" * 60)

if __name__ == "__main__":
    main()
