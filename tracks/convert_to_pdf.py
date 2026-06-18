"""
Converte tutti i .md in tracks/ (e sotto-directory) in PDF.
Output: tracks/pdf/ con naming: {cartella}_{nomefile}.pdf
Stile: 108 Vision design system (dark header, violet accent)
Usa fpdf2 con font Arial TTF (supporto Unicode completo)
"""

import os
import re
from pathlib import Path
from fpdf import FPDF

TRACKS_DIR = Path(r"c:\Code\Documents\Lavoro\Personale\Vision\tracks")
OUTPUT_DIR = TRACKS_DIR / "pdf"
OUTPUT_DIR.mkdir(exist_ok=True)

FONT_DIR = Path(r"C:\Windows\Fonts")


class VisionPDF(FPDF):
    def __init__(self, title_text="", subtitle_text=""):
        super().__init__()
        self.title_text = title_text
        self.subtitle_text = subtitle_text
        self.set_auto_page_break(auto=True, margin=20)
        # Register Arial as Unicode font
        self.add_font('ArialUni', '', str(FONT_DIR / 'arial.ttf'))
        self.add_font('ArialUni', 'B', str(FONT_DIR / 'arialbd.ttf'))
        self.add_font('ArialUni', 'I', str(FONT_DIR / 'ariali.ttf'))
        self.add_font('ArialUni', 'BI', str(FONT_DIR / 'arialbi.ttf'))

    def header(self):
        self.set_fill_color(109, 40, 217)
        self.rect(0, 0, 210, 3, 'F')
        self.set_font('ArialUni', '', 8)
        self.set_text_color(148, 163, 184)
        self.set_y(5)
        self.cell(0, 5, '108 Vision', align='L')
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font('ArialUni', '', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f'108 Vision | Pagina {self.page_no()}', align='C')

    def chapter_title(self, title):
        self.set_font('ArialUni', 'B', 18)
        self.set_text_color(15, 23, 42)
        self.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(109, 40, 217)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 100, self.get_y())
        self.ln(6)

    def section_title(self, title):
        self.set_font('ArialUni', 'B', 13)
        self.set_text_color(15, 23, 42)
        self.set_x(self.l_margin)
        y = self.get_y()
        self.set_fill_color(109, 40, 217)
        self.rect(10, y, 1.5, 7, 'F')
        self.set_x(14)
        self.multi_cell(self.w - self.r_margin - 14, 7, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def sub_title(self, title):
        self.set_font('ArialUni', 'B', 11)
        self.set_text_color(51, 65, 85)
        self.set_x(self.l_margin)
        self.multi_cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body_text(self, text):
        self.set_font('ArialUni', '', 10)
        self.set_text_color(30, 41, 59)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def quote_text(self, text):
        self.set_fill_color(245, 243, 255)
        self.set_draw_color(167, 139, 250)
        y = self.get_y()
        self.set_font('ArialUni', 'I', 10)
        self.set_text_color(51, 65, 85)
        self.rect(10, y, 190, 8, 'F')
        self.set_line_width(0.5)
        self.line(10, y, 10, y + 8)
        self.set_x(14)
        self.multi_cell(self.w - self.r_margin - 14, 5, text)
        self.set_x(self.l_margin)
        self.ln(3)

    def code_block(self, text):
        self.set_fill_color(15, 23, 42)
        self.set_font('ArialUni', '', 8)
        self.set_text_color(226, 232, 240)
        y = self.get_y()
        lines = text.split('\n')
        height = min(len(lines) * 4 + 6, 240)
        if y + height > 270:
            self.add_page()
            y = self.get_y()
        self.rect(10, y, 190, height, 'F')
        self.set_xy(13, y + 3)
        for line in lines[:55]:
            self.cell(0, 4, line[:120], new_x="LMARGIN", new_y="NEXT")
            self.set_x(13)
        self.set_x(self.l_margin)
        self.ln(4)

    def bullet(self, text, indent=0):
        self.set_font('ArialUni', '', 10)
        self.set_text_color(30, 41, 59)
        x = 14 + indent
        self.set_x(x)
        self.cell(4, 5, '•')
        available = self.w - self.r_margin - self.get_x()
        if available < 10:
            self.ln(5)
            self.set_x(x + 4)
            available = self.w - self.r_margin - self.get_x()
        self.multi_cell(available, 5, text)


def parse_and_render(pdf: VisionPDF, md_content: str):
    """Parse markdown and render to PDF using custom formatting."""
    if md_content.startswith('---'):
        parts = md_content.split('---', 2)
        if len(parts) >= 3:
            md_content = parts[2].strip()

    lines = md_content.split('\n')
    i = 0
    in_code = False
    code_buffer = []
    first_h1 = True

    while i < len(lines):
        line = lines[i]

        # Code blocks
        if line.strip().startswith('```'):
            if in_code:
                pdf.code_block('\n'.join(code_buffer))
                code_buffer = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_buffer.append(line)
            i += 1
            continue

        # Headers
        if line.startswith('# ') and first_h1:
            pdf.chapter_title(line[2:].strip())
            first_h1 = False
            i += 1
            continue
        elif line.startswith('# '):
            pdf.add_page()
            pdf.chapter_title(line[2:].strip())
            i += 1
            continue
        elif line.startswith('## '):
            pdf.section_title(line[3:].strip())
            i += 1
            continue
        elif line.startswith('### '):
            pdf.sub_title(line[4:].strip())
            i += 1
            continue
        elif line.startswith('#### '):
            pdf.sub_title(line[5:].strip())
            i += 1
            continue

        # Blockquote
        if line.startswith('> '):
            quote_lines = []
            while i < len(lines) and lines[i].startswith('> '):
                quote_lines.append(lines[i][2:])
                i += 1
            pdf.quote_text(' '.join(quote_lines))
            continue

        # Horizontal rule
        if line.strip() in ('---', '***', '___'):
            pdf.ln(3)
            pdf.set_draw_color(226, 232, 240)
            pdf.set_line_width(0.3)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(5)
            i += 1
            continue

        # Bullet points
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            indent = len(line) - len(line.lstrip())
            text = line.strip()[2:]
            text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
            text = re.sub(r'\*(.+?)\*', r'\1', text)
            text = re.sub(r'`(.+?)`', r'\1', text)
            text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
            pdf.bullet(text, indent=min(indent, 8))
            i += 1
            continue

        # Numbered list
        if re.match(r'^\s*\d+\.\s', line):
            text = re.sub(r'^\s*\d+\.\s', '', line)
            text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
            text = re.sub(r'`(.+?)`', r'\1', text)
            text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
            pdf.bullet(text)
            i += 1
            continue

        # Table
        if '|' in line and i + 1 < len(lines) and '---' in lines[i + 1]:
            headers = [c.strip() for c in line.split('|') if c.strip()]
            i += 2
            pdf.set_font('ArialUni', 'B', 9)
            pdf.set_text_color(15, 23, 42)
            pdf.set_fill_color(241, 245, 249)
            header_text = '  |  '.join(headers)
            pdf.multi_cell(0, 5, header_text[:150], new_x="LMARGIN", new_y="NEXT", fill=True)
            pdf.set_font('ArialUni', '', 9)
            pdf.set_text_color(30, 41, 59)
            while i < len(lines) and '|' in lines[i] and lines[i].strip():
                cells = [c.strip() for c in lines[i].split('|') if c.strip()]
                row_text = '  |  '.join(cells)
                row_text = re.sub(r'\*\*(.+?)\*\*', r'\1', row_text)
                row_text = re.sub(r'`(.+?)`', r'\1', row_text)
                pdf.multi_cell(0, 5, row_text[:150], new_x="LMARGIN", new_y="NEXT")
                i += 1
            pdf.ln(3)
            continue

        # Empty line
        if not line.strip():
            pdf.ln(2)
            i += 1
            continue

        # Regular paragraph
        text = line.strip()
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'`(.+?)`', r'\1', text)
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
        if text:
            pdf.body_text(text)
        i += 1


