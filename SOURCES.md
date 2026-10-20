# SOURCES.md — Registre des Données et Outils (SemisSûr)

Ce registre documente de manière exhaustive chaque jeu de données utilisé par SemisSûr, sa provenance, sa licence, sa période couverte et la date de dernière consultation. Conformément aux règles du hackathon national **« Du satellite à la solution »** (SENSAT & TRL Space, Sénégal), aucune donnée payante n'est utilisée.

---

## 1. Jeux de données satellitaires et géographiques

| # | Donnée | Fournisseur / Produit exact | Résolution spatiale | Période utilisée | Licence | Date de consultation | Statut dans l'application |
|---|---|---|---|---|---|---|---|
| **1** | **CHIRPS Daily Pluie** | Climate Hazards Center (UC Santa Barbara) / `CHIRPS-2.0.africa_daily` | 0,05° (~5,3 km) | 01/01/2015 au 15/10/2026 | Domaine public (USGS / UC Regents) | 20 octobre 2026 | Donnée réelle traçable |
| **2** | **Sentinel-2 L2A (BOA)** | ESA / Copernicus Data Space (`COPERNICUS/S2_SR_HARMONIZED`) | 10 m (B04, B08) & 20 m (SCL) | Saisons 2019 à 2026 (01 mai au 15 oct) | Open Access (Copernicus Open Access Policy) | 20 octobre 2026 | Donnée réelle traçable |
| **3** | **ESA WorldCover 2021** | Agence Spatiale Européenne (ESA) / WorldCover v200, tuile N12W018 | 10 m (classe 40 = Terres cultivées) | Année 2021 (référence de masque) | Creative Commons Attribution 4.0 International (CC BY 4.0) | 20 octobre 2026 | Référence contextuelle |
| **4** | **Limites administratives** | GADM v4.1 / geoBoundaries Sénégal (Département Kaffrine, Communes) | Vectoriel (polygones) | 2023 | CC BY 4.0 / Open Data | 20 octobre 2026 | Référence géographique |
| **5** | **OpenStreetMap** | Contributeurs OpenStreetMap / Geofabrik Sénégal | Vectoriel (routes, pistes, villages) | 2026 | Open Database License (ODbL) — Attribution : © OpenStreetMap contributors | 20 octobre 2026 | Contexte cartographique |
| **6** | **Stations ANACIM** | ANACIM (Agence Nationale de l'Aviation Civile et de la Météorologie) | Ponctuel | Facultatif | Convention publique / Accord | Non disponible (mentionné pour contrôle futur) |

---

## 2. Zone d'étude précise

- **Localisation** : Région de Kaffrine, Bassin arachidier (Sénégal).
- **Emprise géographique (BBOX)** :
  - Longitude Ouest : -15,630°
  - Latitude Sud : 14,030°
  - Longitude Est : -15,470°
  - Latitude Nord : 14,180°
- **Centre** : 14,105° N, -15,550° E (~16 km × 16 km).
- **Découpage opérationnel** : Carroyage régulier de 1,5 km, masqué par les surfaces cultivées (WorldCover classe 40 $\ge 20\%$).

---

## 3. Outils et environnements logiciels

- **Python** : Python 3.13 (`geopandas`, `shapely`, `pandas`, `numpy`, `scipy`, `pystac-client`, `pyyaml`, `pytest`).
- **Application Web** : Vite, React 19, TypeScript, MapLibre GL JS (fond de carte vectoriel et raster local), Apache ECharts.
- **Audits & Tests** : Pytest (tests unitaires de parité algorithmique), tests de tolérance TypeScript / Python.

---

## 4. Équipe et contributions

*(À compléter par les membres de l'équipe lors de la finalisation du dépôt)*

- **Membre 1** : [Nom / Prénom] — [Rôle : Traitement géomatique & pipeline CHIRPS/S2]
- **Membre 2** : [Nom / Prénom] — [Rôle : Développement Frontend & interface conseiller]
- **Membre 3** : [Nom / Prénom] — [Rôle : Agronomie, validation des seuils & note de concept]
- **Membre 4** : [Nom / Prénom] — [Rôle : Présentation, diapositives & analyse d'impact]
