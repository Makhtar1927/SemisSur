# pipeline/05_detect.py
"""
Étape 5 : Détection des faux départs de saison, calcul de sensibilité et métadonnées.
Implémente la règle de détection définie dans config.yaml.
Génère data/processed/results.json, sensitivity.json et metadata.json.

RÈGLE DE DÉTECTION (conforme au cahier des charges) :
1. Début de saison : premier jour >= start_search_day où cumul 3j >= trigger_accum_mm.
2. Pause sèche : dans les 30j suivants, plus longue suite de jours < dry_day_max_rain_mm.
   Signalée si >= dry_spell_min_duration_days.
3. Signature NDVI : pic dans les 25j après le début de saison, creux dans les 30j après le pic,
   baisse relative >= relative_drop_min, remontée >= recovery_abs_min dans les 40j suivants.
4. Statut : "signature_probable" si baisse ET pause sèche confirmée ;
            "baisse_a_examiner" si baisse sans pause sèche ;
            "pas_de_signature" sinon.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np
from datetime import datetime, date
from pipeline.common import ROOT_DIR, load_config, write_json


# ─────────────────────────────────────────────
#  IMPLÉMENTATION ALGORITHME (partagée Python/TS)
# ─────────────────────────────────────────────

def detect_season_start(rain_series: list, dates: list, cfg: dict) -> dict | None:
    """
    Détecte le premier jour de début de saison selon la règle de cumul glissant.
    rain_series : liste de float (mm/jour), dates : liste de str (YYYY-MM-DD).
    """
    search_start_md = cfg["start_search_day"]   # "06-01"
    accum_days = cfg["accum_days"]              # 3
    trigger_mm = cfg["trigger_accum_mm"]        # 20.0

    for i in range(len(dates)):
        d = dates[i]
        if d[5:] < search_start_md:
            continue
        if i + accum_days > len(rain_series):
            break
        window_sum = sum(rain_series[i:i + accum_days])
        if window_sum >= trigger_mm:
            return {"date": dates[i], "cumul_mm": round(window_sum, 1)}
    return None


def detect_dry_spell(rain_series: list, dates: list, start_date: str, cfg: dict) -> dict:
    """
    Cherche la plus longue pause sèche dans les dry_spell_window_days jours après start_date.
    """
    window = cfg["dry_spell_window_days"]        # 30
    max_rain = cfg["dry_day_max_rain_mm"]        # 1.0
    min_dur = cfg["dry_spell_min_duration_days"] # 8

    try:
        start_idx = dates.index(start_date)
    except ValueError:
        return {"max_dry_days": 0, "dry_start": None, "dry_end": None, "is_critical": False}

    search_end = min(start_idx + window + 1, len(dates))
    window_rain = rain_series[start_idx:search_end]
    window_dates = dates[start_idx:search_end]

    max_run = 0
    cur_run = 0
    best_start = None
    cur_start = None
    best_period_start = None
    best_period_end = None

    for j, r in enumerate(window_rain):
        if r < max_rain:
            if cur_run == 0:
                cur_start = window_dates[j]
            cur_run += 1
            if cur_run > max_run:
                max_run = cur_run
                best_period_start = cur_start
                best_period_end = window_dates[j]
        else:
            cur_run = 0

    return {
        "max_dry_days": max_run,
        "dry_start": best_period_start,
        "dry_end": best_period_end,
        "is_critical": max_run >= min_dur
    }


def detect_ndvi_signature(ndvi_dates: list, ndvi_medians: list, season_start_date: str, cfg: dict) -> dict:
    """
    Cherche la signature de faux départ dans la série NDVI.
    Retourne : peak_value, peak_date, trough_value, trough_date, recovery_value, recovery_date,
               relative_drop, recovery_delta, has_signature.
    """
    peak_window = cfg["peak_window_days"]
    trough_window = cfg["trough_window_days"]
    min_drop = cfg["relative_drop_min"]
    min_recovery = cfg["recovery_abs_min"]
    recovery_window = cfg["recovery_window_days"]

    if not season_start_date:
        return {"has_signature": False, "error": "Pas de début de saison détecté"}

    start_dt = datetime.strptime(season_start_date, "%Y-%m-%d")

    # Filtrer les observations valides (non None)
    valid = [(d, v) for d, v in zip(ndvi_dates, ndvi_medians)
             if v is not None and d is not None]
    if not valid:
        return {"has_signature": False, "error": "Aucune observation NDVI valide"}

    valid_dates = [datetime.strptime(d, "%Y-%m-%d") for d, _ in valid]
    valid_vals = [v for _, v in valid]

    # 1. PIC dans les 25 jours après le début de saison
    peak_val, peak_dt = None, None
    for dt, v in zip(valid_dates, valid_vals):
        diff = (dt - start_dt).days
        if 0 <= diff <= peak_window:
            if peak_val is None or v > peak_val:
                peak_val = v
                peak_dt = dt

    if peak_val is None:
        return {"has_signature": False, "error": "Aucun pic NDVI dans la fenêtre"}

    # 2. CREUX dans les 30 jours après le pic
    trough_val, trough_dt = None, None
    for dt, v in zip(valid_dates, valid_vals):
        diff = (dt - peak_dt).days
        if 1 <= diff <= trough_window:
            if trough_val is None or v < trough_val:
                trough_val = v
                trough_dt = dt

    if trough_val is None:
        return {"has_signature": False, "error": "Aucun creux NDVI après le pic"}

    relative_drop = (peak_val - trough_val) / peak_val if peak_val > 0 else 0

    if relative_drop < min_drop:
        return {
            "has_signature": False,
            "peak_value": round(peak_val, 4),
            "peak_date": peak_dt.strftime("%Y-%m-%d"),
            "trough_value": round(trough_val, 4),
            "trough_date": trough_dt.strftime("%Y-%m-%d"),
            "relative_drop": round(relative_drop, 4),
            "error": f"Baisse relative {relative_drop:.1%} < seuil {min_drop:.0%}"
        }

    # 3. REMONTÉE dans les 40 jours suivant le creux
    recovery_val, recovery_dt = None, None
    for dt, v in zip(valid_dates, valid_vals):
        diff = (dt - trough_dt).days
        if 1 <= diff <= recovery_window:
            if recovery_val is None or v > recovery_val:
                recovery_val = v
                recovery_dt = dt

    recovery_delta = (recovery_val - trough_val) if recovery_val is not None else 0

    return {
        "has_signature": True,
        "peak_value": round(peak_val, 4),
        "peak_date": peak_dt.strftime("%Y-%m-%d"),
        "trough_value": round(trough_val, 4),
        "trough_date": trough_dt.strftime("%Y-%m-%d"),
        "relative_drop": round(relative_drop, 4),
        "recovery_value": round(recovery_val, 4) if recovery_val else None,
        "recovery_date": recovery_dt.strftime("%Y-%m-%d") if recovery_dt else None,
        "recovery_delta": round(recovery_delta, 4)
    }


def compute_confidence(n_valid_obs: int, avg_cloud_frac: float) -> str:
    """Calcule le niveau de confiance selon la qualité des observations."""
    if n_valid_obs >= 12 and avg_cloud_frac < 0.25:
        return "eleve"
    elif n_valid_obs >= 6 and avg_cloud_frac < 0.50:
        return "moyen"
    else:
        return "faible"


def compute_anomaly(ndvi_median: float | None, ref_p50: float | None) -> float | None:
    """Anomalie NDVI par rapport à la médiane de référence."""
    if ndvi_median is None or ref_p50 is None:
        return None
    return round(ndvi_median - ref_p50, 4)


# ─────────────────────────────────────────────
#  PIPELINE PRINCIPAL
# ─────────────────────────────────────────────

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

        # ── Pluie ──
        rain_sec = df_rain[df_rain["sector_id"] == sid].sort_values("date")
        rain_dates = rain_sec["date"].tolist()
        rain_mm = rain_sec["rain_mm"].tolist()

        season_result = detect_season_start(rain_mm, rain_dates, rain_cfg)
        dry_spell = {"max_dry_days": 0, "dry_start": None, "dry_end": None, "is_critical": False}
        if season_result:
            dry_spell = detect_dry_spell(rain_mm, rain_dates, season_result["date"], rain_cfg)

        # ── NDVI ──
        ndvi_sec = df_ndvi[df_ndvi["sector_id"] == sid].sort_values("date_start")
        ndvi_dates = ndvi_sec["date_start"].tolist()
        ndvi_meds = [v if not pd.isna(v) else None for v in ndvi_sec["ndvi_median"].tolist()]

        n_valid = sum(1 for v in ndvi_meds if v is not None)
        avg_cloud = float(ndvi_sec["cloud_frac"].mean()) if len(ndvi_sec) > 0 else 1.0

        season_start_date = season_result["date"] if season_result else None
        ndvi_sig = detect_ndvi_signature(ndvi_dates, ndvi_meds, season_start_date, ndvi_cfg)

        # ── Anomalie vs référence ──
        min_anomaly = None
        if ndvi_meds:
            # Calculer l'anomalie sur les obs valides autour du creux
            valid_obs = [(d, v) for d, v in zip(ndvi_dates, ndvi_meds) if v is not None]
            ref_sec = df_ref[df_ref["sector_id"] == sid]
            anomalies = []
            for d, v in valid_obs:
                window_key = d[5:]  # MM-DD
                ref_row = ref_sec[ref_sec["window"] == window_key]
                if len(ref_row) > 0:
                    anomaly = compute_anomaly(v, float(ref_row["ndvi_p50"].iloc[0]))
                    if anomaly is not None:
                        anomalies.append(anomaly)
            min_anomaly = round(min(anomalies), 4) if anomalies else None

        # ── Statut ──
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

    # Compter les statuts
    statuts = [r["statut"] for r in results]
    for s in ["signature_probable", "baisse_a_examiner", "pas_de_signature", "non_evalue"]:
        print(f"  {s}: {statuts.count(s)} secteur(s)")

    # ── Analyse de sensibilité ──
    print(f"[05_detect] Calcul de la grille de sensibilité...")
    sens_cfg = config["sensitivity_grid"]
    sensitivity = []

    for rain_trigger in sens_cfg["rain_trigger_accum_mm"]:
        for dry_days in sens_cfg["dry_spell_min_duration_days"]:
            for ndvi_drop in sens_cfg["ndvi_relative_drop_min"]:
                rain_cfg_mod = dict(rain_cfg)
                rain_cfg_mod["trigger_accum_mm"] = rain_trigger
                rain_cfg_mod["dry_spell_min_duration_days"] = dry_days
                ndvi_cfg_mod = dict(ndvi_cfg)
                ndvi_cfg_mod["relative_drop_min"] = ndvi_drop

                n_sig = 0
                for sec in sectors:
                    sid = sec["properties"]["id"]
                    rain_sec = df_rain[df_rain["sector_id"] == sid].sort_values("date")
                    r_dates = rain_sec["date"].tolist()
                    r_mm = rain_sec["rain_mm"].tolist()
                    s_res = detect_season_start(r_mm, r_dates, rain_cfg_mod)
                    d_spell = detect_dry_spell(r_mm, r_dates, s_res["date"] if s_res else "", rain_cfg_mod)

                    ndvi_sec = df_ndvi[df_ndvi["sector_id"] == sid].sort_values("date_start")
                    n_dates = ndvi_sec["date_start"].tolist()
                    n_meds = [v if not pd.isna(v) else None for v in ndvi_sec["ndvi_median"].tolist()]
                    n_sig_res = detect_ndvi_signature(n_dates, n_meds, s_res["date"] if s_res else None, ndvi_cfg_mod)

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
    print(f"[05_detect] Grille de sensibilité écrite : {sensitivity_path}")

    # ── Métadonnées ──
    metadata = {
        "generated_at": datetime.now().isoformat(),
        "project": "SemisSûr",
        "zone": config["project"]["zone_name"],
        "bbox": config["project"]["bbox"],
        "season_year": config["dates"]["season_year"],
        "season_start": config["dates"]["season_start"],
        "season_end": config["dates"]["season_end"],
        "reference_years": config["dates"]["reference_years"],
        "thresholds": config["detection_thresholds"],
        "sources": [
            {
                "produit": "CHIRPS Daily",
                "version": "2.0",
                "fournisseur": "UC Santa Barbara / USGS",
                "resolution": "0.05°",
                "periode": f"{config['dates']['season_start']} à {config['dates']['season_end']}",
                "licence": "Domaine public",
                "date_consultation": "2026-10-20"
            },
            {
                "produit": "Sentinel-2 L2A",
                "version": "COPERNICUS/S2_SR_HARMONIZED",
                "fournisseur": "ESA / Copernicus",
                "resolution": "10 m",
                "periode": "2019-05-01 à 2026-10-15",
                "licence": "Copernicus Open Access",
                "date_consultation": "2026-10-20"
            },
            {
                "produit": "ESA WorldCover 2021",
                "version": "v200",
                "fournisseur": "ESA",
                "resolution": "10 m",
                "periode": "2021 (référence contextuelle)",
                "licence": "CC BY 4.0",
                "date_consultation": "2026-10-20"
            }
        ],
        "avertissement": (
            "Les valeurs de NDVI sont des signaux à vérifier sur place. "
            "Elles n'impliquent ni cause, ni rendement, ni perte prouvée. "
            "Les seuils sont des hypothèses à calibrer par des données de terrain."
        )
    }
    write_json(metadata, ROOT_DIR / config["paths"]["processed"]["metadata"])
    print(f"[05_detect] Métadonnées écrites.")
    return results


if __name__ == "__main__":
    run_detection()
