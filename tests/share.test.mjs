import test from "node:test";
import assert from "node:assert/strict";
import { shareText } from "../web/share.js";

const names = { a: "Maintenir le cap", b: "Augmenter sa capacité" };
const url = "https://example.org/quiz/";

test("le texte de partage expose l'orientation, jamais les réponses détaillées", () => {
  const text = shareText([{ id: "a", score: 66.0714 }, { id: "b", score: 12 }], names, url);
  assert.match(text, /Maintenir le cap : 66\.1 \/ 100/);
  assert.match(text, /https:\/\/example\.org\/quiz\//);
  assert.doesNotMatch(text, /q01|q07|66\.0714/);
});

test("les égalités et les résultats incomplets n'inventent pas un gagnant", () => {
  assert.match(shareText([{ id: "a", score: 50 }, { id: "b", score: 50 }], names, url), /À égalité : Maintenir le cap · Augmenter sa capacité/);
  assert.equal(shareText([{ id: "a", score: null }, { id: "b", score: 50 }], names, url), null);
});
