// Data definitions for StegoDetect AI
export const SUPPORTED_TYPES = {
  image: {
    title: 'Image',
    description: 'Check image files for hidden messages or data payloads.',
    formats: ['JPG', 'JPEG', 'PNG', 'BMP']
  },
  text: {
    title: 'Text',
    description: 'Check text documents for hidden characters or formatting anomalies.',
    formats: ['TXT', 'DOC', 'DOCX']
  },
  network: {
    title: 'Network Capture',
    description: 'Check network packet captures for covert communication channels.',
    formats: ['PCAP', 'PCAPNG']
  }
};
