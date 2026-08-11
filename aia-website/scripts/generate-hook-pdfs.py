#!/usr/bin/env python3
"""Render 108 Vision PDF assets from structured JSON content."""

from __future__ import annotations

import json
import sys
from html import escape
from pathlib import Path
from typing import Any

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase.pdfmetrics import stringWidth
    from reportlab.platypus import (
        BaseDocTemplate,
        Frame,
        KeepTogether,
        ListFlowable,
        ListItem,
        PageBreak,
        PageTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )
except ImportError as exc:  # pragma: no cover - environment-dependent
    raise SystemExit(
        "reportlab is required to generate PDFs. Install it with: "
        "python -m pip install reportlab"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = Path(__file__).resolve().parent / "pdf-content"
OUT_DIR = ROOT / "public" / "downloads"

CONTENT_FILES = (
    "client-direzione-tecnica.json",
    "client-software-in-mano.json",
    "partner-direzione-tecnica.json",
    "partner-software-in-mano.json",
)
EXPECTED_OUTPUTS = {
    "108vision-direzione-tecnica.pdf",
    "108vision-software-in-mano.pdf",
    "108vision-partner-direzione-tecnica.pdf",
    "108vision-partner-software-in-mano.pdf",
}
REQUIRED_METADATA = {
    "type",
    "audience",
    "objective",
    "version",
    "sources",
    "claimStatus",
}

INK_950 = colors.HexColor("#0F172A")
INK_900 = colors.HexColor("#1E293B")
INK_800 = colors.HexColor("#334155")
INK_700 = colors.HexColor("#475569")
INK_400 = colors.HexColor("#94A3B8")
INK_200 = colors.HexColor("#E2E8F0")
INK_100 = colors.HexColor("#F1F5F9")
INK_50 = colors.HexColor("#F8FAFC")
VIOLET_900 = colors.HexColor("#4C1D95")
VIOLET_700 = colors.HexColor("#6D28D9")
VIOLET_500 = colors.HexColor("#8B5CF6")
VIOLET_400 = colors.HexColor("#A78BFA")
VIOLET_200 = colors.HexColor("#DDD6FE")
VIOLET_100 = colors.HexColor("#EDE9FE")
VIOLET_50 = colors.HexColor("#F5F3FF")
SUCCESS_600 = colors.HexColor("#059669")
ERROR_600 = colors.HexColor("#DC2626")
WHITE = colors.white

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
HEADER_H = 27 * mm
FOOTER_H = 15 * mm
FRAME_TOP = PAGE_H - HEADER_H - 7 * mm
FRAME_BOTTOM = FOOTER_H + 3 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X


def safe_text(value: object) -> str:
    return escape(str(value), quote=False).replace("\n", "<br/>")


def load_content(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        data: dict[str, Any] = json.load(handle)

    metadata = data.get("metadata")
    document = data.get("document")
    if not isinstance(metadata, dict) or not isinstance(document, dict):
        raise ValueError(f"{path.name}: metadata and document must be objects")

    missing = REQUIRED_METADATA - metadata.keys()
    if missing:
        raise ValueError(f"{path.name}: missing metadata fields: {sorted(missing)}")

    output = document.get("output")
    if output not in EXPECTED_OUTPUTS:
        raise ValueError(f"{path.name}: unexpected output filename: {output!r}")

    pages = document.get("pages")
    if not isinstance(pages, list) or not 4 <= len(pages) <= 6:
        raise ValueError(f"{path.name}: pages must contain 4 to 6 entries")
    return data


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "Eyebrow",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=VIOLET_700,
            spaceAfter=4 * mm,
        ),
        "title": ParagraphStyle(
            "Title",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=24,
            textColor=INK_950,
            spaceAfter=4 * mm,
        ),
        "lead": ParagraphStyle(
            "Lead",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=INK_700,
            spaceAfter=5 * mm,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=INK_950,
            spaceBefore=1.5 * mm,
            spaceAfter=2.5 * mm,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.7,
            textColor=INK_800,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.1,
            leading=10.8,
            textColor=INK_700,
        ),
        "card_title": ParagraphStyle(
            "CardTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.3,
            leading=12,
            textColor=VIOLET_700,
            spaceAfter=1.5 * mm,
        ),
        "quote": ParagraphStyle(
            "Quote",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9.4,
            leading=13,
            textColor=INK_800,
        ),
        "cta_title": ParagraphStyle(
            "CtaTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=WHITE,
            spaceAfter=2 * mm,
        ),
        "cta_body": ParagraphStyle(
            "CtaBody",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12.5,
            textColor=colors.HexColor("#CBD5E1"),
            spaceAfter=2.5 * mm,
        ),
        "cta_action": ParagraphStyle(
            "CtaAction",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            leading=12,
            textColor=VIOLET_400,
        ),
        "table_head": ParagraphStyle(
            "TableHead",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.8,
            leading=9.5,
            textColor=INK_950,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.7,
            leading=9.6,
            textColor=INK_800,
        ),
    }


