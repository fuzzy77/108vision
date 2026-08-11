#!/usr/bin/env python3
"""Generate 108 Vision presentation PDFs.

Produces 4 PDFs in public/downloads/:
  - Client hooks: direzione-tecnica, software-in-mano
  - Agency partner kits: partner-direzione-tecnica, partner-software-in-mano
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "downloads"

INK_950 = HexColor("#0F172A")
INK_800 = HexColor("#334155")
INK_700 = HexColor("#475569")
INK_500 = HexColor("#64748B")
INK_200 = HexColor("#E2E8F0")
INK_100 = HexColor("#F1F5F9")
INK_50 = HexColor("#F8FAFC")
VIOLET_700 = HexColor("#6D28D9")
VIOLET_600 = HexColor("#7C3AED")
VIOLET_500 = HexColor("#8B5CF6")
VIOLET_100 = HexColor("#EDE9FE")
VIOLET_50 = HexColor("#F5F3FF")


# ---------------------------------------------------------------------------
# Primitives
# ---------------------------------------------------------------------------


def draw_header_bar(c: canvas.Canvas, width: float, height: float, eyebrow: str = "") -> None:
    c.setFillColor(INK_950)
    c.rect(0, height - 26 * mm, width, 26 * mm, fill=1, stroke=0)
    c.setFillColor(VIOLET_500)
    c.rect(0, height - 27.2 * mm, width, 1.2 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(18 * mm, height - 12 * mm, "108 Vision")
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#94A3B8"))
    c.drawString(18 * mm, height - 18 * mm, "Il partner tecnico che prende in mano la situazione.")
    if eyebrow:
        c.setFillColor(VIOLET_500)
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(width - 18 * mm, height - 14 * mm, eyebrow.upper())


def draw_footer(c: canvas.Canvas, width: float, page: int, total: int) -> None:
    c.setStrokeColor(INK_200)
    c.setLineWidth(0.4)
    c.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
    c.setFillColor(INK_500)
    c.setFont("Helvetica", 7.5)
    c.drawString(18 * mm, 7.5 * mm, "www.108vision.it  ·  info@108vision.it")
    c.drawRightString(width - 18 * mm, 7.5 * mm, f"{page} / {total}")


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    max_width: float,
    font: str = "Helvetica",
    size: float = 10,
    leading: float = 14,
    color: Color = INK_800,
) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line = ""
    for word in words:
        trial = f"{line} {word}".strip()
        if c.stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            c.drawString(x, y, line)
            y -= leading
            line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def pill(c: canvas.Canvas, x: float, y: float, label: str) -> None:
    w = c.stringWidth(label, "Helvetica-Bold", 8) + 8 * mm
    c.setFillColor(VIOLET_100)
    c.roundRect(x, y - 5.5 * mm, w, 7.5 * mm, 3, fill=1, stroke=0)
    c.setFillColor(VIOLET_700)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 3.5 * mm, y - 3.2 * mm, label)


def section_title(c: canvas.Canvas, margin: float, y: float, title: str) -> float:
    c.setFillColor(INK_950)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin, y, title)
    return y - 7 * mm


def bullet_block(
    c: canvas.Canvas,
    items: list[str],
    x: float,
    y: float,
    max_width: float,
    size: float = 9.5,
    leading: float = 12.5,
) -> float:
    for item in items:
        c.setFillColor(VIOLET_600)
        c.circle(x + 1.8 * mm, y + 2.2, 1.4, fill=1, stroke=0)
        y = draw_wrapped(
            c, item, x + 6 * mm, y, max_width - 6 * mm, size=size, leading=leading, color=INK_800
        )
        y -= 2.2 * mm
    return y


def quote_block(c: canvas.Canvas, margin: float, y: float, content_w: float, text: str, h: float = 28 * mm) -> float:
    c.setFillColor(VIOLET_50)
    c.roundRect(margin, y - h, content_w, h, 4, fill=1, stroke=0)
    c.setFillColor(VIOLET_500)
    c.rect(margin, y - h, 2.2 * mm, h, fill=1, stroke=0)
    draw_wrapped(
        c,
        text,
        margin + 6 * mm,
        y - 8 * mm,
        content_w - 12 * mm,
        font="Helvetica-Oblique",
        size=9.5,
        leading=13,
        color=INK_800,
    )
    return y - h - 6 * mm


def dark_cta(
    c: canvas.Canvas,
    margin: float,
    y: float,
    content_w: float,
    title: str,
    lines: list[str],
    url: str,
    h: float = 36 * mm,
) -> float:
    c.setFillColor(INK_950)
    c.roundRect(margin, y - h, content_w, h, 5, fill=1, stroke=0)
    c.setFillColor(VIOLET_500)
    c.rect(margin, y - h, 2.5 * mm, h, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin + 6 * mm, y - 9 * mm, title)
    yy = y - 16 * mm
    c.setFont("Helvetica", 8.5)
    c.setFillColor(HexColor("#CBD5E1"))
    for line in lines:
        c.drawString(margin + 6 * mm, yy, line)
        yy -= 5 * mm
    c.setFillColor(VIOLET_500)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin + 6 * mm, y - h + 6 * mm, url)
    return y - h - 4 * mm


def mini_card(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    body: str,
) -> None:
    c.setFillColor(INK_50)
    c.setStrokeColor(INK_200)
    c.setLineWidth(0.6)
    c.roundRect(x, y - h, w, h, 4, fill=1, stroke=1)
    c.setFillColor(VIOLET_700)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 3.5 * mm, y - 6.5 * mm, title)
    draw_wrapped(c, body, x + 3.5 * mm, y - 12 * mm, w - 7 * mm, size=8, leading=10.5, color=INK_700)


def two_col_row(
    c: canvas.Canvas,
    margin: float,
    y: float,
    content_w: float,
    left_title: str,
    left_body: str,
    right_title: str,
    right_body: str,
    h: float = 32 * mm,
) -> float:
    gap = 4 * mm
    w = (content_w - gap) / 2
    mini_card(c, margin, y, w, h, left_title, left_body)
    mini_card(c, margin + w + gap, y, w, h, right_title, right_body)
    return y - h - 5 * mm


# ---------------------------------------------------------------------------
# Client — Direzione Tecnica (3 pagine)
# ---------------------------------------------------------------------------


def build_direzione_tecnica(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    margin = 18 * mm
    content_w = width - 2 * margin
    total = 3

    # --- P1 ---
    draw_header_bar(c, width, height, "Direzione Tecnica")
    y = height - 38 * mm
    pill(c, margin, y, "PRESENTAZIONE · PMI")
    y -= 14 * mm

    c.setFillColor(INK_950)
    c.setFont("Helvetica-Bold", 20)
    for line in ["Hai già un team.", "Ti manca chi prende", "le decisioni difficili."]:
        c.drawString(margin, y, line)
        y -= 8 * mm

    y -= 3 * mm
    y = draw_wrapped(
        c,
        "Il codice c’è. Le persone ci sono. Ma ogni settimana si ripete lo stesso film: "
        "priorità che cambiano a voce, bug che tornano, assunzioni fatte «a sensazione», "
        "nessuno che dice no quando serve. Non ti manca un altro sviluppatore. "
        "Ti manca ownership tecnica.",
        margin,
        y,
        content_w,
        size=10.5,
        leading=14.5,
        color=INK_800,
    )

    y -= 5 * mm
    y = quote_block(
        c,
        margin,
        y,
        content_w,
        "«Prendo ownership delle decisioni e dei deliverable. Lavoriamo con uno slot "
        "settimanale chiaro — così sai cosa ottieni e io resto affidabile.»",
        h=26 * mm,
    )

    y = section_title(c, margin, y, "Il costo invisibile dello status quo")
    y = bullet_block(
        c,
        [
            "Roadmap che vive solo nella testa del fondatore o del «dev più bravo»",
            "Rilasci che fanno paura — nessuno sa cosa può rompersi",
            "Debito tecnico che cresce finché un giorno blocca una feature commerciale",
            "Hiring sbagliato: seniority valutata sul CV, non sul problema reale",
        ],
        margin,
        y,
        content_w,
    )

    y -= 3 * mm
    y = section_title(c, margin, y, "Cosa cambia con un Partner Tecnico")
    y = draw_wrapped(
        c,
        "Non slide che spariscono. Non un Fractional CTO da brochure americana. "
        "Un interlocutore senior che firma decisioni scritte, ritmi di delivery e "
        "crescita del team — entro ore dichiarate, non promesse vaghe.",
        margin,
        y,
        content_w,
        size=9.5,
        leading=13,
        color=INK_800,
    )

    draw_footer(c, width, 1, total)
    c.showPage()

    # --- P2 ---
    draw_header_bar(c, width, height, "Direzione Tecnica")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Tre modalità — una sola competenza")
    y = draw_wrapped(
        c,
        "Scegliamo l’angolatura in base al problema. Non vendiamo un pacchetto fisso: "
        "vendiamo chiarezza su dove intervenire.",
        margin,
        y,
        content_w,
        size=9.5,
        leading=12.5,
        color=INK_700,
    )
    y -= 3 * mm

    modes = [
        (
            "01  Strategico",
            "Roadmap tecnica allineata al business, ADR su scelte architetturali, "
            "governance dei rilasci. Ideale quando il team sa scrivere codice ma "
            "manca chi decide la direzione.",
        ),
        (
            "02  Operativo (time-boxed)",
            "Code review e pair su slot fissi — non embed full-time. Entri nei "
            "momenti critici, alzi lo standard, esci. Se ti serve qualcuno «uno di "
            "voi» ogni giorno, ti aiuto ad assumerlo: non fingo di esserlo.",
        ),
        (
            "03  Team building",
            "Selezione, onboarding, struttura ruoli, mentoring. Il team prima del "
            "codice: perché un’architettura bella su un team fragile fallisce comunque.",
        ),
    ]
    for title, body in modes:
        c.setFillColor(INK_50)
        c.setStrokeColor(INK_200)
        c.roundRect(margin, y - 28 * mm, content_w, 28 * mm, 4, fill=1, stroke=1)
        c.setFillColor(VIOLET_700)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin + 4 * mm, y - 8 * mm, title)
        draw_wrapped(c, body, margin + 4 * mm, y - 14 * mm, content_w - 8 * mm, size=8.5, leading=11.5, color=INK_700)
        y -= 32 * mm

    y -= 2 * mm
    y = section_title(c, margin, y, "Entry point: Tech Assessment")
    y = draw_wrapped(
        c,
        "2–3 giorni. Deliverable scritto: stato dello stack, rischi ordinati, priorità "
        "90 giorni, stime ore realistiche. Niente retainer a cieco. Se ha senso "
        "continuare, le ore del mese 1 sono in contratto — e sai già cosa comprare.",
        margin,
        y,
        content_w,
        size=9.5,
        leading=13,
        color=INK_800,
    )

    draw_footer(c, width, 2, total)
    c.showPage()

    # --- P3 ---
    draw_header_bar(c, width, height, "Direzione Tecnica")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Come lavoriamo (onesto)")
    y = bullet_block(
        c,
        [
            "Ownership = decisioni + deliverable concordati — non presenza 8 ore al giorno",
            "Cap capacità dichiarato: slot settimanali chiari (tipicamente 4–8 h per cliente)",
            "Background enterprise su sistemi mission-critical, tradotto per PMI",
            "AI solo dove ha ROI misurabile — non un progetto AI da vendere a parte",
        ],
        margin,
        y,
        content_w,
    )

    y -= 2 * mm
    y = section_title(c, margin, y, "Cosa NON siamo")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "Non siamo…",
        "Fractional CTO da slide. Body rental. Agenzia che sparisce dopo la riunione. "
        "Un CTO interno a tempo pieno mascherato.",
        "Siamo…",
        "Il partner che prende in mano direzione e accountability — con ritmi e "
        "deliverable che puoi verificare a fine mese.",
        h=34 * mm,
    )

    y = section_title(c, margin, y, "Per chi è (e per chi no)")
    y = bullet_block(
        c,
        [
            "Sì: PMI con 3–10 sviluppatori senza riferimento tecnico solido",
            "Sì: team presente ma senza ritmo, review o decisioni scritte",
            "No: serve un embed full-time ogni giorno → ti aiuto a strutturare l’assunzione",
            "No: urgenza «go-live in 2 settimane» senza team capace e senza buffer",
        ],
        margin,
        y,
        content_w,
    )

    y -= 4 * mm
    dark_cta(
        c,
        margin,
        y,
        content_w,
        "Prossimo passo",
        [
            "Una call di 20–30 minuti. Una domanda: hai già un team,",
            "o il problema è costruire / rifare il software?",
            "Se è direzione tecnica, partiamo dal Tech Assessment.",
        ],
        "www.108vision.it/direzione-tecnica",
        h=38 * mm,
    )

    draw_footer(c, width, 3, total)
    c.save()


# ---------------------------------------------------------------------------
# Client — Software in Mano (3 pagine)
# ---------------------------------------------------------------------------


def build_software_in_mano(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    margin = 18 * mm
    content_w = width - 2 * margin
    total = 3

    draw_header_bar(c, width, height, "Software in Mano")
    y = height - 38 * mm
    pill(c, margin, y, "PRESENTAZIONE · PMI")
    y -= 14 * mm

    c.setFillColor(INK_950)
    c.setFont("Helvetica-Bold", 20)
    for line in ["Il software lo costruiamo.", "E lo teniamo in mano", "dopo il go-live."]:
        c.drawString(margin, y, line)
        y -= 8 * mm

    y -= 3 * mm
    y = draw_wrapped(
        c,
        "Troppe PMI italiane hanno già pagato due volte lo stesso pezzo di software: "
        "la prima a chi lo ha scritto, la seconda a chi è sparito. Gestionale che non "
        "parla col CRM. Excel che tiene in piedi il magazzino. Un fornitore che risponde "
        "solo quando ricorda. Il problema non è «manca un’app». Il problema è ownership.",
        margin,
        y,
        content_w,
        size=10.5,
        leading=14.5,
        color=INK_800,
    )

    y -= 5 * mm
    y = quote_block(
        c,
        margin,
        y,
        content_w,
        "«Un interlocutore unico: da cosa ti serve davvero, all’architettura, al build, "
        "alle integrazioni, all’evolutiva. Il codice è tuo al 100%. Nessun lock-in.»",
        h=26 * mm,
    )

    y = section_title(c, margin, y, "I film che conosci già")
    y = bullet_block(
        c,
        [
            "Preventivo a voce, scope che esplode a metà progetto, lite sul «era escluso»",
            "Go-live e poi silenzio — finché un bug non costa una settimana di lavoro manuale",
            "Integrazioni con TeamSystem, Zucchetti, Fatture in Cloud rimandate «alla fase 2»",
            "AI comprata come moda, senza capire quale flusso del business migliora in 90 giorni",
        ],
        margin,
        y,
        content_w,
    )

    draw_footer(c, width, 1, total)
    c.showPage()

    draw_header_bar(c, width, height, "Software in Mano")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Tre modi di ingaggio — zero fog")
    y = draw_wrapped(
        c,
        "Non vendiamo ore a caso. Vendiamo un percorso in cui sai sempre cosa stai comprando.",
        margin,
        y,
        content_w,
        size=9.5,
        leading=12.5,
        color=INK_700,
    )
    y -= 3 * mm

    modes = [
        (
            "01  Discovery",
            "Scope chiuso, priorità, architettura e stima. In 1–2 settimane hai un documento "
            "su cui decidere — non un PowerPoint di promesse. Credito tipicamente detraibile "
            "dal progetto se firmi entro 30 giorni.",
        ),
        (
            "02  Progetto",
            "Scope fisso, milestone, consegna. Ownership sul risultato, non solo sulle ore "
            "fatturate. Sai cosa entra, cosa resta fuori, quando controlli.",
        ),
        (
            "03  Retainer evolutivo",
            "Ore mensili chiare per far crescere il software dopo il go-live. Il pezzo "
            "critico del business resta in mano — non in una black box del fornitore.",
        ),
    ]
    for title, body in modes:
        c.setFillColor(INK_50)
        c.setStrokeColor(INK_200)
        c.roundRect(margin, y - 30 * mm, content_w, 30 * mm, 4, fill=1, stroke=1)
        c.setFillColor(VIOLET_700)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin + 4 * mm, y - 8 * mm, title)
        draw_wrapped(c, body, margin + 4 * mm, y - 14 * mm, content_w - 8 * mm, size=8.5, leading=11.5, color=INK_700)
        y -= 34 * mm

    y -= 1 * mm
    y = section_title(c, margin, y, "Cosa portiamo (oltre al codice)")
    y = bullet_block(
        c,
        [
            "Traduzione business → requisiti → architettura (senza far finta che «lo capisca il dev»)",
            "Integrazioni con gestionali italiani e flussi reali, non demo da catalogo",
            "AI applicata solo dove il ROI è dimostrabile entro ~90 giorni",
            "Prova del metodo: WellBeing — un’app che abbiamo costruito e teniamo in mano",
        ],
        margin,
        y,
        content_w,
    )

    draw_footer(c, width, 2, total)
    c.showPage()

    draw_header_bar(c, width, height, "Software in Mano")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Cosa NON siamo")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "Non siamo…",
        "Factory commodity. Software house che consegna e sparisce. Body rental senza "
        "ownership sul risultato. «Team offshore dedicato» da brochure.",
        "Siamo…",
        "Il partner che costruisce e resta. Stessa profondità tecnica della Direzione "
        "Tecnica — angolatura diversa: qui il software è il problema.",
        h=36 * mm,
    )

    y = section_title(c, margin, y, "Per chi è")
    y = bullet_block(
        c,
        [
            "Serve un prodotto o un modulo che oggi non esiste (o non regge più)",
            "Hai codice / un fornitore, ma nessuno se ne prende davvero cura",
            "Processi manuali e Excel che bruciano ore ogni settimana sul core business",
            "Hai già un team forte e ti manca solo la guida → guarda Direzione Tecnica",
        ],
        margin,
        y,
        content_w,
    )

    y -= 3 * mm
    y = section_title(c, margin, y, "Regola di scelta (una frase)")
    y = quote_block(
        c,
        margin,
        y,
        content_w,
        "«Il cliente ha già un team di sviluppo, o deve ancora costruire / rifare il software?» "
        "Team presente → Direzione Tecnica. Software assente o rotto → Software in Mano.",
        h=24 * mm,
    )

    dark_cta(
        c,
        margin,
        y,
        content_w,
        "Prossimo passo",
        [
            "Call di 20–30 minuti. Se il problema è costruire o tenere il software,",
            "partiamo da una Discovery a scope chiuso — poi progetto o retainer.",
        ],
        "www.108vision.it/software-in-mano",
        h=34 * mm,
    )

    draw_footer(c, width, 3, total)
    c.save()


# ---------------------------------------------------------------------------
# Agency — Partner Direzione Tecnica
# ---------------------------------------------------------------------------


def build_partner_direzione(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    margin = 18 * mm
    content_w = width - 2 * margin
    total = 3

    draw_header_bar(c, width, height, "Partner · Direzione Tecnica")
    y = height - 38 * mm
    pill(c, margin, y, "KIT AGENZIE DI CONSULENZA")
    y -= 14 * mm

    c.setFillColor(INK_950)
    c.setFont("Helvetica-Bold", 18)
    for line in ["Cosa posso fare io", "per le vostre proposte", "quando manca la tech."]:
        c.drawString(margin, y, line)
        y -= 7.5 * mm

    y -= 3 * mm
    y = draw_wrapped(
        c,
        "Voi vincete sulla relazione, sul contesto business, sull’account. "
        "Spesso perdete (o svuotate di valore) quando arriva la domanda: "
        "«Chi ci guida sul software / sul team / sull’architettura?» "
        "Io sono quella risposta — in subcontract o in co-delivery — senza inventare "
        "un team full-time che non esiste.",
        margin,
        y,
        content_w,
        size=10,
        leading=14,
        color=INK_800,
    )

    y -= 5 * mm
    y = section_title(c, margin, y, "Perché integrarci nelle vostre proposte")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "Voi portate",
        "Relazione col cliente, contesto di business, fiducia locale, progetti di "
        "strategia / organizzazione / processi.",
        "Io porto",
        "Seniority enterprise su architettura, delivery e AI applicata. Due SKU chiari. "
        "Capacità dichiarata — zero «team dedicato» da brochure.",
        h=38 * mm,
    )

    y = section_title(c, margin, y, "Quando proporre Direzione Tecnica")
    y = bullet_block(
        c,
        [
            "Il cliente ha già 3–10 sviluppatori ma manca un riferimento tecnico solido",
            "C’è un Tech Lead «di fatto» che non tiene più il passo con crescita e qualità",
            "Devono assumere e non sanno valutare seniority, stack o ruoli",
            "Vi chiedono «un CTO part-time» — e voi non volete promettere un embed full-time",
        ],
        margin,
        y,
        content_w,
    )

    draw_footer(c, width, 1, total)
    c.showPage()

    draw_header_bar(c, width, height, "Partner · Direzione Tecnica")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Cosa vendete voi al cliente (linguaggio commerciale)")
    y = bullet_block(
        c,
        [
            "Roadmap tecnica allineata al business — decisioni scritte, non «si vedrà»",
            "ADR e scelte architetturali documentate (così non dipendono da una sola testa)",
            "Code review e pair time-boxed — alzano lo standard senza sostituire il team",
            "Supporto hiring e crescita del team interno",
        ],
        margin,
        y,
        content_w,
    )

    y -= 2 * mm
    y = section_title(c, margin, y, "Cosa NON promettete (protegge voi e me)")
    y = bullet_block(
        c,
        [
            "Sviluppo a ore / body rental mascherato da «direzione»",
            "Product Owner del backlog al posto del cliente",
            "CTO presente ogni giorno nel team chat o in ufficio",
            "Guardia 24/7 su produzione",
        ],
        margin,
        y,
        content_w,
    )

    y -= 2 * mm
    y = section_title(c, margin, y, "Entry point che chiude senza retainer a cieco")
    c.setFillColor(INK_50)
    c.setStrokeColor(INK_200)
    c.roundRect(margin, y - 36 * mm, content_w, 36 * mm, 4, fill=1, stroke=1)
    c.setFillColor(VIOLET_700)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 4 * mm, y - 8 * mm, "Tech Assessment · 2–3 giorni · 1.500–3.500 EUR [indicativo]")
    draw_wrapped(
        c,
        "Deliverable scritto: stato stack, rischi, piano 90 giorni, ore realistiche. "
        "Credito tipicamente detraibile dal mese 1 retainer se firma entro 30 gg. "
        "I vostri commerciali hanno un pezzo concreto da mettere in proposta — non una slide.",
        margin + 4 * mm,
        y - 15 * mm,
        content_w - 8 * mm,
        size=8.5,
        leading=11.5,
        color=INK_700,
    )
    y -= 42 * mm

    y = section_title(c, margin, y, "Script da usare in proposta (4 righe)")
    y = quote_block(
        c,
        margin,
        y,
        content_w,
        "«Per la parte tecnica abbiamo un partner specializzato, 108 Vision: prende in mano "
        "decisioni e deliverable del software, non solo consulenza generica. Vi guida il team "
        "che avete già — con ore chiare e un Tech Assessment iniziale prima di impegni lunghi.»",
        h=32 * mm,
    )

    draw_footer(c, width, 2, total)
    c.showPage()

    draw_header_bar(c, width, height, "Partner · Direzione Tecnica")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Modelli di collaborazione (default B e C)")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "B — Subcontract",
        "Voi firmate col cliente. 108 Vision eroga in white-label / sub-fornitura. "
        "Preferito quando volete un’unica relazione commerciale.",
        "C — Co-delivery",
        "Proposta e delivery congiunti; entrambi visibili dove ha senso. Preferito "
        "quando il brand tecnico rafforza la vostra offerta.",
        h=40 * mm,
    )
    y = draw_wrapped(
        c,
        "Modello A (referral diretto): solo se posso propormi al cliente finale "
        "(introduzione esplicita / call congiunta). Niente referral silenzioso.",
        margin,
        y,
        content_w,
        size=9,
        leading=12,
        color=INK_700,
    )

    y -= 5 * mm
    y = section_title(c, margin, y, "Vincolo di capacità (da dire al cliente con voi)")
    y = bullet_block(
        c,
        [
            "Cap operativo: 8–12 h/settimana totali su clienti side — qualità prima della scala",
            "Slot tipico per cliente: 4–8 h/sett., ore/mese in contratto",
            "Fuori cap → waitlist o rinegoziazione: non si promette oltre",
            "Perché vi interessa: evita under-delivery sul vostro nome e protegge il delivery congiunto",
        ],
        margin,
        y,
        content_w,
    )

    y -= 3 * mm
    y = section_title(c, margin, y, "Cosa ottengo io / cosa ottenete voi")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "Voi",
        "Chiudete pezzi tecnici senza assumente un CTO. Différentiate la proposta. "
        "Mantenete l’account. Pipeline con entry point chiaro.",
        "Io",
        "Lavoro su problemi dove la seniority conta. Relazione partner stabile. "
        "Niente cacce a freddo su PMI sconosciute.",
        h=36 * mm,
    )

    dark_cta(
        c,
        margin,
        y,
        content_w,
        "Prossimo passo partner",
        [
            "1) Call 20 min — allineamento modelli B/C, SKU, cap ore.",
            "2) Entro 60 giorni: almeno 1 opportunità in pipeline (cliente nominato",
            "   o inclusione in una proposta attiva).",
        ],
        "www.108vision.it/direzione-tecnica  ·  info@108vision.it",
        h=40 * mm,
    )

    draw_footer(c, width, 3, total)
    c.save()


# ---------------------------------------------------------------------------
# Agency — Partner Software in Mano
# ---------------------------------------------------------------------------


def build_partner_software(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    margin = 18 * mm
    content_w = width - 2 * margin
    total = 3

    draw_header_bar(c, width, height, "Partner · Software in Mano")
    y = height - 38 * mm
    pill(c, margin, y, "KIT AGENZIE DI CONSULENZA")
    y -= 14 * mm

    c.setFillColor(INK_950)
    c.setFont("Helvetica-Bold", 18)
    for line in ["Cosa posso fare io", "quando il vostro cliente", "ha bisogno di software."]:
        c.drawString(margin, y, line)
        y -= 7.5 * mm

    y -= 3 * mm
    y = draw_wrapped(
        c,
        "Le società di consulenza chiudono strategie, processi, organizzazione — "
        "e poi si fermano sul pezzo digitale: chi lo costruisce? Chi lo tiene vivo? "
        "Se mandate il cliente da una software house a caso, perdete controllo sul "
        "risultato e sulla relazione. Io costruisco e resto — in subcontract o co-delivery.",
        margin,
        y,
        content_w,
        size=10,
        leading=14,
        color=INK_800,
    )

    y -= 5 * mm
    y = section_title(c, margin, y, "Perché integrarci nelle vostre proposte")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "Voi portate",
        "Diagnosi di business, priorità, change management, fiducia dell’imprenditore.",
        "Io porto",
        "Discovery → build → integrazioni → retainer. Un interlocutore unico. "
        "Proprietà codice 100% cliente. AI solo con ROI.",
        h=36 * mm,
    )

    y = section_title(c, margin, y, "Quando proporre Software in Mano")
    y = bullet_block(
        c,
        [
            "Il software non esiste, non regge, o il fornitore precedente è sparito",
            "Serve un modulo critico (ordini, magazzino, portale, automazioni) legato al core",
            "Integrazioni con gestionali IT (TeamSystem, Zucchetti, Fatture in Cloud, …)",
            "Il cliente ha «curiosità AI» ma nessuno sa quale flusso migliorare in 90 giorni",
            "Avete già venduto strategia e vi serve chi esegue senza commoditizzare il pezzo tech",
        ],
        margin,
        y,
        content_w,
    )

    draw_footer(c, width, 1, total)
    c.showPage()

    draw_header_bar(c, width, height, "Partner · Software in Mano")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Cosa vendete voi al cliente")
    y = bullet_block(
        c,
        [
            "Discovery → Progetto a scope chiuso → Retainer evolutivo (percorso chiaro)",
            "Un interlocutore: requisito → architettura → build → manutenzione",
            "Proprietà del codice al cliente — nessun lock-in da piattaforma proprietaria",
            "Integrazioni e flussi reali PMI, non demo da catalogo",
        ],
        margin,
        y,
        content_w,
    )

    y -= 2 * mm
    y = section_title(c, margin, y, "Cosa NON promettete")
    y = bullet_block(
        c,
        [
            "Body rental / «risorse» a giornata senza ownership sul risultato",
            "«Team offshore dedicato» da brochure",
            "Factory commodity senza strategia sul pezzo critico",
            "Progetti AI senza criterio di successo entro ~90 giorni",
        ],
        margin,
        y,
        content_w,
    )

    y -= 2 * mm
    y = section_title(c, margin, y, "Entry point che i vostri commerciali possono mettere in offerta")
    c.setFillColor(INK_50)
    c.setStrokeColor(INK_200)
    c.roundRect(margin, y - 36 * mm, content_w, 36 * mm, 4, fill=1, stroke=1)
    c.setFillColor(VIOLET_700)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 4 * mm, y - 8 * mm, "Discovery Sprint · 1–2 settimane · 1.500–3.000 EUR [indicativo]")
    draw_wrapped(
        c,
        "Scope + architettura + stima progetto/retainer. Credito tipicamente detraibile "
        "dal Progetto se firma entro 30 gg. Riduce il rischio reputazionale: nessuno "
        "impegna mesi senza un documento decisionale.",
        margin + 4 * mm,
        y - 15 * mm,
        content_w - 8 * mm,
        size=8.5,
        leading=11.5,
        color=INK_700,
    )
    y -= 42 * mm

    y = section_title(c, margin, y, "Script da usare in proposta")
    y = quote_block(
        c,
        margin,
        y,
        content_w,
        "«Per costruire e far evolvere il software abbiamo un partner tecnico, 108 Vision: "
        "prende in mano il pezzo digitale — Discovery, progetto, retainer — con ore chiare "
        "e codice di proprietà del cliente. Il primo passo è una Discovery a scope chiuso.»",
        h=30 * mm,
    )

    draw_footer(c, width, 2, total)
    c.showPage()

    draw_header_bar(c, width, height, "Partner · Software in Mano")
    y = height - 38 * mm
    y = section_title(c, margin, y, "Regola rapida — quale SKU proporre?")
    y = quote_block(
        c,
        margin,
        y,
        content_w,
        "«Il cliente ha già un team di sviluppo, o deve ancora costruire / rifare il software?» "
        "Team presente → Direzione Tecnica. Software assente/rotto → Software in Mano. "
        "Entrambi → Assessment o Discovery prima, poi sequenza.",
        h=28 * mm,
    )

    y = section_title(c, margin, y, "Modelli B / C (stessi della Direzione Tecnica)")
    y = two_col_row(
        c,
        margin,
        y,
        content_w,
        "B — Subcontract",
        "Voi firmate; io erogo white-label / sub-fornitura. Un’unica relazione commerciale "
        "verso il cliente.",
        "C — Co-delivery",
        "Proposta congiunta, brand dove serve. Utile quando volete mostrare profondità "
        "tecnica senza diventare una software house.",
        h=38 * mm,
    )

    y = section_title(c, margin, y, "Vincolo di capacità + prova del metodo")
    y = bullet_block(
        c,
        [
            "Cap 8–12 h/sett. totali side — slot per cliente in contratto",
            "Progetti grandi: scope chiuso + milestone; non «sempre disponibili»",
            "Prova concreta del metodo: WellBeing (app costruita e tenuta in mano da noi) — "
            "esempio di Software in Mano, non un terzo canale da vendere al posto vostro",
        ],
        margin,
        y,
        content_w,
    )

    y -= 3 * mm
    dark_cta(
        c,
        margin,
        y,
        content_w,
        "Prossimo passo partner",
        [
            "1) Call 20 min — allineamento B/C, quando usare SiM vs Direzione Tecnica.",
            "2) Entro 60 giorni: 1 opportunità in pipeline (cliente nominato o proposta).",
        ],
        "www.108vision.it/software-in-mano  ·  info@108vision.it",
        h=36 * mm,
    )

    draw_footer(c, width, 3, total)
    c.save()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    targets = [
        (OUT / "108vision-direzione-tecnica.pdf", build_direzione_tecnica),
        (OUT / "108vision-software-in-mano.pdf", build_software_in_mano),
        (OUT / "108vision-partner-direzione-tecnica.pdf", build_partner_direzione),
        (OUT / "108vision-partner-software-in-mano.pdf", build_partner_software),
    ]
    for path, builder in targets:
        builder(path)
        print(f"Wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
