# tests/test_detection.py
"""
Tests unitaires SemisSur - JEUX SYNTHÉTIQUES UNIQUEMENT.
Ces données ne sont JAMAIS affichées dans l'application.
Ils vérifient le comportement de l'algorithme de détection en isolation.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from pipeline.detect_core import (
    detect_season_start,
    detect_dry_spell,
    detect_ndvi_signature,
    compute_confidence,
    compute_anomaly
)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration de référence (identique à config.yaml)
# ─────────────────────────────────────────────────────────────────────────────
RAIN_CFG = {
    "start_search_day": "06-01",
    "accum_days": 3,
    "trigger_accum_mm": 20.0,
    "dry_spell_window_days": 30,
    "dry_day_max_rain_mm": 1.0,
    "dry_spell_min_duration_days": 8
}

NDVI_CFG = {
    "peak_window_days": 25,
    "trough_window_days": 30,
    "relative_drop_min": 0.15,
    "recovery_abs_min": 0.05,
    "recovery_window_days": 40
}


# ─────────────────────────────────────────────────────────────────────────────
# TESTS — detect_season_start
# ─────────────────────────────────────────────────────────────────────────────

class TestDetectSeasonStart:
    """Jeu SYNTHÉTIQUE - ne pas afficher dans l'application."""

    def test_synthetic_detects_trigger_on_exact_threshold(self):
        """Cas typique : cumul exactement au seuil sur 3 jours."""
        dates = [f"2026-06-{d:02d}" for d in range(1, 15)]
        rain = [0.0] * 14
        # Jours 8,9,10 juin : cumul = 7+7+6 = 20 mm
        rain[7], rain[8], rain[9] = 7.0, 7.0, 6.0
        result = detect_season_start(rain, dates, RAIN_CFG)
        assert result is not None
        assert result["date"] == "2026-06-08"
        assert result["cumul_mm"] == 20.0

    def test_synthetic_no_detection_before_search_date(self):
        """Pluie forte avant le 1er juin : ne doit pas déclencher."""
        dates = [f"2026-05-{d:02d}" for d in range(1, 31)]
        rain = [15.0] * 30
        result = detect_season_start(rain, dates, RAIN_CFG)
        assert result is None

    def test_synthetic_no_detection_below_threshold(self):
        """Cumul 19 mm (sous le seuil) : pas de déclenchement."""
        dates = [f"2026-06-{d:02d}" for d in range(1, 15)]
        rain = [0.0] * 14
        rain[5], rain[6], rain[7] = 7.0, 6.0, 5.9  # 18.9 mm
        result = detect_season_start(rain, dates, RAIN_CFG)
        assert result is None

    def test_synthetic_detects_first_qualifying_event(self):
        """Deux épisodes qualifiants : retourne le premier."""
        dates = [f"2026-06-{d:02d}" for d in range(1, 30)]
        rain = [0.0] * 29
        rain[2], rain[3], rain[4] = 8.0, 8.0, 8.0   # 06-03 : 24 mm
        rain[15], rain[16], rain[17] = 10.0, 10.0, 10.0  # 06-16 : 30 mm
        result = detect_season_start(rain, dates, RAIN_CFG)
        assert result["date"] == "2026-06-03"


# ─────────────────────────────────────────────────────────────────────────────
# TESTS — detect_dry_spell
# ─────────────────────────────────────────────────────────────────────────────

class TestDetectDrySpell:
    """Jeu SYNTHÉTIQUE - ne pas afficher dans l'application."""

    def _make_series(self, n=40):
        base_dates = []
        from datetime import date, timedelta
        start = date(2026, 6, 10)
        for i in range(n):
            base_dates.append((start + timedelta(days=i)).strftime("%Y-%m-%d"))
        return base_dates, [0.5] * n  # Jours par défaut < 1 mm (tous secs)

    def test_synthetic_detects_10day_dry_spell(self):
        """Pause sèche de 10 jours : détectée et critique."""
        dates, rain = self._make_series(40)
        # Jours 5-14 (index) : pluie 0 mm (sous le seuil de 1 mm)
        for i in range(5, 15):
            rain[i] = 0.0
        # Autres jours : 1.5 mm (au-dessus du seuil)
        for i in range(40):
            if i < 5 or i >= 15:
                rain[i] = 1.5
        result = detect_dry_spell(rain, dates, dates[0], RAIN_CFG)
        assert result["max_dry_days"] == 10
        assert result["is_critical"] is True

    def test_synthetic_7day_dry_not_critical(self):
        """Pause de 7 jours : non critique (seuil = 8)."""
        dates, rain = self._make_series(40)
        for i in range(40):
            rain[i] = 1.5
        for i in range(3, 10):
            rain[i] = 0.0
        result = detect_dry_spell(rain, dates, dates[0], RAIN_CFG)
        assert result["max_dry_days"] == 7
        assert result["is_critical"] is False

    def test_synthetic_no_dry_spell_when_all_wet(self):
        """Pluie abondante tous les jours : aucune pause sèche."""
        dates, _ = self._make_series(40)
        rain = [5.0] * 40  # Tous > 1 mm
        result = detect_dry_spell(rain, dates, dates[0], RAIN_CFG)
        assert result["max_dry_days"] == 0
        assert result["is_critical"] is False


