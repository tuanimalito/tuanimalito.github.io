#!/usr/bin/env python3
# scripts/update_revistas.py
# Version simplificada para PDFs locales

import json
import os
from datetime import datetime
from typing import Dict

# Configuracion de hipodromos con rutas LOCALES
HIPODROMOS_CONFIG = [
    {
        "id": "belmont-park",
        "nombre": "Belmont Park",
        "logo": "img/winner/hip3.webp",
        "revistas": {
            "espanol": "pdfs/BelmontPark.pdf",
            "winnersChoice": "pdfs/WinBelmontPark.pdf"
        }
    },
    {
        "id": "thistledown",
        "nombre": "ThistleDown",
        "logo": "img/winner/hip15.webp",
        "revistas": {
            "espanol": "pdfs/ThistleDown.pdf",
            "winnersChoice": "pdfs/WinThistleDown.pdf"
        }
    },
    {
        "id": "evangeline-downs",
        "nombre": "Evangeline Downs",
        "logo": "img/winner/hip1.webp",
        "revistas": {
            "espanol": "pdfs/EvangelineDowns.pdf",
            "winnersChoice": "pdfs/WinEvangelineDowns.pdf"
        }
    },
    {
        "id": "delta-downs",
        "nombre": "Delta Downs",
        "logo": "img/winner/hip17.webp",
        "revistas": {
            "espanol": "pdfs/DeltaDowns.pdf",
            "winnersChoice": "pdfs/WinDeltaDowns.pdf"
        }
    },
    {
        "id": "belterra-park",
        "nombre": "Belterra Park",
        "logo": "img/winner/hip8.webp",
        "revistas": {
            "espanol": "pdfs/WinBelterraPark.pdf",
            "winnersChoice": "pdfs/WinBelterraPark.pdf"
        }
    },
    {
        "id": "gulfstream-park",
        "nombre": "Gulfstream Park",
        "logo": "img/winner/hip6.webp",
        "revistas": {
            "espanol": "pdfs/GulfstreamPark.pdf",
            "winnersChoice": "pdfs/WinGulfstreamPark.pdf"
        }
    },
    {
        "id": "century-mile",
        "nombre": "Century Mile",
        "logo": "img/winner/hip13.webp",
        "revistas": {
            "espanol": "pdfs/CenturyMile.pdf",
            "winnersChoice": "pdfs/WinCenturyMile.pdf"
        }
    },
    {
        "id": "charles-town",
        "nombre": "Charles Town",
        "logo": "img/winner/hip10.webp",
        "revistas": {
            "espanol": "pdfs/CharlesTown.pdf",
            "winnersChoice": "pdfs/WinCharlesTown.pdf"
        }
    },
    {
        "id": "emerald-downs",
        "nombre": "Emerald Downs",
        "logo": "img/winner/hip19.webp",
        "revistas": {
            "espanol": "pdfs/EmeraldDowns.pdf",
            "winnersChoice": "pdfs/WinEmeraldDowns.pdf"
        }
    },
    {
        "id": "remington-park",
        "nombre": "Remington Park",
        "logo": "img/winner/hip2.webp",
        "revistas": {
            "espanol": "pdfs/RemingtonPark.pdf",
            "winnersChoice": "pdfs/WinRemingtonPark.pdf"
        }
    },
    {
        "id": "lone-star-park",
        "nombre": "Lone Star Park",
        "logo": "img/winner/hip23.webp",
        "revistas": {
            "espanol": "pdfs/LoneStarPark.pdf",
            "winnersChoice": "pdfs/WinLoneStarPark.pdf"
        }
    },
    {
        "id": "laurel-park",
        "nombre": "Laurel Park",
        "logo": "img/winner/hip24.webp",
        "revistas": {
            "espanol": "pdfs/LaurelPark.pdf",
            "winnersChoice": "pdfs/WinLaurelPark.pdf"
        }
    },
    {
        "id": "sam-houston",
        "nombre": "Sam Houston",
        "logo": "img/winner/hip18.webp",
        "revistas": {
            "espanol": "pdfs/SamHouston.pdf",
            "winnersChoice": "pdfs/WinSamHouston.pdf"
        }
    },
    {
        "id": "monmouth-park",
        "nombre": "Monmouth Park",
        "logo": "img/winner/hip12.webp",
        "revistas": {
            "espanol": "pdfs/MonmouthPark.pdf",
            "winnersChoice": "pdfs/WinMonmouthPark.pdf"
        }
    },
    {
        "id": "prairie-meadows",
        "nombre": "Prairie Meadows",
        "logo": "img/winner/hip14.webp",
        "revistas": {
            "espanol": "pdfs/PrairieMeadows.pdf",
            "winnersChoice": "pdfs/WinPrairieMeadows.pdf"
        }
    },
    {
        "id": "delaware-park",
        "nombre": "Delaware Park",
        "logo": "img/winner/hip1.webp",
        "revistas": {
            "espanol": "pdfs/DelawarePark.pdf",
            "winnersChoice": "pdfs/WinDelawarePark.pdf"
        }
    },
    {
        "id": "woodbine",
        "nombre": "Woodbine",
        "logo": "img/winner/hip9.webp",
        "revistas": {
            "espanol": "pdfs/Woodbine.pdf",
            "winnersChoice": "pdfs/WinWoodbine.pdf"
        }
    },
    {
        "id": "fairmount-park",
        "nombre": "Fairmount Park",
        "logo": "img/winner/hip20.webp",
        "revistas": {
            "espanol": "pdfs/FairmountPark.pdf",
            "winnersChoice": "pdfs/WinFairmountPark.pdf"
        }
    },
    {
        "id": "sunray-park",
        "nombre": "Sunray Park",
        "logo": "img/winner/hip16.webp",
        "revistas": {
            "espanol": "pdfs/SunrayPark.pdf",
            "winnersChoice": "pdfs/WinSunrayPark.pdf"
        }
    },
    {
        "id": "louisiana-downs",
        "nombre": "Louisiana Downs",
        "logo": "img/winner/hip22.webp",
        "revistas": {
            "espanol": "pdfs/LouisianaDowns.pdf",
            "winnersChoice": "pdfs/WinLouisianaDowns.pdf"
        }
    },
    {
        "id": "los-alamitos-qh",
        "nombre": "Los Alamitos QH",
        "logo": "img/winner/hip1.webp",
        "revistas": {
            "espanol": "pdfs/LosAlamitosQH.pdf",
            "winnersChoice": "pdfs/WinLosAlamitosQH.pdf"
        }
    },
    {
        "id": "fair-grounds",
        "nombre": "Fair Grounds",
        "logo": "img/winner/hip1.webp",
        "revistas": {
            "espanol": "pdfs/FairGrounds.pdf",
            "winnersChoice": "pdfs/WinFairGrounds.pdf"
        }
    },
    {
        "id": "hawthorne-park",
        "nombre": "Hawthorne Park",
        "logo": "img/winner/hip21.webp",
        "revistas": {
            "espanol": "pdfs/HawthornePark.pdf",
            "winnersChoice": "pdfs/WinHawthornePark.pdf"
        }
    },
    {
        "id": "parx-racing",
        "nombre": "Parx Racing",
        "logo": "img/winner/hip11.webp",
        "revistas": {
            "espanol": "pdfs/ParxRacing.pdf",
            "winnersChoice": "pdfs/WinParxRacing.pdf"
        }
    },
    {
        "id": "santa-anita",
        "nombre": "Santa Anita Park",
        "logo": "img/winner/hip4.webp",
        "revistas": {
            "espanol": "pdfs/SantaAnitaPark.pdf",
            "winnersChoice": "pdfs/WinSantaAnitaPark.pdf"
        }
    }
]

