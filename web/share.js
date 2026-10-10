import { leaders } from "./scoring.js";

const SHORT_NAMES = {
  maintenir_le_cap: "Maintenir le cap",
  accroitre_sa_capacite: "Augmenter sa capacité",
  se_differencier_techniquement: "Se différencier",
  deplacer_sa_contribution: "Déplacer sa contribution",
  changer_de_marche: "Changer de marché",
  agir_collectivement: "Agir collectivement",
};

export function shareText(results, names, url) {
  if (results.some((result) => result.score === null)) return null;
  const winners = leaders(results);
  const headline = winners.length === 0
    ? "Aucune orientation ne se détache"
    : winners.length === 1
      ? `${names[winners[0].id]} : ${winners[0].score.toFixed(1)} / 100`
      : `À égalité : ${winners.map((result) => names[result.id]).join(" · ")}`;
  return `Mes orientations professionnelles dans un contexte d'IA : ${headline}. Un questionnaire pour réfléchir à mes choix, pas une prédiction. ${url}`;
}

function drawPolygon(ctx, values, centerX, centerY, radius, fill, stroke) {
  ctx.beginPath();
  values.forEach((value, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    const x = centerX + Math.cos(angle) * radius * value;
    const y = centerY + Math.sin(angle) * radius * value;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
}

function wrap(ctx, text, x, y, width, lineHeight, maxLines) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((part, i) => {
    ctx.fillText(part + (i === maxLines - 1 && lines.length > maxLines ? "…" : ""), x, y + lineHeight * i);
  });
}

export async function createShareImage(results, names) {
  if (results.some((result) => result.score === null)) throw new Error("Résultat incomplet");
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.fillStyle = "#f7fafc";
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = "#eaf2f9";
  ctx.fillRect(36, 36, 1128, 558);
  ctx.fillStyle = "#396a90";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText("✳  STRATÉGIE PROFESSIONNELLE ET IA", 88, 109);
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("MES ORIENTATIONS", 88, 208);

  const winners = leaders(results);
  const title = winners.length === 1 ? names[winners[0].id]
    : winners.length ? "Plusieurs pistes à égalité" : "Aucune piste dominante";
  ctx.fillStyle = "#243d53";
  ctx.font = "bold 54px system-ui, sans-serif";
  wrap(ctx, title, 88, 290, 560, 66, 3);
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillStyle = "#356d97";
  const subtitle = winners.length === 1 ? `${winners[0].score.toFixed(1)} / 100` :
    winners.length === 2 ? `${SHORT_NAMES[winners[0].id]} & ${SHORT_NAMES[winners[1].id]}` :
      winners.length ? `${winners.length} stratégies en tête` : "Un résultat à explorer";
  wrap(ctx, subtitle, 88, 493, 580, 32, 2);
  ctx.font = "19px system-ui, sans-serif";
  ctx.fillStyle = "#526b7e";
  ctx.fillText("Une base pour réfléchir, pas une étiquette.", 88, 551);

  const centerX = 915;
  const centerY = 314;
  for (const step of [0.25, 0.5, 0.75, 1]) {
    drawPolygon(ctx, Array(6).fill(step), centerX, centerY, 142, null, "#bfd2e2");
  }
  results.forEach((_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * 142, centerY + Math.sin(angle) * 142);
    ctx.strokeStyle = "#bfd2e2";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  drawPolygon(ctx, results.map((result) => result.score / 100), centerX, centerY, 142, "#84b9d966", "#4d8fb5");
  ctx.fillStyle = "#34546d";
  ctx.font = "14px system-ui, sans-serif";
  results.forEach((result, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    const x = centerX + Math.cos(angle) * 190;
    const y = centerY + Math.sin(angle) * 190;
    ctx.textAlign = i === 0 || i === 3 ? "center" : i < 3 ? "left" : "right";
    ctx.fillText(SHORT_NAMES[result.id] || names[result.id], x, y);
  });
  ctx.textAlign = "left";
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Export PNG impossible")), "image/png",
  ));
}
