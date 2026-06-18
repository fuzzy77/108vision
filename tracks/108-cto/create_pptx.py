from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# 108 Vision palette
INK_950 = RGBColor(0x0F, 0x17, 0x2A)
INK_900 = RGBColor(0x1E, 0x29, 0x3B)
INK_800 = RGBColor(0x33, 0x41, 0x55)
INK_200 = RGBColor(0xE2, 0xE8, 0xF0)
INK_50 = RGBColor(0xF8, 0xFA, 0xFC)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
VIOLET_700 = RGBColor(0x6D, 0x28, 0xD9)
VIOLET_500 = RGBColor(0x8B, 0x5C, 0xF6)
VIOLET_400 = RGBColor(0xA7, 0x8B, 0xFA)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

def dark_slide():
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    bg = slide.background.fill
    bg.solid()
    bg.fore_color.rgb = INK_950
    return slide

def text(slide, left, top, width, height, txt, size=18, bold=False, color=WHITE, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = txt
    p.font.size = Pt(size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.alignment = align
    p.font.name = 'Inter'
    return tf

def bar(slide, top):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(top), Inches(0.08), Inches(0.8))
    s.fill.solid()
    s.fill.fore_color.rgb = VIOLET_700
    s.line.fill.background()

def hline(slide, left, top, width):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(0.04))
    s.fill.solid()
    s.fill.fore_color.rgb = VIOLET_700
    s.line.fill.background()

# ===== SLIDE 1: COVER =====
slide = dark_slide()
text(slide, 1.0, 1.5, 10, 1.2, 'ELIOS SCOGLIO', size=44, bold=True)
text(slide, 1.0, 2.5, 10, 0.8, 'Software & Architecture Manager | Fractional CTO', size=22, color=VIOLET_400)
hline(slide, 1.0, 3.5, 3.0)
text(slide, 1.0, 4.0, 10, 0.6, 'Presentazione per Etica Soluzioni', size=18, color=INK_200)
text(slide, 1.0, 6.2, 10, 0.5, '108 Vision — Costruiamo la direzione, non solo il codice.', size=14, color=INK_800)

# ===== SLIDE 2: CHI SONO =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Chi sono', size=36, bold=True)
bar(slide, 1.4)
items = [
    '10+ anni su piattaforme mission-critical ad alto traffico',
    '30M transazioni/anno — zero-downtime obbligatorio',
    '93 componenti, 7 livelli architetturali, 3 team coordinati',
    'Compliance quotidiana: SIAE, Polizia di Stato, GDPR',
    '7+ integrazioni esterne con circuit breaker e monitoring',
    'Legacy modernization: CORBA (23 anni) → microservizi gRPC',
]
tf = text(slide, 1.2, 2.0, 10.5, 5.0, '', size=18, color=INK_200)
for item in items:
    p = tf.add_paragraph()
    p.text = f'→  {item}'
    p.font.size = Pt(18)
    p.font.color.rgb = INK_200
    p.font.name = 'Inter'
    p.space_before = Pt(14)
text(slide, 1.0, 6.6, 11, 0.4, 'Non scrivo codice. Faccio in modo che le decisioni tecniche siano quelle giuste.', size=14, bold=True, color=VIOLET_400)

# ===== SLIDE 3: COSA FACCIO =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Cosa faccio concretamente', size=36, bold=True)
bar(slide, 1.4)
areas = [
    ('Strategia', 'Roadmap tecnica, decisioni architetturali, allineamento business-tech'),
    ('Architettura', 'Review design, standard, debito tecnico, scelte build/buy'),
    ('Team', 'Hiring, 1:1, mentoring, cultura ingegneristica, crescita'),
    ('Governance', 'ADR tracciabili, metriche DORA, report mensile, CEO sync'),
    ('AI & Innovazione', 'Adoption pragmatica — ROI dimostrabile, non hype'),
]
for i, (title, desc) in enumerate(areas):
    y = 2.0 + i * 0.95
    text(slide, 1.5, y, 3.0, 0.5, title, size=18, bold=True, color=VIOLET_400)
    text(slide, 5.0, y, 7.5, 0.5, desc, size=16, color=INK_200)
text(slide, 1.0, 6.6, 10, 0.4, 'Cosa NON faccio: scrivere codice, gestire sprint, fare il PM.', size=13, color=INK_800)

# ===== SLIDE 4: RISULTATI =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Risultati dimostrabili', size=36, bold=True)
bar(slide, 1.4)
results = [
    ('Deploy frequency', '+400%', 'da ogni 6 settimane a ogni settimana'),
    ('Tempo deploy', '-91%', 'da 4 ore a 22 minuti'),
    ('Costo sviluppo (AI)', '-77/82%', 'su task specifici'),
    ('Tempo analisi', '-92%', 'da 2-3 giorni a 2 ore'),
    ('Team satisfaction', '+50%', 'survey interna'),
]
for i, (label, number, detail) in enumerate(results):
    y = 2.2 + i * 0.95
    text(slide, 1.5, y, 3.5, 0.5, label, size=16, color=INK_200)
    text(slide, 5.2, y, 2.0, 0.5, number, size=24, bold=True, color=VIOLET_400)
    text(slide, 7.5, y, 5.0, 0.5, detail, size=14, color=INK_800)
