const NS = "http://www.w3.org/2000/svg";
const SHORT_NAMES = {
  maintenir_le_cap: ["Maintenir", "le cap"],
  accroitre_sa_capacite: ["Augmenter sa", "capacité de", "production"],
  se_differencier_techniquement: ["Se différencier", "par ses", "réalisations"],
  deplacer_sa_contribution: ["Déplacer sa", "contribution"],
  changer_de_marche: ["Changer de", "marché"],
  agir_collectivement: ["Agir", "collectivement"],
};

function element(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function point(index, radius) {
  const angle = -Math.PI / 2 + index * Math.PI / 3;
  return [300 + Math.cos(angle) * radius, 260 + Math.sin(angle) * radius];
}

export function renderRadar(container, results, names) {
  container.replaceChildren();
  const svg = element("svg", { viewBox: "0 0 600 540", role: "img", "aria-labelledby": "radar-title radar-desc" });
  const title = element("title", { id: "radar-title" });
  title.textContent = "Radar des six stratégies";
  const desc = element("desc", { id: "radar-desc" });
  desc.textContent = results.map((r) => `${names[r.id]} : ${r.score === null ? "incomplet" : `${r.score.toFixed(1)} sur 100`}`).join(" ; ");
  svg.append(title, desc);
  for (const percent of [25, 50, 75, 100]) {
    svg.append(element("polygon", { points: results.map((_, i) => point(i, 170 * percent / 100).join(",")).join(" "), class: "grid-ring" }));
  }
  results.forEach((r, i) => {
    svg.append(element("line", { x1: 300, y1: 260, x2: point(i, 170)[0], y2: point(i, 170)[1], class: "grid-axis" }));
    const [x, y] = point(i, 219);
    const label = element("text", { x, y, class: "radar-label", "text-anchor": i === 0 || i === 3 ? "middle" : i < 3 ? "start" : "end" });
    (SHORT_NAMES[r.id] || [names[r.id]]).forEach((line, j) => {
      const tspan = element("tspan", { x, dy: j ? 16 : 0 });
      tspan.textContent = line;
      label.append(tspan);
    });
    svg.append(label);
  });
  // A missing value must not be joined to its neighbours: show only known points.
  if (results.every((r) => r.score !== null)) {
    svg.append(element("polygon", { points: results.map((r, i) => point(i, 170 * r.score / 100).join(",")).join(" "), class: "result-shape" }));
  }
  results.forEach((r, i) => {
    if (r.score !== null) svg.append(element("circle", { cx: point(i, 170 * r.score / 100)[0], cy: point(i, 170 * r.score / 100)[1], r: 5, class: "result-dot" }));
  });
  container.append(svg);
}
