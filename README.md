# Stratégie professionnelle et IA

Ce projet propose un **support d'auto-positionnement** pour les personnes qui travaillent dans le développement, la data science, la data engineering ou l'ingénierie IA. L'objectif est de mettre des mots sur plusieurs orientations professionnelles possibles et d'ouvrir une discussion, pas de classer les personnes ni de prédire leur avenir.

- [`strategies-ia-emploi-dev.yaml`](strategies-ia-emploi-dev.yaml) décrit six stratégies et des portraits illustratifs.
- [`questionnaire.yaml`](questionnaire.yaml) définit les questions, leurs réponses possibles et le barème du radar. Il constitue la source de vérité pour un futur front.
- [`web/`](web/) contient une interface statique sans framework : introduction, questionnaire, radar SVG et détail du calcul.
- [`web/strategies.html`](web/strategies.html) présente les six stratégies sans passer par le questionnaire, avec leurs paris et des détails dépliables.

Le résultat affiche le pari et les réponses qui ont construit chaque score ; les conditions, avantages et limites se lisent sur la page des stratégies.

## Lancer en local

Pré-requis : Python 3, `pip` et Node.js 22 ou plus pour les tests seulement. À la racine du dépôt :

```bash
python -m pip install -r requirements.txt
python scripts/build.py
python -m http.server 8000 --directory dist
```

Ouvrir <http://localhost:8000/> pour le questionnaire, ou <http://localhost:8000/strategies.html> pour explorer les stratégies directement. Refaire `python scripts/build.py` après toute modification des YAML ou de `web/`, puis recharger la page. Ouvrir directement les pages en `file://` ne charge pas le JSON dans les navigateurs courants.

Pour vérifier le score après le build : `npm test` (aucun `npm install` nécessaire). Le build valide également les références entre questions et stratégies. Le dossier `dist/` est généré et ignoré par Git.

## Déployer sur GitHub Pages

Dans le dépôt GitHub, choisir **Settings → Pages → Build and deployment → Source : GitHub Actions**, puis pousser sur `main`. Le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) construit les fichiers statiques, lance les tests et publie `dist/`. Il peut aussi être lancé manuellement avec **Actions → Publier sur GitHub Pages → Run workflow**. Si la branche principale porte un autre nom, remplacer `main` dans le déclencheur du workflow. Les chemins relatifs fonctionnent aussi sous le sous-chemin d'un dépôt GitHub Pages.

Le questionnaire et ses résultats sont calculés dans le navigateur : aucune réponse n'est transmise au site, et elles sont perdues en rechargeant la page. Aucun compte ni service externe n'est requis.

## Partager un résultat

Quand les six axes sont complets, sous le radar, des liens discrets proposent **Partager**, **Image** (téléchargement) et **Copier le texte**. L'image PNG est une carte de 1200 × 630 pixels avec la stratégie qui ressort (ou les stratégies ex æquo) et le radar. Les réponses aux questions n'y figurent pas. Sur les appareils compatibles, « Partager » ouvre le partage natif avec l'image ; sinon il partage le texte et le lien, ou copie le texte si le partage natif n'est pas disponible. Une image téléchargée peut être jointe manuellement à une publication.

Le lien partagé renvoie au **questionnaire**, pas aux résultats personnels : aucune réponse n'est encodée dans l'URL. En cas d'axe incomplet, le partage est masqué jusqu'à ce que les réponses concernées soient précisées.

## Ce que représente le radar

Le radar comporte six axes, dans l'ordre défini par `questionnaire.yaml` : maintenir le cap, accroître sa capacité de production, se différencier techniquement, déplacer sa contribution, changer de marché professionnel et agir collectivement. Ces stratégies **peuvent se combiner** ; le radar ne doit pas désigner un profil unique.

Les réponses portent sur les **priorités déclarées pour les six prochains mois** et des **choix dans des situations hypothétiques**. Elles ne prouvent ni qu'une action a déjà été menée, ni qu'elle réussira. Un score élevé signifie seulement que cette orientation reçoit davantage de soutien dans les réponses de la personne à **ce questionnaire**. Ce n'est ni une probabilité, ni un pourcentage d'appartenance à une catégorie, ni une mesure d'employabilité. Le questionnaire ne mesure pas la **fréquence réelle d'usage de l'IA** : une même stratégie peut être poursuivie avec des niveaux d'adoption différents. Cette information pourrait, à l'avenir, être restituée séparément des six axes.

Les portraits du fichier des stratégies ne sont **pas** des axes supplémentaires. La logique « monétiser une fenêtre d'opportunité » peut accompagner plusieurs orientations ; elle n'a pas de score séparé.

## Format pour une interface

Le questionnaire contient exactement **15 questions**, pour environ **4 à 5 minutes**. Une réponse suffit pour passer automatiquement à la question suivante ; le bouton Précédent permet de corriger son choix.

- `q01` à `q06` sont des **affirmations**, chacune associée à un axe. La réponse est un entier de `1` (pas du tout une priorité) à `5` (priorité très forte), ou `null` pour « Je ne sais pas encore ».
- `q07` à `q15` sont des **situations**. La réponse est **un seul identifiant d'option** (`a`, `b`, `c`, `d`), ou une valeur spéciale : `aucune` (réponse valide à zéro point) ou `incertain` (réponse manquante). Une option peut soutenir plusieurs axes, listés dans `axes`.

