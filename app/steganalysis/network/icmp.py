"""
ICMP Steganalysis Engine (Defensive & Offline Only)
==================================================
Parses packet capture files (PCAP / PCAPNG) to detect ICMP-based covert channels
and steganography, inspecting packet structure, payload entropy, flow periodicity,
and standard OS ping signature divergence.

STRICT SAFETY NOTICE:
This module is strictly DEFENSIVE and ANALYTICAL. It performs offline inspection
of existing PCAP files only. It does not transmit, inject, or forge network packets.
"""

from typing import Dict, Any, List, Optional, Tuple
import io
import os
import tempfile
import numpy as np
from scapy.all import rdpcap, IP, IPv6, ICMP
try:
    from scapy.layers.inet6 import ICMPv6EchoRequest, ICMPv6EchoReply
except ImportError:
    ICMPv6EchoRequest, ICMPv6EchoReply = None, None


# Standard OS Ping default payload signatures
WINDOWS_PING_PAYLOAD = b"abcdefghijklmnopqrstuvwabcdefghi"  # 32 bytes


def _shannon_entropy(data: bytes) -> float:
    """Compute Shannon entropy of byte sequence [0.0 - 8.0 bits/byte]."""
    if not data:
        return 0.0
    arr = np.frombuffer(data, dtype=np.uint8)
    counts = np.bincount(arr, minlength=256)
    probs = counts[counts > 0] / len(data)
    return float(-np.sum(probs * np.log2(probs)))


