# -*- coding: utf-8 -*-
"""
run_pipeline.py -- Point d'entree unique pour SemisSur.
Execute toutes les etapes du pipeline dans l'ordre correct.

Usage :
    python run_pipeline.py
"""
import sys
import io
import time
from pathlib import Path

# Forcer la sortie UTF-8 sur Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent))

from pipeline.common import load_config, ensure_dirs, ROOT_DIR

def banner(text: str):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def main():
    banner("SemisSûr — Démarrage du pipeline de données")
    print("Livraison hackathon : 23 octobre 2026, 23h59 (heure de Dakar)")
    print("Zone : Bassin arachidier — Région de Kaffrine, Sénégal\n")

    config = load_config()
    ensure_dirs(config)

    # Étape 1 : Secteurs
    banner("Étape 1/5 : Découpage spatial et masque de cultures")
    t0 = time.time()
    from pipeline.sector_01 import build_sectors
    build_sectors()
    print(f"  ✓ Terminé en {time.time()-t0:.1f}s")

    # Étape 2 : Pluie CHIRPS
    banner("Étape 2/5 : Pluie journalière CHIRPS")
    t0 = time.time()
    from pipeline.chirps_02 import process_chirps
    process_chirps()
    print(f"  ✓ Terminé en {time.time()-t0:.1f}s")

    # Étape 3 : NDVI Sentinel-2
    banner("Étape 3/5 : NDVI Sentinel-2 L2A (masque nuages SCL)")
    t0 = time.time()
    from pipeline.ndvi_03 import process_ndvi
    process_ndvi()
    print(f"  ✓ Terminé en {time.time()-t0:.1f}s")

    # Étape 4 : Référence pluriannuelle
    banner("Étape 4/5 : Référence NDVI 2019-2025 (p10/p50/p90)")
    t0 = time.time()
    from pipeline.reference_04 import process_reference
    process_reference()
    print(f"  ✓ Terminé en {time.time()-t0:.1f}s")

    # Étape 5 : Détection et résultats
    banner("Étape 5/5 : Détection des faux départs et sensibilité")
    t0 = time.time()
    from pipeline.detect_05 import run_detection
    run_detection()
    print(f"  ✓ Terminé en {time.time()-t0:.1f}s")

    banner("Pipeline terminé — Fichiers dans data/processed/")
    processed = ROOT_DIR / "data" / "processed"
    for f in sorted(processed.iterdir()):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name:<30} {size_kb:>8.1f} Ko")
    print("\nLancez maintenant : cd frontend && npm run dev")


if __name__ == "__main__":
    main()
