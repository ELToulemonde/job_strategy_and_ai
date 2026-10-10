import { scoreAnswers, leaders } from "./scoring.js";
import { renderRadar } from "./radar.js";
import { createShareImage, shareText } from "./share.js";

const $ = (id) => document.getElementById(id);
const answers = {};
let questionnaire;
let strategies;
let current = 0;
let advanceTimer;
let lastResults;
let lastNames;
let cardBlob;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function show(section) {
  for (const id of ["intro", "quiz", "result", "failure"]) $(id).hidden = id !== section;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function addChoice(container, question, label, value, checked, onChoose, special = false) {
  const wrapper = node("label", undefined, special ? "option special" : "option");
  const input = node("input");
  input.type = "radio";
  input.name = question.id;
  input.value = value;
  input.checked = checked;
  input.addEventListener("click", onChoose);
  wrapper.append(input, node("span", label));
  container.append(wrapper);
}

function updateNavigation() {
  $("previous").textContent = current === 0 ? "← Introduction" : "← Précédent";
  $("results-shortcut").hidden = current === questionnaire.questions.length - 1 ||
    !questionnaire.questions.every((question) => Object.hasOwn(answers, question.id));
}

function advance() {
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    if (current === questionnaire.questions.length - 1) renderResult();
    else { current++; renderQuestion(); }
  }, 150);
}

function renderQuestion() {
  show("quiz");
  const question = questionnaire.questions[current];
  $("progress-text").textContent = `Question ${current + 1} / ${questionnaire.questions.length}`;
  $("progress-bar").setAttribute("aria-valuenow", current + 1);
  $("progress-fill").style.width = `${(current + 1) / questionnaire.questions.length * 100}%`;
  const content = $("question-content");
  content.replaceChildren();
  const title = node("h1", question.texte);
  title.id = "question-title";
  content.append(title);
  const form = node("fieldset");
  const legend = node("legend", question.type === "affirmation" ? "De 1 à 5, quelle est votre priorité ?" : "Choisissez une seule réponse");
  form.append(legend);
  const choices = node("div", undefined, question.type === "affirmation" ? "options scale" : "options");
  form.append(choices);

  if (question.type === "affirmation") {
    for (const option of questionnaire.affirmations.echelle) {
      addChoice(choices, question, option.libelle, option.valeur, answers[question.id] === option.valeur,
        () => { answers[question.id] = option.valeur; advance(); });
    }
    const anchors = node("div", undefined, "scale-anchors");
    anchors.append(node("span", questionnaire.affirmations.borne_basse), node("span", questionnaire.affirmations.borne_haute));
    form.append(anchors);
    const specials = node("div", undefined, "special-options");
    addChoice(specials, question, questionnaire.affirmations.reponse_incertaine, "incertain",
      Object.hasOwn(answers, question.id) && answers[question.id] === null,
      () => { answers[question.id] = null; advance(); }, true);
    form.append(specials);
  } else {
    for (const option of question.options) {
      addChoice(choices, question, option.texte, option.id, answers[question.id] === option.id,
        () => { answers[question.id] = option.id; advance(); });
    }
    const specials = node("div", undefined, "special-options");
    for (const [id, definition] of Object.entries(questionnaire.situations.reponses_speciales)) {
      addChoice(specials, question, definition.libelle, id, answers[question.id] === id,
        () => { answers[question.id] = id; advance(); }, true);
    }
    form.append(specials);
  }
  content.append(form);
  updateNavigation();
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}

function list(parent, title, values) {
  parent.append(node("h3", title));
  const ul = node("ul");
  for (const value of values) ul.append(node("li", value));
  parent.append(ul);
}

