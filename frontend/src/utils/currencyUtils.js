/**
 * Currency Utility for FinanceTracker
 * Handles conversion and formatting based on user preferences.
 */

// Approximate exchange rates relative to PKR (Base)
const PKR_RATES = {
  PKR: 1,
  USD: 0.00357, // 1 PKR = 0.00357 USD
  EUR: 0.00327, // 1 PKR = 0.00327 EUR
  GBP: 0.00281, // 1 PKR = 0.00281 GBP
};

const SYMBOLS = {
  PKR: 'Rs.',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Converts an amount from one currency to another using mock rates.
 * @param {number} amount - The original amount
 * @param {string} from - Original currency code (e.g. 'PKR')
 * @param {string} to - Target currency code (e.g. 'USD')
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, from = 'PKR', to = 'PKR') => {
  if (!amount) return 0;
  if (from === to) return amount;

  // Convert to PKR first (Base)
  const amountInPKR = from === 'PKR' ? amount : amount / (PKR_RATES[from] || 1);
  
  // Convert from PKR to target
  return amountInPKR * (PKR_RATES[to] || 1);
};

/**
 * Returns the symbol for a given currency code.
 */
export const getCurrencySymbol = (code) => SYMBOLS[code] || '$';

/**
 * Formats an amount with conversion and symbols.
 * @param {number} amount - The original value
 * @param {string} from - Original currency (usually PKR)
 * @param {string} to - User's preferred currency
 */
export const formatCurrency = (amount, from = 'PKR', to = 'PKR') => {
  const converted = convertCurrency(amount, from, to);
  const symbol = getCurrencySymbol(to);
  
  return `${symbol} ${converted.toLocaleString(undefined, {
    minimumFractionDigits: to === 'PKR' ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
};
