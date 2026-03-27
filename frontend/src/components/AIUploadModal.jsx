import ReactDOM from 'react-dom';
import { FileText, UploadCloud, CheckCircle, X } from 'lucide-react';

const AIUploadModal = ({ isOpen, onClose, uploadState, uploadText, onFileUpload }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={() => uploadState === 'idle' && onClose()}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '1.5rem', right: '1.5rem', 
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', transition: 'color 0.2s'
          }}
          className="hover-bright"
        >
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>AI PDF Extractor</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Upload your bank statement. Our AI will automatically extract and categorize your transactions.
        </p>

        <div className={`scanner-container ${uploadState !== 'idle' ? 'active' : ''}`}>
          {uploadState === 'scanning' && <div className="scanner-laser" />}
          
          <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {uploadState === 'idle' && <UploadCloud size={60} color="var(--accent-primary)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />}
            {uploadState === 'scanning' && <FileText size={60} color="var(--accent-primary)" style={{ marginBottom: '1.5rem' }} className="animate-pulse" />}
            {uploadState === 'success' && <CheckCircle size={60} color="var(--success)" style={{ marginBottom: '1.5rem' }} />}
            
            <p style={{ 
              fontWeight: '600', 
              fontSize: '1.1rem',
              marginBottom: '1.5rem', 
              color: uploadState === 'success' ? 'var(--success)' : 'var(--text-primary)',
              textAlign: 'center',
              padding: '0 1rem'
            }}>
              {uploadText}
            </p>
            
            {uploadState === 'idle' && (
              <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '0.75rem 2rem' }}>
                Select PDF Statement
                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileUpload} />
              </label>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <FileText size={14} />
          <span>Supports NayaPay & Standard Text-based Statements</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AIUploadModal;
