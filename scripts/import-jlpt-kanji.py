#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import JLPT Kanji N5-N1 classifications from trankhoi172/kanjiN5_N1,
normalize simplified Chinese glyphs to standard Japanese Shinjitai,
enrich with readings/meanings/strokes from characters.json and KanjiVG,
and save structured output into data/kanji/jlpt.json.
"""

import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET

SIMPLIFIED_TO_SHINJITAI = {
    '员': '員', '问': '問', '图': '図', '场': '場', '卖': '売',
    '务': '務', '胜': '勝', '单': '単', '报': '報', '论': '論',
    '识': '識', '议': '議', '负': '負', '财': '財', '贫': '貧',
    '责': '責', '费': '費', '资': '資', '赞': '賛',
    '铜': '銅', '锐': '鋭', '录': '録', '门': '門', '陆': '陸',
    '阶': '階', '顺': '順', '预': '預', '领': '領', '额': '額',
    '驻': '駐', '龄': '齢',
    '铅': '鉛', '钵': '鉢', '铳': '銃', '铣': '銑', '铭': '銘',
    '钱': '銭', '铸': '鋳', '钢': '鋼', '锤': '錘', '锭': '錠',
    '锦': '錦', '炼': '錬', '错': '錯', '锻': '鍛', '镰': '鎌',
    '锁': '鎖', '镇': '鎮', '镜': '鏡', '钟': '鐘', '鉴': '鑑',
    '闲': '閑', '阁': '閣', '阀': '閥', '阅': '閲', '阵': '陣',
    '陈': '陳',
}

LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
BASE_RAW_URL = 'https://raw.githubusercontent.com/trankhoi172/kanjiN5_N1/main/data'

def fetch_kanjivg_stroke(char):
    code = f'{ord(char):05x}'
    url = f'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{code}.svg'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            xml_data = resp.read()
        tree = ET.fromstring(xml_data)
        paths = [p.attrib['d'] for p in tree.iter() if p.tag.endswith('path') and 'd' in p.attrib]
        if paths:
            return {'character': char, 'paths': paths, 'sourceCharacter': char}
    except Exception:
        return None
    return None

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    kanji_dir = os.path.join(root_dir, 'data', 'kanji')
    strokes_dir = os.path.join(kanji_dir, 'strokes')
    os.makedirs(strokes_dir, exist_ok=True)

    chars_path = os.path.join(kanji_dir, 'characters.json')
    with open(chars_path, 'r', encoding='utf-8') as f:
        characters = json.load(f)

    print(f"Loaded {len(characters)} characters from {chars_path}")

    by_level = {}
    by_character = {}

    for lvl in LEVELS:
        lvl_upper = lvl.upper()
        url = f'{BASE_RAW_URL}/{lvl}.json'
        print(f"Downloading {lvl_upper} from {url}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            items = json.loads(resp.read().decode('utf-8'))

        level_list = []
        for item in items:
            raw_char = item['kanji']
            char = SIMPLIFIED_TO_SHINJITAI.get(raw_char, raw_char)
            stroke_file = os.path.join(strokes_dir, f'{ord(char):x}.json')

            # If missing stroke file for N5 or N4 (and N3), try downloading from KanjiVG
            if lvl in ['n5', 'n4', 'n3'] and not os.path.exists(stroke_file):
                print(f"  Fetching missing stroke for {char} ({lvl_upper})...")
                stroke_data = fetch_kanjivg_stroke(char)
                if stroke_data:
                    with open(stroke_file, 'w', encoding='utf-8') as sf:
                        json.dump(stroke_data, sf, ensure_ascii=False, separators=(',', ':'))

            has_strokes = os.path.exists(stroke_file)
            c_info = characters.get(char, {})
            c_info['hasStrokes'] = has_strokes
            c_info['jlpt'] = lvl_upper

            kanji_entry = {
                'character': char,
                'level': lvl_upper,
                'strokes': c_info.get('strokes'),
                'vietnameseNames': c_info.get('vietnameseNames', []),
                'readings': c_info.get('readings', []),
                'meanings': c_info.get('meanings', []),
                'radicalId': c_info.get('radicalId'),
                'hasStrokes': has_strokes,
            }

            level_list.append(kanji_entry)
            by_character[char] = {
                'level': lvl_upper,
                'strokes': kanji_entry['strokes'],
                'vietnameseNames': kanji_entry['vietnameseNames'],
                'readings': kanji_entry['readings'],
                'meanings': kanji_entry['meanings'],
                'hasStrokes': has_strokes,
            }

        by_level[lvl_upper] = level_list
        print(f"  Processed {lvl_upper}: {len(level_list)} kanji.")

    # Save jlpt.json
    jlpt_path = os.path.join(kanji_dir, 'jlpt.json')
    jlpt_data = {
        'total': sum(len(v) for v in by_level.values()),
        'byLevel': by_level,
        'byCharacter': by_character,
    }
    with open(jlpt_path, 'w', encoding='utf-8') as f:
        json.dump(jlpt_data, f, ensure_ascii=False, indent=2)
    print(f"Saved {jlpt_data['total']} JLPT kanji to {jlpt_path}")

    # Also update characters.json with jlpt property and updated hasStrokes
    with open(chars_path, 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, separators=(',', ':'))
    print(f"Updated characters.json with JLPT mappings.")

if __name__ == '__main__':
    main()
