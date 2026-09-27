"""
Network Steganalysis Detector
=============================
Defensive offline detector for network covert channels, focusing on ICMP protocol inspection.
"""

from typing import Dict, Any, Optional
from app.steganalysis.network.icmp import analyze_icmp_pcap


class NetworkSteganalysisDetector:
    """Offline analyzer for network covert channels and packet steganography."""

    def analyze(self, pcap_input: Any) -> Dict[str, Any]:
        """Inspect a PCAP packet capture for covert channel activity."""
        return analyze_icmp_pcap(pcap_input)


_network_detector_instance: Optional[NetworkSteganalysisDetector] = None


def get_network_detector() -> NetworkSteganalysisDetector:
    """Retrieve or initialize global NetworkSteganalysisDetector singleton."""
    global _network_detector_instance
    if _network_detector_instance is None:
        _network_detector_instance = NetworkSteganalysisDetector()
    return _network_detector_instance