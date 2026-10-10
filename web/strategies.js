function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function addList(parent, title, values) {
  parent.append(element("h4", title));
  const list = element("ul");
  for (const value of values) list.append(element("li", value));
  parent.append(list);
}

function strategyCard(strategy, index) {
  const article = element("article", undefined, "discovery-card");
  article.id = strategy.id;
  article.append(element("span", String(index + 1).padStart(2, "0"), "card-number"));
  article.append(element("h3", strategy.nom));
  article.append(element("p", strategy.pari, "card-pari"));
  const details = element("details", undefined, "card-details");
  details.append(element("summary", "Explorer cette stratégie"));
  const content = element("div", undefined, "card-details-body");
  content.append(element("h4", "Concrètement"), element("p", strategy.actions));
  addList(content, "Ce qui doit être vrai", strategy.conditions_reussite);
  addList(content, "Ce que cette stratégie apporte", strategy.avantages);
  addList(content, "Points d'attention", strategy.limites);
  addList(content, "Quand réexaminer ce choix", strategy.signaux_revision);
  if (strategy.portraits?.length) {
    content.append(element("h4", "Portraits possibles"));
    for (const portrait of strategy.portraits) {
      const item = element("p", undefined, "portrait");
      item.append(element("strong", `${portrait.nom} — `), document.createTextNode(portrait.nuance));
      content.append(item);
    }
  }
  details.append(content);
  article.append(details);
  return article;
}

async function init() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error("Données indisponibles");
    const { strategies } = await response.json();
    const grid = document.getElementById("strategy-cards");
    strategies.strategies.forEach((strategy, index) => grid.append(strategyCard(strategy, index)));
    const id = strategies.strategies.find((item) => `#${item.id}` === window.location.hash)?.id;
    if (id) {
      const card = document.getElementById(id);
      card.querySelector("details").open = true;
      card.scrollIntoView();
    }
  } catch (error) {
    console.error(error);
    document.getElementById("strategies-error").hidden = false;
  }
}

init();
