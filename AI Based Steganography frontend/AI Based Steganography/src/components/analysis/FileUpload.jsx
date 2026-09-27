import React, { useRef, useState } from 'react';
import { UploadCloud, Play } from 'lucide-react';
import FilePreviewCard from './FilePreviewCard';

export default function FileUpload({
  fileType,
  selectedFile,
  onFileSelect,
  onFileRemove,
  onStartAnalysis,
  isAnalyzing
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const getAcceptTypes = () => {
    switch (fileType) {
      case 'image':
        return '.jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp';
      case 'text':
        return '.txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'network':
        return '.pcap,.pcapng,application/vnd.tcpdump.pcap,application/octet-stream';
      default:
        return '*/*';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    let previewUrl = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    onFileSelect({
      name: file.name,
      size: file.size,
      type: file.type || fileType,
      rawFile: file,
      previewUrl: previewUrl
    });
  };

  const getFormatLabel = () => {
    if (fileType === 'image') return 'JPG, PNG, or BMP';
    if (fileType === 'text') return 'TXT, DOC, or DOCX';
    return 'PCAP or PCAPNG';
  };

  return (
    <div>
      {!selectedFile ? (
        <div
          className={`dropzone ${isDragOver ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
          <div className="dropzone-icon-circle">
            <UploadCloud size={28} />
          </div>
          <h3>Drag and drop your file here</h3>
          <p>Supports {getFormatLabel()} files</p>
          <button className="btn btn-secondary btn-sm" type="button">
            Browse Files
          </button>
        </div>
      ) : (
        <div>
          <FilePreviewCard
            file={selectedFile}
            fileType={fileType}
            onRemove={onFileRemove}
          />

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={onStartAnalysis}
              disabled={isAnalyzing}
              type="button"
            >
              <Play size={16} />
              <span>Start Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
