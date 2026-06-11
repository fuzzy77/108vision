"""
Generate 108 Vision logo as PNG for use in DOCX files.
Creates a clean brand mark (108 in white on dark bg with violet accent).
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from PIL import Image, ImageDraw, ImageFont

# Dimensions
W, H = 220, 140
RADIUS = 24

# Colors
BG_COLOR = (15, 23, 42)       # slate-900
VIOLET = (167, 139, 250)      # violet-400
WHITE = (255, 255, 255)

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Rounded rectangle background
draw.rounded_rectangle([(0, 0), (W-1, H-1)], radius=RADIUS, fill=BG_COLOR)

# Text "108"
try:
    font = ImageFont.truetype("arial.ttf", 72)
except:
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
    except:
        font = ImageFont.load_default()

bbox = draw.textbbox((0, 0), "108", font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (W - tw) // 2
ty = (H - th) // 2 - 10

draw.text((tx, ty), "108", fill=WHITE, font=font)

# Violet accent bar under text
bar_y = ty + th + 8
bar_w = 64
bar_x = (W - bar_w) // 2
draw.rounded_rectangle([(bar_x, bar_y), (bar_x + bar_w, bar_y + 6)], radius=3, fill=VIOLET)

# Save
output = r'c:\Code\Documents\Lavoro\Personale\Vision\tracks\Curriculum\logo-108-mark.png'
img.save(output, 'PNG')
print(f'Logo saved: {output}')

# Also create a wider version with "VISION" text
W2, H2 = 500, 100
img2 = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
draw2 = ImageDraw.Draw(img2)

# Mark box
mark_w, mark_h = 130, 80
mark_x, mark_y = 10, 10
draw2.rounded_rectangle([(mark_x, mark_y), (mark_x + mark_w, mark_y + mark_h)], radius=16, fill=BG_COLOR)

try:
    font_mark = ImageFont.truetype("arial.ttf", 48)
    font_vision = ImageFont.truetype("arial.ttf", 40)
    font_sub = ImageFont.truetype("arial.ttf", 11)
except:
    font_mark = font_vision = font_sub = ImageFont.load_default()

# "108" in mark
bbox_m = draw2.textbbox((0,0), "108", font=font_mark)
mw = bbox_m[2] - bbox_m[0]
draw2.text((mark_x + (mark_w - mw)//2, mark_y + 12), "108", fill=WHITE, font=font_mark)

# Violet bar in mark
draw2.rounded_rectangle([(mark_x + 30, mark_y + 64), (mark_x + 70, mark_y + 68)], radius=2, fill=VIOLET)

# "VISION" text
draw2.text((mark_x + mark_w + 20, 22), "VISION", fill=BG_COLOR, font=font_vision)
draw2.text((mark_x + mark_w + 20, 68), "ARCHITETTURA DI DECISIONI", fill=(109, 40, 217), font=font_sub)

output2 = r'c:\Code\Documents\Lavoro\Personale\Vision\tracks\Curriculum\logo-108-vision.png'
img2.save(output2, 'PNG')
print(f'Full logo saved: {output2}')
