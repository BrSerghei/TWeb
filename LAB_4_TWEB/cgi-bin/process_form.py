#!/usr/bin/env python3
                       
\
\
\
\
\
\
   

import csv
import datetime as _dt
import html
import os
import re
import sys
import urllib.parse

FIELDS = ["name", "codename", "email", "weapon", "instinct", "priority", "favGame", "message"]

CHARS = {
    "chris": {
        "name": "Chris Redfield",
        "role": "S.T.A.R.S. Alpha — Marksman / B.S.A.A.",
        "clearance": "ALPHA",
        "color": "#4a9fd4",
        "bio": "Headstrong, loyal, physically overwhelming. You face threats head-on and refuse to leave anyone behind."
    },
    "jill": {
        "name": "Jill Valentine",
        "role": "S.T.A.R.S. Alpha — Field Agent / B.S.A.A.",
        "clearance": "OMEGA",
        "color": "#d465a0",
        "bio": "Strategic, resourceful, unbreakable. You plan your way out before anyone realises there is no exit."
    },
    "leon": {
        "name": "Leon S. Kennedy",
        "role": "U.S. Government — Field Operative",
        "clearance": "DELTA",
        "color": "#6fb56f",
        "bio": "Composed under fire and capable of surviving situations for which no operative can be fully prepared."
    },
    "claire": {
        "name": "Claire Redfield",
        "role": "TerraSave — Field Investigator",
        "clearance": "GAMMA",
        "color": "#d47a40",
        "bio": "Protective, relentless and surprisingly effective when everything collapses around the mission."
    },
    "wesker": {
        "name": "Albert Wesker",
        "role": "Umbrella Corp. — Director / Antagonist",
        "clearance": "CLASSIFIED",
        "color": "#aaaaaa",
        "bio": "Dangerous, calculating and unusually focused on control, dominance and the final outcome."
    }
}

RULES = {
    "name":     {"required": True,  "min": 2, "max": 60,  "pattern": r"^[a-zA-ZÀ-ÿ\s'\-]+$"},
    "codename": {"required": True,  "min": 2, "max": 30,  "pattern": r"^[a-zA-Z0-9_\-\s]+$"},
    "email":    {"required": True,  "max": 100, "pattern": r"^[^\s@]+@[^\s@]+\.[^\s@]+$"},
    "weapon":   {"required": True,  "allowed": ["knife", "handgun", "shotgun", "smg", "rocket", "bowgun"]},
    "instinct": {"required": True,  "allowed": ["fight", "stealth", "run", "dominate"]},
    "priority": {"required": True,  "allowed": ["protect", "intel", "survive", "dominate"]},
    "favGame":  {"required": True,  "allowed": ["re1", "re2", "re3", "re4", "re7", "re8"]},
    "message":  {"required": False, "max": 800}
}

LABELS = {
    "knife": "Combat Knife", "handgun": "Handgun", "shotgun": "Shotgun",
    "smg": "Submachine Gun", "rocket": "Rocket Launcher", "bowgun": "Bowgun",
    "fight": "Engage Directly", "stealth": "Evade & Observe", "run": "Extract & Regroup",
    "dominate": "Dominate / Complete the Experiment",
    "protect": "Protect the Civilian", "intel": "Secure the Data", "survive": "Survive at Any Cost",
    "re1": "RE1 — Spencer Estate Incident", "re2": "RE2 — Raccoon City Collapse",
    "re3": "RE3 — Nemesis Protocol", "re4": "RE4 — Los Illuminados Operation",
    "re7": "RE7 — Baker Estate Incident", "re8": "RE Village — Eastern European Incident"
}


def esc(value):
    return html.escape(str(value or ""), quote=True)