def guardar_json(data: Dict, ruta: str = "data/revistas.json"):
    """Guarda el JSON en la ruta especificada"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    ruta_completa = os.path.join(project_root, ruta)
    
    os.makedirs(os.path.dirname(ruta_completa), exist_ok=True)
    
    with open(ruta_completa, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"JSON guardado en {ruta}")

def main():
    print("=" * 60)
    print(f"ACTUALIZANDO REVISTAS.JSON - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Crear el objeto JSON con todos los hipodromos (todos activos)
    data = {
        "metadata": {
            "lastUpdate": datetime.now().isoformat(),
            "totalHipodromos": len(HIPODROMOS_CONFIG),
            "totalConfigurados": len(HIPODROMOS_CONFIG),
            "version": "1.0.0"
        },
        "hipodromos": [],
        "errores": None
    }
    
    for config in HIPODROMOS_CONFIG:
        data["hipodromos"].append({
            "id": config["id"],
            "nombre": config["nombre"],
            "logo": config["logo"],
            "revistas": {
                "espanol": config["revistas"]["espanol"],
                "winnersChoice": config["revistas"]["winnersChoice"]
            },
            "activo": True,
            "ultimaActualizacion": datetime.now().strftime("%Y-%m-%d")
        })
        print(f"  OK - {config['nombre']}")
    
    guardar_json(data)
    
    print("=" * 60)
    print("ACTUALIZACION COMPLETADA EXITOSAMENTE")
    print("=" * 60)

if __name__ == "__main__":
    main()