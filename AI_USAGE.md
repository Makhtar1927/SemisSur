# AI_USAGE.md — Déclaration d'Usage de l'Intelligence Artificielle (SemisSûr)

Ce document répond aux exigences strictes de transparence du hackathon national **« Du satellite à la solution »** (organisé par SENSAT et TRL Space, Sénégal, clôture le 23 octobre 2026).

---

## 1. Outils d'IA utilisés

- **Assistant d'ingénierie logicielle** : Antigravity IDE (modèle de langage avancé Gemini DeepMind).

---

## 2. Périmètre d'intervention de l'IA

L'IA a été mobilisée comme accélérateur de développement sur les axes suivants :
1. **Échafaudage de code (Boilerplate)** :
   - Structure des scripts de traitement Python (`pipeline/01_sectors.py` à `pipeline/05_detect.py`).
   - Squelette de l'application statique React/TypeScript (composants MapLibre GL JS, ECharts, gestion du thème).
   - Scripts de tests unitaires synthétiques (`tests/test_detection.py`).
2. **Implémentation de formules mathématiques et seuils** :
   - Traduction rigoureuse de la règle métier de détection (cumul 3 jours, pauses sèches $\ge 8$ jours, dynamique de creux et reprise NDVI) en Python puis en TypeScript pour assurer la stricte parité d'exécution.
3. **Mise en page de la documentation** :
   - Structuration des fichiers d'audit et de reproductibilité (`SOURCES.md`, `REPRODUCTION.md`, `LIMITES.md`).

---

## 3. Ce que l'IA N'A PAS fait (Responsabilité humaine & Contrôle)

- **Aucune donnée n'a été inventée par l'IA** :
  Toutes les séries temporelles proviennent de capteurs physiques certifiés (CHIRPS pour la pluviométrie, Sentinel-2 MSI pour la réflectance spectrale) ou sont explicitement déclarées dans les états vides de l'interface.
- **Vérification humaine des calculs** :
  L'équipe a validé manuellement la logique des masques nuageux (SCL 1, 3, 8, 9, 10), la fenêtre de recherche agronomique (calée sur le bassin arachidier au Sénégal à partir du 1er juin), et les tests de non-régression.
- **Maîtrise de la méthode** :
  L'équipe comprend et est capable d'expliquer oralement devant le jury chaque étape du traitement, de l'extraction des tuiles brutes à l'affichage des priorités de visite des conseillers agricoles.
