#!/usr/bin/env python3
# scripts/limpieza_profunda.py
import json
import os

def main():
    print("Iniciando limpieza profunda de archivos guardados...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    ruta_salida = os.path.join(project_root, "data", "revistas.json")
    ruta_originales = os.path.join(project_root, "data", "urls_originales.json")

    # 1. Leer los hipódromos configurados
    if os.path.exists(ruta_originales):
        with open(ruta_originales, "r", encoding="utf-8") as f:
            fuente_data = json.load(f)
    else:
        print("No se encontró urls_originales.json")
        return

    # 2. Forzar que absolutamente TODOS inicien en FALSO
    data_web = {
        "metadata": {"lastUpdate": "Limpieza Inicial", "totalHipodromos": len(fuente_data.get("hipodromos", []))},
        "hipodromos": [],
        "errores": None
    }

    for hipo in fuente_data.get("hipodromos", []):
        data_web["hipodromos"].append({
            "id": hipo["id"],
            "nombre": hipo["nombre"],
            "logo": hipo["logo"],
            "revistas": {"espanol": "#", "winnersChoice": "#"},
            "activo": False,  # <-- Forzamos Apagado
            "ultimaActualizacion": ""
        })
        
        # Intentar borrar el archivo físico viejo si existe localmente
        url_pdf = hipo.get("url_pdf", "")
        nombre_archivo = os.path.basename(url_pdf) if url_pdf else ""
        archivo_local = os.path.join(project_root, "pdfs", nombre_archivo)
        if os.path.exists(archivo_local) and nombre_archivo:
            try:
                os.remove(archivo_local)
                print(f"Eliminado rastro antiguo de: {nombre_archivo}")
            except:
                pass

    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(data_web, f, indent=2, ensure_ascii=False)
    
    print("¡Limpieza completada con éxito!")

if __name__ == "__main__":
    main()
