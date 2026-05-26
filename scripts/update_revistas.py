#!/usr/bin/env python3
# scripts/update_revistas.py
import json
import os
from datetime import datetime

def main():
    print("=" * 60)
    print(f"PROCESANDO DISPONIBILIDAD DE REVISTAS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    ruta_originales = os.path.join(project_root, "data", "urls_originales.json")
    ruta_salida = os.path.join(project_root, "data", "revistas.json")
    ruta_pdfs = os.path.join(project_root, "pdfs")
    
    # Validar que exista el origen
    if not os.path.exists(ruta_originales):
        print(f"ERROR CRÍTICO: No existe el archivo {ruta_originales}")
        return

    with open(ruta_originales, "r", encoding="utf-8") as f:
        fuente_data = json.load(f)
        
    data_web = {
        "metadata": {
            "lastUpdate": datetime.now().isoformat(),
            "totalHipodromos": len(fuente_data.get("hipodromos", [])),
            "version": "1.1.0"
        },
        "hipodromos": [],
        "errores": None
    }
    
    # Analizar cada hipódromo según lo descargado en la carpeta pdfs/
    for hipo in fuente_data.get("hipodromos", []):
        url_pdf = hipo.get("url_pdf", "")
        nombre_archivo = os.path.basename(url_pdf) if url_pdf else ""
        ruta_fisica_pdf = os.path.join(ruta_pdfs, nombre_archivo)
        
        # Un hipódromo está activo si el archivo existe y pesa más de 1 Kilobyte (evita archivos corruptos)
        esta_activo = False
        if nombre_archivo and os.path.exists(ruta_fisica_pdf):
            if os.path.getsize(ruta_fisica_pdf) > 1024:
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
        
    # Guardar el JSON definitivo para la web
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(data_web, f, indent=2, ensure_ascii=False)
        
    print("=" * 60)
    print("¡Archivo data/revistas.json generado exitosamente!")
    print("=" * 60)

if __name__ == "__main__":
    main()