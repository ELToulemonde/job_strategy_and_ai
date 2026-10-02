// No server or hidden weights: this module follows the formula in README.md.
export function scoreAnswers(questionnaire, answers) {
  const direct = questionnaire.questions.filter((q) => q.type === "affirmation");
  const situations = questionnaire.questions.filter((q) => q.type === "situation");
  const scale = questionnaire.affirmations.echelle.map((item) => item.valeur);

  return questionnaire.axes.map((id) => {
    const affirmation = direct.find((q) => q.axe === id);
    const value = answers[affirmation.id];
    const directValid = scale.includes(value);
    if (value !== undefined && value !== null && !directValid) {
      throw new Error(`Réponse invalide : ${affirmation.id}`);
    }
    const eligible = situations.filter((q) => q.options.some((option) => option.axes.includes(id)));
    let points = 0;
    const detail = eligible.map((q) => {
      const answer = answers[q.id];
      if (answer === undefined || answer === "incertain" || answer === null) {
        return { questionId: q.id, points: null, choices: [] };
      }
      if (answer === "aucune") {
        return { questionId: q.id, points: 0, choices: [] };
      }
      const validIds = q.options.map((option) => option.id);
      if (typeof answer !== "string" || !validIds.includes(answer)) {
        throw new Error(`Réponse invalide : ${q.id}`);
      }
      const choices = q.options.filter((option) => answer === option.id && option.axes.includes(id));
      const count = Math.min(
        choices.length * questionnaire.calcul.points_par_option_et_axe,
        questionnaire.calcul.plafond_par_situation_et_axe,
      );
      points += count;
      return { questionId: q.id, points: count, choices: choices.map((choice) => choice.texte) };
    });
    const missing = [
      ...(!directValid ? [affirmation.id] : []),
      ...detail.filter((entry) => entry.points === null).map((entry) => entry.questionId),
    ];
    const score = missing.length ? null : 100 * (
      questionnaire.calcul.poids_affirmation * (value - 1) / 4 +
      questionnaire.calcul.poids_situations * points / eligible.length
    );
    return { id, score, direct: directValid ? value : null, points, possible: eligible.length, missing, detail };
  });
}

export function leaders(results) {
  if (results.some((result) => result.score === null)) return [];
  const maximum = Math.max(...results.map((result) => result.score));
  if (maximum === 0) return [];
  return results.filter((result) => Math.abs(result.score - maximum) < 1e-9);
}
