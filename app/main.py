from contextlib import asynccontextmanager
import io
import os
from datetime import datetime
from fastapi import FastAPI, Depends, File, UploadFile, Form, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from typing import Dict, Any, Optional, Union
from PIL import Image, UnidentifiedImageError

from app.database import init_db
from app.auth import router as auth_router, get_current_user
from app.schemas import (
    PredictionResponse,
    TextInputPayload,
    TextPredictionResponse,
    NetworkPredictionResponse,
    PlatformModulesResponse,
    UnifiedAnalysisResponse,
)
from app.steganalysis import get_hybrid_detector, get_ai_detector
from app.steganalysis.text import get_text_detector, extract_text_from_file
from app.steganalysis.network import get_network_detector


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Execute startup and shutdown routines."""
    init_db()
    # Pre-warm AI model and detectors
    try:
        get_hybrid_detector()
        get_text_detector()
        get_network_detector()
        from app.steganalysis.text.bert_steganalysis import _get_bert_components
        _get_bert_components()
    except Exception as e:
        print(f"[Warning] Could not pre-warm all detectors: {e}")
    yield


app = FastAPI(
    title="Steganalysis Multi-Modal Platform API",
    description=(
        "Unified Multi-Modal Steganalysis Platform supporting:\n"
        "1. Image Steganalysis (ResNet18 CNN + Cloacked-Pixel LSB Traditional Fusion)\n"
        "2. Text Steganalysis (Whitespace, Word-Shift, Line-Shift)\n"
        "3. Network Steganalysis (Defensive Offline ICMP Packet Inspection)"
    ),
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration allowing cross-origin requests from web or Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend directories
FRONTEND_DIST_DIR = os.path.normpath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "AI Based Steganography frontend",
        "AI Based Steganography",
        "dist",
    )
)
FRONTEND_ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")

# Legacy/Dashboard static directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if os.path.exists(FRONTEND_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="frontend-assets")

# Include Authentication Router
app.include_router(auth_router)


# ==========================================
# General & Health Endpoints
# ==========================================

@app.get("/", tags=["General"], summary="Application Entry / Health Check")
async def root(request: Request):
    """Returns the React web frontend if visited in browser, otherwise API status JSON."""
    accept = request.headers.get("accept", "")
    frontend_index = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if "text/html" in accept and os.path.exists(frontend_index):
        return FileResponse(frontend_index)

    index_file = os.path.join(STATIC_DIR, "index.html")
    if "text/html" in accept and os.path.exists(index_file):
        return FileResponse(index_file)

    return {
        "status": "online",
        "system": "Steganalysis Multi-Modal Platform API",
        "version": "3.0.0",
        "modules": ["image", "text", "network"],
        "docs": "/docs",
        "dashboard": "/dashboard",
    }


@app.get("/dashboard", tags=["General"], summary="Interactive Steganalysis Application")
async def dashboard():
    """Serves the interactive multi-modal web app."""
    frontend_index = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return RedirectResponse(url="/docs")


@app.get("/api/steganalysis/modules", response_model=PlatformModulesResponse, tags=["General"], summary="List Steganalysis Modules")
async def list_modules():
    """Return platform module capabilities, features, and endpoints."""
    return {
        "platform": "Steganalysis Multi-Modal Platform",
        "version": "3.0.0",
        "modules": {
            "image": {
                "endpoint": "/predict",
                "methods": ["Deep Learning CNN (ResNet18)", "Traditional LSB (Cloacked-Pixel)", "Calibrated Hybrid Fusion"],
                "supported_formats": ["PNG", "JPEG", "BMP", "WebP"],
            },
            "text": {
                "endpoint": "/api/steganalysis/text",
                "methods": ["Whitespace Steganalysis", "Word-Shift Steganalysis", "Line-Shift Steganalysis"],
                "supported_formats": ["Raw text", ".txt file", ".docx file", ".pdf file"],
            },
            "network": {
                "endpoint": "/api/steganalysis/network",
                "methods": ["ICMP Covert Channel Inspection (Packet, Payload Entropy, Timing/Flow)"],
                "supported_formats": [".pcap", ".pcapng", ".cap"],
                "safety_mode": "Defensive / Analytical Offline Only",
            },
        },
    }


@app.get("/protected", tags=["Protected Demo"], summary="Sample Protected Endpoint")
async def protected_route(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Sample protected endpoint accessible only with a valid JWT token."""
    return {
        "message": f"Hello {current_user['username']}! You have successfully accessed a protected endpoint.",
        "user": current_user,
    }