# ─────────────────────────────────────────────────────────────────────────────
# TESTS — detect_ndvi_signature
# ─────────────────────────────────────────────────────────────────────────────

class TestDetectNdviSignature:
    """Jeu SYNTHÉTIQUE - ne pas afficher dans l'application."""

    def _make_dates(self, start="2026-06-10", n=20):
        from datetime import date, timedelta
        d = date(2026, 6, 10)
        return [(d + timedelta(days=7 * i)).strftime("%Y-%m-%d") for i in range(n)]

    def test_synthetic_full_signature_detected(self):
        """Pic, creux (-25%), remontée : signature complète détectée."""
        dates = self._make_dates(n=15)
        # Pic à J+14 (index 2), creux à J+35 (index 5), remontée à J+70 (index 10)
        ndvi = [0.20, 0.30, 0.55, 0.45, 0.38, 0.30, 0.32, 0.40, 0.48, 0.56, 0.58, 0.55, 0.50, 0.45, 0.40]
        result = detect_ndvi_signature(dates, ndvi, "2026-06-10", NDVI_CFG)
        assert result["has_signature"] is True
        assert result["peak_value"] == pytest.approx(0.55)
        assert result["relative_drop"] >= 0.15

    def test_synthetic_no_signature_small_drop(self):
        """Baisse de seulement 10% (sous seuil 15%) : pas de signature."""
        dates = self._make_dates(n=10)
        # Pic 0.60, creux 0.55 => baisse 8.3%
        ndvi = [0.20, 0.40, 0.60, 0.58, 0.55, 0.57, 0.59, 0.61, 0.60, 0.58]
        result = detect_ndvi_signature(dates, ndvi, "2026-06-10", NDVI_CFG)
        assert result["has_signature"] is False

    def test_synthetic_none_values_handled(self):
        """Observations None (nuages) : gérées sans erreur."""
        dates = self._make_dates(n=10)
        ndvi = [None, None, 0.50, None, 0.30, None, 0.45, 0.55, None, 0.60]
        result = detect_ndvi_signature(dates, ndvi, "2026-06-10", NDVI_CFG)
        # Ne doit pas lever d'exception
        assert isinstance(result, dict)
        assert "has_signature" in result

    def test_synthetic_no_season_start(self):
        """Pas de date de début de saison : résultat sans erreur."""
        dates = self._make_dates(n=5)
        ndvi = [0.3, 0.5, 0.4, 0.35, 0.45]
        result = detect_ndvi_signature(dates, ndvi, None, NDVI_CFG)
        assert result["has_signature"] is False


# ─────────────────────────────────────────────────────────────────────────────
# TESTS — compute_confidence
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeConfidence:
    """Jeu SYNTHÉTIQUE."""

    def test_synthetic_high_confidence(self):
        assert compute_confidence(15, 0.10) == "eleve"

    def test_synthetic_medium_confidence(self):
        assert compute_confidence(8, 0.35) == "moyen"

    def test_synthetic_low_confidence_few_obs(self):
        assert compute_confidence(3, 0.60) == "faible"


# ─────────────────────────────────────────────────────────────────────────────
# TESTS — compute_anomaly
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeAnomaly:
    """Jeu SYNTHÉTIQUE."""

    def test_synthetic_positive_anomaly(self):
        result = compute_anomaly(0.65, 0.50)
        assert result == pytest.approx(0.15)

    def test_synthetic_negative_anomaly(self):
        result = compute_anomaly(0.30, 0.55)
        assert result == pytest.approx(-0.25)

    def test_synthetic_none_inputs(self):
        assert compute_anomaly(None, 0.50) is None
        assert compute_anomaly(0.50, None) is None
