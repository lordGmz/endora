# Journal des modifications

Toutes les évolutions notables d'Endora sont listées ici. Le format suit
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le
[versionnage sémantique](https://semver.org/lang/fr/). La section d'une version sert de notes de
release (voir [docs/PUBLICATION.md](docs/PUBLICATION.md)).

## [Non publié]

### Added

- **Customizable appearance** (Settings › Themes), applied live to every theme:
  - **Accent color**: eight presets or any custom color, used for buttons, links, selection and
    variables; the text on the accent switches between light and dark to stay readable.
  - **Active tab color**: its own color for the active tab and sub-tab, or the same as the accent.
  - **Tab style**: Line (previous look), Filled or Pills, for the tab bar and the sub-tabs
    (Params, Body…).
  - **Density**: Compact, Normal or Comfortable spacing for tabs, fields and buttons.
  - **Corner radius**: from square (0 px) to rounded (12 px).
- **Custom themes**: create a theme from the current one and change any of its 20 colors
  (interface, status, code and variables) with a live preview; rename it, mark it as light or dark
  so it can be used with system sync, and delete it. Themes can be exported to a `.json` file and
  imported back, to share them or move them to another machine.
- A custom theme is applied as soon as the window opens, without a flash of the default theme.
- **Activity bar** on the left edge: Collections, Environments and History open the matching
  side panel (clicking the active one hides it), followed by mock servers and, at the bottom,
  Settings. A green dot shows when a mock server is running.
- **Status bar**: sidebar toggle, active environment (opens it, or the environment list when none
  is active), running mock servers, and the console with a red badge counting errors. Tooltips show
  the keyboard shortcuts.
- **Narrow windows**: below 1000 px the side panel folds away by itself and comes back when the
  window is widened again, unless it was hidden on purpose.
- **Search and commands** (⌘K / Ctrl+K, or the search box in the top bar): find any request by
  name, URL, method or folder, open or run a collection, switch environment, and run common
  commands (new request, import, console, themes, shortcuts…) from the keyboard. Accents and word
  order don't matter. The shortcut can be changed in Settings › Shortcuts and is also in the View
  menu.
- **Request location**: a breadcrumb above the URL bar shows where the request lives
  (collection › folders › name); the collection and folders open in one click, and a double click
  on the name renames the request. Unsaved requests say they are not in a collection yet.
- **Response placeholder**: before the first send, the response pane lists the shortcuts to send,
  save and reach the URL bar (custom shortcuts included) and reminds that a cURL command can be
  pasted into the URL bar.

### Security

- **Local files protected**: a request can now only send a file that was chosen in Endora's file
  picker. Previously, a collection script (`pm.sendRequest` or a modified `pm.request`) or an
  imported collection could read any file on the machine (SSH keys, documents…) and upload it to a
  third-party server. A script can no longer add a file or reuse a file chosen for another request.
- **Scripts isolated from each other**: every script run (pre-request, post-response, mock script)
  now happens in a fresh hidden window that is destroyed afterwards. A script can no longer leave
  code behind to spy on later runs, such as the variables and secrets of another collection. A
  spare window is preloaded to keep sending fast.
- **Authorization secrets encrypted**: passwords, client secrets, tokens and private keys used in
  authorizations are now encrypted on disk with the system keychain, in collections, history,
  restored tabs and mock servers (as secret variables already were). Secrets in the deployed
  version of a mock are encrypted too. Existing files are converted automatically on first launch.
- **RAML 0.8 import**: a crafted file (`!include` followed by two spaces or a tab) can no longer
  trigger a network request to an arbitrary address during import.
- **OAuth 2.0**: the redirect URL must match exactly (scheme, host, port, path), and the `state`
  parameter is now also checked for the implicit flow.
- **Private mock servers**: the `x-mock-key` key is compared in constant time, and an empty key
  never grants access.
- **Dependencies**: patched versions of js-yaml, yaml, lodash, validator and fast-uri are enforced
  for the import converters (`npm audit`: 21 → 14 alerts; the remaining ones are not reachable in
  Endora).
- **Continuous integration**: GitHub Actions are pinned to commit SHAs.

### Changed

- **Request and response tabs**: counters use the same badge everywhere (Params, Headers, Tests
  with passed/total, red when a test fails); the Authorization tab shows "inherited" when the
  request uses its parent's authorization; the request "Settings" tab is now "Options", so it is no
  longer confused with the application settings.
- **Response status** is shown as a colored pill (green, orange or red).
- **Top bar**: the environment selector and its variable preview (now an eye icon instead of
  `{ }`) move from the tab bar to the top bar. The inactive "Workspaces" button is removed, and
  Services and Settings moved to the activity bar.
- **Settings and mock servers** use the full width: they have their own menu, so the side panel
  steps aside while they are open and comes back with the next request tab (or when an activity bar
  view is chosen).
- **Side panel**: its header shows the name of the current view; the Collections / Environments /
  History tabs are replaced by the activity bar.
- An empty Params table explains how to add query parameters.
- **File fields in imported collections**: a form-data file field coming from an imported
  collection, or saved before this version, must be selected again; the error message says so.
- **Public mock server**: enabling public access now asks for confirmation, and a warning stays
  visible while the mock can be reached without a key from the local network.
- **Settings › About**: on Linux without a keyring (GNOME Keyring, KWallet), Endora now reports that
  secrets are only obfuscated and explains how to fix it.
- Collection files on disk now contain their secrets encrypted, so other tools can no longer read
  them as is; exporting from Endora still produces plain text.

### Fixed

- The preview tab (in italics) was white and took the whole width of the tab bar, squeezing the
  other tabs until their titles were cut ("New …", "Get …").

## [0.4.0] — 2026-10-16

### Ajouté

- **Beautify (Prettier)** : bouton « Beautify » et raccourci ⌘B / Ctrl+B (modifiable) pour mettre
  en forme le body brut (JSON, XML, HTML, JavaScript), les scripts pre-request / post-response et
  les scripts de mock. Les `{{variables}}` sont conservées et les objets JSON dépliés ; ⌘Z annule la
  mise en forme ; un code invalide affiche l'erreur avec sa position.
- **Onglets qui se souviennent** : en revenant sur un onglet, on retrouve le sous-onglet (Params,
  Body…), le mode du body, la vue de la réponse (Pretty, Raw, Headers…), la phase des scripts, les
  filtres, ainsi que le curseur, la sélection, le défilement et l'historique d'annulation des
  éditeurs. Le script d'un mock en cours d'édition n'est plus perdu en changeant d'onglet.
- **Volets redimensionnables** : barre latérale, séparation requête/réponse et panneau de code se
  règlent à la souris (ou au clavier) ; double clic pour revenir à la taille par défaut. Les tailles
  sont mémorisées.

### Modifié

- **Responsivité** : l'interface s'adapte à la place disponible (petite fenêtre, panneau de code
  ouvert, grand écran) : barre d'URL sur deux lignes, champs d'auth et éditeur de scripts empilés,
  onglets et statistiques de réponse qui passent à la ligne, Runner et Services réorganisés. Taille
  minimale de la fenêtre abaissée à 760 × 520.
- **Défilement** : les barres d'onglets défilent à la molette et l'onglet actif reste visible.
- **Pretty** : le XML et le HTML de la réponse sont mis en forme (jusqu'à 512 Ko).

### Corrigé

- Plus d'éclair bleu nuit au démarrage : la fenêtre et l'interface s'ouvrent directement aux
  couleurs du thème choisi.
- Une URL longue ou une ligne de réponse très longue élargissait toute l'interface au-delà de la
  fenêtre (boutons Send/Save hors écran).
- La vue Pretty arrondissait les grands entiers JSON (ex. identifiants sur 19 chiffres).
- Les valeurs d'en-têtes de réponse très longues débordaient au lieu de passer à la ligne.
- ⌘S (raccourci « Enregistrer ») et le menu Fichier › Enregistrer enregistrent le script d'un mock
  dans Services ; le raccourci était intercepté sans effet.

## [0.3.1] — 2026-10-16

### Ajouté

- **Thème Vantablack** : noir absolu sur toute l'interface (fond, panneaux, éditeurs), pensé pour
  les écrans OLED. Disponible dans Paramètres › Thèmes, en thème fixe ou comme thème sombre de la
  synchronisation système.

### Corrigé

- Une nouvelle fenêtre s'ouvre avec le fond du thème choisi en mode fixe, et non plus celui du
  thème sombre ou clair du système.

## [0.3.0] — 2026-10-16

### Ajouté

- **Langues** : interface en anglais (par défaut) et en français, réglable dans Paramètres ›
  Général. Les termes familiers des clients d'API restent identiques dans les deux langues
  (Bearer Token, API Key, Headers, Body, Pre-request…).
- **Mises à jour automatiques** : vérification au démarrage puis toutes les 6 heures. Les petites
  mises à jour (correctifs) se téléchargent en arrière-plan et s'installent au redémarrage ; les
  grosses mises à jour attendent l'accord de l'utilisateur (notification, bouton « Installer »).
  Réglable dans Paramètres › Mises à jour.

### Modifié

- **Langue par défaut** : l'interface s'ouvre désormais en anglais ; le français se choisit dans
  Paramètres › Général › Langue.
- **Mises à jour** : cette version est la dernière à installer manuellement ; les suivantes
  arrivent automatiquement (petites mises à jour) ou en un clic (grosses mises à jour).

### Corrigé

- **Mock servers** : le bouton de création restait inactif quand l'onglet Services était restauré
  au démarrage ; une erreur de création bloquait le bouton sans message.

## [0.2.2] — 2026-10-16

### Ajouté

- **Barre du haut** : logo, accès aux espaces de travail (bientôt disponibles), notifications
  (mises à jour disponibles, avec pastille), services et paramètres.
- **Mock servers** (Services) : autant de mocks que voulu, créés depuis une collection, avec une URL
  automatique ; accès public ou privé (clé), déploiement automatique des modifications, sessions
  (`x-mock-session`), script injecté exécuté à chaque requête (`pm.request`, `pm.response`,
  `pm.state`), journal des requêtes. Les mocks actifs redémarrent avec l'application.
- **Exemples de réponse** : « Enregistrer comme exemple » sur une réponse ; les mocks les servent.

### Modifié

- **Paramètres › Mises à jour** : la section « À propos » n'affiche plus que la version et le
  stockage des secrets.

### Corrigé

- **macOS** : l'application est signée (Developer ID) et notarisée par Apple ; Gatekeeper ne
  l'empêche plus de s'ouvrir. Le build macOS de la 0.2.1 échouait à la signature.

## [0.2.1] — 2026-10-16

### Ajouté

- **Onglets** : réorganisation par glisser-déposer ; renommage par double-clic ou par le menu
  contextuel (renomme aussi la requête, le dossier, la collection ou l'environnement affiché).

## [0.2.0] — 2026-10-16

### Corrigé

- Compatibilité avec TypeScript 7 : l'option `baseUrl`, supprimée, est retirée de `tsconfig.json`.

## [0.1.0] — 2026-10-16

Première version publique.

### Ajouté

- **Requêtes HTTP** : méthodes, paramètres synchronisés avec l'URL, en-têtes, bodies raw / form-data
  (fichiers) / x-www-form-urlencoded, HTTP/1.1 et HTTP/2 (ALPN, h2c), redirections, délais, taille
  maximale de réponse ; réponse formatée, brute, aperçu, en-têtes.
- **Organisation** : collections et dossiers, onglets avec aperçu, historique groupé par jour,
  requêtes libres sans collection, glisser-déposer, import/export collection v2.1.
- **Variables** : environnements, globales, variables de collection, valeurs initiales et courantes,
  secrets chiffrés, variables dynamiques, coloration et autocomplétion des `{{variables}}`.
- **Autorisation** : clé d'API, Bearer, Basic, Digest, OAuth 1.0, OAuth 2.0 (5 modes d'obtention du
  jeton), Hawk, AWS Signature v4, NTLM, Akamai EdgeGrid, JWT, ASAP, avec héritage.
- **Scripts et tests** : scripts avant la requête et après la réponse, API `pm.*`, assertions chai,
  exécution isolée, résultats des tests, console.
- **Collection Runner** : ordre d'exécution, itérations, délai, fichiers de données CSV/JSON,
  `setNextRequest`, rapport exportable.
- **Imports** : cURL, collections v1/v2/v2.1, environnements, sauvegarde complète, OpenAPI 3.0/3.1,
  Swagger 1.2/2.0, RAML 0.8/1.0, GraphQL, HAR, WSDL 1.1/2.0, WADL ; par fichier, lien ou texte.
- **Génération de code** dans 20 langages.
- **Application** : 5 thèmes avec synchronisation clair/sombre du système, raccourcis
  personnalisables, vérification des mises à jour.
- **Distribution** : installeurs macOS, Windows et Linux ; Homebrew, winget, Scoop et scripts
  d'installation.

[Non publié]: https://github.com/lix033/endora/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/lix033/endora/releases/tag/v0.1.0
