import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

/**
 * Convert single file to PDF
 * @param {File} file
 * @param {function} onProgress - (percent: number) => void
 * @returns {Promise<Blob>} PDF blob
 */
export const convertFileToPdf = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE}/api/pdf/convert`, formData, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 50));
    },
    onDownloadProgress: (e) => {
      if (e.total) onProgress?.(50 + Math.round((e.loaded / e.total) * 50));
      else onProgress?.(75);
    },
  });

  // Check if backend returned an error JSON instead of PDF
  if (response.data.type === 'application/json') {
    const text = await response.data.text();
    const json = JSON.parse(text);
    throw new Error(json.message || 'Conversion failed');
  }

  return response.data;
};

/**
 * Convert multiple files — returns blob (PDF or ZIP)
 */
export const convertMultipleFiles = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  const response = await axios.post(`${API_BASE}/api/pdf/convert-multiple`, formData, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 50));
    },
    onDownloadProgress: (e) => {
      if (e.total) onProgress?.(50 + Math.round((e.loaded / e.total) * 50));
      else onProgress?.(75);
    },
  });

  if (response.data.type === 'application/json') {
    const text = await response.data.text();
    const json = JSON.parse(text);
    throw new Error(json.message || 'Conversion failed');
  }

  return response.data;
};

/**
 * Trigger browser download from a Blob
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generate output filename from original file
 */
export const getPdfFilename = (originalName) => {
  const base = originalName.replace(/\.[^/.]+$/, '');
  return `${base}.pdf`;
};
