document.addEventListener("DOMContentLoaded", () => {
  // Tab Navigation
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });

  // ==========================================
  // MODULE 1: IMAGE STEGANALYSIS
  // ==========================================
  const imgDropZone = document.getElementById("image-drop-zone");
  const imgFileInput = document.getElementById("image-file-input");
  const imgAnalyzeBtn = document.getElementById("image-analyze-btn");
  const imgPreviewContainer = document.getElementById("image-preview-container");
  const imgPreview = document.getElementById("image-preview");
  const imgFilename = document.getElementById("image-filename");

  let selectedImageFile = null;

  imgDropZone.addEventListener("click", () => imgFileInput.click());
  imgDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    imgDropZone.classList.add("dragover");
  });
  imgDropZone.addEventListener("dragleave", () => imgDropZone.classList.remove("dragover"));
  imgDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    imgDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleImageSelection(e.dataTransfer.files[0]);
    }
  });

  imgFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleImageSelection(e.target.files[0]);
    }
  });

  function handleImageSelection(file) {
    selectedImageFile = file;
    imgFilename.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      imgPreview.src = e.target.result;
      imgPreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
    imgAnalyzeBtn.disabled = false;
  }

  imgAnalyzeBtn.addEventListener("click", async () => {
    if (!selectedImageFile) return;
    imgAnalyzeBtn.disabled = true;
    imgAnalyzeBtn.textContent = "Analyzing Image...";

    const formData = new FormData();
    formData.append("file", selectedImageFile);

    try {
      const resp = await fetch("/predict", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert("Image analysis error: " + (err.detail || "Server error"));
        return;
      }

      const data = await resp.json();
      renderImageResults(data);
    } catch (e) {
      alert("Network request failed: " + e.message);
    } finally {
      imgAnalyzeBtn.disabled = false;
      imgAnalyzeBtn.textContent = "Analyze Image";
    }
  });

  function renderImageResults(data) {
    document.getElementById("image-placeholder").classList.add("hidden");
    const content = document.getElementById("image-results-content");
    content.classList.remove("hidden");

    const banner = document.getElementById("image-verdict-banner");
    banner.className = "verdict-banner " + (data.prediction === "STEGO" ? "stego" : "clean");

    document.getElementById("image-prediction").textContent = data.prediction;
    document.getElementById("image-confidence").textContent = (data.confidence * 100).toFixed(1) + "%";

    document.getElementById("ai-pred").textContent = data.ai.prediction;
    document.getElementById("ai-prob").textContent = (data.ai.probability * 100).toFixed(1) + "%";
    document.getElementById("ai-conf").textContent = (data.ai.confidence * 100).toFixed(1) + "%";

    document.getElementById("trad-mean").textContent = data.traditional.lsb_mean.toFixed(4);
    document.getElementById("trad-entropy").textContent = data.traditional.bit_entropy.toFixed(4);
    document.getElementById("trad-score").textContent = data.traditional.traditional_score.toFixed(3);

    const evList = document.getElementById("image-evidence-list");
    evList.innerHTML = "";
    (data.explanations || []).forEach((exp) => {
      const li = document.createElement("li");
      li.textContent = exp;
      evList.appendChild(li);
    });
  }

  // ==========================================
  // MODULE 2: TEXT STEGANALYSIS
  // ==========================================
  const textInput = document.getElementById("text-input");
  const textFileInput = document.getElementById("text-file-input");
  const textAnalyzeBtn = document.getElementById("text-analyze-btn");

  const SAMPLE_NORMAL = `Digital forensics is the application of scientific investigation techniques to digital devices.
Investigators preserve, identify, extract, and document digital evidence in a forensically sound manner.
Standard documents maintain natural spacing without synthetic variations.`;

  const SAMPLE_WS = `Federal cybersecurity guidelines emphasize layered defense.   \t
Security audits require rigorous forensic logging across all systems.\t \t
Network perimeters must inspect anomalous traffic flows regularly.  \t \nEndpoint protection suites should monitor unauthorized bit modifications.\t\t  `;

  const SAMPLE_WORD = `Digital  forensics  investigators analyze   various   types of  media.
Steganography  attempts  to  hide   the very  existence  of  covert   data.
Statistical  spacing  distributions   can reveal   artificial   binary states.`;

  document.getElementById("sample-normal").addEventListener("click", () => {
    textInput.value = SAMPLE_NORMAL;
  });
  document.getElementById("sample-ws").addEventListener("click", () => {
    textInput.value = SAMPLE_WS;
  });
  document.getElementById("sample-word").addEventListener("click", () => {
    textInput.value = SAMPLE_WORD;
  });

  textFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        textInput.value = evt.target.result;
      };
      reader.readAsText(file);
    }
  });

  textAnalyzeBtn.addEventListener("click", async () => {
    const textVal = textInput.value;
    if (!textVal.trim()) {
      alert("Please enter text or upload a .txt file first.");
      return;
    }

    textAnalyzeBtn.disabled = true;
    textAnalyzeBtn.textContent = "Analyzing Text...";

    try {
      const resp = await fetch("/api/steganalysis/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textVal }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert("Text analysis error: " + (err.detail || "Server error"));
        return;
      }

      const data = await resp.json();
      renderTextResults(data);
    } catch (e) {
      alert("Request failed: " + e.message);
    } finally {
      textAnalyzeBtn.disabled = false;
      textAnalyzeBtn.textContent = "Analyze Text";
    }
  });

  function renderTextResults(data) {
    document.getElementById("text-placeholder").classList.add("hidden");
    const content = document.getElementById("text-results-content");
    content.classList.remove("hidden");

    const banner = document.getElementById("text-verdict-banner");
    banner.className = "verdict-banner " + (data.prediction === "SUSPICIOUS" ? "suspicious" : "clean");

    document.getElementById("text-prediction").textContent = data.prediction;
    document.getElementById("text-score").textContent = data.score.toFixed(3);

    // Whitespace
    const ws = data.methods.whitespace;
    document.getElementById("ws-suspicious").textContent = ws.suspicious ? "Yes" : "No";
    document.getElementById("ws-score").textContent = ws.score.toFixed(2);
    document.getElementById("ws-trailing").textContent = ws.features.trailing_lines_count;

    // Word-Shift
    const word = data.methods.word_shift;
    document.getElementById("word-suspicious").textContent = word.suspicious ? "Yes" : "No";
    document.getElementById("word-score").textContent = word.score.toFixed(2);
    document.getElementById("word-ratio").textContent = (word.features.multi_space_ratio * 100).toFixed(1) + "%";

    // Line-Shift
    const line = data.methods.line_shift;
    document.getElementById("line-suspicious").textContent = line.suspicious ? "Yes" : "No";
    document.getElementById("line-score").textContent = line.score.toFixed(2);
    document.getElementById("line-blank").textContent = line.features.blank_lines_count;

    const evList = document.getElementById("text-evidence-list");
    evList.innerHTML = "";
    (data.evidence || []).forEach((ev) => {
      const li = document.createElement("li");
      li.textContent = ev;
      evList.appendChild(li);
    });
  }

  // ==========================================
  // MODULE 3: NETWORK STEGANALYSIS
  // ==========================================
  const pcapDropZone = document.getElementById("pcap-drop-zone");
  const pcapFileInput = document.getElementById("pcap-file-input");
  const pcapAnalyzeBtn = document.getElementById("pcap-analyze-btn");
  const pcapPreviewContainer = document.getElementById("pcap-preview-container");
  const pcapFilename = document.getElementById("pcap-filename");

  let selectedPcapFile = null;

  pcapDropZone.addEventListener("click", () => pcapFileInput.click());
  pcapDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    pcapDropZone.classList.add("dragover");
  });
  pcapDropZone.addEventListener("dragleave", () => pcapDropZone.classList.remove("dragover"));
  pcapDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    pcapDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handlePcapSelection(e.dataTransfer.files[0]);
    }
  });

  pcapFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handlePcapSelection(e.target.files[0]);
    }
  });

  function handlePcapSelection(file) {
    selectedPcapFile = file;
    pcapFilename.textContent = file.name;
    pcapPreviewContainer.classList.remove("hidden");
    pcapAnalyzeBtn.disabled = false;
  }

  pcapAnalyzeBtn.addEventListener("click", async () => {
    if (!selectedPcapFile) return;
    pcapAnalyzeBtn.disabled = true;
    pcapAnalyzeBtn.textContent = "Analyzing PCAP...";

    const formData = new FormData();
    formData.append("file", selectedPcapFile);

    try {
      const resp = await fetch("/api/steganalysis/network", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert("PCAP analysis error: " + (err.detail || "Server error"));
        return;
      }

      const data = await resp.json();
      renderNetworkResults(data);
    } catch (e) {
      alert("Request failed: " + e.message);
    } finally {
      pcapAnalyzeBtn.disabled = false;
      pcapAnalyzeBtn.textContent = "Analyze Packet Capture";
    }
  });

  function renderNetworkResults(data) {
    document.getElementById("network-placeholder").classList.add("hidden");
    const content = document.getElementById("network-results-content");
    content.classList.remove("hidden");

    const banner = document.getElementById("network-verdict-banner");
    let cls = "clean";
    if (data.prediction === "SUSPICIOUS") cls = "stego";
    else if (data.prediction === "MODERATE_EVIDENCE") cls = "suspicious";
    banner.className = "verdict-banner " + cls;

    document.getElementById("network-prediction").textContent = data.prediction;
    document.getElementById("network-score").textContent = data.score.toFixed(3);

    document.getElementById("net-total-pkts").textContent = data.total_packets;
    document.getElementById("net-icmp-pkts").textContent = data.icmp_packets_count;
    document.getElementById("net-flows").textContent = data.flows_analyzed;
    document.getElementById("net-entropy").textContent = data.features.avg_payload_entropy.toFixed(2);

    const evList = document.getElementById("network-evidence-list");
    evList.innerHTML = "";
    (data.evidence || []).forEach((ev) => {
      const li = document.createElement("li");
      li.textContent = ev;
      evList.appendChild(li);
    });
  }
});