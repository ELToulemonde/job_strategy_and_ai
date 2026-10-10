# AGENTS.md

## Objet du dépôt

Support d'auto-positionnement professionnel dans un contexte d'IA. Les textes
rédigés vivent dans `strategies-ia-emploi-dev.yaml`, `questionnaire.yaml`,
`README.md`, `web/*.html` et les chaînes affichées par `web/*.js`.

## Style éditorial (français)

Tous les textes rédigés suivent les règles suivantes.

- **Langue** : français. Typographie soignée, accents corrects, espaces
  insécables (`&nbsp;`) avant `: ; ! ?` et à l'intérieur des nombres dans le HTML.
- **Pas d'AI slop** : proscrire les formules creuses et promotionnelles
  (« à l'ère de », « à l'heure où », « dans un monde où », « révolutionnaire »,
  « ne se contente pas de », « il est important de noter », superlatifs,
  énumérations de trois adjectifs, métaphores décoratives). Préférer des
  phrases courtes, concrètes, une idée par phrase.
- **Voix** : forme passive ou impersonnelle autant que possible. Éviter la
  première personne (« je », « mon », « ma ») et l'alternance « mon/son/ta ».
  Employer « la personne », « l'équipe », ou une tournure passive. Le « vous »
  est réservé aux consignes adressées directement à la personne qui répond au
  questionnaire.
- **Cohérence lexicale** : un même concept garde le même mot partout. Voir le
  glossaire ci-dessous. Ne pas introduire de synonyme décoratif.
- **Définitions** : à la première apparition d'un terme du glossaire dans un
  texte long, poser une définition courte plutôt que de la supposer connue.
- **Simplicité** : une phrase = une idée. Découper les phrases à subordonnées
  multiples. Éviter les doubles négations et les tournures « avant que … ne
  rende … visible ».

## Glossaire (termes canoniques)

- **stratégie** : orientation professionnelle possible, décrite par un pari,
  des conditions de réussite, des points d'attention et des signaux de révision.
- **pari** : hypothèse sur laquelle repose une stratégie ; ce qui doit être vrai
  pour qu'elle soit préférable. Le mot reste employé pour désigner l'hypothèse,
  jamais pour désigner la carte ou l'action (« explorer cette stratégie », pas
  « explorer ce pari »).
- **portrait** : manière concrète de suivre une stratégie, illustrée par un cas.
- **logique transversale** : orientation qui peut accompagner plusieurs
  stratégies sans constituer un axe à part.
- **axe** : dimension mesurée par le questionnaire ; chaque axe correspond à une
  stratégie.
- **orientation** : terme d'affichage pour « stratégie » dans les résultats.
- **conditions de réussite** : ce qui doit être vrai pour que la stratégie porte.
- **points d'attention** : limites et risques associés à la stratégie.
- **signaux de révision** : indices qui invitent à réexaminer la stratégie.

## Règles techniques

- Ne pas modifier les identifiants (`id`) des stratégies, axes, questions et
  options, ni le champ `version` : le scoring, les tests et les liens de partage
  en dépendent.
- Conserver la structure des YAML (clés, listes, indentation).
- Après toute modification des YAML ou de `web/` :
  `python scripts/build.py` puis `npm test`.
