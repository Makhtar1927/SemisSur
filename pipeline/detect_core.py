# pipeline/detect_core.py
"""
Noyau algorithmique de détection SemisSûr.
Implémenté ici en Python (référence), et reproduit à l'identique en TypeScript
dans frontend/src/lib/detection.ts pour la sensibilité interactive.
"""


def detect_season_start(rain_series: list, dates: list, cfg: dict) -> dict | None:
    search_start_md = cfg["start_search_day"]
    accum_days = cfg["accum_days"]
    trigger_mm = cfg["trigger_accum_mm"]
    for i in range(len(dates)):
        if dates[i][5:] < search_start_md:
            continue
        if i + accum_days > len(rain_series):
            break
        if sum(rain_series[i:i + accum_days]) >= trigger_mm:
            return {"date": dates[i], "cumul_mm": round(sum(rain_series[i:i + accum_days]), 1)}
    return None


def detect_dry_spell(rain_series: list, dates: list, start_date: str, cfg: dict) -> dict:
    window = cfg["dry_spell_window_days"]
    max_rain = cfg["dry_day_max_rain_mm"]
    min_dur = cfg["dry_spell_min_duration_days"]
    try:
        start_idx = dates.index(start_date)
    except ValueError:
        return {"max_dry_days": 0, "dry_start": None, "dry_end": None, "is_critical": False}
    search_end = min(start_idx + window + 1, len(dates))
    window_rain = rain_series[start_idx:search_end]
    window_dates = dates[start_idx:search_end]
    max_run = 0
    cur_run = 0
    cur_start = None
    best_start = None
    best_end = None
    for j, r in enumerate(window_rain):
        if r < max_rain:
            if cur_run == 0:
                cur_start = window_dates[j]
            cur_run += 1
            if cur_run > max_run:
                max_run = cur_run
                best_start = cur_start
                best_end = window_dates[j]
        else:
            cur_run = 0
    return {"max_dry_days": max_run, "dry_start": best_start, "dry_end": best_end,
            "is_critical": max_run >= min_dur}


def detect_ndvi_signature(ndvi_dates: list, ndvi_medians: list, season_start_date: str, cfg: dict) -> dict:
    from datetime import datetime
    peak_window = cfg["peak_window_days"]
    trough_window = cfg["trough_window_days"]
    min_drop = cfg["relative_drop_min"]
    min_recovery = cfg["recovery_abs_min"]
    recovery_window = cfg["recovery_window_days"]
    if not season_start_date:
        return {"has_signature": False, "error": "Pas de début de saison"}
    start_dt = datetime.strptime(season_start_date, "%Y-%m-%d")
    valid = [(d, v) for d, v in zip(ndvi_dates, ndvi_medians) if v is not None and d is not None]
    if not valid:
        return {"has_signature": False, "error": "Aucune observation valide"}
    valid_dates = [datetime.strptime(d, "%Y-%m-%d") for d, _ in valid]
    valid_vals = [v for _, v in valid]
    # Pic
    peak_val, peak_dt = None, None
    for dt, v in zip(valid_dates, valid_vals):
        diff = (dt - start_dt).days
        if 0 <= diff <= peak_window:
            if peak_val is None or v > peak_val:
                peak_val, peak_dt = v, dt
    if peak_val is None:
        return {"has_signature": False, "error": "Aucun pic dans la fenêtre"}
    # Creux
    trough_val, trough_dt = None, None
    for dt, v in zip(valid_dates, valid_vals):
        diff = (dt - peak_dt).days
        if 1 <= diff <= trough_window:
            if trough_val is None or v < trough_val:
                trough_val, trough_dt = v, dt
    if trough_val is None:
        return {"has_signature": False, "error": "Aucun creux après le pic"}
    relative_drop = (peak_val - trough_val) / peak_val if peak_val > 0 else 0
    if relative_drop < min_drop:
        return {"has_signature": False, "peak_value": round(peak_val, 4),
                "peak_date": peak_dt.strftime("%Y-%m-%d"),
                "trough_value": round(trough_val, 4),
                "trough_date": trough_dt.strftime("%Y-%m-%d"),
                "relative_drop": round(relative_drop, 4)}
    # Remontée
    recovery_val, recovery_dt = None, None
    for dt, v in zip(valid_dates, valid_vals):
        diff = (dt - trough_dt).days
        if 1 <= diff <= recovery_window:
            if recovery_val is None or v > recovery_val:
                recovery_val, recovery_dt = v, dt
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
    if n_valid_obs >= 12 and avg_cloud_frac < 0.25:
        return "eleve"
    elif n_valid_obs >= 6 and avg_cloud_frac < 0.50:
        return "moyen"
    return "faible"


def compute_anomaly(ndvi_median, ref_p50) -> float | None:
    if ndvi_median is None or ref_p50 is None:
        return None
    return round(ndvi_median - ref_p50, 4)
