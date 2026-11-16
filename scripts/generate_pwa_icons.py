import struct
import zlib
import math
import os

def create_png(width, height, get_pixel_fn, supersample=2):
    """
    Renders an image of size (width, height) using super-sampling for anti-aliased geometry.
    get_pixel_fn(x, y) receives float coordinates in range [0, width] and [0, height],
    and returns (r, g, b, a) where each is 0-255.
    """
    raw_rows = []
    inv_ss2 = 1.0 / (supersample * supersample)
    step = 1.0 / supersample
    start_offset = 0.5 * step

    for y in range(height):
        row = bytearray([0]) # filter type 0: None
        for x in range(width):
            total_r = 0.0
            total_g = 0.0
            total_b = 0.0
            total_a = 0.0
            
            for sy in range(supersample):
                py = y + start_offset + sy * step
                for sx in range(supersample):
                    px = x + start_offset + sx * step
                    r, g, b, a = get_pixel_fn(px, py)
                    total_r += r
                    total_g += g
                    total_b += b
                    total_a += a
            
            row.extend([
                int(round(total_r * inv_ss2)),
                int(round(total_g * inv_ss2)),
                int(round(total_b * inv_ss2)),
                int(round(total_a * inv_ss2))
            ])
        raw_rows.append(bytes(row))
    
    raw_data = b"".join(raw_rows)
    compressed = zlib.compress(raw_data, level=9)
    
    # Construct PNG file
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    
    # IHDR
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack(">I", 13))
    png.extend(b"IHDR")
    png.extend(ihdr)
    png.extend(struct.pack(">I", zlib.crc32(b"IHDR" + ihdr) & 0xffffffff))
    
    # IDAT
    png.extend(struct.pack(">I", len(compressed)))
    png.extend(b"IDAT")
    png.extend(compressed)
    png.extend(struct.pack(">I", zlib.crc32(b"IDAT" + compressed) & 0xffffffff))
    
    # IEND
    png.extend(struct.pack(">I", 0))
    png.extend(b"IEND")
    png.extend(struct.pack(">I", zlib.crc32(b"IEND") & 0xffffffff))
    
    return bytes(png)

# Official Orienta IA color palette
COLOR_NAVY = (11, 25, 44, 255)       # #0B192C
COLOR_BLUE = (43, 130, 201, 255)     # #2B82C9
COLOR_WHITE = (255, 255, 255, 255)   # #FFFFFF
COLOR_GOLD = (245, 190, 60, 255)     # #F5BE3C
COLOR_TRANSPARENT = (0, 0, 0, 0)

def point_in_triangle(px, py, x1, y1, x2, y2, x3, y3):
    # Barycentric technique
    d = (y2 - y3)*(x1 - x3) + (x3 - x2)*(y1 - y3)
    if abs(d) < 1e-6:
        return False
    a = ((y2 - y3)*(px - x3) + (x3 - x2)*(py - y3)) / d
    b = ((y3 - y1)*(px - x3) + (x1 - x3)*(py - y3)) / d
    c = 1.0 - a - b
    return (a >= 0.0) and (b >= 0.0) and (c >= 0.0)

def point_in_rounded_rect(px, py, x, y, w, h, r):
    if px < x or px > x + w or py < y or py > y + h:
        return False
    # Check 4 corners
    if px < x + r and py < y + r:
        return (px - (x + r))**2 + (py - (y + r))**2 <= r**2
    if px > x + w - r and py < y + r:
        return (px - (x + w - r))**2 + (py - (y + r))**2 <= r**2
    if px < x + r and py > y + h - r:
        return (px - (x + r))**2 + (py - (y + h - r))**2 <= r**2
    if px > x + w - r and py > y + h - r:
        return (px - (x + w - r))**2 + (py - (y + h - r))**2 <= r**2
    return True