def draw_page_chrome(canvas: Any, doc: "PdfDocument") -> None:
    document = doc.content["document"]
    canvas.saveState()
    canvas.setFillColor(INK_950)
    canvas.rect(0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, fill=1, stroke=0)
    canvas.setFillColor(VIOLET_500)
    canvas.rect(0, PAGE_H - HEADER_H - 1.2 * mm, PAGE_W, 1.2 * mm, fill=1, stroke=0)

    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawString(MARGIN_X, PAGE_H - 11.5 * mm, document["brand"])
    canvas.setFillColor(INK_400)
    canvas.setFont("Helvetica", 7.7)
    canvas.drawString(MARGIN_X, PAGE_H - 18 * mm, document["claim"])

    canvas.setFillColor(VIOLET_400)
    canvas.setFont("Helvetica-Bold", 7.5)
    channel = str(document["channel"]).upper()
    canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 14 * mm, channel)

    canvas.setStrokeColor(INK_200)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN_X, 13 * mm, PAGE_W - MARGIN_X, 13 * mm)
    canvas.setFillColor(INK_400)
    canvas.setFont("Helvetica", 7.2)
    contact = str(document["contact"])
    if stringWidth(contact, "Helvetica", 7.2) > CONTENT_W - 23 * mm:
        contact = contact.split(" · ")[0]
    canvas.drawString(MARGIN_X, 7.5 * mm, contact)
    canvas.drawRightString(
        PAGE_W - MARGIN_X,
        7.5 * mm,
        f"{canvas.getPageNumber()} / {len(document['pages'])}",
    )
    canvas.restoreState()


class PdfDocument(BaseDocTemplate):
    def __init__(self, filename: str, content: dict[str, Any]) -> None:
        self.content = content
        metadata = content["metadata"]
        document = content["document"]
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=MARGIN_X,
            rightMargin=MARGIN_X,
            topMargin=HEADER_H + 7 * mm,
            bottomMargin=FOOTER_H + 3 * mm,
            title=document["channel"],
            author=document["brand"],
            subject=metadata["objective"],
            creator=document["brand"],
        )
        frame = Frame(
            MARGIN_X,
            FRAME_BOTTOM,
            CONTENT_W,
            FRAME_TOP - FRAME_BOTTOM,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
            id="content",
        )
        self.addPageTemplates(
            PageTemplate(id="108-vision", frames=[frame], onPage=draw_page_chrome)
        )


def paragraph(text: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(safe_text(text), style)


def bullet_list(
    items: list[object],
    styles: dict[str, ParagraphStyle],
    *,
    color: colors.Color = VIOLET_700,
) -> ListFlowable:
    entries = [
        ListItem(paragraph(item, styles["body"]), leftIndent=4 * mm)
        for item in items
    ]
    return ListFlowable(
        entries,
        bulletType="bullet",
        bulletFontName="Helvetica",
        bulletFontSize=7,
        bulletColor=color,
        leftIndent=5 * mm,
        bulletOffsetY=1.5,
        spaceAfter=3 * mm,
    )


def card_cell(
    item: dict[str, Any], styles: dict[str, ParagraphStyle]
) -> list[Any]:
    return [
        paragraph(item["title"], styles["card_title"]),
        paragraph(item["text"], styles["small"]),
    ]


def render_cards(
    items: list[dict[str, Any]], styles: dict[str, ParagraphStyle]
) -> Table:
    rows: list[list[Any]] = []
    for index in range(0, len(items), 2):
        row: list[Any] = [card_cell(items[index], styles)]
        row.append(
            card_cell(items[index + 1], styles)
            if index + 1 < len(items)
            else []
        )
        rows.append(row)
    table = Table(
        rows,
        colWidths=[(CONTENT_W - 4 * mm) / 2] * 2,
        hAlign="LEFT",
        spaceAfter=3 * mm,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), INK_50),
                ("BOX", (0, 0), (-1, -1), 0.6, INK_200),
                ("INNERGRID", (0, 0), (-1, -1), 4 * mm, WHITE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
            ]
        )
    )
    return table


def render_timeline(
    items: list[dict[str, Any]], styles: dict[str, ParagraphStyle]
) -> Table:
    rows = [
        [
            paragraph(item["title"], styles["card_title"]),
            paragraph(item["text"], styles["small"]),
        ]
        for item in items
    ]
    table = Table(
        rows,
        colWidths=[48 * mm, CONTENT_W - 48 * mm],
        hAlign="LEFT",
        spaceAfter=3 * mm,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), INK_50),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, INK_200),
                ("LINEBEFORE", (0, 0), (0, -1), 2, VIOLET_700),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.6 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6 * mm),
            ]
        )
    )
    return table


