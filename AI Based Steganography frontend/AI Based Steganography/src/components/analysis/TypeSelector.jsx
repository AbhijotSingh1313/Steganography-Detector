import React from 'react';
import { Image, FileText, Network, Check } from 'lucide-react';

export default function TypeSelector({ selectedType, onSelectType }) {
  const types = [
    {
      id: 'image',
      title: 'Image',
      icon: <Image size={20} />,
      desc: 'Check image files for hidden messages or data payloads.',
      formats: ['JPG', 'JPEG', 'PNG', 'BMP']
    },
    {
      id: 'text',
      title: 'Text',
      icon: <FileText size={20} />,
      desc: 'Check text documents for hidden characters or formatting anomalies.',
      formats: ['TXT', 'DOC', 'DOCX']
    },
    {
      id: 'network',
      title: 'Network Capture',
      icon: <Network size={20} />,
      desc: 'Check network packet captures for covert communication channels.',
      formats: ['PCAP', 'PCAPNG']
    }
  ];

  return (
    <div className="analysis-type-grid">
      {types.map((type) => {
        const isSelected = selectedType === type.id;
        return (
          <div
            key={type.id}
            className={`type-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectType(type.id)}
            role="button"
            tabIndex={0}
          >
            <div className="type-header">
              <div className="type-icon-box">{type.icon}</div>
              {isSelected && <Check size={16} style={{ color: 'var(--color-primary)' }} />}
            </div>
            <h3 className="type-title">{type.title}</h3>
            <p className="type-desc">{type.desc}</p>
            <div className="type-formats">
              {type.formats.map((fmt) => (
                <span key={fmt} className="format-pill">
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
