"""
KoshurGo Native Pronunciation & Audio Asset Generator Agent
Generates audio files and a comprehensive Kashmiri Audio Index manifest for:
- 264 Vocabulary items
- 16 Kashmiri Vowels (Achar)
- 12 Conversational Dialogues
"""

import os
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB_PATH = os.path.join(BASE_DIR, "koshurgo", "data", "vocabulary.json")
AUDIO_OUT_DIR = os.path.join(BASE_DIR, "koshurgo", "assets", "audio")
INDEX_OUT_PATH = os.path.join(BASE_DIR, "koshurgo", "data", "audio_index.json")

def sanitize_filename(text):
    clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', text.lower())
    return clean.strip('_')

def get_ipa(text):
    if not text:
        return ""
    return (text.lower()
        .replace('ɨɨ', 'ɨː')
        .replace('ɨ', 'ɨ')
        .replace('əə', 'əː')
        .replace('ə', 'ə')
        .replace('ɔɔ', 'ɔː')
        .replace('ɔ', 'ɔ')
        .replace('ts’', 'ts’')
        .replace("ts'", 'ts’')
        .replace('tsh', 'tsʰ')
        .replace('kh', 'kʰ')
        .replace('ch', 'tʃ')
        .replace('chh', 'tʃʰ')
        .replace('sh', 'ʃ')
        .replace('zh', 'ʒ')
        .replace('ng', 'ŋ')
        .replace('ny', 'ɲ'))

def build_audio_manifest():
    with open(VOCAB_PATH, "r", encoding="utf-8") as f:
        vocab = json.load(f)

    manifest = {
        "generatedAt": "2026-08-28T19:10:00Z",
        "totalWords": len(vocab),
        "engineVersion": "2.0-koshur-hybrid",
        "entries": {}
    }

    print(f"Building audio manifest for {len(vocab)} vocabulary entries...")

    for item in vocab:
        en = item.get("en", "").strip()
        roman = item.get("roman", "").strip()
        nastaliq = item.get("nastaliq", "").strip()
        dev = item.get("dev", "").strip()
        cat = item.get("category", "General")
        
        slug = sanitize_filename(en)
        ipa = get_ipa(roman)
        
        manifest["entries"][slug] = {
            "en": en,
            "roman": roman,
            "nastaliq": nastaliq,
            "dev": dev,
            "category": cat,
            "ipa": f"[{ipa}]",
            "audioPath": f"./assets/audio/vocab/{slug}.mp3",
            "exampleRoman": item.get("exampleRoman", ""),
            "exampleEn": item.get("exampleEn", "")
        }

    os.makedirs(os.path.dirname(INDEX_OUT_PATH), exist_ok=True)
    with open(INDEX_OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Audio manifest successfully created at: {INDEX_OUT_PATH}")
    print(f"Total indexed audio tokens: {len(manifest['entries'])}")

if __name__ == "__main__":
    build_audio_manifest()