def render_fit(
    block: dict[str, Any], styles: dict[str, ParagraphStyle]
) -> Table:
    def fit_cell(title_key: str, items_key: str, color: colors.Color) -> list[Any]:
        story: list[Any] = [paragraph(block[title_key], styles["card_title"])]
        story.append(bullet_list(block[items_key], styles, color=color))
        return story

    table = Table(
        [
            [
                fit_cell("fitTitle", "fitItems", SUCCESS_600),
                fit_cell("noFitTitle", "noFitItems", ERROR_600),
            ]
        ],
        colWidths=[(CONTENT_W - 4 * mm) / 2] * 2,
        hAlign="LEFT",
        spaceAfter=3 * mm,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#ECFDF5")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FEF2F2")),
                ("BOX", (0, 0), (-1, -1), 0.6, INK_200),
                ("INNERGRID", (0, 0), (-1, -1), 4 * mm, WHITE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
            ]
        )
    )
    return table


def render_data_table(
    block: dict[str, Any], styles: dict[str, ParagraphStyle]
) -> list[Any]:
    result: list[Any] = []
    if block.get("title"):
        result.append(paragraph(block["title"], styles["section"]))
    rows = [
        [paragraph(value, styles["table_head"]) for value in block["columns"]]
    ]
    rows.extend(
        [paragraph(value, styles["table_cell"]) for value in row]
        for row in block["rows"]
    )
    first_width = 53 * mm
    other_width = (CONTENT_W - first_width) / (len(block["columns"]) - 1)
    table = Table(
        rows,
        colWidths=[first_width]
        + [other_width] * (len(block["columns"]) - 1),
        repeatRows=1,
        hAlign="LEFT",
        spaceAfter=3 * mm,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK_100),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, INK_50]),
                ("GRID", (0, 0), (-1, -1), 0.5, INK_200),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.1 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.1 * mm),
            ]
        )
    )
    result.append(table)
    return result


def render_block(
    block: dict[str, Any], styles: dict[str, ParagraphStyle]
) -> list[Any]:
    kind = block["type"]
    if kind == "section":
        return [
            KeepTogether(
                [
                    paragraph(block["title"], styles["section"]),
                    bullet_list(block["items"], styles),
                ]
            )
        ]
    if kind == "checklist":
        return [
            paragraph(block["title"], styles["section"]),
            bullet_list(block["items"], styles),
        ]
    if kind == "cards":
        return [render_cards(block["items"], styles)]
    if kind == "timeline":
        return [render_timeline(block["items"], styles)]
    if kind == "fit":
        return [render_fit(block, styles)]
    if kind == "table":
        return render_data_table(block, styles)
    if kind in {"quote", "callout"}:
        content: list[Any] = []
        if block.get("title"):
            content.append(paragraph(block["title"], styles["card_title"]))
        content.append(paragraph(block["text"], styles["quote" if kind == "quote" else "body"]))
        table = Table([[content]], colWidths=[CONTENT_W], hAlign="LEFT", spaceAfter=4 * mm)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), VIOLET_50),
                    ("LINEBEFORE", (0, 0), (0, -1), 3, VIOLET_700),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                    ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
                ]
            )
        )
        return [table]
    if kind == "cta":
        content = [
            paragraph(block["title"], styles["cta_title"]),
            paragraph(block["text"], styles["cta_body"]),
            paragraph(block["action"], styles["cta_action"]),
        ]
        table = Table([[content]], colWidths=[CONTENT_W], hAlign="LEFT", spaceBefore=2 * mm)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), INK_950),
                    ("LINEBEFORE", (0, 0), (0, -1), 3, VIOLET_500),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6 * mm),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6 * mm),
                    ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
                ]
            )
        )
        return [table]
    raise ValueError(f"Unsupported block type: {kind!r}")


def build_story(
    content: dict[str, Any], styles: dict[str, ParagraphStyle]
) -> list[Any]:
    story: list[Any] = []
    pages = content["document"]["pages"]
    for index, page in enumerate(pages):
        story.extend(
            [
                paragraph(page["eyebrow"], styles["eyebrow"]),
                paragraph(page["title"], styles["title"]),
                paragraph(page["lead"], styles["lead"]),
            ]
        )
        for block in page["blocks"]:
            story.extend(render_block(block, styles))
            story.append(Spacer(1, 1.5 * mm))
        if index < len(pages) - 1:
            story.append(PageBreak())
    return story


def generate(data: dict[str, Any]) -> Path:
    output = OUT_DIR / data["document"]["output"]
    pdf = PdfDocument(str(output), data)
    pdf.build(build_story(data, make_styles()))
    return output


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generated: list[Path] = []
    for filename in CONTENT_FILES:
        data = load_content(CONTENT_DIR / filename)
        generated.append(generate(data))
    for path in generated:
        print(f"Wrote {path} ({path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
