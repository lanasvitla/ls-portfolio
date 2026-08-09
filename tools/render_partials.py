from __future__ import annotations

import json
from html import escape
import re
from pathlib import Path


SITE = Path(__file__).resolve().parents[1]
PARTIALS = SITE / "partials"
MANIFEST = Path(__file__).with_name("pages.json")

FALLBACKS = {
    "site-header": r"^[ \t]*<header class=\"site-header\"[\s\S]*?</header>",
    "brand-forms": r"^[ \t]*<div class=\"[^\"]*(?:hero|case)-forms[^\"]*brand-forms[^\"]*\"[\s\S]*?</div>",
    "other-projects": r"^[ \t]*<section class=\"other other-projects\"[\s\S]*?</section>",
    "discussion-cta": r"^[ \t]*<section class=\"closing discussion-cta\"[\s\S]*?</section>",
    "contact-footer": r"^[ \t]*<section class=\"contact\" id=\"contact\"[\s\S]*?</section>",
    "case-lightbox": r"^[ \t]*<div class=\"case-lightbox\"[\s\S]*?</div>",
}


def load_manifest() -> list[dict[str, object]]:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    projects = data.get("projects", [])
    pages = data["pages"]
    for page in pages:
        if isinstance(page, dict):
            page["projectRegistry"] = projects
    return pages


def render_other_cards(data: dict[str, object]) -> str:
    cards = data.get("otherProjects")
    if not isinstance(cards, list):
        current_project_id = data.get("currentProjectId")
        registry = data.get("projectRegistry")
        cards = [
            project
            for project in registry
            if isinstance(project, dict) and project.get("id") != current_project_id
        ] if isinstance(registry, list) else []

    output: list[str] = []
    asset_prefix = str(data.get("assetPrefix", ""))
    cta = str(data.get("projectCta", "Смотреть проект"))

    for card in cards:
        if not isinstance(card, dict):
            continue

        title = str(card.get("title", ""))
        href = str(card.get("href", "#"))
        image = str(card.get("image", ""))
        alt = str(card.get("alt", title))
        description = str(card.get("description", ""))
        image_src = image if image.startswith(("../", "./", "/", "http")) else asset_prefix + image
        arrow_src = asset_prefix + "assets/icons/Arrow_right.svg"

        if image:
            thumb = "\n".join(
                [
                    f'      <a class="other-thumb other-thumb--link" href="{escape(href, quote=True)}" aria-label="{escape(title, quote=True)}">',
                    f'        <img class="other-thumb__image" src="{escape(image_src, quote=True)}" alt="{escape(alt, quote=True)}" />',
                    "      </a>",
                ]
            )
        else:
            thumb = '      <div class="other-thumb" aria-hidden="true"></div>'

        action_label = escape(f"{cta} {title}", quote=True)
        output.append(
            "\n".join(
                [
                    '    <article class="other-card">',
                    thumb,
                    '      <div class="other-card-copy">',
                    f'        <h3 class="other-card-title">{escape(title)}</h3>',
                    f'        <p class="other-card-description">{escape(description)}</p>' if description else "",
                    '      </div>',
                    f'      <a class="project-link action-link" href="{escape(href, quote=True)}" aria-label="{action_label}">',
                    f"        <span>{escape(cta)}</span>",
                    f'        <img class="ui-arrow" src="{escape(arrow_src, quote=True)}" alt="" />',
                    "      </a>",
                    "    </article>",
                ]
            )
        )

    return "\n".join(output)


def render(template: str, data: dict[str, object]) -> str:
    output = template
    defaults = {
        "siteHeaderLabel": "Primary navigation",
        "navAriaLabel": "Main navigation",
        "homeAriaLabel": "На главную",
        "worksLabel": "Works",
        "contactsLabel": "Contacts",
        "discussionLabel": "Связаться",
        "discussionText": "Обсудить ваш проект",
        "lightboxCloseLabel": "Закрыть просмотр",
        "lightboxPrevLabel": "Предыдущее изображение",
        "lightboxNextLabel": "Следующее изображение",
    }
    enriched = {**defaults, **dict(data)}
    enriched["otherCards"] = render_other_cards(enriched)
    for key, value in enriched.items():
        if isinstance(value, (str, int, float, bool)):
            output = output.replace("{{" + key + "}}", str(value))
    return output


def indent_block(block: str, spaces: int = 2) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line if line else line for line in block.splitlines())


def replace_component(html: str, name: str, content: str) -> str:
    start = f"<!-- component:{name} start -->"
    end = f"<!-- component:{name} end -->"
    wrapped = f"  {start}\n{indent_block(content)}\n  {end}"
    marker_pattern = re.compile(
        rf"^[ \t]*<!-- component:{re.escape(name)} start -->[\s\S]*?^[ \t]*<!-- component:{re.escape(name)} end -->",
        re.MULTILINE,
    )

    if start in html and end in html:
        return marker_pattern.sub(wrapped, html, count=1)

    fallback = FALLBACKS[name]
    updated, count = re.subn(fallback, wrapped, html, count=1, flags=re.S | re.M)
    if count != 1:
        raise RuntimeError(f"Cannot place component {name}")
    return updated


def main() -> None:
    templates = {
        path.stem: path.read_text(encoding="utf-8")
        for path in PARTIALS.glob("*.html")
    }

    for page in load_manifest():
        path = SITE / str(page["path"])
        html = path.read_text(encoding="utf-8")
        for name in page["components"]:
            html = replace_component(html, str(name), render(templates[str(name)], page))
        path.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