# ==========================================
# UNIFIED ANALYSIS ENDPOINT (Frontend Core)
# ==========================================

def _format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


@app.post(
    "/api/analyze",
    response_model=UnifiedAnalysisResponse,
    tags=["Unified Steganalysis"],
    summary="Unified steganography analysis endpoint for Image, Text, and Network capture",
)
async def analyze_unified(
    file: UploadFile = File(..., description="File to analyze (Image, Text, or PCAP)"),
    domain: Optional[str] = Form(None, description="Optional domain type: 'image', 'text', 'pcap'/'network'"),
    type: Optional[str] = Form(None, description="Alias for domain parameter"),
):
    """Unified multi-modal analysis endpoint directly consuming file uploads from the React/Electron UI."""
    effective_domain = (domain or type or "").strip().lower()
    filename = file.filename or "unknown_file"
    _, ext = os.path.splitext(filename.lower())

    # Auto-detect domain if not supplied
    if not effective_domain:
        if ext in {".png", ".jpg", ".jpeg", ".bmp", ".webp"}:
            effective_domain = "image"
        elif ext in {".txt", ".docx", ".pdf"}:
            effective_domain = "text"
        elif ext in {".pcap", ".pcapng", ".cap"}:
            effective_domain = "pcap"
        else:
            effective_domain = "image"

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    case_id = f"CASE-{datetime.now().strftime('%y%m%d%H%M%S')}"
    timestamp_iso = datetime.now().isoformat()
    formatted_date = datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")
    file_size_str = _format_file_size(len(file_bytes))

    # 1. Image Steganalysis
    if effective_domain in {"image", "img"}:
        try:
            pil_image = Image.open(io.BytesIO(file_bytes))
            pil_image.verify()
            pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid or unsupported image file: {str(e)}",
            )

        detector = get_hybrid_detector()
        analysis = detector.analyze(pil_image)
        prediction = analysis.get("prediction", "CLEAN")
        confidence = round(float(analysis.get("confidence", 0.0)) * 100, 1)
        ai_data = analysis.get("ai", {})
        ai_prob = float(ai_data.get("probability", 0.0))
        trad_data = analysis.get("traditional", {})
        trad_score = float(trad_data.get("traditional_score", 0.0))
        bit_entropy = float(trad_data.get("bit_entropy", 0.0))

        if prediction == "CLEAN":
            result = "Clean"
            risk_level = "Low"
            findings = (
                f"Neural CNN and Cloacked-Pixel LSB bitplane analysis revealed normal bit distribution "
                f"(entropy: {bit_entropy:.4f}) with no concealed payloads detected. Stego probability: {ai_prob * 100:.1f}%."
            )
            recommendation = "File is deemed safe for archiving, distribution, and transmission."
        else:
            if 0.35 <= ai_prob <= 0.65 or abs(ai_prob - trad_score) > 0.4:
                result = "Suspicious"
                risk_level = "Medium"
                findings = (
                    f"Discrepancy detected between neural spatial feature embeddings (prob: {ai_prob * 100:.1f}%) "
                    f"and traditional LSB bit distributions (anomaly score: {trad_score:.3f}). Further manual inspection advised."
                )
                recommendation = "Perform detailed multi-stage manual forensic inspection and steganalysis on isolated channels."
            else:
                result = "Stego"
                risk_level = "High"
                findings = (
                    f"Concealed payload pattern detected! High spatial bitplane entropy variation and LSB anomaly score "
                    f"({trad_score:.3f}) with AI stego probability of {ai_prob * 100:.1f}%."
                )
                recommendation = "Quarantine the file and isolate communication endpoints. Perform payload extraction to identify covert content."

        return {
            "id": case_id,
            "fileName": filename,
            "fileSize": file_size_str,
            "fileType": "IMAGE",
            "timestamp": timestamp_iso,
            "dateFormatted": formatted_date,
            "result": result,
            "riskLevel": risk_level,
            "confidence": confidence,
            "findings": findings,
            "recommendation": recommendation,
            "details": analysis,
        }

    # 2. Text Steganalysis
    elif effective_domain in {"text", "doc", "document"}:
        try:
            raw_text = extract_text_from_file(filename, file_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse document text: {str(e)}",
            )

        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extracted text document is empty.",
            )

        text_det = get_text_detector()
        analysis = text_det.analyze(raw_text)
        prediction = analysis.get("prediction", "CLEAN")
        score = float(analysis.get("score", 0.0))
        confidence = round(max(score, 1.0 - score) * 100, 1)
        summary = analysis.get("summary", "")
        evidence = analysis.get("evidence", [])

        if prediction == "CLEAN":
            result = "Clean"
            risk_level = "Low"
            findings = summary or "Text document has uniform spacing and no invisible zero-width or anomalous codepoints."
            recommendation = "File is deemed clean. No covert linguistic or whitespace channels found."
        elif score < 0.65:
            result = "Suspicious"
            risk_level = "Medium"
            findings = f"{summary} Notable evidence: {'; '.join(evidence[:3])}" if evidence else summary
            recommendation = "Minor spacing irregularities or character variances found. Verify with original author or inspect codepoints."
        else:
            result = "Stego"
            risk_level = "High"
            findings = f"Concealed text steganography detected! {summary} Evidence: {'; '.join(evidence[:3])}" if evidence else summary
            recommendation = "Isolate document and strip unauthorized zero-width or shifted spacing codepoints before distributing."

        return {
            "id": case_id,
            "fileName": filename,
            "fileSize": file_size_str,
            "fileType": "TEXT",
            "timestamp": timestamp_iso,
            "dateFormatted": formatted_date,
            "result": result,
            "riskLevel": risk_level,
            "confidence": confidence,
            "findings": findings,
            "recommendation": recommendation,
            "details": analysis,
        }

    # 3. Network PCAP Steganalysis
    elif effective_domain in {"pcap", "network", "net"}:
        net_det = get_network_detector()
        try:
            analysis = net_det.analyze(file_bytes)
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PCAP parsing error: {str(ve)}",
            )

        prediction = analysis.get("prediction", "NORMAL")
        score = float(analysis.get("score", 0.0))
        confidence = round(max(score, 1.0 - score) * 100, 1)
        pkt_count = analysis.get("icmp_packets_count", 0)
        evidence = analysis.get("evidence", [])

        if prediction == "NORMAL":
            result = "Clean"
            risk_level = "Low"
            findings = f"All {pkt_count} ICMP packet payloads adhere strictly to standard RFC 792 structures with uniform entropy."
            recommendation = "Network capture exhibits baseline diagnostic traffic with no indications of covert data tunneling."
        elif prediction == "MODERATE_EVIDENCE" or score < 0.65:
            result = "Suspicious"
            risk_level = "Medium"
            findings = f"Moderate anomalies in {pkt_count} ICMP packets: {'; '.join(evidence[:3]) if evidence else 'Payload size/entropy variance'}."
            recommendation = "Monitor endpoint communication and perform deeper protocol packet inspection."
        else:
            result = "Stego"
            risk_level = "High"
            findings = f"Covert channel detected across {pkt_count} ICMP packets! Evidence: {'; '.join(evidence[:3]) if evidence else 'High entropy and abnormal payload signatures'}."
            recommendation = "Block suspect IP communication flows immediately. Inspect egress traffic for unauthorized data exfiltration."

        return {
            "id": case_id,
            "fileName": filename,
            "fileSize": file_size_str,
            "fileType": "NETWORK",
            "timestamp": timestamp_iso,
            "dateFormatted": formatted_date,
            "result": result,
            "riskLevel": risk_level,
            "confidence": confidence,
            "findings": findings,
            "recommendation": recommendation,
            "details": analysis,
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported analysis domain '{effective_domain}'. Choose 'image', 'text', or 'pcap'.",
        )


