import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Target } from 'lucide-react';
import { convertCurrency, formatCurrency, getCurrencySymbol } from '../utils/currencyUtils';

const Budgets = () => {
  const { user } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Expenses data to calculate progress
  const [expenses, setExpenses] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [availableCategories, setAvailableCategories] = useState([]);

  const fetchBudgetsAndExpenses = async () => {
    try {
      const [budgetsRes, transRes, catRes] = await Promise.all([
        axios.get('/budgets'),
        axios.get('/transactions'),
        axios.get('/categories')
      ]);
      setBudgets(budgetsRes.data);
      setExpenses(transRes.data.transactions || []);
      setAvailableCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsAndExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert user input (in their preferred currency) back to PKR for storage
      const pkrAmount = convertCurrency(parseFloat(limitAmount), user?.defaultCurrency || 'PKR', 'PKR');
      
      await axios.post('/budgets', { category, limitAmount: pkrAmount, month, year });
      setShowForm(false);
      setCategory(''); setLimitAmount('');
      fetchBudgetsAndExpenses();
    } catch (error) {
      console.error('Error adding budget', error);
      alert(error.response?.data?.message || 'Failed to add budget');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this budget limit?')) return;
    try {
      await axios.delete(`/budgets/${id}`);
      fetchBudgetsAndExpenses();
    } catch (error) {
      console.error('Error deleting budget', error);
    }
  };

  // Helper to calculate total spent in a category for a specific month/year
  const getSpentAmount = (budget) => {
    return expenses
      .filter(e => 
        new Date(e.date).getMonth() + 1 === budget.month &&
        new Date(e.date).getFullYear() === budget.year
      )
      .reduce((acc, curr) => {
        if (curr.category === 'split' && curr.splits?.length > 0) {
          const relevantSplit = curr.splits.filter(s => s.category === budget.category).reduce((sum, s) => sum + s.amount, 0);
          return acc + relevantSplit;
        } else if (curr.category === budget.category) {
          return acc + curr.amount;
        }
        return acc;
      }, 0);
  };

  if (loading) return <div>Loading budgets...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Monthly Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Set Budget Limit
        </button>
      </div>

      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h3>New Budget Limit</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="input-group">
              <label>Category</label>
              <select 
                className="input-field" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                required
              >
                <option value="">Select Category</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Limit Amount ({getCurrencySymbol(user?.defaultCurrency || 'PKR')})</label>
              <input type="number" step="0.01" className="input-field" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} placeholder={`e.g. 50.00`} required />
            </div>
            <div className="input-group">
              <label>Month</label>
              <input type="number" min="1" max="12" className="input-field" value={month} onChange={(e) => setMonth(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Year</label>
              <input type="number" min="2000" max="2100" className="input-field" value={year} onChange={(e) => setYear(e.target.value)} required />
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save Budget</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-grid">
        {budgets.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '4rem 2rem' }}>
            <Target size={48} style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Budgets Set</h3>
            <p style={{ maxWidth: '300px' }}>Take control of your spending by setting monthly limits for your favorite categories.</p>
          </div>
        ) : (
          budgets.map(budget => {
            const spent = getSpentAmount(budget);
            const percentage = Math.min((spent / budget.limitAmount) * 100, 100);
            const isOverBudget = spent > budget.limitAmount;
            const isNearLimit = percentage >= 80 && !isOverBudget;

            let progressColor = 'var(--success)';
            if (isOverBudget) progressColor = 'var(--danger)';
            else if (isNearLimit) progressColor = 'var(--accent-secondary)';

            return (
              <div key={budget.id} className="glass-panel animate-fade-in" style={{ position: 'relative', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{availableCategories.find(c => c.id === budget.category)?.icon}</span>
                      {availableCategories.find(c => c.id === budget.category)?.name || budget.category}
                    </h3>
                  </div>
                  <button 
                    onClick={() => handleDelete(budget.id)} 
                    style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
                    title="Delete Budget"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span>Spent: {formatCurrency(spent, 'PKR', user?.defaultCurrency)}</span>
                  <span>Limit: {formatCurrency(budget.limitAmount, 'PKR', user?.defaultCurrency)}</span>
                </div>

                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    backgroundColor: progressColor,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', textAlign: 'right', color: progressColor, fontWeight: '500' }}>
                  {percentage.toFixed(1)}% {isOverBudget && '(Over budget!)'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Budgets;