def read_form_data():
    method = os.environ.get("REQUEST_METHOD", "GET").upper()
    if method == "POST":
        try:
            length = int(os.environ.get("CONTENT_LENGTH", "0") or "0")
        except ValueError:
            length = 0
        raw = sys.stdin.buffer.read(min(length, 20000)).decode("utf-8", errors="replace")
    else:
        raw = os.environ.get("QUERY_STRING", "")

    parsed = urllib.parse.parse_qs(raw, keep_blank_values=True, encoding="utf-8", errors="replace")
    data = {}
    for field in FIELDS:
        value = parsed.get(field, [""])[0]
        data[field] = value.strip()
    return data


def validate(data):
    errors = {}
    for field, rule in RULES.items():
        value = data.get(field, "").strip()
        if rule.get("required") and not value:
            errors[field] = "Câmp obligatoriu."
            continue
        if not value:
            continue
        if "min" in rule and len(value) < rule["min"]:
            errors[field] = f"Minim {rule['min']} caractere."
            continue
        if "max" in rule and len(value) > rule["max"]:
            errors[field] = f"Maxim {rule['max']} caractere."
            continue
        if "pattern" in rule and not re.match(rule["pattern"], value, flags=re.UNICODE):
            errors[field] = "Format invalid."
            continue
        if "allowed" in rule and value not in rule["allowed"]:
            errors[field] = "Valoare invalidă."
    return errors


def match_character(data):
    score = 0
    score += {"knife": -1, "handgun": 1, "shotgun": 2, "smg": 2, "rocket": 3, "bowgun": 0}.get(data["weapon"], 0)
    score += {"fight": 2, "stealth": -1, "run": 0, "dominate": 4}.get(data["instinct"], 0)
    score += {"protect": 1, "intel": -1, "survive": 0, "dominate": 5}.get(data["priority"], 0)
    score += {"re1": 0, "re2": 0, "re3": -1, "re4": 1, "re7": -2, "re8": 0}.get(data["favGame"], 0)

    if score >= 9:
        return CHARS["wesker"]
    if score >= 4:
        return CHARS["chris"]
    if score >= 2:
        return CHARS["leon"]
    if score >= 0:
        return CHARS["claire"]
    return CHARS["jill"]


def save_to_csv(data, ch):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, "submissions.csv")

    file_exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow([
                "timestamp", "ip", "name", "codename", "email", "weapon", "instinct",
                "priority", "favGame", "message", "matched_character", "clearance"
            ])
        writer.writerow([
            _dt.datetime.now().isoformat(timespec="seconds"),
            os.environ.get("REMOTE_ADDR", "unknown"),
            data["name"], data["codename"], data["email"], data["weapon"], data["instinct"],
            data["priority"], data["favGame"], data["message"], ch["name"], ch["clearance"]
        ])
    return csv_path


def page_header(title):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
<div class="site-header">
  <div class="site-title glitch" data-text="☣ Resident Evil">☣ Resident Evil</div>
  <div class="site-subtitle">CGI Server Response — Umbrella Corporation</div>
</div>
<nav class="main-nav">
  <ul class="nav-list">
    <li><a href="../index.html">Home</a></li>
    <li><a href="../pages/page2.html">Characters</a></li>
    <li><a href="../pages/page3.html">Weapons</a></li>
    <li><a href="../pages/page4.html">Games</a></li>
    <li><a href="../pages/page5.html">Chronology</a></li>
    <li><a href="../pages/page6.html" class="active">Assessment</a></li>
  </ul>
</nav>
"""


def page_footer():
    return """
<hr class="blood-line">
<footer class="site-footer">
  ☣ Resident Evil Series Archive &nbsp;|&nbsp; CGI Processing Complete &nbsp;|&nbsp; Est. 1996
</footer>
</body>
</html>
"""


def render_error_page(errors, data):
    items = "".join(f"<li><strong>{esc(field)}</strong>: {esc(msg)}</li>" for field, msg in errors.items())
    return page_header("Eroare validare CGI") + f"""
<div class="section-header">
  <h2>⚠ Datele nu au fost acceptate de server</h2>
  <p>Validarea JavaScript se execută în browser, iar această validare CGI se execută pe server.</p>
