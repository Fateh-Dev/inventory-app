# Analyse des fonctionnalités manquantes — FTH Stock

## Ce qui existe déjà ✅

| Module | Fonctionnalités présentes |
|---|---|
| **Articles** | CRUD complet, filtres, seuil stock faible, lots (lots), numéro de série, date de péremption, activation/désactivation |
| **Entrepôts** | CRUD complet, stock par entrepôt, responsable, activation/désactivation |
| **Fournisseurs** | CRUD complet, coordonnées (contact, phone, email, adresse), activation/désactivation |
| **Mouvements** | Réception, Sortie (Issue), Transfert, Retour, Ajustement, Mise au rebut · Statuts Pending/Confirmed/Cancelled · Numéro auto-généré · Lignes de mouvement · Sélection lot · Confirmation & Annulation · Édition en mode Pending |
| **Alertes** | Stock faible, Lot expirant/expiré · Sévérité (Critical/Warning/Info) · Marquer lu · Résoudre avec note · Badge dans la navbar |
| **Tables de référence** | Catégories, Marques, Modèles (marque > modèle), Départements · CRUD + suppression avec confirmation |
| **Tableau de bord** | Compteurs globaux, répartition par catégorie, alertes récentes, articles en stock faible |
| **Authentification** | Login, JWT, Rôle Admin, Profil, Gestion des utilisateurs |
| **UX** | Mode clair/sombre, sidebar collapsible, pagination, responsive |

---

## Fonctionnalités MANQUANTES 🔴

### 1. Inventaire physique (Comptage)
- **Absent** : Il n'existe aucun module de "comptage" ou "inventaire". L'ajustement de stock (type `Adjustment`) existe dans le backend mais il n'y a pas de workflow dédié :
  - Pas de page d'inventaire tournant (saisie des quantités physiques comptées par article/entrepôt)
  - Pas de calcul automatique des écarts (physique vs théorique)
  - Pas de rapport d'écarts après comptage
  - Pas de cycle de validation d'inventaire (brouillon → validé)

### 2. Historique & traçabilité par article
- **Absent** : Dans la fiche d'un article, aucun historique n'est affiché :
  - Pas de liste des mouvements passés pour un article donné (qui a pris quoi, quand, en quelle quantité)
  - Pas d'historique de l'évolution de la quantité totale dans le temps
  - Pas de vue "Fiche article" dédiée (on voit la liste mais pas le détail d'un article)

### 3. Gestion des lots avancée (vue dédiée)
- **Partiellement absent** : Les lots existent dans le domaine mais :
  - Pas de page dédiée "Gestion des lots" avec liste de tous les lots
  - Pas de vue consolidée : lot #L-XXX → quantité restante, entrepôt, date réception, péremption
  - Pas d'action manuelle "ajuster quantité d'un lot" directement depuis l'interface
  - Pas d'impression/export de la liste des lots

### 4. Bons de sortie / Documents imprimables
- **Absent** : Aucun bon/document n'est généré depuis l'application :
  - Pas de bon de sortie (Bon de Distribution) imprimable pour la Sortie de dotation
  - Pas de bon de réception imprimable
  - Pas de bon de transfert
  - Pas d'export PDF des mouvements confirmés

### 5. Rapports & Statistiques
- **Quasi absent** : Le dashboard est basique et statique :
  - Pas de rapport de consommation par département sur une période
  - Pas de rapport de valorisation du stock (valeur totale du stock par entrepôt/article)
  - Pas de rapport des mouvements sur une période (ex : tout ce qui a été sorti en juin)
  - Pas de graphiques de tendance (courbe d'évolution du stock dans le temps)
  - Pas d'export Excel/CSV des données

### 6. Gestion des retours (Return) dans l'UI
- **Backend ok, UI manquante** : Le type `Return` existe côté backend mais dans le formulaire de création de mouvement, aucun workflow spécifique n'est prévu :
  - Le formulaire pour un "Retour" ne guide pas l'utilisateur (quel mouvement de sortie original ce retour concerne-t-il ?)
  - Pas de lien entre un Retour et le mouvement d'Issue original

### 7. Export des données
- **Totalement absent** :
  - Pas d'export Excel (articles, mouvements, alertes, lots)
  - Pas d'export CSV
  - Pas d'export PDF pour les listes

### 8. Notifications & seuils configurables
- **Partiellement absent** : Les alertes se déclenchent mais :
  - Pas de page de configuration des seuils (ex : "déclencher une alerte quand le stock passe sous X unités")
  - Les seuils sont définis par article à la création mais ne sont pas modifiables en masse
  - Pas de configuration du délai d'alerte pour péremption (en dur dans le code : 30 jours)

### 9. Gestion des prix d'achat & valorisation
- **Partiellement absent** : Le prix unitaire est saisi à la réception et stocké dans le lot. Mais :
  - Pas de prix moyen pondéré (PMP) calculé automatiquement
  - Pas de vue "Valorisation du stock" (quantité × coût moyen)
  - Pas d'historique des prix d'achat par article/fournisseur

### 10. Suppression / Archivage des articles, entrepôts, fournisseurs
- **Partiellement absent** : Ces entités ont `Activate/Deactivate` mais :
  - Pas de suppression réelle (uniquement désactivation)
  - Les entités désactivées n'ont pas de corbeille/archivage distinct
  - Pas de confirmation modale pour la désactivation (bouton direct)

### 11. Recherche globale
- **Absent** : Chaque page a sa propre barre de recherche mais :
  - Pas de recherche globale (taper "ciment" et trouver les articles + les mouvements + les fournisseurs liés)

### 12. Vue par entrepôt (Stock par emplacement)
- **Partiellement absent** : La vue "stock d'un entrepôt" existe (endpoint backend) mais :
  - La page Entrepôts ne permet pas de voir directement "ce qui se trouve dans cet entrepôt" avec une belle vue tabulaire
  - Pas de comparaison entre entrepôts (article X : 5 dans EntA, 12 dans EntB)

### 13. Journal d'audit
- **Absent** : Le backend a un champ `CreatedByUser` mais :
  - Pas de page "Journal d'audit" listant toutes les actions (qui a créé/modifié/supprimé quoi et quand)
  - Pas d'`UpdatedByUser` enregistré lors des modifications

### 14. Favoris / Accès rapide
- **Absent** : Pas de moyen de marquer des articles ou entrepôts fréquents comme favoris pour y accéder rapidement.

---

## Résumé des priorités

| Priorité | Fonctionnalité manquante |
|---|---|
| 🔴 Haute | Bons de sortie imprimables (PDF) |
| 🔴 Haute | Historique par article (qui a pris quoi, quand) |
| 🔴 Haute | Rapports de consommation par département |
| 🟠 Moyenne | Inventaire physique (comptage + écarts) |
| 🟠 Moyenne | Vue lots avancée (liste, ajustement) |
| 🟠 Moyenne | Export Excel/CSV |
| 🟡 Basse | Seuils d'alertes configurables dans l'UI |
| 🟡 Basse | Journal d'audit |
| 🟡 Basse | Vue stock par entrepôt améliorée |
| 🟡 Basse | Valorisation du stock (PMP) |
