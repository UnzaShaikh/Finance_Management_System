import { useState, useEffect } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { parseCSVFile, detectColumns, mapCSVColumns } from '../utils/csvUtils';
import axios from 'axios';

const CSVUploadModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('upload'); // upload, mapping, preview, success
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({ date: '', description: '', debit: '', credit: '' });
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const data = await parseCSVFile(selectedFile);
      if (data.length === 0) throw new Error('File is empty');
      
      setFile(selectedFile);
      setRawData(data);
      const detected = detectColumns(data[0]);
      setMapping(detected);
      setStep('mapping');
    } catch (err) {
      setError(err.message || 'Error parsing CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleMapConfirm = () => {
    const mapped = mapCSVColumns(rawData, mapping);
    setParsedData(mapped);
    setStep('preview');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post('/transactions/bulk', { transactions: parsedData });
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to save transactions to server');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => !loading && onClose()}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>CSV Bank Import</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        {error && (
          <div className="glass-panel" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="scanner-container" style={{ padding: '3rem' }}>
            <UploadCloud size={64} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Support CSV files from any bank</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                Select CSV File
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
              </label>
              <button className="btn btn-secondary" onClick={() => {
                const sample = [
                  { 'Date': '2026-03-24', 'Description': 'Starbucks Coffee', 'Debit': '4.50', 'Credit': '' },
                  { 'Date': '2026-03-24', 'Description': 'Salary Deposit', 'Debit': '', 'Credit': '2500.00' },
                  { 'Date': '2026-03-23', 'Description': 'Netflix.com', 'Debit': '15.99', 'Credit': '' },
                  { 'Date': '2026-03-22', 'Description': 'Uber Trip', 'Debit': '12.00', 'Credit': '' },
                  { 'Date': '2026-03-21', 'Description': 'Daraz Online Shopping', 'Debit': '25.00', 'Credit': '' }
                ];
                setRawData(sample);
                setMapping({ date: 'Date', description: 'Description', debit: 'Debit', credit: 'Credit' });
                setStep('mapping');
              }}>
                Try Demo Data
              </button>
            </div>
            {loading && <p className="animate-pulse" style={{ marginTop: '1rem' }}>Parsing file...</p>}
          </div>
        )}

        {step === 'mapping' && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Map Your Columns</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Match the headers from your CSV to our system.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {Object.keys(mapping).map(field => (
                <div key={field} className="input-group">
                  <label style={{ textTransform: 'capitalize' }}>{field}</label>
                  <select 
                    className="input-field" 
                    value={mapping[field]} 
                    onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                  >
                    <option value="">-- Select Column --</option>
                    {Object.keys(rawData[0]).map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleMapConfirm}>Preview Data</button>
              <button className="btn btn-secondary" onClick={() => setStep('upload')}>Back</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Preview ({parsedData.length} items)</h3>
            <div style={{ overflowX: 'auto', marginBottom: '2rem', maxHeight: '400px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount (Rs.)</th>
                    <th>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date}</td>
                      <td>{item.description}</td>
                      <td><span className="badge badge-accent">{item.category}</span></td>
                      <td style={{ textAlign: 'right', color: item.type === 'INCOME' ? 'var(--success)' : 'var(--text-primary)' }}>
                        {item.type === 'INCOME' ? '+' : '-'}{item.amount.toFixed(2)}
                      </td>
                      <td>
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save All Transactions'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('mapping')}>Back to Mapping</button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="scanner-container" style={{ padding: '3rem' }}>
            <CheckCircle size={64} color="var(--success)" className="animate-bounce" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '1rem' }}>Bulk Import Successful!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Refreshing your transaction history...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUploadModal;
