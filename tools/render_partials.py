from __future__ import annotations

import json
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
    return data["pages"]


def render(template: str, data: dict[str, object]) -> str:
    output = template
    for key, value in data.items():
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
