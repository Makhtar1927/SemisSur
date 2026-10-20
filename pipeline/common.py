# pipeline/common.py
"""
Fonctions communes et utilitaires de configuration pour SemisSûr.
"""

from pathlib import Path
import yaml
import json
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parent.parent

def load_config(config_path: str = None) -> dict:
    """Charge le fichier config.yaml du projet."""
    if config_path is None:
        path = ROOT_DIR / "config.yaml"
    else:
        path = Path(config_path)
    
    if not path.exists():
        raise FileNotFoundError(f"Fichier de configuration introuvable : {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def ensure_dirs(config: dict) -> None:
    """Assure l'existence des répertoires de données brutes et traitées."""
    paths = config.get("paths", {})
    for p in paths.get("raw", {}).values():
        (ROOT_DIR / p).mkdir(parents=True, exist_ok=True)
    processed_dir = ROOT_DIR / paths.get("processed", {}).get("dir", "data/processed")
    processed_dir.mkdir(parents=True, exist_ok=True)

def write_json(data: dict, filepath: Path) -> None:
    """Écrit des données structurées en JSON avec formatage lisible."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