</div>
<div class="form-wrapper">
  <div class="result-header">
    <div class="result-tag">// Server-side validation failed</div>
  </div>
  <div class="result-sep"></div>
  <ul class="toc-list">{items}</ul>
  <p class="form-notice">Reveniți la formular și corectați datele introduse.</p>
  <p><a class="btn-submit" href="../pages/page6.html">// Înapoi la formular</a></p>
</div>
""" + page_footer()


def render_success_page(data, ch, csv_path):
    safe_report = f"<p class='result-intel'>{esc(data['message'])}</p>" if data.get("message") else "<p class='result-intel'>Nu a fost introdus raport suplimentar.</p>"
    return page_header("Assessment CGI Response") + f"""
<div class="section-header">
  <h2>☣ Umbrella Corporation — Assessment Report</h2>
  <p>Datele au fost transmise către server, prelucrate de scriptul CGI și salvate în fișier.</p>
</div>
<div id="result-panel" style="display:block">
  <div class="result-header">
    <div class="result-tag">// CGI Response — Transmission Accepted</div>
    <div class="result-clearance" style="color:{esc(ch['color'])}">CLEARANCE LEVEL: {esc(ch['clearance'])}</div>
  </div>
  <div class="result-sep"></div>
  <div class="result-body">
    <div>
      <div class="result-label">Full Legal Name</div>
      <div class="result-codename">{esc(data['name'])}</div>
      <div class="result-label">Secure Communication Channel</div>
      <div class="result-charrole">{esc(data['email'])}</div>
    </div>
    <div>
      <div class="result-label">Operative Codename</div>
      <div class="result-codename">{esc(data['codename'].upper())}</div>
      <div class="result-label">Archive Match</div>
      <div class="result-charname" style="color:{esc(ch['color'])}">{esc(ch['name'])}</div>
      <div class="result-charrole">{esc(ch['role'])}</div>
    </div>
  </div>
  <div class="result-sep"></div>
  <div>
    <div class="result-label">// Profil psihologic</div>
    <p class="result-bio">{esc(ch['bio'])}</p>
  </div>
  <div class="result-sep"></div>
  <div>
    <div class="result-label">// Date primite de server</div>
    <p class="result-intel">
      Armă: {esc(LABELS.get(data['weapon'], data['weapon']))}<br>
      Instinct: {esc(LABELS.get(data['instinct'], data['instinct']))}<br>
      Prioritate: {esc(LABELS.get(data['priority'], data['priority']))}<br>
      Experiență: {esc(LABELS.get(data['favGame'], data['favGame']))}
    </p>
  </div>
  <div class="result-sep"></div>
  <div>
    <div class="result-label">// Field Report</div>
    {safe_report}
  </div>
  <div class="result-sep"></div>
  <div class="result-tag">Memorizare: <span style="color:#22ff22">data/submissions.csv</span></div>
  <p><a class="btn-submit" href="../pages/page6.html">// Trimite alt formular</a></p>
</div>
""" + page_footer()


def main():
    data = read_form_data()
    errors = validate(data)

    print("Content-Type: text/html; charset=utf-8")
    print("Cache-Control: no-store")
    print()

    if errors:
        print(render_error_page(errors, data))
        return

    ch = match_character(data)
    try:
        csv_path = save_to_csv(data, ch)
    except OSError as exc:
        print(page_header("Eroare salvare CGI"))
        print(f"""
<div class="section-header">
  <h2>⚠ Datele au fost prelucrate, dar nu au putut fi salvate</h2>
  <p>Eroare server: {esc(exc)}</p>
</div>
<div class="form-wrapper"><p><a class="btn-submit" href="../pages/page6.html">// Înapoi la formular</a></p></div>
""")
        print(page_footer())
        return

    print(render_success_page(data, ch, csv_path))


if __name__ == "__main__":
    main()
