import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  File as FileIcon
} from 'lucide-react';

const MaterialViewer = ({ material, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!material) return null;

  const renderContent = () => {
    switch (material.material_type) {
      case 'TEXT':
        return (
          <div className="bg-white/10 rounded-lg p-6 max-h-[70vh] overflow-y-auto">
            <pre className="text-white whitespace-pre-wrap font-sans">
              {material.text_content || material.extracted_text || 'No content available'}
            </pre>
          </div>
        );

      case 'YOUTUBE':
        const videoId = extractYouTubeId(material.url);
        return (
          <div className="relative pb-[56.25%] h-0">
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={material.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'PDF':
        return (
          <div className="bg-white/10 rounded-lg p-6">
            <div className="mb-4 text-center">
              <p className="text-white mb-2">PDF Viewer</p>
              <p className="text-sm text-gray-400">
                For full functionality, please download the file
              </p>
            </div>
            {material.file_path ? (
              <embed
                src={material.file_path}
                type="application/pdf"
                className="w-full h-[70vh] rounded-lg"
              />
            ) : material.extracted_text ? (
              <div className="max-h-[60vh] overflow-y-auto">
                <pre className="text-white whitespace-pre-wrap text-sm">
                  {material.extracted_text}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>PDF preview not available</p>
              </div>
            )}
          </div>
        );

      case 'PPTX':
      case 'DOCX':
        return (
          <div className="bg-white/10 rounded-lg p-6">
            <div className="text-center mb-6">
              <FileIcon size={64} className="mx-auto mb-4 text-blue-400" />
              <p className="text-white text-lg mb-2">
                {material.material_type === 'PPTX' ? 'PowerPoint' : 'Word Document'}
              </p>
              <p className="text-sm text-gray-400">
                Preview not available in browser. Please download to view.
              </p>
            </div>

            {material.extracted_text && (
              <div className="bg-black/30 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                <p className="text-xs text-gray-400 mb-3">Extracted Text Preview:</p>
                <pre className="text-white whitespace-pre-wrap text-sm">
                  {material.extracted_text}
                </pre>
              </div>
            )}

            {material.file_path && (
              <div className="mt-4 text-center">
                <a
                  href={material.file_path}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Download size={20} />
                  Download File
                </a>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-white/10 rounded-lg p-6 text-center text-gray-400">
            <p>Unsupported material type</p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-xl p-6 max-w-5xl w-full max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{material.title}</h2>
              <p className="text-sm text-gray-400">
                {getMaterialTypeLabel(material.material_type)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {material.file_path && material.material_type !== 'YOUTUBE' && (
                <a
                  href={material.file_path}
                  download
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </a>
              )}

              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          {renderContent()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper functions
function extractYouTubeId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}

function getMaterialTypeLabel(type) {
  const labels = {
    TEXT: 'Text Document',
    YOUTUBE: 'YouTube Video',
    PDF: 'PDF Document',
    PPTX: 'PowerPoint Presentation',
    DOCX: 'Word Document'
  };
  return labels[type] || type;
}

export default MaterialViewer;
