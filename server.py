#!/usr/bin/env python3
"""
Secure Static Web Server for KompresMiniMax
Provides HTTP security headers: CSP, HSTS ready, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SecureHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # 1. Anti MIME Sniffing
        self.send_header('X-Content-Type-Options', 'nosniff')
        # 2. Clickjacking Defense
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        # 3. Cross-Site Scripting Filter
        self.send_header('X-XSS-Protection', '1; mode=block')
        # 4. Strict Referrer Policy
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        # 5. Device Permissions Restriction (Kamera diizinkan untuk fitur scan dokumen)
        self.send_header('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
        # 6. Content Security Policy (Mengizinkan asset CDN esensial & inline worker)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; "
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self' blob:; "
            "worker-src 'self' blob: https://cdnjs.cloudflare.com;"
        )
        self.send_header('Content-Security-Policy', csp)
        super().end_headers()

if __name__ == '__main__':
    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, SecureHandler)
    print(f"[*] KompresMiniMax Secure Server aktif di port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server dimatikan.")
        httpd.server_close()
