import { useContext } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../../context/AuthContext';
import { formatCurrency, convertCurrency } from '../../utils/currencyUtils';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const ExpensePieChart = ({ data = [] }) => {
  const { user } = useContext(AuthContext);
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No expense data to display
      </div>
    );
  }

  // Map data to include icon in name for legend
  const chartData = data.map(item => ({
    ...item,
    displayName: `${item.icon} ${item.name}`,
    // Convert PKR value to display value for correct pie sizing and tooltips
    value: convertCurrency(item.value, 'PKR', user?.defaultCurrency || 'PKR')
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          nameKey="displayName"
          stroke="var(--glass-border)"
          animationBegin={0}
          animationDuration={1500}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px',
            boxShadow: 'var(--card-shadow)'
          }}
          itemStyle={{ color: 'var(--text-primary)', fontWeight: '600' }}
          formatter={(value) => formatCurrency(value, user?.defaultCurrency || 'PKR', user?.defaultCurrency || 'PKR')}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '500' }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpensePieChart;
