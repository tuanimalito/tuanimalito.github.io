#!/usr/bin/env python3
# scripts/update_revistas.py
import json
import os
import urllib.request
import re
from datetime import datetime, email.utils

def verificar_si_es_de_hoy(url):
    """
    Se conecta al servidor externo y revisa la fecha real de modificación del PDF.
    Si el archivo no es de hoy, devuelve False.
    """
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url, headers=headers, method='HEAD') # HEAD solo pide los datos del archivo, no lo descarga completo
        
        with urllib.request.urlopen(req, timeout=10) as response:
            url_time = response.headers.get('Last-Modified')
            
        if url_time:
            # Convertir la fecha del servidor (formato inglés/red) a fecha de Python
            fecha_archivo = datetime(*email.utils.parsedate(url_time)[:6]).date()
            fecha_hoy = datetime.now().date()
            
            # Comparamos si la fecha del archivo coincide con el día de hoy
            if fecha_archivo == fecha_hoy:
                return True
            else:
                print(f"    ⚠️ Archivo rechazado por viejo. Fecha en servidor: {fecha_archivo} | Hoy es: {fecha_hoy}")
                return False
        return True # Si el servidor no envía fecha, por seguridad permitimos el paso pero lo ideal es verificarlo
    except Exception as e:
        print(f"    ⚠️ No se pudo verificar la fecha en el servidor: {str(e)}")
        return False


def descargar_de_respaldo(nombre_hipodromo, nombre_archivo, destino_carpeta):
    """
    Busca y descarga el PDF desde El Oasis sólo si está actualizado.
    """
    print(f"  --> Buscando respaldo para {nombre_hipodromo} en El Oasis...")
    url_oasis = "http://eloasiss.com/revistas_gac.php"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url_oasis, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        palabra_clave = nombre_hipodromo.lower().replace(" ", "").replace("park", "").replace("downs", "")
        enlaces = re.findall(r'href=["\'](.*?\.pdf)["\']', html, re.IGNORECASE)
        
        url_respaldo = None
        for enlace in enlaces:
            if palabra_clave in enlace.lower():
                if enlace.startswith('http'):
                    url_respaldo = enlace
                else:
                    url_respaldo = f"http://eloasiss.com/{enlace}"
                break
                
        if url_respaldo:
            # ¡FILTRO CRÍTICO!: Verificar si el archivo de respaldo realmente es de hoy
            if not verificar_si_es_de_hoy(url_respaldo):
                print(f"    ❌ El PDF de respaldo en El Oasis también es antiguo.")
                return False
                
            print(f"    ✅ ¡Respaldo fresco encontrado!: {url_respaldo}")
            ruta_final = os.path.join(destino_carpeta, nombre_archivo)
            
            req_pdf = urllib.request.Request(url_respaldo, headers=headers)
            with urllib.request.urlopen(req_pdf, timeout=20) as resp_pdf:
                with open(ruta_final, 'wb') as f:
                    f.write(resp_pdf.read())
            return True
        return False
            
    except Exception as e:
        print(f"    ⚠️ Error en el servidor de respaldo: {str(e)}")
        return False


def main():
    print("=" * 60)
    print(f"SISTEMA ANTIVIEJOS ACTIVADO - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    ruta_originales = os.path.join(project_root, "data", "urls_originales.json")
    ruta_salida = os.path.join(project_root, "data", "revistas.json")
    ruta_pdfs = os.path.join(project_root, "pdfs")
    
    if not os.path.exists(ruta_originales):
        return

    with open(ruta_originales, "r", encoding="utf-8") as f:
        fuente_data = json.load(f)
        
    data_web = {
        "metadata": {
            "lastUpdate": datetime.now().isoformat(),
            "totalHipodromos": len(fuente_data.get("hipodromos", [])),
            "version": "1.3.0"
        },
        "hipodromos": [],
        "errores": None
    }
    
    for hipo in fuente_data.get("hipodromos", []):
        url_pdf = hipo.get("url_pdf", "")
        nombre_archivo = os.path.basename(url_pdf) if url_pdf else ""
        ruta_fisica_pdf = os.path.join(ruta_pdfs, nombre_archivo)
        
        esta_activo = False
        
        # 1. Comprobar lo descargado por el Workflow de la fuente principal
        if nombre_archivo and os.path.exists(ruta_fisica_pdf):
            # El archivo físico existe, pero... ¿es una revista nueva de hoy?
            print(f"  -> Verificando vigencia de: {hipo['nombre']}")
            if verificar_si_es_de_hoy(url_pdf):
                esta_activo = True
            else:
                # Si es viejo, lo borramos inmediatamente para no dejar basura
                try:
                    os.remove(ruta_fisica_pdf)
                except:
                    pass
                print(f"     [Borrado] Se eliminó el PDF obsoleto de {hipo['nombre']}")
                
        # 2. Si la fuente principal falló o era vieja, saltamos al respaldo
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
        
        estado_txt = "¡ACTIVO Y FRESCO! ✅" if esta_activo else "APAGADO (Sin carreras nuevas) ❌"
        print(f"     Resultado final -> {hipo['nombre']}: {estado_txt}\n")
        
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(data_web, f, indent=2, ensure_ascii=False)
        
    print("=" * 60)
    print("¡Filtro completado! Tu comunidad está a salvo de información vieja.")
    print("=" * 60)

if __name__ == "__main__":
    main()
