"""
Traditional LSB Steganalysis Module
====================================
Adapted and modernized from Cloacked-Pixel (https://github.com/mkoler/cloacked-pixel)
Original concept: Block-based LSB distribution analysis for detecting encrypted payloads.

License & Attribution:
- Original implementation by mkoler (Cloacked-Pixel, MIT License).
- Preserved in cloacked-pixel/ repository.
- Reimplemented in vectorized Python 3 / NumPy for high performance and deterministic feature extraction.
"""

from typing import Union, Dict, Any, Optional
import os
import numpy as np
from PIL import Image
from scipy.stats import chi2


def _ensure_image_array(image_input: Union[str, Image.Image, np.ndarray]) -> np.ndarray:
    """Load and normalize image into a uint8 RGB numpy array (H, W, 3)."""
    if isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image file not found: {image_input}")
        pil_img = Image.open(image_input)
    elif isinstance(image_input, Image.Image):
        pil_img = image_input
    elif isinstance(image_input, np.ndarray):
        if image_input.dtype != np.uint8:
            image_input = np.clip(image_input, 0, 255).astype(np.uint8)
        if image_input.ndim == 2:
            return np.stack([image_input] * 3, axis=-1)
        elif image_input.ndim == 3 and image_input.shape[2] >= 3:
            return image_input[:, :, :3]
        else:
            raise ValueError(f"Unsupported array shape: {image_input.shape}")
    else:
        raise TypeError(f"Unsupported image input type: {type(image_input)}")

    # Ensure RGB conversion (discarding alpha if present, expanding grayscale)
    rgb_img = pil_img.convert("RGB")
    return np.array(rgb_img, dtype=np.uint8)


def _compute_chi_square_pov(pixel_channel: np.ndarray) -> Dict[str, float]:
    """Compute Pairs of Values (PoV) Chi-Square statistic on pixel histogram.
    
    In natural clean images, adjacent values (2k, 2k+1) have unequal frequencies.
    LSB replacement equalizes them towards (h(2k)+h(2k+1))/2, significantly reducing Chi2.
    """
    flat = pixel_channel.flatten()
    hist = np.bincount(flat, minlength=256)
    even = hist[0::2]
    odd = hist[1::2]
    expected = (even + odd) / 2.0
    valid = expected > 0
    k = np.sum(valid)
    if k <= 1:
        return {"chi_square": 0.0, "p_value": 1.0}
    chi_stat = float(np.sum(((even[valid] - expected[valid]) ** 2) / expected[valid]))
    # p-value: under null hypothesis of equalized pairs, p-val is near 1
    p_val = float(1.0 - chi2.cdf(chi_stat, df=k - 1))
    return {"chi_square": round(chi_stat, 2), "p_value": round(p_val, 6)}


def _compute_shannon_entropy(p: float) -> float:
    """Compute binary Shannon entropy given probability p of bit 1."""
    if p <= 0.0 or p >= 1.0:
        return 0.0
    q = 1.0 - p
    return float(-p * np.log2(p) - q * np.log2(q))


