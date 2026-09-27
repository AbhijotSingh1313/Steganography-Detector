from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=4, description="Password (at least 4 characters)")
    name: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None


class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    name: Optional[str] = None
    security_question: Optional[str] = None
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseModel):
    email: EmailStr
    security_answer: str
    new_password: str = Field(..., min_length=4)


class PasswordChangeRequest(BaseModel):
    email: EmailStr
    old_password: str
    new_password: str = Field(..., min_length=4)


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None


class MessageResponse(BaseModel):
    message: str


# ==========================================
# Image Steganalysis & Prediction Response
# ==========================================

class AIAnalysisResult(BaseModel):
    prediction: str = Field(..., description="AI prediction: CLEAN or STEGO")
    probability: float = Field(..., description="Estimated probability of steganography from CNN [0.0 - 1.0]")
    confidence: float = Field(..., description="AI model confidence score [0.0 - 1.0]")


class TraditionalAnalysisResult(BaseModel):
    lsb_mean: float = Field(..., description="Global LSB mean across all pixels & channels")
    zero_ratio: float = Field(..., description="Proportion of LSB 0 bits")
    one_ratio: float = Field(..., description="Proportion of LSB 1 bits")
    bit_entropy: float = Field(..., description="Shannon entropy of bit distribution")
    traditional_score: float = Field(..., description="Composite traditional anomaly score [0.0 - 1.0]")
    suspicious: bool = Field(..., description="Whether traditional evidence flags suspicious randomness")
    channel_statistics: Optional[Dict[str, Any]] = None
    block_statistics: Optional[Dict[str, Any]] = None
    chi_square_pov: Optional[Dict[str, Any]] = None


class HybridAnalysisResult(BaseModel):
    prediction: str = Field(..., description="Final fused prediction: CLEAN or STEGO")
    probability: float = Field(..., description="Fused stego probability [0.0 - 1.0]")
    confidence: float = Field(..., description="Fused decision confidence [0.0 - 1.0]")
    fusion_method: str = Field(..., description="Method utilized for hybrid fusion")


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Primary prediction: CLEAN or STEGO")
    confidence: float = Field(..., description="Overall confidence score [0.0 - 1.0]")
    ai: AIAnalysisResult
    traditional: TraditionalAnalysisResult
    hybrid: HybridAnalysisResult
    explanations: List[str] = Field(default_factory=list, description="Verifiable explainability statements")


# ==========================================
# Text Steganalysis Schemas
# ==========================================

class TextInputPayload(BaseModel):
    text: str = Field(..., description="Raw text content to analyze")


class TextMethodResult(BaseModel):
    method: str
    suspicious: bool
    score: float
    features: Dict[str, Any]
    evidence: List[str]
    suspicious_lines: Optional[List[Dict[str, Any]]] = None
    suspicious_locations: Optional[List[Dict[str, Any]]] = None
    limitations: Optional[List[str]] = None


class TextPredictionResponse(BaseModel):
    module: str = "text"
    prediction: str = Field(..., description="CLEAN or SUSPICIOUS")
    score: float = Field(..., description="Steganalysis evidence score [0.0 - 1.0]")
    confidence_type: str = "evidence_score"
    methods: Dict[str, Any]
    summary: str
    evidence: List[str]
    limitations: List[str]


# ==========================================
# Network Steganalysis Schemas
# ==========================================

class NetworkFlowSummary(BaseModel):
    flow: str
    packets: int
    avg_payload_size: float
    avg_entropy: float


class NetworkPredictionResponse(BaseModel):
    module: str = "network"
    protocol: str = "ICMP"
    prediction: str = Field(..., description="NORMAL, MODERATE_EVIDENCE, or SUSPICIOUS")
    score: float = Field(..., description="ICMP covert channel suspicion score [0.0 - 1.0]")
    confidence_type: str = "evidence_score"
    total_packets: int
    icmp_packets_count: int
    flows_analyzed: int
    features: Dict[str, Any]
    flows: List[Dict[str, Any]]
    evidence: List[str]
    limitations: List[str]


# ==========================================
# Unified Platform Analysis (Frontend Contract)
# ==========================================

class UnifiedAnalysisResponse(BaseModel):
    id: str = Field(..., description="Unique case identifier, e.g. CASE-123456")
    fileName: str = Field(..., description="Name of the analyzed file")
    fileSize: str = Field(..., description="Formatted file size string")
    fileType: str = Field(..., description="IMAGE, TEXT, or NETWORK")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    dateFormatted: str = Field(..., description="Localized formatted date")
    result: str = Field(..., description="Clean, Stego, or Suspicious")
    riskLevel: str = Field(..., description="Low, Medium, or High")
    confidence: float = Field(..., description="Confidence score percentage [0 - 100]")
    findings: str = Field(..., description="Key forensic findings summary")
    recommendation: str = Field(..., description="Actionable security recommendation")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Detailed analysis metadata")


# ==========================================
# Platform Overview Schema
# ==========================================

class PlatformModulesResponse(BaseModel):
    platform: str
    version: str
    modules: Dict[str, Any]