text(slide, 1.0, 6.6, 10, 0.4, 'Numeri da sistemi reali in produzione. Non POC, non demo.', size=13, color=INK_800)

# ===== SLIDE 5: DUE FILONI =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Il mio approccio: due filoni paralleli', size=36, bold=True)
bar(slide, 1.4)
# Filone 1
s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.2), Inches(5.3), Inches(3.8))
s.fill.solid()
s.fill.fore_color.rgb = INK_900
s.line.color.rgb = VIOLET_700
s.line.width = Pt(1.5)
text(slide, 1.3, 2.4, 4.8, 0.5, 'FILONE 1 — PRESENTE', size=16, bold=True, color=VIOLET_400)
text(slide, 1.3, 2.9, 4.8, 0.4, 'Concretizzare e ottimizzare', size=14, color=INK_200)
tf = text(slide, 1.3, 3.4, 4.8, 2.5, '', size=14, color=INK_200)
for item in ['Flussi di sviluppo ottimizzati', 'Best practice e standard condivisi', 'CI/CD e testing automatico', 'Incident management strutturato', 'Comunicazione team-business']:
    p = tf.add_paragraph()
    p.text = f'→ {item}'
    p.font.size = Pt(14)
    p.font.color.rgb = INK_200
    p.font.name = 'Inter'
    p.space_before = Pt(6)
text(slide, 1.3, 5.6, 4.8, 0.4, 'Valore visibile in 2-4 settimane.', size=12, bold=True, color=VIOLET_400)

# Filone 2
s2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(2.2), Inches(5.3), Inches(3.8))
s2.fill.solid()
s2.fill.fore_color.rgb = INK_900
s2.line.color.rgb = VIOLET_500
s2.line.width = Pt(1.5)
text(slide, 7.1, 2.4, 4.8, 0.5, 'FILONE 2 — VISIONE', size=16, bold=True, color=VIOLET_400)
text(slide, 7.1, 2.9, 4.8, 0.4, 'Dove andare nei prossimi 3-5 anni', size=14, color=INK_200)
tf2 = text(slide, 7.1, 3.4, 4.8, 2.5, '', size=14, color=INK_200)
for item in ['Revisione architetturale completa', 'AI strategy (prodotto + processo)', 'Scale engineering (2x clienti)', 'Cloud & platform approach', 'Security operativa (code-level)']:
    p = tf2.add_paragraph()
    p.text = f'→ {item}'
    p.font.size = Pt(14)
    p.font.color.rgb = INK_200
    p.font.name = 'Inter'
    p.space_before = Pt(6)
text(slide, 7.1, 5.6, 4.8, 0.4, 'Decisioni misurabili con ADR.', size=12, bold=True, color=VIOLET_400)

# ===== SLIDE 6: METODO =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Il metodo: Know-How → Step → KPI', size=36, bold=True)
bar(slide, 1.4)
phases = [
    ('MESE 1', 'ASCOLTO', 'Capisco il vostro mondo.\nMappo architettura, flussi, team.\nMisuro la baseline.\nOutput: State of the Stack.'),
    ('MESI 2-3', 'AZIONE', 'Obiettivi concreti con owner\ne deadline. 3 step operativi\n+ 3 step strategici.\nKPI misurati mese per mese.'),
    ('MESE 4+', 'ESECUZIONE', 'Report mensile con numeri.\nRoadmap viva. Retrospettiva\nteam. CEO sync bisettimanale.\nScalare up/down a scelta.'),
]
for i, (period, title, desc) in enumerate(phases):
    x = 1.0 + i * 4.0
    colors = [VIOLET_700, VIOLET_500, VIOLET_400]
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(2.2), Inches(3.6), Inches(4.2))
    box.fill.solid()
    box.fill.fore_color.rgb = INK_900
    box.line.color.rgb = colors[i]
    box.line.width = Pt(2)
    text(slide, x + 0.2, 2.4, 3.2, 0.4, period, size=12, bold=True, color=colors[i])
    text(slide, x + 0.2, 2.9, 3.2, 0.5, title, size=22, bold=True)
    text(slide, x + 0.2, 3.6, 3.2, 2.5, desc, size=14, color=INK_200)
text(slide, 1.0, 6.7, 11, 0.4, 'Prima misuro, poi prometto. Mai numeri senza baseline.', size=13, bold=True, color=VIOLET_400)