Le front affiche les questions, les libellés et les options à partir du YAML. Les identifiants sont stables au sein de cette version (`version: 4`) : si des réponses sont enregistrées dans une autre interface, les accompagner de la version du questionnaire, car modifier une question ou son barème changerait le sens des résultats antérieurs. Les noms des axes à afficher se trouvent dans le fichier des stratégies.

Exemple de structure de réponses, partiel :

```json
{
  "version": 4,
  "reponses": {
    "q01": 4,
    "q07": "c",
    "q08": "aucune",
    "q09": "incertain"
  }
}
```

Une question absente du jeu de réponses est traitée comme `incertain`, **jamais** comme `aucune` ou `0`. Les valeurs spéciales sont exclusives des options ordinaires. Tout autre identifiant ou combinaison invalide est une erreur de saisie, pas une réponse à interpréter.

## Calcul public et déterministe

Pour un axe `x` :

1. **Affirmation** : `A(x) = (réponse à l'affirmation de x − 1) / 4`. Ainsi, `1` donne `0`, `3` donne `0,5` et `5` donne `1`.
2. Une situation est **éligible** à `x` si au moins une de ses options contient `x` dans `axes`. Son maximum possible pour `x` est **1**, quel que soit le nombre d'options pertinentes.
3. Dans chaque situation éligible répondue, `P(q, x) = 1` si l'option choisie contient `x`, sinon `0`. La même option peut rapporter un point à plusieurs axes. `aucune` rapporte `0`.
4. **Situations** : `S(x) = somme des P(q, x) / nombre total de situations éligibles à x`.
5. **Radar** : `score(x) = 100 × (0,5 × A(x) + 0,5 × S(x))`.

Les poids sont les mêmes pour toutes les stratégies : une moitié pour la priorité déclarée, une moitié pour les arbitrages en situation. **Ce partage 50/50 est un choix éditorial**, pas un poids estimé statistiquement. Il évite qu'une affirmation pèse neuf fois moins qu'un bloc de situations simplement parce qu'il y a plus de situations. La division par le maximum accessible compense le fait qu'un axe n'apparaisse pas dans chacune des neuf situations.

| Axe | Situations éligibles | Maximum de points en situation |
| --- | ---: | ---: |
| Maintenir le cap | 7 | 7 |
| Augmenter sa capacité de production | 7 | 7 |
| Se différencier techniquement | 8 | 8 |
| Déplacer sa contribution | 8 | 8 |
| Changer de marché professionnel | 6 | 6 |
| Agir collectivement | 6 | 6 |

**Exemple :** une personne répond `4` à l'affirmation « Maintenir le cap » et choisit une option qui soutient cet axe dans quatre des sept situations éligibles. Les trois autres n'apportent aucun point sur cet axe. Le score brut vaut `100 × (0,5 × (4 − 1)/4 + 0,5 × 4/7) = 66,0714…`, affiché **66,1 / 100**.

La normalisation utilise le nombre **total** de situations éligibles, et non le nombre auquel la personne a répondu. Si l'affirmation ou **une** situation éligible à `x` manque ou vaut `incertain`, le score de `x` est `null` et l'interface affiche « axe incomplet ». Les autres axes complets restent affichables. Aucun point manquant n'est inventé. Arrondir à une décimale **uniquement pour l'affichage** ; conserver la valeur non arrondie pour tout autre usage.

Un axe peut atteindre `0` ou `100` indépendamment des autres ; les six scores ne totalisent pas nécessairement `100`. Garder l'ordre des axes du YAML, afficher les égalités comme telles et ne pas déduire de la surface du radar un indicateur global. L'interface présente la stratégie au score maximal seulement si **tous** les axes sont complets et que ce maximum est supérieur à zéro ; elle présente toutes les stratégies ex æquo le cas échéant. Si tous les scores sont nuls ou qu'un axe est incomplet, aucun « profil gagnant » n'est annoncé. Pour expliquer un résultat, on peut afficher l'affirmation, les situations éligibles et les options qui ont apporté un point : tout est traçable dans le fichier.

## Limites et prochaine étape méthodologique

Le questionnaire est **une première proposition à prétester**, pas une échelle psychométrique validée. Une affirmation par axe et quelques choix en situation ne suffisent pas à établir la fidélité ou la validité statistique des six dimensions. Chaque situation force un choix : une option non choisie ne signifie donc pas que la stratégie correspondante est rejetée. Les affirmations permettent de déclarer plusieurs priorités fortes à la fois. Les stratégies « maintenir le cap » et « agir collectivement » peuvent aussi coexister avec presque toutes les autres ; leur comparaison numérique doit rester prudente.

Avant de tirer des conclusions plus fortes, faire relire les questions à des personnes aux situations professionnelles variées, leur demander ce qu'elles ont compris de chaque option et pourquoi elles l'ont choisie, puis ajuster formulations et contributions. Un pilote plus large pourra ensuite examiner les réponses manquantes, les effets de plafond et la pertinence des axes ; tout changement important appellera une nouvelle version du questionnaire. Cette démarche de définition des dimensions, d'entretien cognitif et d'évaluation des mesures s'inspire des principes exposés par [Boateng et al., *Best Practices for Developing and Validating Scales*, 2018](https://doi.org/10.3389/fpubh.2018.00149). Cette référence **ne valide pas** nos questions ni nos coefficients.
