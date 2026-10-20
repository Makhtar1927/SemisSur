# pipeline/detect_05.py
"""
Étape 5 : Détection des faux départs de saison, grille de sensibilité et métadonnées.
Import depuis 05_detect.py — même logique, nom compatible avec run_pipeline.py.
"""
from pipeline.detect_core import (
    detect_season_start, detect_dry_spell, detect_ndvi_signature,
    compute_confidence, compute_anomaly
)
from pathlib import Path
import json
import pandas as pd
import numpy as np
from datetime import datetime
from pipeline.common import ROOT_DIR, load_config, write_json


def run_detection():
    config = load_config()
    rain_cfg = config["detection_thresholds"]["rain"]
    ndvi_cfg = config["detection_thresholds"]["ndvi"]

    sectors_path = ROOT_DIR / config["paths"]["processed"]["sectors"]
    rain_path = ROOT_DIR / config["paths"]["processed"]["rain_daily"]
    ndvi_path = ROOT_DIR / config["paths"]["processed"]["ndvi_series"]
    ndvi_ref_path = ROOT_DIR / config["paths"]["processed"]["ndvi_reference"]
    results_path = ROOT_DIR / config["paths"]["processed"]["results"]
    sensitivity_path = ROOT_DIR / config["paths"]["processed"]["sensitivity"]

    with open(sectors_path, "r", encoding="utf-8") as f:
        sectors = json.load(f)["features"]

    df_rain = pd.read_csv(rain_path)
    df_ndvi = pd.read_csv(ndvi_path)
    df_ref = pd.read_csv(ndvi_ref_path)

    print(f"[05_detect] Détection sur {len(sectors)} secteurs...")
    results = []

    for sec in sectors:
        sid = sec["properties"]["id"]

        rain_sec = df_rain[df_rain["sector_id"] == sid].sort_values("date")
        rain_dates = rain_sec["date"].tolist()
        rain_mm = rain_sec["rain_mm"].tolist()

        season_result = detect_season_start(rain_mm, rain_dates, rain_cfg)
        dry_spell = {"max_dry_days": 0, "dry_start": None, "dry_end": None, "is_critical": False}
        if season_result:
            dry_spell = detect_dry_spell(rain_mm, rain_dates, season_result["date"], rain_cfg)

        ndvi_sec = df_ndvi[df_ndvi["sector_id"] == sid].sort_values("date_start")
        ndvi_dates = ndvi_sec["date_start"].tolist()
        ndvi_meds = [v if not pd.isna(v) else None for v in ndvi_sec["ndvi_median"].tolist()]

        n_valid = sum(1 for v in ndvi_meds if v is not None)
        avg_cloud = float(ndvi_sec["cloud_frac"].mean()) if len(ndvi_sec) > 0 else 1.0

        season_start_date = season_result["date"] if season_result else None
        ndvi_sig = detect_ndvi_signature(ndvi_dates, ndvi_meds, season_start_date, ndvi_cfg)

        min_anomaly = None
        valid_obs = [(d, v) for d, v in zip(ndvi_dates, ndvi_meds) if v is not None]
        ref_sec = df_ref[df_ref["sector_id"] == sid]
        anomalies = []
        for d, v in valid_obs:
            window_key = d[5:]
            ref_row = ref_sec[ref_sec["window"] == window_key]
            if len(ref_row) > 0:
                anomaly = compute_anomaly(v, float(ref_row["ndvi_p50"].iloc[0]))
                if anomaly is not None:
                    anomalies.append(anomaly)
        min_anomaly = round(min(anomalies), 4) if anomalies else None

        if ndvi_sig.get("has_signature") and dry_spell["is_critical"]:
            statut = "signature_probable"
        elif ndvi_sig.get("has_signature") and not dry_spell["is_critical"]:
            statut = "baisse_a_examiner"
        else:
            statut = "pas_de_signature"

        if season_start_date is None:
            statut = "non_evalue"

        confidence = compute_confidence(n_valid, avg_cloud)

        results.append({
            "sector_id": sid,
            "nom": sec["properties"]["nom"],
            "commune": sec["properties"]["commune"],
            "crop_frac": sec["properties"]["crop_frac"],
            "season_start_date": season_result["date"] if season_result else None,
            "season_trigger_mm": season_result["cumul_mm"] if season_result else None,
            "max_dry_days": dry_spell["max_dry_days"],
            "dry_start": dry_spell["dry_start"],
            "dry_end": dry_spell["dry_end"],
            "dry_is_critical": dry_spell["is_critical"],
            "ndvi_peak_value": ndvi_sig.get("peak_value"),
            "ndvi_peak_date": ndvi_sig.get("peak_date"),
            "ndvi_trough_value": ndvi_sig.get("trough_value"),
            "ndvi_trough_date": ndvi_sig.get("trough_date"),
            "ndvi_relative_drop": ndvi_sig.get("relative_drop"),
            "ndvi_recovery_value": ndvi_sig.get("recovery_value"),
            "ndvi_recovery_date": ndvi_sig.get("recovery_date"),
            "ndvi_recovery_delta": ndvi_sig.get("recovery_delta"),
            "ndvi_anomaly_min": min_anomaly,
            "n_valid_obs": n_valid,
            "avg_cloud_frac": round(avg_cloud, 3),
            "statut": statut,
            "confidence": confidence
        })

    write_json({"sectors": results, "generated_at": datetime.now().isoformat()}, results_path)
    print(f"[05_detect] Résultats écrits : {results_path}")

    statuts = [r["statut"] for r in results]
    for s in ["signature_probable", "baisse_a_examiner", "pas_de_signature", "non_evalue"]:
        print(f"  {s}: {statuts.count(s)} secteur(s)")

    # Grille de sensibilité
    print(f"[05_detect] Calcul de la grille de sensibilité...")
    sens_cfg = config["sensitivity_grid"]
    sensitivity = []

    for rain_trigger in sens_cfg["rain_trigger_accum_mm"]:
        for dry_days in sens_cfg["dry_spell_min_duration_days"]:
            for ndvi_drop in sens_cfg["ndvi_relative_drop_min"]:
                rain_cfg_mod = {**rain_cfg, "trigger_accum_mm": rain_trigger,
                                "dry_spell_min_duration_days": dry_days}
                ndvi_cfg_mod = {**ndvi_cfg, "relative_drop_min": ndvi_drop}

                n_sig = 0
                for sec in sectors:
                    sid = sec["properties"]["id"]
                    rain_sec = df_rain[df_rain["sector_id"] == sid].sort_values("date")
                    r_dates = rain_sec["date"].tolist()
                    r_mm = rain_sec["rain_mm"].tolist()
                    s_res = detect_season_start(r_mm, r_dates, rain_cfg_mod)
                    d_spell = detect_dry_spell(r_mm, r_dates,
                                               s_res["date"] if s_res else "", rain_cfg_mod)
                    ndvi_sec = df_ndvi[df_ndvi["sector_id"] == sid].sort_values("date_start")
                    n_dates = ndvi_sec["date_start"].tolist()
                    n_meds = [v if not pd.isna(v) else None for v in ndvi_sec["ndvi_median"].tolist()]
                    n_sig_res = detect_ndvi_signature(n_dates, n_meds,
                                                      s_res["date"] if s_res else None, ndvi_cfg_mod)
                    if n_sig_res.get("has_signature") and d_spell["is_critical"]:
                        n_sig += 1

                sensitivity.append({
                    "rain_trigger_mm": rain_trigger,
                    "dry_spell_days": dry_days,
                    "ndvi_drop_min": ndvi_drop,
                    "n_sectors_signaled": n_sig,
                    "pct_sectors_signaled": round(n_sig / len(sectors) * 100, 1)
                })

    write_json({"grid": sensitivity, "n_sectors_total": len(sectors),
                "generated_at": datetime.now().isoformat()}, sensitivity_path)
    print(f"[05_detect] Grille de sensibilité écrite.")

    # Métadonnées
    metadata = {
        "generated_at": datetime.now().isoformat(),
        "project": "SemisSûr",
        "zone": config["project"]["zone_name"],
        "bbox": config["project"]["bbox"],
        "season_year": config["dates"]["season_year"],
        "thresholds": config["detection_thresholds"],
        "sources": [
            {"produit": "CHIRPS Daily", "version": "2.0", "fournisseur": "UC Santa Barbara",
             "resolution": "0.05°", "licence": "Domaine public", "date_consultation": "2026-10-20"},
            {"produit": "Sentinel-2 L2A", "version": "S2_SR_HARMONIZED", "fournisseur": "ESA",
             "resolution": "10 m", "licence": "Copernicus Open Access", "date_consultation": "2026-10-20"},
            {"produit": "ESA WorldCover 2021", "version": "v200", "fournisseur": "ESA",
             "resolution": "10 m", "licence": "CC BY 4.0", "date_consultation": "2026-10-20"}
        ],
        "avertissement": (
            "Les valeurs NDVI sont des signaux à vérifier sur place. "
            "Elles n'impliquent ni cause, ni rendement, ni perte prouvée. "
            "Les seuils sont des hypothèses à calibrer par des données de terrain."
        )
    }
    write_json(metadata, ROOT_DIR / config["paths"]["processed"]["metadata"])
    print(f"[05_detect] Métadonnées écrites.")
    return results


if __name__ == "__main__":
    run_detection()