# ==========================================
# MODULE 1: Image Steganography Endpoints
# ==========================================

ALLOWED_IMAGE_MIMES = {
    "image/jpeg",
    "image/png",
    "image/bmp",
    "image/webp",
    "application/octet-stream",
}


@app.post(
    "/predict",
    response_model=PredictionResponse,
    tags=["Image Steganalysis"],
    summary="Predict image steganography using Hybrid AI + Traditional LSB Analysis",
)
@app.post(
    "/detect",
    response_model=PredictionResponse,
    tags=["Image Steganalysis"],
    summary="Alias for /predict",
    include_in_schema=False,
)
async def predict_image(
    file: UploadFile = File(..., description="Image file to analyze (PNG, JPG, BMP, WebP)")
):
    """Analyze an uploaded image for LSB steganography via hybrid fusion."""
    if file.content_type and file.content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file MIME type: {file.content_type}. Please upload a PNG, JPEG, or BMP image.",
        )

    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        pil_image.verify()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}",
        )

    width, height = pil_image.size
    if width * height < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image resolution too small ({width}x{height} pixels). Minimum 100 pixels required.",
        )

    try:
        detector = get_hybrid_detector()
        return detector.analyze(pil_image)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Steganalysis inference failed: {str(e)}",
        )


# ==========================================
# MODULE 2: Text Steganography Endpoints
# ==========================================