# ===== SLIDE 7: FRACTIONAL vs FULL-TIME =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Fractional CTO vs Full-Time', size=36, bold=True)
bar(slide, 1.4)
comparisons = [
    ('Costo annuo', '120-180K EUR', '85-100K EUR'),
    ('Rischio hiring', '6 mesi per capire', 'Trial 3 mesi, zero rischio'),
    ('Prospettiva', 'Solo interna', 'Esterna + interna'),
    ('Competenza AI', 'Da trovare + formare', 'Disponibile dal giorno 1'),
    ('Flessibilita', 'Fisso (rinegoziare)', 'Up/down ogni mese'),
    ('Exit', 'Panico se esce', 'Pianificata = successo'),
]
text(slide, 4.5, 1.9, 3.8, 0.4, 'Full-time', size=13, bold=True, color=INK_800)
text(slide, 8.8, 1.9, 3.8, 0.4, 'Fractional', size=13, bold=True, color=VIOLET_400)
for i, (label, ft, frac) in enumerate(comparisons):
    y = 2.4 + i * 0.75
    text(slide, 1.2, y, 3.0, 0.4, label, size=15, bold=True)
    text(slide, 4.5, y, 3.8, 0.4, ft, size=14, color=INK_200)
    text(slide, 8.8, y, 3.8, 0.4, frac, size=14, bold=True, color=VIOLET_400)

# ===== SLIDE 8: MATCH =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Match con il vostro contesto', size=36, bold=True)
bar(slide, 1.4)
matches = [
    ('750K prenotazioni/giorno', '30M transazioni/anno'),
    ('1.000+ Comuni multi-tenant', 'Multi-tenant enterprise'),
    ('PagoPA, SPID, AppIO', 'SIAE, VRO, GDPR compliance'),
    ('Prodotto 23 anni', 'Legacy 23 anni in migrazione'),
    ('7+ integrazioni PA', '7+ integrazioni + circuit breaker'),
    ('Dati minori e pazienti', 'GDPR quotidiano, PII controls'),
    ('Team AI senza direzione', 'AI con ROI -77% dimostrato'),
]
text(slide, 1.5, 1.9, 5.0, 0.4, 'ETICA SOLUZIONI', size=12, bold=True, color=INK_800)
text(slide, 7.8, 1.9, 5.0, 0.4, 'ELIOS SCOGLIO', size=12, bold=True, color=VIOLET_400)
for i, (their, mine) in enumerate(matches):
    y = 2.4 + i * 0.68
    text(slide, 1.5, y, 5.0, 0.4, their, size=14, color=INK_200)
    text(slide, 7.8, y, 5.0, 0.4, mine, size=14, bold=True, color=VIOLET_400)
    hline(slide, 6.5, y + 0.2, 1.0)

# ===== SLIDE 9: COME FUNZIONA =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Come funziona in pratica', size=36, bold=True)
bar(slide, 1.4)
details = [
    ('Presenza', '2 giorni/settimana dedicati (scalabile)'),
    ('Giorno 1', 'Governance + Team: standup, 1:1, review architetturali'),
    ('Giorno 2', 'Strategia + Stakeholder: CEO sync, roadmap, metriche'),
    ('Async', 'Risposta entro 4h; urgenze entro 2h'),
    ('Ogni mese', 'Report + ADR + roadmap + metriche'),
    ('Commitment', '3 mesi minimo, poi mensile'),
    ('Entry point', 'Tech Assessment 2gg — zero vincolo'),
]
for i, (label, value) in enumerate(details):
    y = 2.0 + i * 0.72
    text(slide, 1.5, y, 3.0, 0.4, label, size=15, bold=True, color=VIOLET_400)
    text(slide, 4.8, y, 8.0, 0.4, value, size=15, color=INK_200)

# ===== SLIDE 10: NEXT STEP =====
slide = dark_slide()
text(slide, 1.0, 0.6, 10, 0.8, 'Prossimo passo', size=36, bold=True)
bar(slide, 1.4)
box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(2.0), Inches(10.0), Inches(3.2))
box.fill.solid()
box.fill.fore_color.rgb = INK_900
box.line.color.rgb = VIOLET_700
box.line.width = Pt(2)
text(slide, 2.0, 2.3, 9.0, 0.5, 'TECH ASSESSMENT', size=24, bold=True, color=VIOLET_400)
tf = text(slide, 2.0, 3.0, 9.0, 2.0, '', size=16, color=INK_200)
for line in ['2 giorni — Output: State of the Stack', 'Architettura, team, flussi, rischi, priorita', 'Costo detratto dal primo mese se si prosegue', 'Zero vincolo: deliverable di valore comunque', '', 'Poi: 3 mesi → obiettivi + KPI → review trimestrale']:
    p = tf.add_paragraph()
    p.text = line
    p.font.size = Pt(16)
    p.font.color.rgb = INK_200
    p.font.name = 'Inter'
    p.space_before = Pt(8)

text(slide, 1.0, 5.8, 11, 0.6, '"Il rischio non e provare. Il rischio e continuare senza direzione tecnica."', size=20, bold=True, color=VIOLET_400, align=PP_ALIGN.CENTER)
text(slide, 1.0, 6.6, 11, 0.4, 'Elios Scoglio | elios@108vision.it | 108vision.it', size=13, color=INK_800, align=PP_ALIGN.CENTER)

prs.save(r'c:\Code\Documents\Lavoro\Personale\Vision\tracks\108-cto\PRES_EticaSoluzioni_EliosScoglio.pptx')
print('PowerPoint salvato con successo.')