def render_orienta_icon(size, is_maskable=False, is_rounded=True):
    """
    Renders the official Orienta IA logo:
    - Dark navy canvas (#0B192C)
    - White orbital arch on the left
    - Main cyan/celeste circle (#2B82C9)
    - Inner dark navy circle (#0B192C)
    - Left white compass arrow
    - Right white compass arrow
    - Central gold pivot dot (#F5BE3C) with white stroke
    """
    scale = size / 512.0
    
    # Safe zone scaling for maskable icons (must fit within central 80% circle)
    factor = 0.72 if is_maskable else 0.88
    
    cx = size / 2.0
    cy = size / 2.0
    
    # Sizing parameters relative to 512
    # In base 512, center of "O" is at cx + 8*scale
    center_x = cx + (6 * scale * factor)
    center_y = cy
    
    # Dimensions scaled
    r_arc = 160 * scale * factor
    stroke_arc_half = 17 * scale * factor
    
    r_blue = 120 * scale * factor
    r_inner = 76 * scale * factor
    
    arrow_len = 46 * scale * factor
    arrow_half_h = 32 * scale * factor
    
    r_gold = 22 * scale * factor
    r_gold_stroke = 26 * scale * factor
    
    corner_r = 0 if is_maskable else (112 * scale if is_rounded else 0)
    
    def pixel_fn(px, py):
        # 1. Background boundary
        if not is_maskable and corner_r > 0:
            if not point_in_rounded_rect(px, py, 0, 0, size, size, corner_r):
                return COLOR_TRANSPARENT
        
        # Color starts as Navy background
        # Distance to center of compass
        dx = px - center_x
        dy = py - center_y
        dist = math.hypot(dx, dy)
        
        # Check central elements from top to bottom:
        # A. Gold pivot dot
        if dist <= r_gold:
            return COLOR_GOLD
        # Gold white ring
        if dist <= r_gold_stroke:
            return COLOR_WHITE
            
        # B. Arrow needles (inside inner circle)
        # Left arrow: tip at -70, base at -24
        # Points: tip=(-70, 0), top=(-24, -30), bottom=(-24, +30)
        tip_lx = center_x - (70 * scale * factor)
        base_lx = center_x - (26 * scale * factor)
        if point_in_triangle(px, py, tip_lx, center_y, base_lx, center_y - arrow_half_h, base_lx, center_y + arrow_half_h):
            return COLOR_WHITE
            
        # Right arrow: tip at +70, base at +24
        tip_rx = center_x + (70 * scale * factor)
        base_rx = center_x + (26 * scale * factor)
        if point_in_triangle(px, py, tip_rx, center_y, base_rx, center_y - arrow_half_h, base_rx, center_y + arrow_half_h):
            return COLOR_WHITE
            
        # C. Inner dark circle
        if dist <= r_inner:
            return COLOR_NAVY
            
        # D. Celeste "O" body
        if dist <= r_blue:
            return COLOR_BLUE
            
        # E. Outer white orbital arc
        # Arc is on the left half (px <= center_x + stroke_arc_half)
        # and has radius ~ r_arc with thickness
        arc_dist = math.hypot(px - center_x, py - center_y)
        if px <= center_x + (2 * scale * factor) and abs(arc_dist - r_arc) <= stroke_arc_half:
            return COLOR_WHITE
            
        return COLOR_NAVY

    return create_png(size, height=size, get_pixel_fn=pixel_fn, supersample=2)

def generate_ico(png_images):
    """
    Creates a multi-resolution .ico file from a list of (width, height, png_bytes).
    """
    num_images = len(png_images)
    header = struct.pack("<HHH", 0, 1, num_images) # Type 1 = ICON
    
    entries = []
    image_data_offset = 6 + 16 * num_images
    data_blobs = []
    
    for w, h, data in png_images:
        size_bytes = len(data)
        b_width = 0 if w >= 256 else w
        b_height = 0 if h >= 256 else h
        entry = struct.pack("<BBBBHHII", b_width, b_height, 0, 0, 1, 32, size_bytes, image_data_offset)
        entries.append(entry)
        data_blobs.append(data)
        image_data_offset += size_bytes
        
    return header + b"".join(entries) + b"".join(data_blobs)

def main():
    os.makedirs("public", exist_ok=True)
    
    print("Generating pwa-192x192.png...")
    png_192 = render_orienta_icon(192, is_maskable=False, is_rounded=True)
    with open("public/pwa-192x192.png", "wb") as f:
        f.write(png_192)
        
    print("Generating pwa-512x512.png...")
    png_512 = render_orienta_icon(512, is_maskable=False, is_rounded=True)
    with open("public/pwa-512x512.png", "wb") as f:
        f.write(png_512)
        
    print("Generating pwa-maskable-512x512.png (with Android adaptive icon safe zone)...")
    png_maskable = render_orienta_icon(512, is_maskable=True, is_rounded=False)
    with open("public/pwa-maskable-512x512.png", "wb") as f:
        f.write(png_maskable)
        
    print("Generating apple-touch-icon.png (180x180)...")
    png_apple = render_orienta_icon(180, is_maskable=False, is_rounded=False) # iOS clips icons automatically
    with open("public/apple-touch-icon.png", "wb") as f:
        f.write(png_apple)
        
    print("Generating favicon.ico (16, 32, 48)...")
    ico_16 = render_orienta_icon(16, is_maskable=False, is_rounded=True)
    ico_32 = render_orienta_icon(32, is_maskable=False, is_rounded=True)
    ico_48 = render_orienta_icon(48, is_maskable=False, is_rounded=True)
    ico_data = generate_ico([(16, 16, ico_16), (32, 32, ico_32), (48, 48, ico_48)])
    with open("public/favicon.ico", "wb") as f:
        f.write(ico_data)
        
    print("All PWA icons successfully generated!")

if __name__ == "__main__":
    main()
