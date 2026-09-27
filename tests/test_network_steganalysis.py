import io
import os
import tempfile
import pytest
from scapy.all import IP, TCP, ICMP, Raw, wrpcap
from fastapi.testclient import TestClient

from app.main import app
from app.steganalysis.network import analyze_icmp_pcap, get_network_detector

client = TestClient(app)


@pytest.fixture
def normal_icmp_pcap_bytes():
    """Synthetic normal ping PCAP."""
    pkts = [
        IP(src="192.168.1.10", dst="8.8.8.8") / ICMP(type=8, seq=i, id=100) / Raw(load=b"abcdefghijklmnopqrstuvwabcdefghi")
        for i in range(10)
    ]
    with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as f:
        tpath = f.name
    wrpcap(tpath, pkts)
    with open(tpath, "rb") as f:
        data = f.read()
    os.remove(tpath)
    return data


@pytest.fixture
def covert_icmp_pcap_bytes():
    """Synthetic covert channel ICMP PCAP with high entropy payload and rigid timing."""
    pkts = []
    for i in range(15):
        p = IP(src="10.0.0.5", dst="198.51.100.2") / ICMP(type=8, seq=i, id=999) / Raw(load=os.urandom(256))
        p.time = 500.0 + i * 1.000
        pkts.append(p)

    with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as f:
        tpath = f.name
    wrpcap(tpath, pkts)
    with open(tpath, "rb") as f:
        data = f.read()
    os.remove(tpath)
    return data


@pytest.fixture
def non_icmp_pcap_bytes():
    """PCAP containing only TCP traffic."""
    pkts = [
        IP(src="192.168.1.5", dst="1.1.1.1") / TCP(sport=12345, dport=80, flags="S")
        for _ in range(5)
    ]
    with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as f:
        tpath = f.name
    wrpcap(tpath, pkts)
    with open(tpath, "rb") as f:
        data = f.read()
    os.remove(tpath)
    return data


def test_icmp_analysis_normal(normal_icmp_pcap_bytes):
    res = analyze_icmp_pcap(normal_icmp_pcap_bytes)
    assert res["prediction"] == "NORMAL"
    assert res["score"] < 0.35
    assert res["icmp_packets_count"] == 10
    assert res["features"]["standard_os_payload_ratio"] >= 0.80


def test_icmp_analysis_covert(covert_icmp_pcap_bytes):
    res = analyze_icmp_pcap(covert_icmp_pcap_bytes)
    assert res["prediction"] == "SUSPICIOUS"
    assert res["score"] >= 0.65
    assert res["features"]["avg_payload_entropy"] >= 6.0
    assert res["features"]["avg_payload_size"] >= 200
    assert len(res["evidence"]) >= 2


def test_icmp_analysis_non_icmp(non_icmp_pcap_bytes):
    res = analyze_icmp_pcap(non_icmp_pcap_bytes)
    assert res["prediction"] == "NORMAL"
    assert res["icmp_packets_count"] == 0
    assert "No ICMP traffic" in res["evidence"][0]


def test_network_api_upload_success(covert_icmp_pcap_bytes):
    response = client.post(
        "/api/steganalysis/network",
        files={"file": ("capture.pcap", io.BytesIO(covert_icmp_pcap_bytes), "application/vnd.tcpdump.pcap")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["module"] == "network"
    assert data["protocol"] == "ICMP"
    assert data["prediction"] == "SUSPICIOUS"
    assert data["total_packets"] == 15
    assert len(data["evidence"]) > 0


def test_network_api_invalid_extension():
    response = client.post(
        "/api/steganalysis/network",
        files={"file": ("capture.txt", io.BytesIO(b"some text"), "text/plain")},
    )
    assert response.status_code == 400


def test_network_api_empty_file():
    response = client.post(
        "/api/steganalysis/network",
        files={"file": ("empty.pcap", io.BytesIO(b""), "application/octet-stream")},
    )
    assert response.status_code == 400