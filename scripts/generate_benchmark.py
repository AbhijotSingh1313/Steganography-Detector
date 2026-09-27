"""
Benchmark Dataset Generation Script
====================================
Generates a controlled, reproducible dataset of Clean and LSB-Stego images
with varying payload rates (Low, Medium, High) using Cloacked-Pixel's LSB embedding logic.
Strictly separates Train and Test splits to avoid any data leakage.
"""

import os
import shutil
import numpy as np
from PIL import Image

# Output benchmark directory
BENCHMARK_DIR = "data/benchmark"
TRAIN_DIR = os.path.join(BENCHMARK_DIR, "train")
TEST_DIR = os.path.join(BENCHMARK_DIR, "test")


def embed_lsb(image: Image.Image, payload_rate: float, seed: int = 42) -> Image.Image:
    """Embed random (encrypted-like) bitstream into image LSBs up to payload_rate fraction of pixels.

    Parameters
    ----------
    image : PIL.Image.Image
    payload_rate : float
        Fraction of channel bytes to replace (e.g. 0.05 = 5% low payload, 0.50 = 50%, 1.0 = full).
    seed : int
        RNG seed for deterministic bitstream.

    Returns
    -------
    PIL.Image.Image
    """
    rng = np.random.RandomState(seed)
    arr = np.array(image.convert("RGB"), dtype=np.uint8)
    h, w, c = arr.shape
    total_slots = h * w * c
    num_to_embed = int(total_slots * payload_rate)

    flat = arr.reshape(-1)
    # Generate pseudo-random bits (simulating AES encrypted payload as in Cloacked-Pixel)
    random_bits = rng.randint(0, 2, size=num_to_embed, dtype=np.uint8)

    # Replace LSBs in sequential order (as Cloacked-Pixel does)
    flat[:num_to_embed] = (flat[:num_to_embed] & 254) | random_bits

    stego_arr = flat.reshape(h, w, c)
    return Image.fromarray(stego_arr, mode="RGB")


def find_source_carriers():
    """Find existing natural carrier images within the project."""
    candidates = [
        "cloacked-pixel/images/castle.jpg",
        "cloacked-pixel/images/orig.jpg",
        "cloacked-pixel/images/logo.png",
        "venv/Lib/site-packages/sklearn/datasets/images/china.jpg",
        "venv/Lib/site-packages/sklearn/datasets/images/flower.jpg",
        "venv/Lib/site-packages/matplotlib/mpl-data/sample_data/grace_hopper.jpg",
    ]
    existing = [p for p in candidates if os.path.exists(p)]
    return existing


def main():
    carriers = find_source_carriers()
    print(f"Found {len(carriers)} source carrier images: {carriers}")

    for split in ["train", "test"]:
        for label in ["clean", "stego_low", "stego_med", "stego_high"]:
            os.makedirs(os.path.join(BENCHMARK_DIR, split, label), exist_ok=True)

    # Carrier assignment: split carriers strictly between train and test
    # (avoiding same base image appearing in both splits)
    np.random.seed(100)
    indices = list(range(len(carriers)))
    train_idx = indices[: len(indices) // 2]
    test_idx = indices[len(indices) // 2 :]

    train_carriers = [carriers[i] for i in train_idx]
    test_carriers = [carriers[i] for i in test_idx]

    print(f"Train carriers ({len(train_carriers)}): {train_carriers}")
    print(f"Test carriers ({len(test_carriers)}): {test_carriers}")

    # Generate samples by taking sub-crops/patches from carriers
    def generate_split(carrier_list, split_name, crops_per_carrier=10):
        split_path = os.path.join(BENCHMARK_DIR, split_name)
        count = 0
        for c_idx, path in enumerate(carrier_list):
            base_img = Image.open(path).convert("RGB")
            bw, bh = base_img.size
            crop_size = min(224, bw, bh)

            for crop_id in range(crops_per_carrier):
                # Deterministic random crops
                rx = (crop_id * 37) % max(1, bw - crop_size)
                ry = (crop_id * 53) % max(1, bh - crop_size)
                patch = base_img.crop((rx, ry, rx + crop_size, ry + crop_size)).resize((224, 224))

                sample_base = f"carrier{c_idx}_patch{crop_id}"

                # 1. Clean image
                patch.save(os.path.join(split_path, "clean", f"{sample_base}_clean.png"))

                # 2. Stego Low payload (5% of capacity)
                stego_low = embed_lsb(patch, payload_rate=0.08, seed=crop_id * 10 + 1)
                stego_low.save(os.path.join(split_path, "stego_low", f"{sample_base}_stego_low.png"))

                # 3. Stego Medium payload (35% of capacity)
                stego_med = embed_lsb(patch, payload_rate=0.35, seed=crop_id * 10 + 2)
                stego_med.save(os.path.join(split_path, "stego_med", f"{sample_base}_stego_med.png"))

                # 4. Stego High payload (85% of capacity)
                stego_high = embed_lsb(patch, payload_rate=0.85, seed=crop_id * 10 + 3)
                stego_high.save(os.path.join(split_path, "stego_high", f"{sample_base}_stego_high.png"))

                count += 4
        print(f"Generated {count} images in {split_path}")

    generate_split(train_carriers, "train", crops_per_carrier=12)
    generate_split(test_carriers, "test", crops_per_carrier=12)
    print("Benchmark generation complete!")


if __name__ == "__main__":
    main()