function renderResult() {
  show("result");
  const results = scoreAnswers(questionnaire, answers);
  const byId = Object.fromEntries(strategies.strategies.map((item) => [item.id, item]));
  const names = Object.fromEntries(strategies.strategies.map((item) => [item.id, item.nom]));
  const summary = $("summary");
  summary.replaceChildren();
  const winners = leaders(results);
  if (results.some((r) => r.score === null)) {
    summary.append(node("h2", "Certaines orientations restent à préciser"));
    summary.append(node("p", "Vous avez choisi « Je ne sais pas encore » pour certaines questions. Les axes concernés restent incomplets ; les autres sont affichés ci-dessous."));
  } else if (!winners.length) {
    summary.append(node("h2", "Aucune orientation ne se détache"));
    summary.append(node("p", "Vos réponses ne privilégient pas l'une des six stratégies proposées. Ce résultat peut aussi servir de point de départ."));
  } else if (winners.length > 1) {
    summary.append(node("h2", "Plusieurs orientations ressortent à égalité"));
    summary.append(node("p", winners.map((r) => names[r.id]).join(" · ")));
    summary.append(node("p", "Ces stratégies peuvent se combiner ; le questionnaire ne les départage pas."));
  } else {
    const winner = winners[0];
    summary.append(node("h2", byId[winner.id].nom));
    summary.append(node("p", byId[winner.id].pari));
    summary.append(node("p", `${winner.score.toFixed(questionnaire.calcul.arrondi_affichage_decimales)} / 100 · L'orientation la plus soutenue par vos réponses.`, "muted"));
  }

  lastResults = results;
  lastNames = names;
  cardBlob = null;
  $("share-tools").hidden = results.some((result) => result.score === null);
  $("share-status").textContent = "";
  $("share").disabled = true;
  $("download-card").disabled = true;
  if (!$("share-tools").hidden) {
    createShareImage(results, names).then((blob) => {
      if (lastResults !== results) return;
      cardBlob = blob;
      $("share").disabled = false;
      $("download-card").disabled = false;
    }).catch(() => {
      $("share-status").textContent = "L'image n'a pas pu être créée ; vous pouvez copier le texte du résultat.";
    });
  }

  renderRadar($("radar"), results, names);
  const scores = $("scores");
  scores.replaceChildren();
  scores.append(node("h2", "Les six orientations"));
  for (const r of results) {
    const line = node("div", undefined, "score-row");
    const heading = node("div", undefined, "score-row-head");
    heading.append(node("span", names[r.id]), node("strong", r.score === null ? "Incomplet" : `${r.score.toFixed(1)} / 100`));
    const bar = node("div", undefined, "bar");
    const fill = node("span");
    fill.style.width = `${r.score ?? 0}%`;
    bar.append(fill);
    line.append(heading, bar);
    scores.append(line);
  }

  const details = $("details");
  details.replaceChildren();
  for (const r of results) {
    const strategy = byId[r.id];
    const section = node("details", undefined, "strategy-detail");
    section.append(node("summary", `${strategy.nom} · ${r.score === null ? "incomplet" : `${r.score.toFixed(1)} / 100`}`));
    const body = node("div", undefined, "detail-body");
    body.append(node("p", strategy.pari));
    const link = node("a", "Lire la stratégie complète ↗");
    link.href = `./strategies.html#${strategy.id}`;
    body.append(link);
    body.append(node("h3", "Pourquoi ce score ?"));
    if (r.missing.length) {
      body.append(node("p", `Réponses à préciser : ${r.missing.join(", ")}. Aucun score n'est calculé pour cet axe.`));
      const links = node("div", undefined, "missing-links");
      for (const id of r.missing) {
        const button = node("button", `Revoir ${id}`, "text-button");
        button.type = "button";
        button.addEventListener("click", () => {
          current = questionnaire.questions.findIndex((question) => question.id === id);
          renderQuestion();
        });
        links.append(button);
      }
      body.append(links);
    } else {
      body.append(node("p", `Priorité déclarée : ${r.direct} / 5 (1 = 0 point) · Situations : ${r.points} / ${r.possible} · Chaque moitié compte pour 50 %.`));
    }
    const supporting = r.detail.filter((item) => item.points > 0);
    list(body, "Réponses ayant apporté un point", supporting.length ? supporting.map((item) => `${item.questionId} — ${item.choices.join(" ; ")}`) : ["Aucune réponse en situation n'a soutenu cet axe."]);
    section.append(body);
    details.append(section);
  }
  $("result-title").focus({ preventScroll: true });
}

async function init() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error("Données introuvables");
    ({ questionnaire, strategies } = await response.json());
    $("estimated-time").textContent = questionnaire.duree_estimee;
    show("intro");
  } catch (error) {
    console.error(error);
    show("failure");
  }
}

$("start").addEventListener("click", renderQuestion);
$("previous").addEventListener("click", () => { clearTimeout(advanceTimer); if (current === 0) show("intro"); else { current--; renderQuestion(); } });
$("results-shortcut").addEventListener("click", () => {
  clearTimeout(advanceTimer);
  if (questionnaire.questions.every((question) => Object.hasOwn(answers, question.id))) renderResult();
});
$("edit").addEventListener("click", () => { current = 0; renderQuestion(); });
$("reset").addEventListener("click", () => { for (const id of Object.keys(answers)) delete answers[id]; current = 0; show("intro"); });
$("download-card").addEventListener("click", () => {
  if (!cardBlob) return;
  const url = URL.createObjectURL(cardBlob);
  const link = node("a");
  link.href = url;
  link.download = "mes-strategies-ia.png";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  $("share-status").textContent = "Image téléchargée. Vous pouvez la joindre à une publication.";
});

async function copyResult() {
  const text = shareText(lastResults, lastNames, new URL(".", window.location.href).href);
  try {
    await navigator.clipboard.writeText(text);
    $("share-status").textContent = "Texte copié. Vous pouvez le coller dans une publication.";
  } catch {
    $("share-status").textContent = "Copie indisponible dans ce navigateur. Vous pouvez télécharger l'image.";
  }
}

$("copy-card").addEventListener("click", copyResult);
$("share").addEventListener("click", () => {
  if (!cardBlob) return;
  if (!navigator.share) { copyResult(); return; }
  const url = new URL(".", window.location.href).href;
  const text = shareText(lastResults, lastNames, url);
  const file = new File([cardBlob], "mes-strategies-ia.png", { type: "image/png" });
  const data = navigator.canShare?.({ files: [file] }) ? { title: "Stratégie professionnelle et IA", text, files: [file] } :
    { title: "Stratégie professionnelle et IA", text };
  navigator.share(data).then(() => {
    $("share-status").textContent = "Partage effectué.";
  }).catch((error) => {
    if (error.name !== "AbortError") $("share-status").textContent = "Partage indisponible. Essayez de télécharger l'image.";
  });
});
init();
