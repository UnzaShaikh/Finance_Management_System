import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { DollarSign, ArrowUpRight, ArrowDownRight, Lightbulb, CreditCard } from 'lucide-react';
import ExpensePieChart from '../components/charts/ExpensePieChart';
import { formatCurrency } from '../utils/currencyUtils';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [insights, setInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [insightsRes, transRes] = await Promise.all([
          axios.get('/insights'),
          axios.get('/transactions?limit=10')
        ]);
        
        setInsights(insightsRes.data);
        setTransactions(transRes.data.transactions || []);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div className="animate-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', opacity: 0.6 }} />
      <p style={{ animation: 'pulse 2s infinite', fontWeight: '500', color: 'var(--text-secondary)' }}>Synchronizing your financial data...</p>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ marginBottom: '1.25rem' }}>Financial Overview</h1>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Current Amount (Latest Statement Balance) */}
        <div className="glass-panel" style={{ borderLeft: '3px solid #3b82f6', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Amount</h3>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)' }}>
              <DollarSign size={18} style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {formatCurrency(insights?.summary?.currentBalance || 0, 'PKR', user?.defaultCurrency)}
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Available Statement Balance</p>
        </div>
 
        {/* Ingoing Total */}
        <div className="glass-panel" style={{ borderLeft: '3px solid #10b981', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingoing Total</h3>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)' }}>
              <ArrowUpRight size={18} style={{ color: '#10b981' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', letterSpacing: '-0.02em' }}>
            {`+${formatCurrency(insights?.summary?.totalIncome || 0, 'PKR', user?.defaultCurrency)}`}
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Total Cash Inflow</p>
        </div>
 
        {/* Outgoing Total */}
        <div className="glass-panel" style={{ borderLeft: '3px solid #ef4444', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outgoing Total</h3>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)' }}>
              <ArrowDownRight size={18} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', letterSpacing: '-0.02em' }}>
            {`-${formatCurrency(insights?.summary?.totalExpense || 0, 'PKR', user?.defaultCurrency)}`}
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Total Cash Outflow</p>
        </div>

        {/* Total Amount (Net) */}
        <div className="glass-panel" style={{ borderLeft: '3px solid var(--accent-primary)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</h3>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)' }}>
              <Lightbulb size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {formatCurrency(insights?.summary?.netTotal || 0, 'PKR', user?.defaultCurrency)}
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Net Transaction Profit/Loss</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gap: '1rem', flex: 1 }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Lightbulb size={18} color="var(--accent-primary)" />
            AI Suggestions
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {insights?.suggestions?.length > 0 ? (
              insights.suggestions.map((suggestion, index) => (
                <div key={index} style={{ padding: '1rem', borderRadius: '12px', backgroundColor: suggestion.includes("Alert") || suggestion.includes("Warning") ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-color)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {suggestion}
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ height: '100%', padding: '2rem' }}>
                <Lightbulb size={32} />
                <p style={{ fontSize: '0.9rem' }}>Upload your statement to get AI-powered financial suggestions.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Expense Breakdown</h3>
          <ExpensePieChart data={insights?.categoryBreakdown} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
