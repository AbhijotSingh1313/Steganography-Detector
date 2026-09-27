import io
import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import docx

from app.main import app

client = TestClient(app)


def test_unified_analyze_image():
    # Create simple PNG
    img = Image.new("RGB", (32, 32), color=(128, 64, 32))
    bio = io.BytesIO()
    img.save(bio, format="PNG")
    bio.seek(0)

    response = client.post(
        "/api/analyze",
        files={"file": ("test_sample.png", bio.getvalue(), "image/png")},
        data={"domain": "image"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["fileType"] == "IMAGE"
    assert data["result"] in ["Clean", "Stego", "Suspicious"]
    assert "confidence" in data
    assert "findings" in data
    assert "recommendation" in data
    assert "details" in data


def test_unified_analyze_text_txt():
    content = "This is a normal paragraph with standard spacing and zero hidden unicode characters."
    response = client.post(
        "/api/analyze",
        files={"file": ("doc.txt", content.encode("utf-8"), "text/plain")},
        data={"domain": "text"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["fileType"] == "TEXT"
    assert data["result"] == "Clean"
    assert data["riskLevel"] == "Low"


def test_unified_analyze_text_docx():
    doc = docx.Document()
    doc.add_paragraph("Steganography analysis verification in Microsoft Word document format.")
    bio = io.BytesIO()
    doc.save(bio)
    bio.seek(0)

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.docx", bio.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"type": "text"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["fileType"] == "TEXT"
    assert "findings" in data


def test_unified_analyze_pcap():
    from scapy.all import IP, ICMP, wrpcap
    packets = [IP(src="192.168.1.10", dst="192.168.1.1")/ICMP() for _ in range(5)]
    with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as tf:
        temp_path = tf.name
    try:
        wrpcap(temp_path, packets)
        with open(temp_path, "rb") as f:
            pcap_bytes = f.read()

        response = client.post(
            "/api/analyze",
            files={"file": ("traffic.pcap", pcap_bytes, "application/vnd.tcpdump.pcap")},
            data={"domain": "pcap"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["fileType"] == "NETWORK"
        assert "riskLevel" in data
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
