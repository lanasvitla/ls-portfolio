from __future__ import annotations

import re
from pathlib import Path


SITE = Path(__file__).resolve().parents[1]
PARTIALS = SITE / "partials"

PAGES = [
    {
        "path": SITE / "ru/branding/index.html",
        "homeHref": "./index.html#top",
        "worksHref": "./index.html#work",
        "contactsHref": "./index.html#contact",
        "assetPrefix": "../../",
        "discussion": False,
    },
    {
        "path": SITE / "ru/branding/eqlio/index.html",
        "homeHref": "../index.html#top",
        "worksHref": "../index.html#work",
        "contactsHref": "./index.html#contact",
        "assetPrefix": "../../../",
        "discussion": True,
        "lightboxLabel": "Просмотр заглушек проекта Eqlio",
    },
    {
        "path": SITE / "ru/branding/visual-brand-identity/index.html",
        "homeHref": "../index.html#top",
        "worksHref": "../index.html#work",
        "contactsHref": "./index.html#contact",
        "assetPrefix": "../../../",
        "discussion": True,
        "lightboxLabel": "Просмотр изображений проекта",
    },
]


def render(template: str, data: dict[str, object]) -> str:
    output = template
    for key, value in data.items():
        output = output.replace("{{" + key + "}}", str(value))
    return output


def indent_block(block: str, spaces: int = 2) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line if line else line for line in block.splitlines())


def replace_component(html: str, name: str, content: str, fallback_pattern: str) -> str:
    start = f"<!-- component:{name} start -->"
    end = f"<!-- component:{name} end -->"
    wrapped = f"  {start}\n{indent_block(content)}\n  {end}"
    marker_pattern = re.compile(
        rf"^[ \t]*<!-- component:{re.escape(name)} start -->[\s\S]*?^[ \t]*<!-- component:{re.escape(name)} end -->",
        re.MULTILINE,
    )

    if start in html and end in html:
        return marker_pattern.sub(wrapped, html, count=1)

    return re.sub(fallback_pattern, wrapped, html, count=1, flags=re.S)


def main() -> None:
    header = (PARTIALS / "site-header.html").read_text(encoding="utf-8")
    contact = (PARTIALS / "contact-footer.html").read_text(encoding="utf-8")
    discussion = (PARTIALS / "discussion-cta.html").read_text(encoding="utf-8")
    lightbox = (PARTIALS / "case-lightbox.html").read_text(encoding="utf-8")

    for page in PAGES:
        html = page["path"].read_text(encoding="utf-8")
        html = replace_component(
            html,
            "site-header",
            render(header, page),
            r"^[ \t]*<header class=\"site-header\"[\s\S]*?</header>",
        )
        html = replace_component(
            html,
            "contact-footer",
            render(contact, page),
            r"^[ \t]*<section class=\"contact\" id=\"contact\"[\s\S]*?</section>",
        )
        if page["discussion"]:
            html = replace_component(
                html,
                "discussion-cta",
                render(discussion, page),
                r"^[ \t]*<section class=\"closing discussion-cta\"[\s\S]*?</section>",
            )
            html = replace_component(
                html,
                "case-lightbox",
                render(lightbox, page),
                r"^[ \t]*<div class=\"case-lightbox\"[\s\S]*?</div>",
            )
        page["path"].write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
