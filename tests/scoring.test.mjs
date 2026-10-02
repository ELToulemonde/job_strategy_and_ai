import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { scoreAnswers, leaders } from "../web/scoring.js";

const { questionnaire: q } = JSON.parse(await readFile(new URL("../dist/data.json", import.meta.url), "utf8"));
const direct = q.questions.filter((item) => item.type === "affirmation");
const situations = q.questions.filter((item) => item.type === "situation");

function blank() {
  return Object.fromEntries([...direct.map((item) => [item.id, 1]), ...situations.map((item) => [item.id, "aucune"])]);
}

test("réponses à zéro et égalité au maximum ne fabriquent aucun vainqueur", () => {
  const answers = blank();
  assert.ok(scoreAnswers(q, answers).every((item) => item.score === 0));
  assert.equal(leaders(scoreAnswers(q, answers)).length, 0);
  direct.forEach((item) => { answers[item.id] = 5; });
  assert.ok(scoreAnswers(q, answers).every((item) => item.score === 50));
  assert.equal(leaders(scoreAnswers(q, answers)).length, 6);
});

test("un seul choix peut donner un point à plusieurs axes", () => {
  const answers = blank();
  answers.q07 = "c";
  const result = scoreAnswers(q, answers);
  assert.equal(result.find((r) => r.id === "accroitre_sa_capacite").points, 1);
  assert.equal(result.find((r) => r.id === "se_differencier_techniquement").points, 1);
  assert.ok(Math.abs(result.find((r) => r.id === "accroitre_sa_capacite").score - 50 / 7) < 1e-10);
});

test("chaque axe peut atteindre 100 indépendamment des autres", () => {
  for (const id of q.axes) {
    const answers = blank();
    answers[direct.find((item) => item.axe === id).id] = 5;
    for (const question of situations) {
      const choice = question.options.find((option) => option.axes.includes(id));
      if (choice) answers[question.id] = choice.id;
    }
    assert.equal(scoreAnswers(q, answers).find((item) => item.id === id).score, 100);
  }
});

test("l'exemple documenté 4/5 et 4/7 donne 66,1 sur le radar", () => {
  const answers = blank();
  answers.q01 = 4;
  situations.filter((question) => question.options.some((option) => option.axes.includes("maintenir_le_cap")))
    .slice(0, 4).forEach((question) => {
      answers[question.id] = question.options.find((option) => option.axes.includes("maintenir_le_cap")).id;
    });
  const result = scoreAnswers(q, answers).find((item) => item.id === "maintenir_le_cap");
  assert.equal(result.score.toFixed(1), "66.1");
});

test("une réponse incertaine rend uniquement les axes concernés incomplets", () => {
  const answers = blank();
  answers.q07 = "incertain";
  const result = scoreAnswers(q, answers);
  for (const item of result) {
    const affected = situations.find((question) => question.id === "q07").options.some((option) => option.axes.includes(item.id));
    assert.equal(item.score === null, affected);
  }
  assert.deepEqual(leaders(result), []);
  answers.q07 = "aucune";
  answers.q06 = null;
  assert.equal(scoreAnswers(q, answers).find((item) => item.id === "agir_collectivement").score, null);
});

test("une combinaison invalide ne produit pas de résultat silencieux", () => {
  const answers = blank();
  answers.q07 = ["a", "b"];
  assert.throws(() => scoreAnswers(q, answers), /q07/);
  answers.q07 = "a";
  answers.q01 = 0;
  assert.throws(() => scoreAnswers(q, answers), /q01/);
});
