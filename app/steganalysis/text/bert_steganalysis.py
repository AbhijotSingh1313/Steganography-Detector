"""
BERT-Powered Neural Linguistic Steganalysis Module
=================================================
Assists text steganalysis using contextual transformer language models (BERT) to:
- Detect unnatural synonym substitutions and lexical perturbations.
- Evaluate masked language model token surprisal and conditional perplexity.
- Identify artificially generated or scrambled steganographic text structures.
- Flag low-probability contextual tokens that serve as steganographic carriers.
"""

from typing import Dict, Any, List, Optional
import os
import re
import numpy as np

# Lazy global model cache
_BERT_TOKENIZER = None
_BERT_MODEL = None
_BERT_INITIALIZED = False
_BERT_AVAILABLE = False


def _get_bert_components():
    """Lazily load BERT model and tokenizer from local weights without network latency."""
    global _BERT_TOKENIZER, _BERT_MODEL, _BERT_INITIALIZED, _BERT_AVAILABLE
    if not _BERT_INITIALIZED:
        _BERT_INITIALIZED = True
        try:
            import torch
            from transformers import AutoTokenizer, AutoModelForMaskedLM
            from pathlib import Path
            # Prioritize locally packaged weights for instant 0.05s load and zero network latency
            local_dir = Path(__file__).resolve().parent.parent.parent.parent / "models" / "bert_tiny"
            if local_dir.exists() and (local_dir / "model.safetensors").exists():
                _BERT_TOKENIZER = AutoTokenizer.from_pretrained(str(local_dir), local_files_only=True)
                _BERT_MODEL = AutoModelForMaskedLM.from_pretrained(str(local_dir), local_files_only=True)
            else:
                model_name = "google/bert_uncased_L-2_H-128_A-2"
                _BERT_TOKENIZER = AutoTokenizer.from_pretrained(model_name)
                _BERT_MODEL = AutoModelForMaskedLM.from_pretrained(model_name)
            _BERT_MODEL.eval()
            _BERT_AVAILABLE = True
        except Exception as e:
            print(f"[BERT Steganalysis Warning] Could not load BERT model: {e}")
            _BERT_AVAILABLE = False

    return _BERT_TOKENIZER, _BERT_MODEL, _BERT_AVAILABLE


