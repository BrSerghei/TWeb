#!/usr/bin/env python3

import html
import urllib.parse
import sys

FIELDS = ["name", "codename", "email", "weapon", "instinct", "priority", "favGame", "message"]

raw = sys.stdin.read()
data = urllib.parse.parse_qs(raw, keep_blank_values=True)

def value(name):
    return html.escape(data.get(name, [""])[0])

print("Content-Type: text/html; charset=utf-8")
print()
print("""<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<title>Umbrella Assessment — Server Receipt</title>
<link rel='stylesheet' href='../style.css'>
</head>
<body>
<div class='site-header'>
  <div class='site-title'>☣ Resident Evil</div>
  <div class='site-subtitle'>Server Receipt</div>
</div>
<div class='section-header'>
  <h2>☣ Assessment received</h2>
  <p>Client-side AJAX validation has already displayed the main result. This page is a CGI fallback receipt.</p>
</div>
<div class='form-wrapper'><div class='toc'><div class='toc-title'>// Submitted fields</div><ul class='toc-list'>""")
for field in FIELDS:
    print(f"<li><strong>{html.escape(field)}</strong>: {value(field)}</li>")
print("""</ul></div><p><a class='btn-explore' href='../pages/page6.html'>↳ Back to Assessment</a></p></div>
<footer class='site-footer'>☣ Resident Evil Series Archive | Umbrella Corporation Is Watching</footer>
</body></html>""")
