import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, FileText, Calendar, Database, AlertCircle } from 'lucide-react';

const ImportHistory = ({ onRefreshTransactions }) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUploads = async () => {
    try {
      const res = await axios.get('/uploads');
      setUploads(res.data);
    } catch (error) {
      console.error('Error fetching upload history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDeleteUpload = async (id, filename) => {
    if (!window.confirm(`⚠️ WARNING: Deleting "${filename}" will ALSO delete all transactions associated with this file from your database forever. \n\nAre you sure you want to proceed?`)) {
      return;
    }

    try {
      await axios.delete(`/uploads/${id}`);
      fetchUploads();
      if (onRefreshTransactions) onRefreshTransactions();
    } catch (error) {
      console.error('Error deleting upload record', error);
      alert('Failed to delete upload history');
    }
  };

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Loading history...</div>;

  return (
    <div className="glass-panel animate-fade-in" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Database size={20} color="var(--accent-primary)" />
        <h3 style={{ margin: 0 }}>Import History</h3>
      </div>

      {uploads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No recorded imports found. Upload your first statement to track history!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Type</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => (
                <tr key={upload.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} color="var(--text-secondary)" />
                      <span style={{ fontWeight: '500' }}>{upload.filename}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Calendar size={14} color="var(--text-secondary)" />
                      {new Date(upload.createdAt).toLocaleDateString(undefined, { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{upload.type}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {upload._count.transactions}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteUpload(upload.id, upload.filename)}
                      className="btn-icon-delete"
                      title="Delete file and all its transactions"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <AlertCircle size={12} />
        Note: Deleting a history record here will perform a bulk-delete on all transactions linked to that file.
      </div>
    </div>
  );
};

export default ImportHistory;
