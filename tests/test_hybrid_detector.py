import io
import os
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.steganalysis import (
    analyze_lsb,
    extract_lsb_features,
    get_ai_detector,
    get_hybrid_detector,
)

client = TestClient(app)


@pytest.fixture
def sample_clean_image():
    """Create a synthetic gradient clean image (non-random LSBs)."""
    h, w = 150, 150
    # Gradient has high spatial correlation and non-uniform LSB distribution
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            arr[y, x, 0] = (x * 2) % 256
            arr[y, x, 1] = (y * 2) % 256
            arr[y, x, 2] = ((x + y) * 2) % 256
    img = Image.fromarray(arr)
    return img


@pytest.fixture
def sample_stego_image():
    """Create a synthetic stego-like image with pseudo-random LSBs (mean near 0.5)."""
    np.random.seed(42)
    h, w = 150, 150
    arr = np.random.randint(50, 200, (h, w, 3), dtype=np.uint8)
    # Force LSBs to be uniformly random bits
    random_bits = np.random.randint(0, 2, (h, w, 3), dtype=np.uint8)
    arr = (arr & 254) | random_bits
    return Image.fromarray(arr)


def test_analyze_lsb_structure(sample_clean_image):
    result = analyze_lsb(sample_clean_image)
    assert "global_lsb_mean" in result
    assert "zero_ratio" in result
    assert "one_ratio" in result
    assert "bit_entropy" in result
    assert "traditional_score" in result
    assert "block_statistics" in result
    assert "channel_statistics" in result
    assert "chi_square_pov" in result
    assert 0.0 <= result["traditional_score"] <= 1.0


def test_analyze_lsb_stego_detection(sample_stego_image):
    result = analyze_lsb(sample_stego_image)
    # Uniform random LSBs should have global mean very close to 0.5
    assert abs(result["global_lsb_mean"] - 0.5) < 0.05
    assert result["bit_entropy"] > 0.99
    # Traditional score should be elevated for uniform LSB bit distribution
    assert result["traditional_score"] > 0.60


def test_analyze_lsb_too_small():
    tiny_img = Image.new("RGB", (5, 5))
    with pytest.raises(ValueError):
        analyze_lsb(tiny_img, block_size=100)


def test_feature_extraction(sample_clean_image):
    features = extract_lsb_features(sample_clean_image)
    assert isinstance(features, dict)
    assert len(features) == 20
    assert "global_lsb_mean" in features
    assert "traditional_score" in features
    assert "block_mean_std" in features


def test_ai_detector(sample_clean_image):
    ai = get_ai_detector()
    res = ai.predict(sample_clean_image)
    assert res["prediction"] in ["CLEAN", "STEGO"]
    assert 0.0 <= res["probability"] <= 1.0
    assert 0.0 <= res["confidence"] <= 1.0


def test_hybrid_detector(sample_clean_image):
    hybrid = get_hybrid_detector()
    res = hybrid.analyze(sample_clean_image)
    assert res["prediction"] in ["CLEAN", "STEGO"]
    assert "ai" in res
    assert "traditional" in res
    assert "hybrid" in res
    assert "explanations" in res
    assert len(res["explanations"]) >= 2


def test_api_predict_success(sample_clean_image):
    buf = io.BytesIO()
    sample_clean_image.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/predict",
        files={"file": ("test.png", buf, "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in ["CLEAN", "STEGO"]
    assert "confidence" in data
    assert "ai" in data
    assert "traditional" in data
    assert "hybrid" in data
    assert "explanations" in data


def test_api_detect_alias(sample_clean_image):
    buf = io.BytesIO()
    sample_clean_image.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/detect",
        files={"file": ("test.png", buf, "image/png")},
    )
    assert response.status_code == 200
    assert "prediction" in response.json()


def test_api_predict_empty_file():
    response = client.post(
        "/predict",
        files={"file": ("empty.png", io.BytesIO(b""), "image/png")},
    )
    assert response.status_code == 400


def test_api_predict_corrupted_file():
    response = client.post(
        "/predict",
        files={"file": ("fake.png", io.BytesIO(b"Not An Image"), "image/png")},
    )
    assert response.status_code == 400