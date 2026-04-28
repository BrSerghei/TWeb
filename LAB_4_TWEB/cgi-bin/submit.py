#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import os
import re
import html
from urllib.parse import parse_qs
from datetime import datetime

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR  = os.path.join(BASE_DIR, 'data')
DATA_FILE = os.path.join(DATA_DIR, 'submissions.txt')

os.makedirs(DATA_DIR, exist_ok=True)

VALID_WEAPONS  = {'knife', 'handgun', 'shotgun', 'smg', 'rocket', 'bowgun'}
VALID_INSTINCT = {'fight', 'stealth', 'run', 'dominate'}
VALID_PRIORITY = {'protect', 'intel', 'survive', 'dominate'}
VALID_GAMES    = {'re1', 're2', 're3', 're4', 're7', 're8'}

NAME_RE     = re.compile(r"^[a-zA-ZÀ-ÿ\s'\-]{2,60}$")
CODENAME_RE = re.compile(r"^[a-zA-Z0-9_\-\s]{2,30}$")
EMAIL_RE    = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def read_post_fields():
    method = os.environ.get('REQUEST_METHOD', 'GET').upper()
    if method != 'POST':
        return {}
    content_length = int(os.environ.get('CONTENT_LENGTH', 0) or 0)
    body = sys.stdin.buffer.read(content_length).decode('utf-8', errors='replace')
    parsed = parse_qs(body, keep_blank_values=True)
    return {k: v[0] if v else '' for k, v in parsed.items()}


def validate(f):
    errors = {}

    name = f.get('name', '').strip()
    if not name:
        errors['name'] = 'Câmp obligatoriu.'
    elif not NAME_RE.match(name):
        errors['name'] = 'Doar litere, spații și cratimă. Minim 2 caractere.'

    codename = f.get('codename', '').strip()
    if not codename:
        errors['codename'] = 'Câmp obligatoriu.'
    elif not CODENAME_RE.match(codename):
        errors['codename'] = 'Doar litere, cifre, _, - și spațiu. Minim 2 caractere.'

    email = f.get('email', '').strip()
    if not email:
        errors['email'] = 'Câmp obligatoriu.'
    elif not EMAIL_RE.match(email):
        errors['email'] = 'Adresă email invalidă.'

    weapon = f.get('weapon', '').strip()
    if not weapon or weapon not in VALID_WEAPONS:
        errors['weapon'] = 'Selectați o armă validă.'

    instinct = f.get('instinct', '').strip()
    if not instinct or instinct not in VALID_INSTINCT:
        errors['instinct'] = 'Selectați un răspuns tactic.'

    priority = f.get('priority', '').strip()
    if not priority or priority not in VALID_PRIORITY:
        errors['priority'] = 'Selectați o prioritate.'

    fav_game = f.get('favGame', '').strip()
    if not fav_game or fav_game not in VALID_GAMES:
        errors['favGame'] = 'Selectați un incident.'

    message = f.get('message', '').strip()
    if len(message) > 800:
        errors['message'] = 'Raportul depășește 800 de caractere.'

    return errors


def match_character(f):
    score = 0
    score += {'knife': -1, 'handgun': 1, 'shotgun': 2,
              'smg': 2, 'rocket': 3, 'bowgun': 0}.get(f.get('weapon', ''), 0)
    score += {'fight': 2, 'stealth': -1, 'run': 0,
              'dominate': 4}.get(f.get('instinct', ''), 0)
    score += {'protect': 1, 'intel': -1, 'survive': 0,
              'dominate': 5}.get(f.get('priority', ''), 0)
    score += {'re1': 0, 're2': 0, 're3': -1,
              're4': 1, 're7': -2, 're8': 0}.get(f.get('favGame', ''), 0)

    CHARS = {
        'wesker': {'name': 'Albert Wesker', 'role': 'Umbrella Corp. — Director / Antagonist',
                   'clearance': 'CLASSIFIED', 'color': '#aaaaaa',
                   'bio': 'You possess extraordinary vision and extraordinary contempt for '
                          'everyone around you. Sunglasses indoors. Prototype virus for '
                          'personal gain. Dangerous. Exceptional. Inevitable.'},
        'chris':  {'name': 'Chris Redfield', 'role': 'S.T.A.R.S. Alpha — Marksman / B.S.A.A.',
                   'clearance': 'ALPHA', 'color': '#4a9fd4',
                   'bio': 'Headstrong, loyal, physically overwhelming. You face threats '
                          'head-on and refuse to leave anyone behind. Boulder optional.'},
        'leon':   {'name': 'Leon S. Kennedy', 'role': 'U.S. Government — Field Operative',
                   'clearance': 'DELTA', 'color': '#6fb56f',
                   'bio': 'Composed under fire, with hair that defies physics. '
                          'You were not prepared — and you survived anyway.'},
        'claire': {'name': 'Claire Redfield', 'role': 'TerraSave — Field Investigator',
                   'clearance': 'GAMMA', 'color': '#d47a40',
                   'bio': 'You rode into danger looking for someone you love. '
                          'Protective, relentless, effective.'},
        'jill':   {'name': 'Jill Valentine', 'role': 'S.T.A.R.S. Alpha — Field Agent / B.S.A.A.',
                   'clearance': 'OMEGA', 'color': '#d465a0',
                   'bio': 'Strategic, resourceful, unbreakable. Master of unlocking. '
                          'Master of survival. Nemesis has tried — and failed.'}
    }

    if score >= 9: return CHARS['wesker']
    if score >= 4: return CHARS['chris']
    if score >= 2: return CHARS['leon']
    if score >= 0: return CHARS['claire']
    return CHARS['jill']


def save_submission(f):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    sep = '─' * 60
    lines = [
        sep,
        f"TIMESTAMP   : {timestamp}",
        f"NAME        : {html.escape(f.get('name', '').strip())}",
        f"CODENAME    : {html.escape(f.get('codename', '').strip())}",
        f"EMAIL       : {html.escape(f.get('email', '').strip())}",
        f"WEAPON      : {f.get('weapon', '').strip()}",
        f"INSTINCT    : {f.get('instinct', '').strip()}",
        f"PRIORITY    : {f.get('priority', '').strip()}",
        f"FAV_GAME    : {f.get('favGame', '').strip()}",
        f"FIELD_REPORT: {html.escape(f.get('message', '').strip() or '—')}",
        sep,
        ""
    ]
    with open(DATA_FILE, 'a', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')


def main():
    sys.stdout.write("Content-Type: application/json; charset=utf-8\r\n")
    sys.stdout.write("Access-Control-Allow-Origin: *\r\n")
    sys.stdout.write("\r\n")
    sys.stdout.flush()

    try:
        fields = read_post_fields()
        errors = validate(fields)

        if errors:
            print(json.dumps({'success': False, 'errors': errors}, ensure_ascii=False))
            return

        save_submission(fields)
        character = match_character(fields)

        response = {
            'success':   True,
            'character': character,
            'codename':  fields.get('codename', '').strip().upper(),
            'message':   fields.get('message', '').strip()
        }
        print(json.dumps(response, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({'success': False, 'errors': {'server': str(e)}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
