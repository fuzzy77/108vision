#!/usr/bin/env python3
"""
Generate the 108 Vision brand assets for the Expo app (aia-app).

Renders the "108" brand mark (Inter ExtraBold + violet underline) from the
108 Vision design system into every icon surface the app references:
  - assets/images/icon.png                     (app icon, 1024 full-bleed dark)
  - assets/images/favicon.png                  (browser tab, 48 rounded)
  - assets/images/splash-icon.png              (splash, transparent mark)
  - assets/images/android-icon-background.png  (adaptive background, dark)
  - assets/images/android-icon-foreground.png  (adaptive foreground, safe zone)
  - assets/images/android-icon-monochrome.png  (adaptive monochrome silhouette)

Brand tokens (from tracks/brand/logo + src/lib/theme.ts):
  ink950      #0F172A
  indigo      #1E1B4B
  primary400  #A78BFA   (underline)
  primary700  #6D28D9   (glow)
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
IMAGES = os.path.normpath(os.path.join(HERE, "..", "assets", "images"))
FONT_DIR = os.path.normpath(
    os.path.join(HERE, "..", "node_modules", "@expo-google-fonts", "inter")
)

INK950 = (15, 23, 42)
INDIGO = (30, 27, 75)
PRIMARY400 = (167, 139, 250)
PRIMARY700 = (109, 40, 217)
WHITE = (255, 255, 255)


def font(size: int, weight: str = "800ExtraBold") -> ImageFont.FreeTypeFont:
    path = os.path.join(FONT_DIR, weight, f"Inter_{weight}.ttf")
    return ImageFont.truetype(path, size)


def mark_bbox(draw: ImageDraw.ImageDraw, size: int) -> tuple:
    """Return (w, h) of the rendered '108' glyphs at the given font size."""
    f = font(size)
    box = draw.textbbox((0, 0), "108", font=f)
    return (box[2] - box[0], box[3] - box[1])


def draw_mark(
    canvas: Image.Image,
    text_color,
    underline_color,
    text_height: float,
    underline_ratio: float = 0.52,
    y_center: float = 0.5,
    show_underline: bool = True,
):
    """Draw '108' centered horizontally with an optional violet underline."""
    draw = ImageDraw.Draw(canvas)
    W, H = canvas.size
    size = int(text_height)
    tw, th = mark_bbox(draw, size)
    while th > text_height and size > 1:
        size -= 1
        tw, th = mark_bbox(draw, size)
    f = font(size)
    tw, th = mark_bbox(draw, size)
    x = (W - tw) / 2
    draw.text((x, H * y_center - th / 2 - th * 0.12), "108", font=f, fill=text_color)

    if show_underline:
        uw = max(8, int(tw * underline_ratio))
        uh = max(2, int(size * 0.075))
        ux = (W - uw) / 2
        uy = H * y_center + th / 2 + int(size * 0.10)
        draw.rounded_rectangle(
            [ux, uy, ux + uw, uy + uh],
            radius=uh // 2,
            fill=underline_color,
        )
    return draw


def vertical_gradient(size: int, top: tuple, bottom: tuple) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = round(top[0] + (bottom[0] - top[0]) * t)
        g = round(top[1] + (bottom[1] - top[1]) * t)
        b = round(top[2] + (bottom[2] - top[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def radial_glow(size: int, color, alpha: int) -> Image.Image:
    glow = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    center = size
    for r in range(size, 0, -1):
        a = int(alpha * (1 - r / size))
        d.ellipse(
            [center - r, center - r, center + r, center + r],
            fill=(*color, a),
        )
    glow = glow.filter(ImageFilter.GaussianBlur(size // 6))
    return glow.resize((size, size), Image.LANCZOS)


def compose_dark_icon(size: int, rounded: bool = False) -> Image.Image:
    base = vertical_gradient(size, INDIGO, INK950)
    glow = radial_glow(size, PRIMARY700, 90)
    base = base.convert("RGBA")
    base.alpha_composite(glow)

    # subtle dot grid, echoing the website hero texture
    d = ImageDraw.Draw(base)
    step = size // 16
    for gx in range(step, size, step):
        for gy in range(step, size, step):
            d.ellipse([gx - 1, gy - 1, gx + 1, gy + 1], fill=(255, 255, 255, 22))

    draw_mark(base, WHITE, PRIMARY400, text_height=size * 0.46)

    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size, size], radius=int(size * 0.22), fill=255
        )
        base.putalpha(mask)

    return base


def save(img: Image.Image, name: str) -> None:
    path = os.path.join(IMAGES, name)
    img.save(path)
    print(f"wrote {path} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    os.makedirs(IMAGES, exist_ok=True)

    save(compose_dark_icon(1024, rounded=False), "icon.png")
    save(compose_dark_icon(48, rounded=True), "favicon.png")

    splash = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw_mark(splash, WHITE, PRIMARY400, text_height=512 * 0.52)
    save(splash, "splash-icon.png")

    bg = vertical_gradient(512, INDIGO, INK950)
    save(bg, "android-icon-background.png")

    fg = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw_mark(fg, WHITE, PRIMARY400, text_height=512 * 0.36)
    save(fg, "android-icon-foreground.png")

    mono = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
    draw_mark(mono, WHITE, WHITE, text_height=432 * 0.42, show_underline=False)
    save(mono, "android-icon-monochrome.png")


if __name__ == "__main__":
    main()