def md_to_pdf(md_path: Path, pdf_path: Path) -> bool:
    """Convert a single markdown file to PDF."""
    try:
        content = md_path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        try:
            content = md_path.read_text(encoding='latin-1')
        except Exception:
            return False

    if not content.strip():
        return False

    rel = md_path.relative_to(TRACKS_DIR)
    folder = str(rel.parent).replace('\\', '/') if str(rel.parent) != '.' else 'root'

    pdf = VisionPDF(title_text=md_path.stem, subtitle_text=folder)
    pdf.add_page()

    try:
        parse_and_render(pdf, content)
        pdf.output(str(pdf_path))
        return True
    except Exception as e:
        print(f"  ERROR: {md_path.name} — {e}")
        return False


def main():
    md_files = sorted(TRACKS_DIR.rglob("*.md"))
    md_files = [f for f in md_files if 'node_modules' not in str(f)
                and f.parent != OUTPUT_DIR
                and f.name != 'convert_to_pdf.py']

    total = len(md_files)
    success = 0
    errors = 0

    print(f"Convertendo {total} file .md in PDF...")
    print(f"Output: {OUTPUT_DIR}")
    print()

    for i, md_path in enumerate(md_files, 1):
        rel = md_path.relative_to(TRACKS_DIR)
        parts = list(rel.parent.parts)
        if parts:
            prefix = '_'.join(parts)
            pdf_name = f"{prefix}_{md_path.stem}.pdf"
        else:
            pdf_name = f"{md_path.stem}.pdf"

        pdf_path = OUTPUT_DIR / pdf_name

        if md_to_pdf(md_path, pdf_path):
            print(f"  [{i}/{total}] OK: {pdf_name}")
            success += 1
        else:
            print(f"  [{i}/{total}] FAIL: {md_path.name}")
            errors += 1

    print()
    print(f"Completato: {success}/{total} OK, {errors} errori.")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
