#!/usr/bin/env python3
# scripts/update_revistas.py
import json
import os
import urllib.request
import re
import email.utils
from datetime import datetime

def verificar_si_es_de_hoy(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url, headers=headers, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as response:
            url_time = response.headers.get('Last-Modified')
            
        if url_time:
            fecha_archivo = datetime(*email.utils.parsedate(url_time)[:6]).date()
            fecha_hoy = datetime.now().date()
            return fecha_archivo == fecha_hoy
        return True
    except Exception as e:
        print(f"    ⚠️ No se pudo verificar la fecha en la fuente principal: {str(e)}")
        return False

def descargar_de_respaldo_dinamico(id_hipodromo, nombre_hipodromo, nombre_archivo, destino_carpeta):
    print(f"  --> Rastreando dinámicamente respaldo para '{nombre_hipodromo}' en El Oasis...")
    url_oasis = "http://eloasiss.com/revistas_gac.php"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url_oasis, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        patron_enlaces = r'href=["\'](descargas/revista/download/(\d{4}-\d{2}-\d{2})/[^"\']+\.pdf)["\'][^>]*>(.*?)</a>'
        coincidencias = re.findall(patron_enlaces, html, re.IGNORECASE)
        
        if not coincidencias:
            print("    ❌ No se detectaron enlaces con formato de fecha en el HTML de El Oasis.")
            return False

        fecha_activa_oasis = coincidencias[0][1]
        
        # Limpieza inteligente de nombres
        nombre_limpio = nombre_hipodromo.lower().replace(" ", "").replace("park", "").replace("downs", "").replace("racing", "")
        raiz_nombre = nombre_limpio[:3] # Reducido a 3 letras para capturar "mnr", "asd", "prx", "lad" perfectamente
        id_limpio = id_hipodromo.lower().replace("-", "")[:3]

        url_final_respaldo = None
        
        for ruta_relativa, fecha_enlace, texto_visible in coincidencias:
            if fecha_enlace != fecha_activa_oasis:
                continue
                
            texto_evaluar = (texto_visible + " " + ruta_relativa).lower().replace(" ", "")
            
            # Buscamos coincidencias cruzando la raíz del nombre y el ID de tu JSON
            if raiz_nombre in texto_evaluar or id_limpio in texto_evaluar:
                url_final_respaldo = f"http://eloasiss.com/{ruta_relativa}"
                print(f"    🎯 ¡Detectado!: '{texto_visible}' mapeado a {nombre_hipodromo} (Fecha Sitio: {fecha_activa_oasis})")
                break

        if url_final_respaldo:
            print(f"    ✅ Descargando desde ruta auto-detectada: {url_final_respaldo}")
            ruta_final_local = os.path.join(destino_carpeta, nombre_archivo)
            
            req_pdf = urllib.request.Request(url_final_respaldo, headers=headers)
            with urllib.request.urlopen(req_pdf, timeout=20) as resp_pdf:
                with open(ruta_final_local, 'wb') as f:
                    f.write(resp_pdf.read())
            return True
            
        print(f"    ❌ No se encontró ningún enlace que se parezca a '{nombre_hipodromo}' para la fecha {fecha_activa_oasis}.")
        return False
            
    except Exception as e:
        print(f"    ⚠️ Error en el rastreador dinámico de El Oasis: {str(e)}")
        return False

def main():
    print("=" * 60)
    print(f"SISTEMA ADAPTATIVO NOCTURNO - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
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
            "version": "1.7.0"
        },
        "hipodromos": [],
        "errores": None
    }
    
    for hipo in fuente_data.get("hipodromos", []):
        id_hipo = hipo["id"]
        url_pdf = hipo.get("url_pdf", "")
        nombre_archivo = os.path.basename(url_pdf) if url_pdf else f"{id_hipo}.pdf"
        ruta_fisica_pdf = os.path.join(ruta_pdfs, nombre_archivo)
        
        esta_activo = False
        
        if url_pdf and os.path.exists(ruta_fisica_pdf):
            print(f"  -> Verificando vigencia en fuente principal para: {hipo['nombre']}")
            if verificar_si_es_de_hoy(url_pdf):
                esta_activo = True
            else:
                try:
                    os.remove(ruta_fisica_pdf)
                except:
                    pass
                print(f"     [Borrado] Archivo obsoleto eliminado de fuente principal.")
                
        if not esta_activo:
            esta_activo = descargar_de_respaldo_dinamico(id_hipo, hipo["nombre"], nombre_archivo, ruta_pdfs)
        
        ruta_local_pdf = f"pdfs/{nombre_archivo}" if esta_activo else "#"
        
        data_web["hipodromos"].append({
            "id": id_hipo,
            "nombre": hipo["nombre"],
            "logo": hipo["logo"],
            "revistas": {
                "espanol": ruta_local_pdf,
                "winnersChoice": ruta_local_pdf
            },
            "activo": esta_activo,
            "ultimaActualizacion": datetime.now().strftime("%Y-%m-%d")
        })
        
        estado_txt = "¡ACTIVO Y FRESCO! ✅" if esta_activo else "APAGADO (Sin carreras hoy) ❌"
        print(f"     Resultado final -> {hipo['nombre']}: {estado_txt}\n")
        
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(data_web, f, indent=2, ensure_ascii=False)
        
    print("=" * 60)
    print("¡Sincronización de cartelera nocturna completada con éxito!")
    print("=" * 60)

if __name__ == "__main__":
    main()