def analyze_lsb(
    image_input: Union[str, Image.Image, np.ndarray],
    block_size: int = 100
) -> Dict[str, Any]:
    """Perform traditional LSB steganalysis on an image.

    Faithfully adapts Cloacked-Pixel's observation:
    Encrypted/compressed steganographic payloads behave like high-entropy random bitstreams.
    Embedded zones have block LSB averages centered tightly around 0.5 with reduced variance.

    Parameters
    ----------
    image_input : str, Image.Image, or np.ndarray
        Path to image file, PIL Image, or uint8 NumPy array.
    block_size : int, optional
        Number of sequential pixels per analysis block (default: 100, matching Cloacked-Pixel).

    Returns
    -------
    dict
        Structured steganalysis evidence dictionary including global and block statistics.
    """
    arr = _ensure_image_array(image_input)
    height, width, channels = arr.shape
    total_pixels = height * width

    if total_pixels < block_size:
        raise ValueError(
            f"Image too small ({width}x{height} = {total_pixels} pixels) for block size {block_size}."
        )

    # Extract least significant bit (LSB) plane for each channel
    # In Cloacked-Pixel, traversal is row-major (h in height, w in width) across R, G, B
    lsb_planes = arr & 1

    channel_names = ["r", "g", "b"]
    channel_stats: Dict[str, Dict[str, float]] = {}
    channel_block_means: Dict[str, np.ndarray] = {}

    for c, c_name in enumerate(channel_names):
        c_lsb = lsb_planes[:, :, c].flatten()  # C-order matches cloacked-pixel row-major
        n_blocks = len(c_lsb) // block_size
        trimmed = c_lsb[: n_blocks * block_size].reshape(n_blocks, block_size)
        b_means = trimmed.mean(axis=1)

        c_mean = float(c_lsb.mean())
        c_zero_ratio = float(1.0 - c_mean)
        c_one_ratio = float(c_mean)
        c_std = float(b_means.std())
        c_dev_half = float(np.mean(np.abs(b_means - 0.5)))
        c_embedded_ratio = float(np.mean(np.abs(b_means - 0.5) <= 0.05))

        channel_stats[c_name] = {
            "lsb_mean": round(c_mean, 5),
            "zero_ratio": round(c_zero_ratio, 5),
            "one_ratio": round(c_one_ratio, 5),
            "block_mean_std": round(c_std, 5),
            "deviation_from_half": round(c_dev_half, 5),
            "embedded_block_ratio": round(c_embedded_ratio, 5),
        }
        channel_block_means[c_name] = b_means

    # Aggregate global statistics across all three color channels
    all_lsbs = lsb_planes.flatten()
    global_mean = float(all_lsbs.mean())
    global_zero_ratio = float(1.0 - global_mean)
    global_one_ratio = float(global_mean)
    global_entropy = float(_compute_shannon_entropy(global_mean))

    # Aggregate block statistics across all channels
    all_block_means = np.concatenate(list(channel_block_means.values()))
    block_std = float(all_block_means.std())
    block_min = float(all_block_means.min())
    block_max = float(all_block_means.max())
    dev_from_half = float(np.mean(np.abs(all_block_means - 0.5)))
    embedded_ratio = float(np.mean(np.abs(all_block_means - 0.5) <= 0.05))

    # Chi-square Pairs of Values test across channels
    pov_results = [_compute_chi_square_pov(arr[:, :, c]) for c in range(3)]
    avg_chi2 = float(np.mean([r["chi_square"] for r in pov_results]))
    max_pval = float(np.max([r["p_value"] for r in pov_results]))

    # Compute a continuous traditional anomaly score [0.0, 1.0]
    # In Cloacked-Pixel, embedding leads to:
    # 1. Global mean closer to 0.5 (abs(global_mean - 0.5) near 0)
    # 2. Block std lower than typical natural images (stego is often < 0.06 in full/high stego)
    # 3. Higher embedded_block_ratio
    mean_closeness = max(0.0, 1.0 - (abs(global_mean - 0.5) / 0.15))
    block_uniformity = max(0.0, min(1.0, (0.12 - block_std) / 0.10)) if block_std < 0.12 else 0.0
    cluster_score = embedded_ratio

    traditional_score = float(
        0.35 * mean_closeness + 0.35 * cluster_score + 0.30 * block_uniformity
    )
    traditional_score = round(max(0.0, min(1.0, traditional_score)), 4)

    # Traditional suspicious indicator (as evidence, not absolute oracle)
    # A natural image can have balanced LSBs, so we tag threshold conservatively
    is_suspicious = bool(traditional_score >= 0.70 and abs(global_mean - 0.5) <= 0.03)

    return {
        "dimensions": {"width": width, "height": height, "channels": channels},
        "global_lsb_mean": round(global_mean, 5),
        "zero_ratio": round(global_zero_ratio, 5),
        "one_ratio": round(global_one_ratio, 5),
        "bit_entropy": round(global_entropy, 5),
        "channel_statistics": channel_stats,
        "block_statistics": {
            "block_size": block_size,
            "total_blocks": len(all_block_means),
            "mean_block_mean": round(float(all_block_means.mean()), 5),
            "std_block_mean": round(block_std, 5),
            "min_block_mean": round(block_min, 5),
            "max_block_mean": round(block_max, 5),
            "deviation_from_half": round(dev_from_half, 5),
            "embedded_block_ratio": round(embedded_ratio, 5),
        },
        "chi_square_pov": {
            "mean_statistic": round(avg_chi2, 2),
            "max_p_value": round(max_pval, 6),
        },
        "traditional_score": traditional_score,
        "suspicious": is_suspicious,
        "method_attribution": "Adapted from Cloacked-Pixel (mkoler, MIT License)",
    }