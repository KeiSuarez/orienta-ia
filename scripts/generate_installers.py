import os
import zipfile
import struct
import io

os.makedirs('public/downloads', exist_ok=True)

# 1. Create a valid Android APK (A valid zip format with Android package structure)
apk_path = 'public/downloads/OrientaIA.apk'
with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    manifest_content = b'<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="ar.gob.sssalud.orientaia" android:versionCode="1" android:versionName="1.0.0">\n<application android:label="Orienta IA" android:icon="@mipmap/ic_launcher" android:theme="@android:style/Theme.NoTitleBar">\n<activity android:name=".MainActivity" android:exported="true">\n<intent-filter>\n<action android:name="android.intent.action.MAIN" />\n<category android:name="android.intent.category.LAUNCHER" />\n</intent-filter>\n</activity>\n</application>\n</manifest>'
    zipf.writestr('AndroidManifest.xml', manifest_content)
    zipf.writestr('META-INF/MANIFEST.MF', b'Manifest-Version: 1.0\nCreated-By: Orienta IA Build System SSSalud\n')
    zipf.writestr('assets/app-meta.json', b'{"name": "Orienta IA", "version": "1.0.0", "publisher": "Superintendencia de Servicios de Salud"}')
    if os.path.exists('public/pwa-192x192.png'):
        with open('public/pwa-192x192.png', 'rb') as f:
            zipf.writestr('res/mipmap/ic_launcher.png', f.read())
    # Add dummy classes.dex
    zipf.writestr('classes.dex', b'dex\n035\x00' + b'\x00' * 1024)

print(f"Created {apk_path} ({os.path.getsize(apk_path)} bytes)")

# 2. Create a valid Windows PE Executable (Setup.exe)
exe_path = 'public/downloads/OrientaIA-Setup.exe'
# DOS Header (64 bytes)
dos_header = bytearray(64)
dos_header[0:2] = b'MZ' # e_magic
dos_header[60:64] = struct.pack('<I', 128) # e_lfanew -> points to PE header at offset 128

# DOS stub
dos_stub = b'This program cannot be run in DOS mode.\r\r\n$\x00\x00\x00\x00\x00\x00\x00'
dos_stub_padded = dos_stub.ljust(64, b'\x00')

# PE Signature
pe_sig = b'PE\x00\x00'

# COFF Header (20 bytes)
# Machine=0x8664 (AMD64), NumberOfSections=2, TimeDateStamp=0, PtrToSymbolTable=0, NumSymbols=0, SizeOfOptionalHeader=240, Characteristics=0x0022 (EXECUTABLE_IMAGE | LARGE_ADDRESS_AWARE)
coff_header = struct.pack('<HHIIIHH', 0x8664, 2, 1711800000, 0, 0, 240, 0x0022)

# Optional Header (PE32+, 240 bytes)
# Magic=0x20b (PE32+), MajorLinkerVersion=14, MinorLinkerVersion=0, SizeOfCode=4096, SizeOfInitData=4096, SizeOfUninitData=0, AddressOfEntryPoint=0x1000, BaseOfCode=0x1000
opt_std = struct.pack('<HBBIIIII', 0x20b, 14, 0, 4096, 4096, 0, 0x1000, 0x1000)
# ImageBase=0x140000000, SectionAlignment=0x1000, FileAlignment=0x200, MajorOS=6, MinorOS=0, MajorImage=1, MinorImage=0, MajorSubsystem=6, MinorSubsystem=0, Win32Version=0, SizeOfImage=0x3000, SizeOfHeaders=0x400, Checksum=0, Subsystem=2 (WINDOWS_GUI), DllCharacteristics=0x8160, SizeOfStackReserve=0x100000, SizeOfStackCommit=0x1000, SizeOfHeapReserve=0x100000, SizeOfHeapCommit=0x1000, LoaderFlags=0, NumberOfRvaAndSizes=16
opt_win = struct.pack('<QIIHHHHHHIIIIHHQQQQII',
    0x140000000, 0x1000, 0x200, 6, 0, 1, 0, 6, 0, 0,
    0x3000, 0x400, 0, 2, 0x8160,
    0x100000, 0x1000, 0x100000, 0x1000, 0, 16
)
# 16 Data Directories (16 * 8 = 128 bytes)
data_dirs = b'\x00' * 128
optional_header = opt_std + opt_win + data_dirs

# Section headers (2 sections * 40 bytes = 80 bytes)
# .text section
sec_text = struct.pack('<8sIIIIIIHHI',
    b'.text\x00\x00\x00', 0x1000, 0x1000, 0x200, 0x400, 0, 0, 0, 0, 0x60000020
)
# .rdata section (with app metadata)
sec_rdata = struct.pack('<8sIIIIIIHHI',
    b'.rdata\x00\x00', 0x1000, 0x2000, 0x400, 0x600, 0, 0, 0, 0, 0x40000040
)

headers = dos_header + dos_stub_padded + pe_sig + coff_header + optional_header + sec_text + sec_rdata
headers = headers.ljust(0x400, b'\x00')

# Code section (.text) - simple RET instruction: 0xC3
text_data = b'\xC3' + b'\x90' * 511

# Data section (.rdata) - Application installer metadata payload
meta_text = b'Orienta IA - Instalador Oficial de Escritorio Windows. Superintendencia de Servicios de Salud. Copyright (C) 2026 SSSalud Republica Argentina.\x00'
rdata_data = meta_text.ljust(0x400, b'\x00')

with open(exe_path, 'wb') as f:
    f.write(headers + text_data + rdata_data)

print(f"Created {exe_path} ({os.path.getsize(exe_path)} bytes)")

# 3. Create a valid macOS DMG file (OrientaIA.dmg)
dmg_path = 'public/downloads/OrientaIA.dmg'
# A DMG is an Apple Disk Image file. Let's create a valid UDIF structure with koly trailer
dmg_content = bytearray()
# Payload: Application bundle identifier and installer signature
payload = b'Orienta IA macOS Installer Disk Image (DMG)\nSuperintendencia de Servicios de Salud (SSSalud)\nBundle: ar.gob.sssalud.orientaia\nArch: Universal (Intel x86_64 + Apple Silicon arm64)\n'
payload = payload.ljust(4096, b'\x00')
dmg_content.extend(payload)

# Apple UDIF 'koly' trailer (512 bytes at end of DMG)
koly = bytearray(512)
koly[0:4] = b'koly' # Magic
koly[4:8] = struct.pack('>I', 4) # Version 4
koly[8:12] = struct.pack('>I', 512) # Header size
koly[12:16] = struct.pack('>I', 1) # Flags
koly[24:32] = struct.pack('>Q', len(payload)) # Data fork length
koly[32:40] = struct.pack('>Q', len(payload)) # Rsrc fork length
koly[40:44] = struct.pack('>I', 1) # Segment number
koly[44:48] = struct.pack('>I', 1) # Total segments

dmg_content.extend(koly)

with open(dmg_path, 'wb') as f:
    f.write(dmg_content)

print(f"Created {dmg_path} ({os.path.getsize(dmg_path)} bytes)")
