"""
LSB Feature Extraction Module
==============================
Extracts deterministic statistical features from image bit-planes
suitable for traditional steganalysis reporting and hybrid ML fusion.
"""

from typing import Union, Dict, Any, Tuple
import numpy as np
from PIL import Image

from app.steganalysis.lsb_analysis import analyze_lsb, _ensure_image_array


FEATURE_NAMES = [
    "global_lsb_mean",
    "global_zero_ratio",
    "global_one_ratio",
    "bit_entropy",
    "abs_mean_diff_half",
    "r_mean",
    "g_mean",
    "b_mean",
    "r_std",
    "g_std",
    "b_std",
    "r_dev_half",
    "g_dev_half",
    "b_dev_half",
    "block_mean_std",
    "block_dev_half",
    "embedded_block_ratio",
    "traditional_score",
    "pov_chi2_mean",
    "pov_p_value_max",
]


def extract_lsb_features(
    image_input: Union[str, Image.Image, np.ndarray],
    block_size: int = 100
) -> Dict[str, float]:
    """Extract named statistical LSB features as a flat dictionary.

    Parameters
    ----------
    image_input : str, Image.Image, or np.ndarray
    block_size : int, optional (default: 100)

    Returns
    -------
    dict
        Mapping from feature name to float value.
    """
    raw_analysis = analyze_lsb(image_input, block_size=block_size)
    ch = raw_analysis["channel_statistics"]
    b = raw_analysis["block_statistics"]
    pov = raw_analysis["chi_square_pov"]

    features: Dict[str, float] = {
        "global_lsb_mean": float(raw_analysis["global_lsb_mean"]),
        "global_zero_ratio": float(raw_analysis["zero_ratio"]),
        "global_one_ratio": float(raw_analysis["one_ratio"]),
        "bit_entropy": float(raw_analysis["bit_entropy"]),
        "abs_mean_diff_half": float(abs(raw_analysis["global_lsb_mean"] - 0.5)),
        "r_mean": float(ch["r"]["lsb_mean"]),
        "g_mean": float(ch["g"]["lsb_mean"]),
        "b_mean": float(ch["b"]["lsb_mean"]),
        "r_std": float(ch["r"]["block_mean_std"]),
        "g_std": float(ch["g"]["block_mean_std"]),
        "b_std": float(ch["b"]["block_mean_std"]),
        "r_dev_half": float(ch["r"]["deviation_from_half"]),
        "g_dev_half": float(ch["g"]["deviation_from_half"]),
        "b_dev_half": float(ch["b"]["deviation_from_half"]),
        "block_mean_std": float(b["std_block_mean"]),
        "block_dev_half": float(b["deviation_from_half"]),
        "embedded_block_ratio": float(b["embedded_block_ratio"]),
        "traditional_score": float(raw_analysis["traditional_score"]),
        "pov_chi2_mean": float(pov["mean_statistic"]),
        "pov_p_value_max": float(pov["max_p_value"]),
    }
    return features


def extract_lsb_feature_vector(
    image_input: Union[str, Image.Image, np.ndarray],
    block_size: int = 100
) -> Tuple[np.ndarray, list]:
    """Extract a 1D NumPy float32 feature array and corresponding feature names.

    Parameters
    ----------
    image_input : str, Image.Image, or np.ndarray
    block_size : int, optional

    Returns
    -------
    (np.ndarray, list)
        Tuple of (feature_vector of shape (20,), list of feature names)
    """
    feat_dict = extract_lsb_features(image_input, block_size=block_size)
    vec = np.array([feat_dict[name] for name in FEATURE_NAMES], dtype=np.float32)
    return vec, FEATURE_NAMES