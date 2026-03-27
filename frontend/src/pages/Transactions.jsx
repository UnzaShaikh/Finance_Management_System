import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Papa from 'papaparse';
import { Plus, Trash2, UploadCloud, FileText, Check, Scissors, Table } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyUtils';
import CSVUploadModal from '../components/CSVUploadModal';
import SplitTransactionModal from '../components/SplitTransactionModal';
import ImportHistory from '../components/ImportHistory';
import AIUploadModal from '../components/AIUploadModal';

const Transactions = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 200, totalPages: 1 });
  
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedTxnForSplit, setSelectedTxnForSplit] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);

  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, scanning, success
  const [uploadText, setUploadText] = useState('Drag & drop your bank PDF here');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'history'

  // Fetch transactions... (replaces removed getCurrencySymbol)

  const fetchTransactions = async (page = 1) => {
    try {
      const res = await axios.get(`/transactions?limit=200&page=${page}`);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 200, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/categories');
      setAvailableCategories(res.data);
      if (res.data.length > 0) setCategory(res.data[0].id);
    } catch (error) {
      console.error('Error fetching categories', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/transactions', { 
        amount, currency, type, category, date, description, notes,
        categorySource: 'manual' 
      });
      setShowForm(false);
      setAmount(''); setDate(''); setDescription(''); setNotes(''); setCategory(availableCategories[0]?.id || '');
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction', error);
      alert('Failed to add transaction');
    }
  };

  const handleCategoryChange = async (id, newCategory) => {
    try {
      // Optimistic Update
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: newCategory, categorySource: 'manual' } : t));
      await axios.put(`/transactions/${id}`, { category: newCategory, categorySource: 'manual' });
    } catch (error) {
      console.error('Error updating category', error);
      fetchTransactions(); // Rollback
    }
  };

  const handleConfirmCategory = async (id) => {
    try {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, categorySource: 'manual' } : t));
      await axios.put(`/transactions/${id}`, { categorySource: 'manual' });
    } catch (error) {
      console.error('Error confirming category', error);
      fetchTransactions();
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await axios.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction', error);
    }
  };

  const handleExportCSV = () => {
    const csvData = transactions.map(t => {
      const catName = availableCategories.find(c => c.id === t.category)?.name || t.category;
      return {
        Date: new Date(t.date).toLocaleDateString(),
        Time: t.time || '',
        Type: t.type,
        Description: t.description,
        Category: catName,
        'Category Source': t.categorySource,
        Amount: t.amount,
        Balance: t.balance || '',
        Notes: t.notes || ''
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Finance_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadState('scanning');
    setUploadText('Analyzing PDF contents...');
    
    setTimeout(() => setUploadText('Extracting sender and receiver entities...'), 1200);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadState('success');
      setUploadText(res.data.message || `Successfully evaluated transactions!`);
      fetchTransactions();
      
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadState('idle');
        setUploadText('Drag & drop your bank PDF here');
      }, 3000);
    } catch (err) {
      console.error("Error importing PDF", err);
      setUploadText('Error interpreting PDF statement data.');
      setUploadState('idle');
      setTimeout(() => { setShowUploadModal(false); setUploadState('idle'); setUploadText('Drag & drop your bank PDF here'); }, 3000);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your financial data...</div>;

  return (
    <div>
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Transactions</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '0.75rem', borderRight: '1px solid var(--glass-border)' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} title="Export to CSV" style={{ padding: '0.6rem 1rem' }}>
              <FileText size={18} /> <span style={{ fontSize: '0.85rem' }}>Export</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCSVModal(true)} title="Import CSV" style={{ padding: '0.6rem 1rem' }}>
              <Table size={18} /> <span style={{ fontSize: '0.85rem' }}>Import CSV</span>
            </button>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowUploadModal(true)} style={{ padding: '0.6rem 1.25rem', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
            <UploadCloud size={18} /> <span style={{ fontSize: '0.85rem' }}>Upload PDF</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ padding: '0.6rem 1.5rem' }}>
            <Plus size={18} /> <span style={{ fontSize: '0.85rem' }}>Add Manual</span>
          </button>
        </div>
      </div>

      <AIUploadModal 
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); setUploadState('idle'); setUploadText('Select PDF Statement'); }}
        uploadState={uploadState}
        uploadText={uploadText}
        onFileUpload={handleFileUpload}
      />

      {showCSVModal && (
        <CSVUploadModal 
          onClose={() => setShowCSVModal(false)} 
          onSuccess={() => fetchTransactions()} 
        />
      )}

      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', borderBottom: '4px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Manual Transaction</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="input-group">
              <label>Amount (Rs.)</label>
              <input type="number" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="input-group">
              <label>Type</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="input-group">
              <label>Category</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} required>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <input type="text" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Starbucks, John Doe" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Notes (Optional)</label>
              <input type="text" className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add extra details..." />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Save Transaction</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={() => setActiveTab('list')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 0.5rem', 
            borderBottom: activeTab === 'list' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'list' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          Transaction List
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 0.5rem', 
            borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'history' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          Import History
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="glass-panel" style={{ padding: '0' }}>
          {transactions.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No transactions found. Start by importing your first statement!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Date & Time</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                    <th style={{ textAlign: 'center', paddingRight: '1.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => {
                    const currentCat = availableCategories.find(c => c.id === t.category) || availableCategories.find(c => c.id === 'others');
                    return (
                      <tr key={t.id} className="animate-fade-in">
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <div style={{ fontWeight: '500' }}>{new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          {t.time && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.time}</div>}
                        </td>
                        <td>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.025em', backgroundColor: t.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', color: t.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.description}>{t.description || '-'}</div>
                          {t.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{t.notes}</div>}
                        </td>
                        <td style={{ minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {t.category === 'split' ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>SPLIT ({t.splits?.length})</span>
                              </div>
                            ) : (
                              <select 
                                className={`category-select ${t.categorySource === 'auto' ? 'suggestion-pulse' : ''}`} 
                                value={t.category || 'others'} 
                                onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                                style={{ 
                                  border: 'none', 
                                  background: t.categorySource === 'auto' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', 
                                  borderRadius: '6px', 
                                  padding: '0.3rem 0.5rem', 
                                  cursor: 'pointer', 
                                  fontSize: '0.85rem', 
                                  width: '100%',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {availableCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                              </select>
                            )}
                            
                            {t.categorySource === 'auto' && (
                              <button 
                                onClick={() => handleConfirmCategory(t.id)}
                                className="btn-confirm"
                                title="Confirm Suggestion"
                                style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                              >
                                <Check size={12} />
                              </button>
                            )}
                            <button 
                              onClick={() => { setSelectedTxnForSplit(t); setShowSplitModal(true); }}
                              className="btn-icon"
                              title="Split Transaction"
                              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
                            >
                              <Scissors size={16} />
                            </button>
                          </div>
                          {t.categorySource === 'auto' && <div style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', marginTop: '2px', fontWeight: '500' }}>✨ AI SUGGESTION</div>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: t.type === 'INCOME' ? '#10b981' : 'var(--text-primary)' }}>
                          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount, t.currency || 'PKR', user?.defaultCurrency)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {t.balance != null ? formatCurrency(t.balance, 'PKR', user?.defaultCurrency) : '-'}
                        </td>
                        <td style={{ textAlign: 'center', paddingRight: '1.5rem' }}>
                          <button onClick={() => handleDelete(t.id)} className="btn-icon-delete" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <ImportHistory onRefreshTransactions={fetchTransactions} />
      )}

      {showSplitModal && (
        <SplitTransactionModal 
          transaction={selectedTxnForSplit} 
          categories={availableCategories}
          onClose={() => setShowSplitModal(false)}
          onSuccess={() => fetchTransactions()}
        />
      )}
    </div>
  );
};

export default Transactions;
