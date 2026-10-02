"""Build the dependency-free static site from the two editorial YAML files."""

import json
import shutil
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dist"
WEB = ROOT / "web"


def load_yaml(name):
    with (ROOT / name).open(encoding="utf-8") as source:
        return yaml.safe_load(source)


def validate(questionnaire, strategies):
    axes = questionnaire["axes"]
    assert len(axes) == 6 and len(set(axes)) == 6
    assert set(axes) == {strategy["id"] for strategy in strategies["strategies"]}
    assert questionnaire["strategies_source"] == "strategies-ia-emploi-dev.yaml"
    questions = questionnaire["questions"]
    assert len(questions) == 15 and len({q["id"] for q in questions}) == 15
    affirmations = [q for q in questions if q["type"] == "affirmation"]
    situations = [q for q in questions if q["type"] == "situation"]
    assert len(affirmations) == 6 and {q["axe"] for q in affirmations} == set(axes)
    assert len(situations) == 9
    assert [x["valeur"] for x in questionnaire["affirmations"]["echelle"]] == list(range(1, 6))
    assert questionnaire["situations"]["maximum_choix"] == 1
    assert questionnaire["calcul"]["poids_affirmation"] + questionnaire["calcul"]["poids_situations"] == 1
    for question in situations:
        options = question["options"]
        assert len(options) == 4 and len({option["id"] for option in options}) == 4
        assert all(option["axes"] and set(option["axes"]) <= set(axes) for option in options)
    assert all(
        any(axis in option["axes"] for question in situations for option in question["options"])
        for axis in axes
    )


def main():
    questionnaire = load_yaml("questionnaire.yaml")
    strategies = load_yaml("strategies-ia-emploi-dev.yaml")
    validate(questionnaire, strategies)
    OUT.mkdir(exist_ok=True)
    for name in ("index.html", "strategies.html", "styles.css", "app.js", "scoring.js", "radar.js", "share.js", "strategies.js"):
        shutil.copy2(WEB / name, OUT / name)
    (OUT / "data.json").write_text(
        json.dumps({"questionnaire": questionnaire, "strategies": strategies}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Site prêt dans {OUT}")


if __name__ == "__main__":
    main()
