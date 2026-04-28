#!/usr/bin/env python3

import http.server
import os

PORT = 8080

os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs('data', exist_ok=True)

handler = http.server.CGIHTTPRequestHandler
handler.cgi_directories = ['/cgi-bin']

print("=" * 60)
print("  ☣  Umbrella Corp — Server CGI Pornit")
print("=" * 60)
print(f"  URL: http://localhost:{PORT}/pages/page6.html")
print(f"  Date salvate in: data/submissions.txt")
print("  Apasa Ctrl+C pentru a opri serverul.")
print("=" * 60)

with http.server.HTTPServer(('', PORT), handler) as httpd:
    httpd.serve_forever()
