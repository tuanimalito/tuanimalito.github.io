#!/usr/bin/env python3
# scripts/update_revistas.py
import json
import os
import urllib.request
import re
import email.utils
from datetime import datetime

def verificar_si_es_de_hoy(url):
    """
    Verifica si el archivo de la fuente principal realmente se actualizó hoy.
    """
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


def descargar_de_respaldo_dinamico(nombre_hipodromo, nombre_archivo, destino_carpeta):
    """
    Rastrea el HTML de El Oasis buscando coincidencias por el nombre del hipódromo,
    extrayendo la ruta de forma totalmente dinámica y automática sin tablas fijas.
    """
    fecha_hoy_str = datetime.now().strftime("%Y-%m-%d") # Genera "2026-05-26"
    print(f"  --> Rastreando dinámicamente respaldo para '{nombre_hipodromo}' en El Oasis...")
    
    url_oasis = "http://eloasiss.com/revistas_gac.php"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url_oasis, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        # Crear palabras clave de búsqueda limpias basadas en tu hipódromo
        nombre_limpio = nombre_hipodromo.lower().replace(" ", "").replace("park", "").replace("downs", "").replace("racing", "")
        raiz_nombre = nombre_limpio[:4] # Tomamos las primeras 4 letras para buscar coincidencias parciales (ej: "this", "loui")
        
        # Expresión regular inteligente: Busca enlaces con la fecha de hoy que contengan un archivo .pdf
        # Captura tanto la URL oculta en el 'href' como el texto visible del enlace
        patron_enlaces = rf'href=["\'](descargas/revista/download/{fecha_hoy_str}/[^"\']+\.pdf)["\'][^>]*>(.*?)</a>'
        coincidencias = re.findall(patron_enlaces, html, re.IGNORECASE)
        
        url_final_respaldo = None
        
        # Analizar cada enlace encontrado hoy en El Oasis
        for ruta_relativa, texto_visible in coincidencias:
            texto_evaluar = (texto_visible + " " + ruta_relativa).lower().replace(" ", "")
            
            # Si el texto del enlace o la ruta contiene la raíz de nuestro hipódromo, tenemos un ganador
            if raiz_nombre in texto_evaluar:
                url_final_respaldo = f"http://eloasiss.com/{ruta_relativa}"
                print(f"    🎯 ¡Coincidencia dinámica detectada en texto! '{texto_visible}' mapeado a {nombre_hipodromo}")
                break
        
        # Si la coincidencia ultra estricta falla, hacemos una búsqueda más flexible en las URLs del día
        if not url_final_respaldo:
            for ruta_relativa, texto_visible in coincidencias:
                if nombre_limpio in ruta_relativa.lower() or raiz_nombre in ruta_relativa.lower():
                    url_final_respaldo = f"http://eloasiss.com/{ruta_relativa}"
                    print(f"    🎯 ¡Coincidencia dinámica detectada en ruta! Mapeado por similitud de archivo.")
                    break

        if url_final_respaldo:
            print(f"    ✅ Descargando desde ruta auto-detectada: {url_final_respaldo}")
            ruta_final_local = os.path.join(destino_carpeta, nombre_archivo)
            
            req_pdf = urllib.request.Request(url_final_respaldo, headers=headers)
            with urllib.request.urlopen(req_pdf, timeout=20) as resp_pdf:
                with open(ruta_final_local, 'wb') as f:
                    f.write(resp_pdf.read())
            return True
            
        print(f"    ❌ No se encontró ningún enlace hoy que se parezca a '{nombre_hipodromo}' en El Oasis.")
        return False
            
    except Exception as e:
        print(f"    ⚠️ Error en el rastreador dinámico de El Oasis: {str(e)}")
        return False


def main():
    print("=" * 60)
    print(f"SISTEMA DE RASTREO DINÁMICO AUTO-DETECTABLE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
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
            "version": "1.5.0"
        },
        "hipodromos": [],
        "errores": None
    }
    
    for hipo in fuente_data.get("hipodromos", []):
        id_hipo = hipo["id"]
        url_pdf = hipo.get("url_pdf", "")
        nombre_archivo = os.path.basename(url_pdf) if url_pdf else ""
        ruta_fisica_pdf = os.path.join(ruta_pdfs, nombre_archivo)
        
        esta_activo = False
        
        # 1. Comprobar fuente principal
        if nombre_archivo and os.path.exists(ruta_fisica_pdf):
            print(f"  -> Verificando vigencia en fuente principal para: {hipo['nombre']}")
            if verificar_si_es_de_hoy(url_pdf):
                esta_activo = True
            else:
                try:
                    os.remove(ruta_fisica_pdf)
                except:
                    pass
                print(f"     [Borrado] Archivo obsoleto eliminado de fuente principal.")
                
        # 2. Si falló la principal, saltamos al RESPALDO INTELIGENTE DINÁMICO
        if not esta_activo:
            exito_respaldo = descargar_de_respaldo_dinamico(hipo["nombre"], nombre_archivo, ruta_pdfs)
            if exito_respaldo:
                esta_activo = True
        
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
    print("¡Rastreo dinámico completado! Rutas auto-detectadas con éxito.")
    print("=" * 60)

if __name__ == "__main__":
    main()
