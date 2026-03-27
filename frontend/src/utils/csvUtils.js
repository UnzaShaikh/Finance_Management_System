import Papa from 'papaparse';

const CATEGORY_KEYWORDS = {
  'food': ['food', 'restaurant', 'cafe', 'starbucks', 'mcdonalds', 'kfc', 'swiggy', 'zomato', 'panda', 'grocery', 'supermarket'],
  'shopping': ['amazon', 'daraz', 'shopping', 'nike', 'adidas', 'clothing', 'retail'],
  'transport': ['uber', 'careem', 'petrol', 'fuel', 'bus', 'train', 'flight', 'airline', 'traffic'],
  'bills': ['electric', 'water', 'gas', 'internet', 'mobile', 'utility', 'ptcl', 'k-electric', 'billing'],
  'transfers': ['transfer', 'p2p', 'raast', 'payment', 'sent', 'received', 'fund'],
  'income': ['salary', 'payroll', 'stipend', 'bonus'],
};

export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

export const autoCategorize = (description) => {
  if (!description) return 'others';
  const desc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }
  return 'others';
};

export const mapCSVColumns = (data, mapping) => {
  return data.map(row => {
    const debit = parseFloat(String(row[mapping.debit] || 0).replace(/[^-0-9.]/g, '')) || 0;
    const credit = parseFloat(String(row[mapping.credit] || 0).replace(/[^-0-9.]/g, '')) || 0;
    const amount = debit !== 0 ? debit : credit;
    const type = debit !== 0 ? 'EXPENSE' : 'INCOME';

    return {
      date: row[mapping.date] || new Date().toISOString(),
      description: row[mapping.description] || 'CSV Transaction',
      amount: Math.abs(amount),
      type: type,
      category: autoCategorize(row[mapping.description]),
      currency: 'PKR', // Enforce global PKR requirement
    };
  }).filter(t => t.amount > 0);
};

export const detectColumns = (firstRow) => {
  const headers = Object.keys(firstRow);
  const mapping = {
    date: '',
    description: '',
    debit: '',
    credit: '',
  };

  headers.forEach(header => {
    const h = header.toLowerCase();
    if (h.includes('date')) mapping.date = header;
    else if (h.includes('desc') || h.includes('detail') || h.includes('particular')) mapping.description = header;
    else if (h.includes('debit') || h.includes('withdrawal') || h.includes('out') || h.includes('paid')) mapping.debit = header;
    else if (h.includes('credit') || h.includes('deposit') || h.includes('in') || h.includes('received')) mapping.credit = header;
    else if (h.includes('amount') && !mapping.debit) mapping.debit = header; // Fallback
  });

  return mapping;
};