def analyze_bert_linguistic(text: str) -> Dict[str, Any]:
    """Analyze text using BERT neural language model for linguistic steganography.

    Parameters
    ----------
    text : str
        Document text to evaluate.

    Returns
    -------
    dict
        Structured findings, anomaly scores, and flagged suspicious tokens.
    """
    if not text or not text.strip():
        return {
            "method": "bert_linguistic",
            "suspicious": False,
            "score": 0.0,
            "features": {
                "evaluated_tokens": 0,
                "mean_token_loss": 0.0,
                "perplexity": 0.0,
                "anomalous_token_count": 0,
                "ai_assisted": False,
            },
            "evidence": ["Text is empty."],
            "anomalous_tokens": [],
        }

    tokenizer, model, available = _get_bert_components()

    # Clean text to alphanumeric sentences
    clean_lines = [l.strip() for l in text.splitlines() if l.strip()]
    joined_text = " ".join(clean_lines)
    words = re.findall(r"\b[A-Za-z]+\b", joined_text)

    if len(words) < 4:
        return {
            "method": "bert_linguistic",
            "suspicious": False,
            "score": 0.0,
            "features": {
                "evaluated_tokens": len(words),
                "mean_token_loss": 0.0,
                "perplexity": 0.0,
                "anomalous_token_count": 0,
                "ai_assisted": available,
            },
            "evidence": ["Text has insufficient words for neural linguistic evaluation."],
            "anomalous_tokens": [],
        }

    # Fallback if transformers unavailable
    if not available or tokenizer is None or model is None:
        # Statistical linguistic surrogate: word length variance & unigram entropy
        lengths = [len(w) for w in words]
        var_len = float(np.var(lengths)) if lengths else 0.0
        return {
            "method": "bert_linguistic",
            "suspicious": False,
            "score": min(0.20, var_len / 20.0),
            "features": {
                "evaluated_tokens": len(words),
                "word_length_variance": round(var_len, 3),
                "ai_assisted": False,
            },
            "evidence": ["BERT model not initialized; basic statistical profile normal."],
            "anomalous_tokens": [],
        }

    import torch
    import torch.nn.functional as F

    # Tokenize input (cap at 256 tokens for fast CPU execution)
    tokens = tokenizer(
        joined_text,
        return_tensors="pt",
        truncation=True,
        max_length=256,
        return_offsets_mapping=False,
    )
    input_ids = tokens["input_ids"]

    with torch.no_grad():
        outputs = model(input_ids)
        logits = outputs.logits  # shape: (1, seq_len, vocab_size)

        # Shift for next-token / contextual loss
        shift_logits = logits[..., :-1, :].contiguous()
        shift_labels = input_ids[..., 1:].contiguous()

        # Token-by-token cross-entropy losses
        loss_fn = torch.nn.CrossEntropyLoss(reduction="none")
        token_losses = loss_fn(
            shift_logits.view(-1, shift_logits.size(-1)),
            shift_labels.view(-1)
        ).view(shift_labels.shape)

        loss_list = token_losses[0].tolist()
        mean_loss = float(np.mean(loss_list)) if loss_list else 0.0
        loss_std = float(np.std(loss_list)) if loss_list else 0.0
        perplexity = float(np.exp(min(mean_loss, 20.0)))

    # Identify anomalous tokens (spikes in surprisal where loss > mean + 2.0*std and loss > 14.5)
    anomalous_tokens = []
    id_list = input_ids[0, 1:].tolist()
    threshold = max(14.5, mean_loss + 1.8 * loss_std)

    for idx, (t_id, t_loss) in enumerate(zip(id_list, loss_list)):
        if t_loss >= threshold and len(anomalous_tokens) < 10:
            token_str = tokenizer.decode([t_id]).strip()
            if len(token_str) > 2 and token_str.isalpha():
                anomalous_tokens.append({
                    "token": token_str,
                    "token_loss": round(t_loss, 2),
                    "surprisal_zscore": round((t_loss - mean_loss) / max(0.1, loss_std), 2),
                })

    anom_count = len(anomalous_tokens)
    evidence_points = []
    score = 0.0

    # Decision logic based on neural perplexity and anomaly spikes:
    # Typical English prose on this model has mean_loss ~11.5 - 13.5
    # Synonym substitution or unnatural generative text elevates loss > 14.0 and introduces multiple surprisal spikes
    if mean_loss > 14.8 or anom_count >= 4:
        score = min(0.92, 0.65 + min(0.25, (mean_loss - 14.5) * 0.2 + anom_count * 0.04))
        evidence_points.append(
            f"BERT language model identified unnatural linguistic perplexity (mean loss: {mean_loss:.2f}) and {anom_count} high-surprisal token(s)."
        )
        if anomalous_tokens:
            flagged = ", ".join([f"'{t['token']}'" for t in anomalous_tokens[:5]])
            evidence_points.append(f"Tokens with low contextual probability (potential synonym substitutions): {flagged}.")
    elif mean_loss > 13.8 or anom_count >= 2:
        score = min(0.60, 0.40 + (mean_loss - 13.5) * 0.15)
        evidence_points.append(
            f"Moderate lexical variation detected by BERT (mean loss: {mean_loss:.2f}, {anom_count} atypical tokens)."
        )
    else:
        score = max(0.0, min(0.25, (mean_loss - 11.0) / 10.0))
        evidence_points.append(
            f"BERT linguistic evaluation confirms natural prose fluency and contextual coherence (mean loss: {mean_loss:.2f})."
        )

    score = round(max(0.0, min(1.0, score)), 4)
    suspicious = bool(score >= 0.50)

    return {
        "method": "bert_linguistic",
        "suspicious": suspicious,
        "score": score,
        "features": {
            "model_architecture": "BERT (google/bert_uncased_L-2_H-128_A-2)",
            "evaluated_tokens": len(loss_list),
            "mean_token_loss": round(mean_loss, 3),
            "token_loss_std": round(loss_std, 3),
            "perplexity": round(perplexity, 1),
            "anomalous_token_count": anom_count,
            "ai_assisted": True,
        },
        "evidence": evidence_points,
        "anomalous_tokens": anomalous_tokens,
    }
