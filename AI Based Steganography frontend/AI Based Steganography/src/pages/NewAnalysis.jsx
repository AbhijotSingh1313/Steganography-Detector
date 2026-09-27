import React, { useState } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Network,
  UploadCloud,
  Play,
  CheckCircle2
} from 'lucide-react';
import FilePreviewCard from '../components/analysis/FilePreviewCard';
import AnalysisProgress from '../components/analysis/AnalysisProgress';
import { analysisService } from '../services/mockAnalysisService';

export default function NewAnalysis({
  selectedType: propSelectedType,
  onSelectType,
  selectedFile: propSelectedFile,
  onSelectFile,
  initialType = null,
  onAnalysisComplete,
  currentUserId
}) {
  const [localType, setLocalType] = useState(initialType);
  const [localFile, setLocalFile] = useState(null);

  const selectedType = onSelectType !== undefined ? propSelectedType : localType;
  const setSelectedType = (type) => {
    if (onSelectType) onSelectType(type);
    else setLocalType(type);
  };

  const selectedFile = onSelectFile !== undefined ? propSelectedFile : localFile;
  const setSelectedFile = (file) => {
    if (onSelectFile) onSelectFile(file);
    else setLocalFile(file);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [selectTypeWarning, setSelectTypeWarning] = useState(false);

  const analysisTypes = [
    {
      id: 'image',
      title: 'Image Analysis',
      desc: 'Detect hidden information in image bitplanes (LSB, spatial patterns, transform artifacts).',
      icon: <ImageIcon size={22} />,
      color: '#9333ea',
      formats: ['.png', '.jpg', '.jpeg', '.bmp'],
      accept: 'image/png,image/jpeg,image/bmp'
    },
    {
      id: 'text',
      title: 'Text Analysis',
      desc: 'Identify zero-width characters, invisible Unicode payloads, and steganographic spacing.',
      icon: <FileText size={22} />,
      color: '#6366f1',
      formats: ['.txt', '.docx', '.pdf'],
      accept: '.txt,.docx,.pdf,text/plain'
    },
    {
      id: 'pcap',
      title: 'Network Capture',
      desc: 'Analyze PCAP packet traces for covert communication channels and payload anomalies.',
      icon: <Network size={22} />,
      color: '#f59e0b',
      formats: ['.pcap', '.pcapng'],
      accept: '.pcap,.pcapng'
    }
  ];

  const handleFileChange = (e) => {
    if (!selectedType) return;
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const loadFile = (file) => {
    const fileObj = {
      name: file.name,
      size: file.size,
      type: file.type,
      rawFile: file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    };
    setSelectedFile(fileObj);
    setSelectTypeWarning(false);
  };

  const handleDropzoneClick = (e) => {
    if (!selectedType) {
      e.preventDefault();
      setSelectTypeWarning(true);
      setTimeout(() => setSelectTypeWarning(false), 3500);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selectedType) {
      setSelectTypeWarning(true);
      setTimeout(() => setSelectTypeWarning(false), 3500);
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!selectedType) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const startAnalysis = async () => {
    if (!selectedFile || !selectedType) return;
    setIsAnalyzing(true);

    const result = await analysisService.processAnalysis(
      selectedFile,
      selectedType,
      (stage) => setCurrentStage(stage),
      currentUserId
    );

    setIsAnalyzing(false);
    onAnalysisComplete(result);
  };

  if (isAnalyzing) {
    return (
      <AnalysisProgress
        currentStage={currentStage}
        fileName={selectedFile?.name || 'Uploaded File'}
      />
    );
  }

  const currentTypeConfig = analysisTypes.find((t) => t.id === selectedType);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* 1. Choose Domain Category */}
      <h3 style={{ fontSize: '1.35rem', fontWeight: 750, marginBottom: '14px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        Select Analysis Type
      </h3>
      <div className="analysis-type-grid">
        {analysisTypes.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              className={`type-card type-card-${type.id} ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setSelectedType(type.id);
                setSelectedFile(null);
                setSelectTypeWarning(false);
              }}
            >
              <div className="type-header">
                <div className={`type-icon-box icon-${type.id}`}>{type.icon}</div>
                {isSelected && (
                  <CheckCircle2 size={18} style={{ color: type.color }} />
                )}
              </div>
              <h4 className="type-title">{type.title}</h4>
              <p className="type-desc">{type.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 2. File Upload Dropzone */}
      <h3 style={{ fontSize: '1.35rem', fontWeight: 750, marginBottom: '14px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        Upload File
      </h3>
      <div style={{ marginBottom: '24px' }}>
        {!selectedFile ? (
          <label
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleDropzoneClick}
          >
            <input
              type="file"
              style={{ display: 'none' }}
              accept={currentTypeConfig?.accept}
              onChange={handleFileChange}
              disabled={!selectedType}
            />
            <div className="dropzone-icon-circle">
              <UploadCloud size={26} />
            </div>
            <h3>Drag &amp; Drop your file here</h3>
            <p>
              or <span className="dropzone-browse-link">browse from your device</span>
            </p>
          </label>
        ) : (
          <FilePreviewCard
            file={selectedFile}
            type={selectedType}
            onRemove={() => setSelectedFile(null)}
          />
        )}

        {selectTypeWarning && (
          <div style={{
            marginTop: '10px',
            color: '#dc2626',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Please select an Analysis Type above first.</span>
          </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        {selectedFile && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedFile(null)}
          >
            Clear File
          </button>
        )}
        <button
          type="button"
          className={`btn btn-primary btn-lg start-analysis-btn ${!selectedFile ? 'btn-disabled' : ''}`}
          disabled={!selectedFile}
          onClick={startAnalysis}
        >
          <Play size={18} />
          <span>Start Steganography Analysis</span>
        </button>
      </div>
    </div>
  );
}
