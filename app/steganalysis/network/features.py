"""
Network Steganalysis Feature Extraction Module
"""

from typing import Dict, Any
from app.steganalysis.network.icmp import analyze_icmp_pcap


def extract_icmp_features(pcap_input: Any) -> Dict[str, Any]:
    """Extract flat statistical features from ICMP packets in a PCAP."""
    result = analyze_icmp_pcap(pcap_input)
    return {
        "icmp_count": result["icmp_packets_count"],
        "flows_count": result["flows_analyzed"],
        **result["features"],
        "suspicion_score": result["score"],
    }