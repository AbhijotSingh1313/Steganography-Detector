import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.steganalysis.text import (
    analyze_whitespace,
    analyze_word_shift,
    analyze_line_shift,
    get_text_detector,
)

client = TestClient(app)

NORMAL_PROSE = """
The field of digital forensics involves the recovery and investigation of material found in digital devices.
Investigators follow standardized procedures to ensure evidence remains admissible in court proceedings.
Modern forensic laboratories employ advanced hardware and software to examine memory, storage media, and network traffic.
Each artifact is cataloged meticulously with strict chain of custody documentation.
"""

ACCIDENTAL_TRAILING = """
This line has an accidental space at the end. 
This is a standard line with no trailing spaces.
This line has another accidental space. 
Most of the document is clean and ordinary.
"""

STEGO_WHITESPACE = """
Confidential communication requires robust security practices.   \t
Cryptographic algorithms protect confidentiality and data integrity.\t \t
However metadata may still leak critical communication patterns.  \t \nSteganographic techniques embed hidden payloads into overt media.\t\t  
Detection systems analyze statistical deviations to identify tampering.\t   \t
"""

STEGO_WORD_SHIFT = """
Digital  forensics  investigators  analyze   electronic  media   to  identify   evidence.
The  process   of  identifying   steganography   requires   careful   statistical  modeling.
Artificial  spacing   between  words   generates  a   bimodal  gap   distribution.
Normal  prose   rarely  exhibits   such  regular   multi-space  states.
"""


def test_whitespace_normal_prose():
    res = analyze_whitespace(NORMAL_PROSE)
    assert not res["suspicious"]
    assert res["score"] < 0.25
    assert res["features"]["trailing_lines_count"] == 0


def test_whitespace_accidental_filtered():
    res = analyze_whitespace(ACCIDENTAL_TRAILING)
    # Accidental single space on a couple lines should not trigger stego
    assert not res["suspicious"]
    assert res["score"] < 0.30


def test_whitespace_stego_detection():
    res = analyze_whitespace(STEGO_WHITESPACE)
    assert res["suspicious"]
    assert res["score"] >= 0.50
    assert res["features"]["binary_like_sequences"] > 0
    assert res["features"]["whitespace_entropy"] > 0.50


def test_word_shift_normal():
    res = analyze_word_shift(NORMAL_PROSE)
    assert not res["suspicious"]
    assert res["score"] < 0.30


def test_word_shift_stego_detection():
    res = analyze_word_shift(STEGO_WORD_SHIFT)
    assert res["suspicious"]
    assert res["score"] >= 0.50
    assert res["features"]["bimodal_entropy"] > 0.50
    assert len(res["suspicious_locations"]) > 0


def test_line_shift_normal():
    res = analyze_line_shift(NORMAL_PROSE)
    assert not res["suspicious"]
    assert res["features"]["measurement_domain"] == "textual_logical_spacing"


def test_text_empty_and_unicode():
    det = get_text_detector()
    res_empty = det.analyze("")
    assert res_empty["prediction"] == "CLEAN"
    assert res_empty["score"] == 0.0

    unicode_text = "こんにちは世界。这是一个测试。🔒 Digital forensics with unicode accents: é, è, ö, ñ."
    res_uni = det.analyze(unicode_text)
    assert res_uni["prediction"] in ["CLEAN", "SUSPICIOUS"]


def test_text_api_json():
    response = client.post(
        "/api/steganalysis/text",
        json={"text": STEGO_WHITESPACE},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["module"] == "text"
    assert data["prediction"] == "SUSPICIOUS"
    assert data["score"] >= 0.50
    assert "methods" in data
    assert "whitespace" in data["methods"]
    assert len(data["evidence"]) > 0


def test_text_api_file_upload():
    file_bytes = io.BytesIO(STEGO_WORD_SHIFT.encode("utf-8"))
    response = client.post(
        "/api/steganalysis/text",
        files={"file": ("sample.txt", file_bytes, "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["module"] == "text"
    assert data["prediction"] == "SUSPICIOUS"


def test_text_api_empty_error():
    response = client.post(
        "/api/steganalysis/text",
        json={"text": "   "},
    )
    assert response.status_code == 400
def test_bert_linguistic_steganalysis():
    from app.steganalysis.text.bert_steganalysis import analyze_bert_linguistic
    
    clean_prose = "Artificial intelligence and machine learning models are transforming digital forensics."
    res_clean = analyze_bert_linguistic(clean_prose)
    assert res_clean["method"] == "bert_linguistic"
    assert res_clean["features"]["ai_assisted"] is True
    assert res_clean["score"] < 0.40
    
    # Highly perturbed / unnatural synonym replaced steganographic text
    perturbed_text = "Artificially fabricated intellect and apparatus schooling architectures are muting computerized legalities."
    res_perturbed = analyze_bert_linguistic(perturbed_text)
    assert res_perturbed["features"]["mean_token_loss"] > res_clean["features"]["mean_token_loss"]
