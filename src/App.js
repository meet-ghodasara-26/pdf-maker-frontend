import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useConverter } from './hooks/useConverter';
import './App.css';

/* ── helpers ── */
const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const FILE_ICONS = {
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', gif: '🖼️', bmp: '🖼️',
  docx: '📝', doc: '📝',
  xlsx: '📊', xls: '📊',
  pptx: '📑', ppt: '📑',
  txt: '📃', csv: '📃',
  html: '🌐', htm: '🌐',
};

const getIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || '📄';
};

/* ── Toast component ── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  const colors = { success: '#00d68f', error: '#ff4757', warning: '#ffa502' };
  return (
    <div className="toast" style={{ '--toast-color': colors[toast.type] || '#4a6cf7' }}>
      <span className="toast-bar" />
      <span className="toast-msg">{toast.message}</span>
    </div>
  );
};

/* ── DropZone component ── */
const DropZone = ({ onFiles, disabled }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = e.dataTransfer?.files;
    if (files?.length) onFiles(files);
  }, [onFiles, disabled]);

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.html,.htm,.csv"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
      />
      <div className="dropzone-inner">
        <div className="dropzone-icon">{dragging ? '📥' : '☁️'}</div>
        <p className="dropzone-title">{dragging ? 'Drop files here' : 'Drag & drop files here'}</p>
        <p className="dropzone-sub">or <span className="link">browse files</span></p>
        <div className="dropzone-formats">
          <span>Images</span><span>DOCX</span><span>XLSX</span><span>PPTX</span><span>TXT</span><span>HTML</span><span>CSV</span>
        </div>
        <p className="dropzone-limit">Max 50 MB per file · Up to 10 files</p>
      </div>
    </div>
  );
};

/* ── FileCard component ── */
const FileCard = ({ entry, onRemove, onDownload }) => {
  const { file, status, error, progress } = entry;
  const statusLabels = { ready: 'Ready', converting: 'Converting…', done: 'Done', error: 'Failed' };

  return (
    <div className={`file-card file-card--${status}`}>
      <div className="file-card-icon">{getIcon(file.name)}</div>
      <div className="file-card-info">
        <p className="file-name" title={file.name}>{file.name}</p>
        <p className="file-meta">{formatSize(file.size)} · <span className={`status-dot status-${status}`}>{statusLabels[status]}</span></p>
        {status === 'converting' && (
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
        {status === 'error' && <p className="file-error">{error}</p>}
      </div>
      <div className="file-card-actions">
        {status === 'done' && (
          <button className="btn-icon btn-download" onClick={() => onDownload(entry)} title="Download PDF">
            ⬇
          </button>
        )}
        {status !== 'converting' && (
          <button className="btn-icon btn-remove" onClick={() => onRemove(entry.id)} title="Remove">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/* ── History Panel ── */
const HistoryPanel = ({ history, onDownload }) => {
  if (!history.length) return (
    <div className="history-empty">
      <span>🗂️</span>
      <p>No conversions yet</p>
    </div>
  );
  return (
    <ul className="history-list">
      {history.map(item => (
        <li key={item.id} className="history-item">
          <span className="history-icon">{getIcon(item.originalName)}</span>
          <div className="history-info">
            <p className="history-name">{item.pdfName}</p>
            <p className="history-time">{item.convertedAt} · {formatSize(item.size)}</p>
          </div>
          <button className="btn-icon btn-download" onClick={() => onDownload(item)} title="Re-download">⬇</button>
        </li>
      ))}
    </ul>
  );
};

/* ── Main App ── */
export default function App() {
  const {
    files, addFiles, removeFile, clearAll,
    converting, progress,
    convertAll, downloadFile,
    toast, theme, toggleTheme,
    history, downloadFromHistory,
  } = useConverter();

  const [tab, setTab] = useState('convert'); // 'convert' | 'history'

  const readyCount = files.filter(f => f.status === 'ready').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  // Download all done PDFs
  const downloadAll = () => {
    files.filter(f => f.status === 'done').forEach(f => downloadFile(f));
  };

  return (
    <div className={`app theme-${theme}`}>
      {/* Animated background */}
      <div className="bg-orbs">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      </div>

      <Toast toast={toast} />

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">PDF<em>forge</em></span>
        </div>
        <nav className="header-nav">
          <button className={`nav-tab ${tab === 'convert' ? 'active' : ''}`} onClick={() => setTab('convert')}>
            Convert
          </button>
          <button className={`nav-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            History {history.length > 0 && <span className="badge">{history.length}</span>}
          </button>
        </nav>
        <button className="btn-theme" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main */}
      <main className="main">
        {tab === 'convert' ? (
          <>
            {/* Hero */}
            <div className="hero">
              <h1 className="hero-title">Convert anything<br /><span className="accent">to PDF</span></h1>
              <p className="hero-sub">Images, Word, Excel, PowerPoint, HTML, Text — all formats, one click.</p>
            </div>

            {/* Drop zone */}
            <DropZone onFiles={addFiles} disabled={converting} />

            {/* File list */}
            {files.length > 0 && (
              <section className="file-section">
                <div className="file-section-header">
                  <span className="file-count">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                  <button className="btn-ghost" onClick={clearAll} disabled={converting}>Clear all</button>
                </div>
                <div className="file-list">
                  {files.map(entry => (
                    <FileCard key={entry.id} entry={entry} onRemove={removeFile} onDownload={downloadFile} />
                  ))}
                </div>
              </section>
            )}

            {/* Action bar */}
            {files.length > 0 && (
              <div className="action-bar">
                {doneCount > 0 && (
                  <button className="btn btn-secondary" onClick={downloadAll}>
                    ⬇ Download All ({doneCount})
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={convertAll}
                  disabled={converting || readyCount === 0}
                >
                  {converting ? (
                    <>
                      <span className="spinner" />
                      Converting… {progress}%
                    </>
                  ) : (
                    `⚡ Convert ${readyCount > 0 ? `${readyCount} File${readyCount !== 1 ? 's' : ''}` : ''} to PDF`
                  )}
                </button>
              </div>
            )}

            {/* Global progress */}
            {converting && (
              <div className="global-progress">
                <div className="global-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* Supported formats strip */}
            {files.length === 0 && (
              <div className="formats-strip">
                {['🖼️ Images', '📝 DOCX', '📊 XLSX', '📑 PPTX', '📃 TXT/CSV', '🌐 HTML'].map(f => (
                  <div key={f} className="format-pill">{f}</div>
                ))}
              </div>
            )}
          </>
        ) : (
          <section className="history-section">
            <h2 className="section-title">Conversion History</h2>
            <HistoryPanel history={history} onDownload={downloadFromHistory} />
          </section>
        )}
      </main>

      <footer className="footer">
        <p>PDFforge · Files are auto-deleted after conversion · Max 50MB</p>
      </footer>
    </div>
  );
}
