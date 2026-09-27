import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Network,
  Cpu,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import '../../styles/forensicHero.css';

export default function ForensicHeroVisual({ onSelectDomain }) {
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  
  // Random Scanning Events State (Section 10)
  // 'idle' | 'image_event' | 'network_event' | 'doc_event'
  const [activeEvent, setActiveEvent] = useState('idle');
  const [eventNotification, setEventNotification] = useState('AI Forensic Scan Active');
  const [isDetectedEvent, setIsDetectedEvent] = useState(false);

  // Mouse Parallax Listener (Section 8: Subtle 2-5px depth offset)
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setMouseOffset({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Randomized Periodic Forensic Scanning Events (Section 10: every 7-10s)
  useEffect(() => {
    const events = ['image_event', 'network_event', 'doc_event'];
    const timer = setInterval(() => {
      const nextEvent = events[Math.floor(Math.random() * events.length)];
      setActiveEvent(nextEvent);

      if (nextEvent === 'image_event') {
        setIsDetectedEvent(true);
        setEventNotification('Hidden Payload Detected (LSB+0)');
      } else if (nextEvent === 'network_event') {
        setIsDetectedEvent(true);
        setEventNotification('Suspicious Packet Detected (PCAP)');
      } else {
        setIsDetectedEvent(true);
        setEventNotification('Zero-Width Unicode Detected');
      }

      // Revert back to idle scanning after 3.6s
      setTimeout(() => {
        setActiveEvent('idle');
        setIsDetectedEvent(false);
        setEventNotification('AI Forensic Scan Active');
      }, 3600);
    }, 8500);

    return () => clearInterval(timer);
  }, []);

  // Constellation Nodes Array (Section 2: ~20 nodes)
  const constellationPoints = [
    { id: 1, x: 75, y: 110 },
    { id: 2, x: 135, y: 195 },
    { id: 3, x: 230, y: 95 },
    { id: 4, x: 335, y: 70 },
    { id: 5, x: 505, y: 85 },
    { id: 6, x: 635, y: 125 },
    { id: 7, x: 745, y: 155 },
    { id: 8, x: 775, y: 260 },
    { id: 9, x: 715, y: 355 },
    { id: 10, x: 755, y: 485 },
    { id: 11, x: 655, y: 550 },
    { id: 12, x: 515, y: 570 },
    { id: 13, x: 345, y: 560 },
    { id: 14, x: 220, y: 535 },
    { id: 15, x: 90, y: 495 },
    { id: 16, x: 80, y: 320 },
    { id: 17, x: 245, y: 245 },
    { id: 18, x: 595, y: 240 },
    { id: 19, x: 575, y: 405 },
    { id: 20, x: 265, y: 395 }
  ];

  // Ambient Data Field Items (Section 1: Distributed across the entire right canvas)
  const ambientDataItems = [
    { text: '01', x: 290, y: 115 },
    { text: '0x4F', x: 670, y: 90 },
    { text: 'FF', x: 730, y: 210 },
    { text: '1011', x: 765, y: 320 },
    { text: '0xA3', x: 710, y: 440 },
    { text: 'U+200B', x: 620, y: 525 },
    { text: '0x2E', x: 440, y: 580 },
    { text: '00', x: 160, y: 565 },
    { text: 'SIG:', x: 50, y: 430 },
    { text: '010', x: 60, y: 215 },
    { text: '{ }', x: 480, y: 135 },
    { text: 'HEX', x: 660, y: 280 }
  ];

  return (
    <div
      ref={containerRef}
      className="forensic-hero-canvas-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="StegXplore AI Forensic Data Field & Multimedia Scanner"
    >
      {/* 1. Large Ambient Radial Glows (Fades into white/lavender page) */}
      <div className="forensic-ambient-glow" />

      {/* 2. Parallax Layer 1 (Background Grid & Constellation: ~2-3px offset) */}
      <div
        className="parallax-layer"
        style={{
          transform: `translate(${mouseOffset.x * 2.5}px, ${mouseOffset.y * 2.5}px)`
        }}
      >
        <svg
          className="forensic-svg-canvas"
          viewBox="0 0 820 620"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Subtle Forensic CAD Grid Pattern (Section 9) */}
            <pattern id="forensicGridPattern" width="46" height="46" patternUnits="userSpaceOnUse">
              <path d="M 46 0 L 0 0 0 46" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="1.2" fill="currentColor" opacity="0.6" />
            </pattern>

            {/* Radial Mask so the grid gently dissolves before reaching headings */}
            <mask id="gridRadialMask">
              <radialGradient id="gridMaskGrad" cx="50%" cy="50%" r="52%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="90%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <rect x="0" y="0" width="820" height="620" fill="url(#gridMaskGrad)" />
            </mask>

            {/* Conical radar sweep gradient */}
            <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(192, 132, 252, 0.45)" />
              <stop offset="65%" stopColor="rgba(139, 92, 246, 0.12)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
            </linearGradient>
          </defs>

          {/* Masked Technical Grid */}
          <rect
            x="0"
            y="0"
            width="820"
            height="620"
            fill="url(#forensicGridPattern)"
            mask="url(#gridRadialMask)"
            className="forensic-bg-grid"
          />

          {/* Constellation Network Connections (Section 2: 3-8% opacity) */}
          <g opacity="0.85">
            <line x1="75" y1="110" x2="135" y2="195" className="constellation-line" />
            <line x1="135" y1="195" x2="245" y2="245" className="constellation-line" />
            <line x1="230" y1="95" x2="335" y2="70" className="constellation-line" />
            <line x1="335" y1="70" x2="505" y2="85" className="constellation-line" />
            <line x1="505" y1="85" x2="635" y2="125" className="constellation-line" />
            <line x1="635" y1="125" x2="745" y2="155" className="constellation-line" />
            <line x1="745" y1="155" x2="775" y2="260" className="constellation-line" />
            <line x1="775" y1="260" x2="715" y2="355" className="constellation-line" />
            <line x1="715" y1="355" x2="595" y2="240" className="constellation-line" />
            <line x1="715" y1="355" x2="755" y2="485" className="constellation-line" />
            <line x1="755" y1="485" x2="655" y2="550" className="constellation-line" />
            <line x1="655" y1="550" x2="515" y2="570" className="constellation-line" />
            <line x1="515" y1="570" x2="345" y2="560" className="constellation-line" />
            <line x1="345" y1="560" x2="220" y2="535" className="constellation-line" />
            <line x1="220" y1="535" x2="90" y2="495" className="constellation-line" />
            <line x1="90" y1="495" x2="80" y2="320" className="constellation-line" />
            <line x1="80" y1="320" x2="135" y2="195" className="constellation-line" />
            <line x1="265" y1="395" x2="220" y2="535" className="constellation-line" />
            <line x1="575" y1="405" x2="655" y2="550" className="constellation-line" />
            <line x1="595" y1="240" x2="505" y2="85" className="constellation-line" />

            {/* Constellation Nodes */}
            {constellationPoints.map((pt) => (
              <circle
                key={pt.id}
                cx={pt.x}
                cy={pt.y}
                r="2.2"
                className="constellation-node"
                style={{ animationDelay: `${(pt.id * 0.35) % 4}s` }}
              />
            ))}
          </g>

          {/* Large Scanner Waves (Section 6: expanding 60-80% of area) */}
          <circle
            cx="410"
            cy="310"
            r="80"
            fill="none"
            className="large-scanner-wave-1 large-wave-stroke"
          />
          <circle
            cx="410"
            cy="310"
            r="80"
            fill="none"
            className="large-scanner-wave-2 large-wave-stroke"
          />

          {/* Ambient Extended Network Branches (Section 5) */}
          <path
            d="M 580 310 Q 660 210, 755 230"
            className="network-ambient-branch"
          />
          <path
            d="M 580 310 Q 690 390, 765 420"
            className="network-ambient-branch"
          />
          {/* Ambient Packets travelling on extended branches */}
          <circle r="2.2" className="stream-particle" opacity="0.6">
            <animateMotion
              dur="4.5s"
              repeatCount="indefinite"
              path="M 580 310 Q 660 210, 755 230"
            />
          </circle>
          <circle r="2.2" className="stream-particle" opacity="0.6">
            <animateMotion
              dur="5.2s"
              repeatCount="indefinite"
              path="M 580 310 Q 690 390, 765 420"
            />
          </circle>

          {/* Ambient Data Field Text (Section 1) */}
          {ambientDataItems.map((item, idx) => (
            <text
              key={idx}
              x={item.x}
              y={item.y}
              className="ambient-data-text"
              style={{ animationDelay: `${idx * 0.5}s` }}
            >
              {item.text}
            </text>
          ))}
          {/* Ambient Tiny Dots */}
          {[
            { x: 195, y: 150 },
            { x: 310, y: 180 },
            { x: 530, y: 190 },
            { x: 670, y: 220 },
            { x: 690, y: 380 },
            { x: 490, y: 460 },
            { x: 320, y: 440 },
            { x: 185, y: 460 }
          ].map((dot, idx) => (
            <circle
              key={`dot-${idx}`}
              cx={dot.x}
              cy={dot.y}
              r="1.8"
              className="ambient-dot"
              style={{ animationDelay: `${idx * 0.4}s` }}
            />
          ))}
        </svg>
      </div>

      {/* 3. Parallax Layer 2 (Data Streams & Central Rings: ~4-5px offset) */}
      <div
        className="parallax-layer"
        style={{
          transform: `translate(${mouseOffset.x * 4.2}px, ${mouseOffset.y * 4.2}px)`
        }}
      >
        <svg
          className="forensic-svg-canvas"
          viewBox="0 0 820 620"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Telemetry Ring with Radar Marks */}
          <g className="ring-outer-telemetry">
            <circle
              cx="410"
              cy="310"
              r="134"
              stroke="rgba(167, 139, 250, 0.2)"
              strokeWidth="1"
              strokeDasharray="2 8"
            />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = 410 + 130 * Math.cos(rad);
              const y1 = 310 + 130 * Math.sin(rad);
              const x2 = 410 + 138 * Math.cos(rad);
              const y2 = 310 + 138 * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(192, 132, 252, 0.35)"
                  strokeWidth="1.2"
                />
              );
            })}
          </g>

          {/* Counter-Rotating Segmented Scanner Ring */}
          <g className="ring-dashed-scanner">
            <circle
              cx="410"
              cy="310"
              r="102"
              stroke="rgba(139, 92, 246, 0.28)"
              strokeWidth="1.5"
              strokeDasharray="20 14 6 14"
            />
            <circle
              cx="410"
              cy="310"
              r="84"
              stroke="rgba(167, 139, 250, 0.22)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </g>

          {/* Radar Conical Sweep Slice */}
          <g className="ring-radar-sweep">
            <path
              d="M 410 310 L 485 235 A 106 106 0 0 1 516 310 Z"
              fill="url(#radarSweepGrad)"
            />
          </g>

          {/* Outward Travelling Radar Pulse Waves */}
          <circle
            cx="410"
            cy="310"
            r="50"
            fill="none"
            stroke="rgba(192, 132, 252, 0.45)"
            className="radar-pulse-wave"
          />
          <circle
            cx="410"
            cy="310"
            r="50"
            fill="none"
            stroke="rgba(167, 139, 250, 0.4)"
            className="radar-pulse-wave-delayed"
          />

          {/* Central Reticle Ticks */}
          <g opacity="0.6">
            <line x1="410" y1="262" x2="410" y2="358" stroke="rgba(167, 139, 250, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="362" y1="310" x2="458" y2="310" stroke="rgba(167, 139, 250, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          {/* ----------------------------------------------------------- */}
          {/* Animated Data Paths (Image, Document, Network -> AI Core)   */}
          {/* ----------------------------------------------------------- */}

          {/* Path 1: Image Node -> AI Core */}
          <path
            id="pathImage"
            className={`data-path-base ${hoveredNode === 'image' || activeEvent === 'image_event' ? 'path-highlighted' : ''}`}
            d="M 180 130 C 255 145, 305 215, 355 272"
          />
          <circle
            r={activeEvent === 'image_event' ? '4.2' : '3.2'}
            className={`stream-particle ${hoveredNode === 'image' ? 'particle-fast' : ''} ${activeEvent === 'image_event' ? 'particle-event-flagged' : ''}`}
          >
            <animateMotion
              dur={hoveredNode === 'image' || activeEvent === 'image_event' ? '1.3s' : '2.4s'}
              repeatCount="indefinite"
              path="M 180 130 C 255 145, 305 215, 355 272"
            />
          </circle>
          <circle r="2.2" className="stream-particle" opacity="0.75">
            <animateMotion
              dur={hoveredNode === 'image' || activeEvent === 'image_event' ? '1.3s' : '2.4s'}
              begin="1.1s"
              repeatCount="indefinite"
              path="M 180 130 C 255 145, 305 215, 355 272"
            />
          </circle>

          {/* Path 2: Document Node -> AI Core */}
          <path
            id="pathDocument"
            className={`data-path-base ${hoveredNode === 'document' || activeEvent === 'doc_event' ? 'path-highlighted' : ''}`}
            d="M 180 490 C 255 475, 305 405, 355 348"
          />
          <circle
            r={activeEvent === 'doc_event' ? '4.2' : '3.2'}
            className={`stream-particle ${hoveredNode === 'document' ? 'particle-fast' : ''} ${activeEvent === 'doc_event' ? 'particle-event-flagged' : ''}`}
          >
            <animateMotion
              dur={hoveredNode === 'document' || activeEvent === 'doc_event' ? '1.3s' : '2.6s'}
              repeatCount="indefinite"
              path="M 180 490 C 255 475, 305 405, 355 348"
            />
          </circle>
          <circle r="2.2" className="stream-particle" opacity="0.75">
            <animateMotion
              dur={hoveredNode === 'document' || activeEvent === 'doc_event' ? '1.3s' : '2.6s'}
              begin="1.2s"
              repeatCount="indefinite"
              path="M 180 490 C 255 475, 305 405, 355 348"
            />
          </circle>

          {/* Path 3: Network Node -> AI Core */}
          <path
            id="pathNetwork"
            className={`data-path-base ${hoveredNode === 'network' || activeEvent === 'network_event' ? 'path-highlighted' : ''}`}
            d="M 640 310 C 570 310, 520 310, 465 310"
          />
          <circle
            r={activeEvent === 'network_event' ? '4.5' : '3.2'}
            className={`stream-particle ${hoveredNode === 'network' ? 'particle-fast' : ''} ${activeEvent === 'network_event' ? 'particle-event-flagged' : ''}`}
          >
            <animateMotion
              dur={hoveredNode === 'network' || activeEvent === 'network_event' ? '1.2s' : '2.2s'}
              repeatCount="indefinite"
              path="M 640 310 C 570 310, 520 310, 465 310"
            />
          </circle>
          <circle r="2.2" className="stream-particle" opacity="0.75">
            <animateMotion
              dur={hoveredNode === 'network' || activeEvent === 'network_event' ? '1.2s' : '2.2s'}
              begin="1.0s"
              repeatCount="indefinite"
              path="M 640 310 C 570 310, 520 310, 465 310"
            />
          </circle>
        </svg>
      </div>

      {/* 4. Central AI Core Hub (Parallax: ~1-2px offset) */}
      <div
        className="forensic-core-hub"
        style={{
          transform: `translate(-50%, -50%) translate(${mouseOffset.x * 1.5}px, ${mouseOffset.y * 1.5}px)`
        }}
      >
        <div
          className={`core-nucleus-capsule ${isDetectedEvent ? 'core-event-active' : ''}`}
        >
          <div className="core-icon-pulse">
            <Cpu size={33} strokeWidth={1.75} />
          </div>
          <span className="core-title">AI Scanner</span>
          <span className="core-subtitle">Forensic Core</span>
        </div>

        {/* Dynamic Status Pill */}
        <div
          className={`core-status-pill ${
            isDetectedEvent ? 'status-detected' : 'status-scanning'
          }`}
        >
          <span
            className={`status-dot-pulse ${
              isDetectedEvent ? 'dot-orange' : ''
            }`}
          />
          <span>{eventNotification}</span>
        </div>
      </div>

      {/* 5. Parallax Layer 3: Interactive Glass Domain Cards (~1.8px offset) */}
      <div
        className="parallax-layer parallax-layer-cards"
        style={{
          transform: `translate(${mouseOffset.x * 1.8}px, ${mouseOffset.y * 1.8}px)`
        }}
      >
        {/* Node 1: Image Steganography (Top-Left) */}
        <div
          className={`floating-domain-node node-image ${
            hoveredNode === 'image' || activeEvent === 'image_event' ? 'node-active' : ''
          }`}
          onMouseEnter={() => setHoveredNode('image')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Micro ambient pixel cloud (Section 3) */}
          <div className="ambient-pixel-cloud">
            <div className="cloud-pixel" />
            <div className="cloud-pixel" />
            <div className="cloud-pixel" />
          </div>

          <div className="node-header-row">
            <div className="node-icon-box">
              <ImageIcon size={16} />
            </div>
            <div className="node-title-group">
              <span className="node-category-tag">Media 01</span>
              <span className="node-title-text">Image Stego</span>
            </div>
          </div>

          <div className="node-detail-tray">
            <span className="node-subtext">LSB Bitplanes</span>
            {/* 3x3 Micro Pixel Grid with stego alteration highlight */}
            <div className="micro-pixel-grid">
              <div className="pixel-cell" />
              <div className="pixel-cell" />
              <div className="pixel-cell" />
              <div className="pixel-cell" />
              <div className="pixel-cell pixel-steg" />
              <div className="pixel-cell" />
              <div className="pixel-cell" />
              <div className="pixel-cell" />
              <div className="pixel-cell pixel-steg" />
            </div>
          </div>
        </div>

        {/* Node 2: Text Steganography (Bottom-Left) */}
        <div
          className={`floating-domain-node node-document ${
            hoveredNode === 'document' || activeEvent === 'doc_event' ? 'node-active' : ''
          }`}
          onMouseEnter={() => setHoveredNode('document')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Ambient Document/Text Fragments (Section 4) */}
          <div className="ambient-doc-fragments">
            <span>\u200B</span>
          </div>

          <div className="node-header-row">
            <div className="node-icon-box">
              <FileText size={16} />
            </div>
            <div className="node-title-group">
              <span className="node-category-tag">Media 02</span>
              <span className="node-title-text">Text Stego</span>
            </div>
          </div>

          <div className="node-detail-tray">
            <span className="node-subtext">Unicode / Spaces</span>
            <span className="micro-binary-indicator">
              0101 \u200B
            </span>
          </div>
        </div>

        {/* Node 3: Network Steganography (Right-Center) */}
        <div
          className={`floating-domain-node node-network ${
            hoveredNode === 'network' || activeEvent === 'network_event' ? 'node-active' : ''
          }`}
          onMouseEnter={() => setHoveredNode('network')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div className="node-header-row">
            <div className="node-icon-box">
              <Network size={16} />
            </div>
            <div className="node-title-group">
              <span className="node-category-tag">Media 03</span>
              <span className="node-title-text">Network Stego</span>
            </div>
          </div>

          <div className="node-detail-tray">
            <span className="node-subtext">PCAP Channels</span>
            <div className="micro-network-pulse">
              <div className="net-dot active" />
              <div className="net-dot" />
              <div className="net-dot active" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