def analyze_icmp_pcap(pcap_path_or_bytes: Any) -> Dict[str, Any]:
    """Inspect a PCAP file or byte stream for ICMP covert channels.

    Parameters
    ----------
    pcap_path_or_bytes : str or bytes or io.BytesIO
        Path to PCAP file or in-memory byte buffer.

    Returns
    -------
    dict
        Comprehensive ICMP steganalysis statistics, flow details, and evidence.
    """
    temp_file = None
    try:
        if isinstance(pcap_path_or_bytes, bytes):
            temp_file = tempfile.NamedTemporaryFile(suffix=".pcap", delete=False)
            temp_file.write(pcap_path_or_bytes)
            temp_file.flush()
            temp_file.close()
            pcap_source = temp_file.name
        elif isinstance(pcap_path_or_bytes, str):
            if not os.path.exists(pcap_path_or_bytes):
                raise FileNotFoundError(f"PCAP file not found: {pcap_path_or_bytes}")
            pcap_source = pcap_path_or_bytes
        elif hasattr(pcap_path_or_bytes, "read"):
            temp_file = tempfile.NamedTemporaryFile(suffix=".pcap", delete=False)
            temp_file.write(pcap_path_or_bytes.read())
            temp_file.flush()
            temp_file.close()
            pcap_source = temp_file.name
        else:
            raise TypeError(f"Unsupported PCAP input type: {type(pcap_path_or_bytes)}")

        try:
            packets = rdpcap(pcap_source)
        except Exception as e:
            raise ValueError(f"Failed to parse PCAP file: {str(e)}")

        total_packets = len(packets)
        icmp_packets = []

        for pkt in packets:
            if pkt.haslayer(ICMP):
                icmp_packets.append((pkt, "IPv4"))
            elif ICMPv6EchoRequest and (pkt.haslayer(ICMPv6EchoRequest) or pkt.haslayer(ICMPv6EchoReply)):
                icmp_packets.append((pkt, "IPv6"))

        icmp_count = len(icmp_packets)
        if icmp_count == 0:
            return {
                "module": "network",
                "protocol": "ICMP",
                "prediction": "NORMAL",
                "score": 0.0,
                "confidence_type": "evidence_score",
                "total_packets": total_packets,
                "icmp_packets_count": 0,
                "flows_analyzed": 0,
                "features": {
                    "avg_payload_size": 0.0,
                    "payload_size_variance": 0.0,
                    "avg_payload_entropy": 0.0,
                    "timing_jitter": 0.0,
                    "standard_os_payload_ratio": 0.0,
                    "high_entropy_payload_ratio": 0.0,
                },
                "flows": [],
                "evidence": ["No ICMP traffic present in the provided packet capture."],
                "limitations": ["PCAP contains no ICMP packets to evaluate."],
            }

        # Packet & Payload Extraction
        payload_lengths = []
        entropies = []
        timestamps = []
        flows: Dict[str, Dict[str, Any]] = {}
        is_standard_os_count = 0
        high_entropy_count = 0
        non_printable_ratios = []

        for pkt, ip_ver in icmp_packets:
            # Extract IP addresses
            if ip_ver == "IPv4" and pkt.haslayer(IP):
                src_ip = pkt[IP].src
                dst_ip = pkt[IP].dst
            elif ip_ver == "IPv6" and pkt.haslayer(IPv6):
                src_ip = pkt[IPv6].src
                dst_ip = pkt[IPv6].dst
            else:
                src_ip, dst_ip = "unknown", "unknown"

            flow_key = f"{src_ip} -> {dst_ip}"
            if flow_key not in flows:
                flows[flow_key] = {
                    "src": src_ip,
                    "dst": dst_ip,
                    "packet_count": 0,
                    "payload_sizes": [],
                    "entropies": [],
                    "timestamps": [],
                }

            # Extract timestamp
            ts = float(pkt.time)
            timestamps.append(ts)
            flows[flow_key]["timestamps"].append(ts)
            flows[flow_key]["packet_count"] += 1

            # Extract ICMP payload
            raw_payload = bytes(pkt[ICMP].payload) if pkt.haslayer(ICMP) else b""
            p_len = len(raw_payload)
            payload_lengths.append(p_len)
            flows[flow_key]["payload_sizes"].append(p_len)

            if p_len > 0:
                ent = _shannon_entropy(raw_payload)
                entropies.append(ent)
                flows[flow_key]["entropies"].append(ent)

                if ent >= 5.5:  # High entropy indicates encrypted or compressed data
                    high_entropy_count += 1

                # Printable ratio
                printable_bytes = sum(1 for b in raw_payload if 32 <= b <= 126)
                non_printable_ratios.append(1.0 - (printable_bytes / p_len))

                # Standard OS Ping check (e.g. Windows 32-byte alphabet)
                if raw_payload == WINDOWS_PING_PAYLOAD or raw_payload == WINDOWS_PING_PAYLOAD[:p_len]:
                    is_standard_os_count += 1

        # Statistical Aggregation
        avg_payload_size = float(np.mean(payload_lengths)) if payload_lengths else 0.0
        payload_var = float(np.var(payload_lengths)) if payload_lengths else 0.0
        avg_entropy = float(np.mean(entropies)) if entropies else 0.0
        max_entropy = float(np.max(entropies)) if entropies else 0.0
        standard_os_ratio = is_standard_os_count / max(1, icmp_count)
        high_entropy_ratio = high_entropy_count / max(1, icmp_count)

        # Inter-arrival Timing Analysis
        inter_arrivals = []
        if len(timestamps) > 1:
            sorted_ts = sorted(timestamps)
            inter_arrivals = list(np.diff(sorted_ts))

        avg_inter_arrival = float(np.mean(inter_arrivals)) if inter_arrivals else 0.0
        timing_std = float(np.std(inter_arrivals)) if inter_arrivals else 0.0
        timing_cv = (timing_std / avg_inter_arrival) if avg_inter_arrival > 0 else 1.0

        # Flow summary
        flow_summaries = []
        for f_key, f_data in flows.items():
            f_p_sizes = f_data["payload_sizes"]
            f_entropies = f_data["entropies"]
            flow_summaries.append({
                "flow": f_key,
                "packets": f_data["packet_count"],
                "avg_payload_size": round(float(np.mean(f_p_sizes)), 1) if f_p_sizes else 0.0,
                "avg_entropy": round(float(np.mean(f_entropies)), 2) if f_entropies else 0.0,
            })

        # Evidence & Suspicion Scoring
        evidence_points = []
        score_components = []

        if high_entropy_ratio > 0.40 and avg_payload_size >= 16:
            entropy_score = min(1.0, (avg_entropy / 7.5))
            score_components.append(("High Payload Entropy", 0.35, entropy_score))
            evidence_points.append(
                f"Elevated ICMP payload entropy detected (avg: {avg_entropy:.2f} bits/byte, {round(high_entropy_ratio * 100, 1)}% packets > 5.5 bits/byte), consistent with encrypted or compressed payload."
            )

        if avg_payload_size > 64:
            size_score = min(1.0, (avg_payload_size - 64) / 200.0)
            score_components.append(("Large Payload Size", 0.25, size_score))
            evidence_points.append(
                f"Unusually large ICMP payload sizes observed (avg: {avg_payload_size:.1f} bytes)."
            )

        if standard_os_ratio < 0.20 and avg_payload_size > 0:
            sig_score = 0.80
            score_components.append(("Non-Standard Signature", 0.20, sig_score))
            evidence_points.append("ICMP payload content diverges from standard operating system echo patterns.")

        if len(inter_arrivals) >= 5 and timing_cv < 0.15 and avg_inter_arrival > 0.05:
            timing_score = min(1.0, 1.0 - timing_cv)
            score_components.append(("Periodic Timing", 0.20, timing_score))
            evidence_points.append(
                f"Highly periodic packet transmission timing detected (mean interval: {avg_inter_arrival:.2f}s, low jitter: CV={timing_cv:.3f}), characteristic of automated beaconing."
            )

        if score_components:
            weights = [c[1] for c in score_components]
            vals = [c[2] for c in score_components]
            suspicion_score = float(np.average(vals, weights=weights))
        else:
            suspicion_score = 0.05

        suspicion_score = round(max(0.0, min(1.0, suspicion_score)), 4)

        if suspicion_score >= 0.65:
            prediction = "SUSPICIOUS"
        elif suspicion_score >= 0.40:
            prediction = "MODERATE_EVIDENCE"
        else:
            prediction = "NORMAL"

        if not evidence_points:
            evidence_points.append("ICMP packet payloads and timing behaviors fall within expected network diagnostic norms.")

        return {
            "module": "network",
            "protocol": "ICMP",
            "prediction": prediction,
            "score": suspicion_score,
            "confidence_type": "evidence_score",
            "total_packets": total_packets,
            "icmp_packets_count": icmp_count,
            "flows_analyzed": len(flows),
            "features": {
                "avg_payload_size": round(avg_payload_size, 2),
                "payload_size_variance": round(payload_var, 2),
                "avg_payload_entropy": round(avg_entropy, 3),
                "max_payload_entropy": round(max_entropy, 3),
                "high_entropy_ratio": round(high_entropy_ratio, 3),
                "standard_os_payload_ratio": round(standard_os_ratio, 3),
                "inter_arrival_mean_sec": round(avg_inter_arrival, 4),
                "inter_arrival_cv": round(timing_cv, 4),
            },
            "flows": flow_summaries[:10],
            "evidence": evidence_points,
            "limitations": [
                "Certain custom diagnostic utilities, VPN tunnels, and network discovery tools use non-standard ICMP payloads legitimately.",
                "Full verification requires correlating packet traces with application endpoints.",
            ],
        }

    finally:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.remove(temp_file.name)
            except Exception:
                pass