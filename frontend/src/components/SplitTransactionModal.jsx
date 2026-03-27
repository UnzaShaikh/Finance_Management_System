import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const SplitTransactionModal = ({ transaction, categories, onClose, onSuccess }) => {
  const [splits, setSplits] = useState([
    { category: transaction.category || 'others', amount: (transaction.amount / 2).toFixed(2), notes: '' },
    { category: 'others', amount: (transaction.amount / 2).toFixed(2), notes: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAllocated = splits.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
  const remaining = transaction.amount - totalAllocated;

  const handleAddSplit = () => {
    setSplits([...splits, { category: 'others', amount: '0', notes: '' }]);
  };

  const handleRemoveSplit = (index) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;
    setSplits(newSplits);
  };

  const handleSave = async () => {
    if (Math.abs(remaining) > 0.01) {
      setError(`Total must equal Rs. ${transaction.amount.toLocaleString()}. Current difference: Rs. ${remaining.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/transactions/${transaction.id}/split`, { splits });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save splits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Split Transaction</h2>
            <p style={{ fontSize: '0.9rem' }}>{transaction.description} • <strong>Rs. {transaction.amount.toLocaleString()}</strong></p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        {error && (
          <div className="glass-panel" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
            <AlertCircle size={20} color="var(--danger)" />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {splits.map((split, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                <select 
                  className="input-field" 
                  value={split.category} 
                  onChange={(e) => handleSplitChange(idx, 'category', e.target.value)}
                  style={{ padding: '0.6rem' }}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Amount (Rs.)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  value={split.amount} 
                  onChange={(e) => handleSplitChange(idx, 'amount', e.target.value)}
                  style={{ padding: '0.6rem' }}
                />
              </div>
              <button 
                onClick={() => handleRemoveSplit(idx)} 
                className="btn-icon" 
                style={{ color: 'var(--danger)', marginBottom: '5px' }}
                disabled={splits.length <= 2}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remaining to Allocate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: Math.abs(remaining) < 0.01 ? 'var(--success)' : 'var(--danger)' }}>
              Rs. {remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleAddSplit} style={{ padding: '0.5rem 1rem' }}>
            <Plus size={16} /> Add Row
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            onClick={handleSave} 
            disabled={loading || Math.abs(remaining) > 0.01}
          >
            {loading ? 'Saving Splits...' : 'Confirm Split'}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SplitTransactionModal;