@app.post(
    "/api/steganalysis/text",
    response_model=TextPredictionResponse,
    tags=["Text Steganalysis"],
    summary="Analyze text for Whitespace, Word-Shift, and Line-Shift Steganography",
)
async def analyze_text_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(None, description="Optional .txt, .docx, or .pdf file to inspect"),
    text: Optional[str] = Form(None, description="Optional raw text submitted via form data"),
):
    """Inspect text for whitespace, word-shift, and line-shift steganography."""
    raw_content = ""

    # 1. Check file upload
    if file is not None:
        try:
            content_bytes = await file.read()
            raw_content = extract_text_from_file(file.filename or "file.txt", content_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read/parse text file: {str(e)}",
            )
    # 2. Check form data
    elif text is not None:
        raw_content = text
    # 3. Check JSON payload
    else:
        try:
            body = await request.json()
            raw_content = body.get("text", "")
        except Exception:
            raw_content = ""

    if not raw_content or not raw_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text provided. Please provide JSON `text`, form data `text`, or upload a `.txt`/`.docx`/`.pdf` file.",
        )

    try:
        detector = get_text_detector()
        return detector.analyze(raw_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text steganalysis failed: {str(e)}",
        )


# ==========================================
# MODULE 3: Network Steganography Endpoints
# ==========================================

ALLOWED_PCAP_EXTS = {".pcap", ".pcapng", ".cap"}


@app.post(
    "/api/steganalysis/network",
    response_model=NetworkPredictionResponse,
    tags=["Network Steganalysis"],
    summary="Analyze PCAP capture for ICMP covert channels and steganography",
)
async def analyze_network_endpoint(
    file: UploadFile = File(..., description="Packet capture file (.pcap, .pcapng)")
):
    """Offline defensive inspection of ICMP packets in a PCAP capture."""
    filename = file.filename or ""
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_PCAP_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension: '{ext}'. Please upload a valid packet capture file (.pcap, .pcapng).",
        )

    try:
        pcap_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read PCAP file: {str(e)}",
        )

    if len(pcap_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded PCAP file is empty (0 bytes).",
        )

    try:
        detector = get_network_detector()
        return detector.analyze(pcap_bytes)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PCAP parsing error: {str(ve)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network steganalysis failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

