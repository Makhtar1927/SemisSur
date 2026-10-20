# pipeline/04_reference.py
"""
Étape 4 : Calcul de la référence pluriannuelle NDVI (2019-2025).
Percentiles p10, p50, p90 par fenêtre de 7 jours et par secteur.
Génère data/processed/ndvi_reference.csv.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pipeline.common import ROOT_DIR, load_config
from pipeline.03_ndvi import build_ndvi_profile_for_sector


def process_reference():
    config = load_config()
    sectors_path = ROOT_DIR / config["paths"]["processed"]["sectors"]
    out_path = ROOT_DIR / config["paths"]["processed"]["ndvi_reference"]

    if not sectors_path.exists():
        raise FileNotFoundError("Secteurs introuvables. Lancez 01_sectors.py d'abord.")

    with open(sectors_path, "r", encoding="utf-8") as f:
        sectors_data = json.load(f)
    sectors = sectors_data["features"]

    ref_years = config["dates"]["reference_years"]
    print(f"[04_reference] Calcul de la référence NDVI sur {len(ref_years)} années ({ref_years[0]}-{ref_years[-1]}) "
          f"pour {len(sectors)} secteurs...")

    # Construire toutes les séries historiques
    # Structure : {sector_id: {window_start (doy): [ndvi_median_year1, year2, ...]}}
    all_records = []

    for i, sec in enumerate(sectors):
        sec_id = sec["properties"]["id"]
        # Collecter les profils sur toutes les années de référence
        yearly_profiles = {}
        for yr in ref_years:
            composites = build_ndvi_profile_for_sector(sec, yr, config, seed_offset=i + yr * 1000)
            for comp in composites:
                window_key = comp["date_start"][5:]  # MM-DD format pour comparaison inter-annuelle
                if comp["ndvi_median"] is not None:
                    if window_key not in yearly_profiles:
                        yearly_profiles[window_key] = []
                    yearly_profiles[window_key].append(comp["ndvi_median"])

        # Calculer les percentiles par fenêtre
        for window_key, values in yearly_profiles.items():
            if len(values) >= 3:  # Au moins 3 années valides pour calculer des percentiles
                all_records.append({
                    "window": window_key,
                    "sector_id": sec_id,
                    "ndvi_p10": round(float(np.percentile(values, 10)), 4),
                    "ndvi_p50": round(float(np.percentile(values, 50)), 4),
                    "ndvi_p90": round(float(np.percentile(values, 90)), 4),
                    "n_years": len(values)
                })

    df = pd.DataFrame(all_records).sort_values(["sector_id", "window"]).reset_index(drop=True)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"[04_reference] {len(df)} enregistrements de référence écrits dans {out_path}.")
    return df


if __name__ == "__main__":
    process_reference()
