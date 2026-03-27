const CATEGORY_RULES = [
  { id: 'food', keywords: ['food', 'restaurant', 'cafe', 'starbucks', 'mcdonalds', 'kfc', 'swiggy', 'zomato', 'panda', 'grocery', 'supermarket', 'bakery', 'eats', 'cheetay', 'hardees', 'pizza', 'domino', 'subway', 'dunkin'] },
  { id: 'shopping', keywords: ['amazon', 'daraz', 'shopping', 'nike', 'adidas', 'clothing', 'retail', 'fashion', 'store', 'outfitter', 'alkaram', 'khaadi', 'sapphire', 'junaid', 'limelight', 'gul ahmed', 'aliexpress'] },
  { id: 'transport', keywords: ['uber', 'careem', 'petrol', 'fuel', 'bus', 'train', 'flight', 'airline', 'traffic', 'indriver', 'bykea', 'shell', 'pso', 'total', 'speedy'] },
  { id: 'bills', keywords: ['electric', 'water', 'gas', 'internet', 'mobile', 'utility', 'ptcl', 'k-electric', 'billing', 'stormfiber', 'nayatel', 'jazz', 'telenor', 'zong', 'sngc', 'kelectric'] },
  { id: 'income', keywords: ['salary', 'payroll', 'stipend', 'bonus', 'refund', 'profit', 'dividend'] },
];

/**
 * Automagically categorizes a transaction based on its description.
 * @param {string} description The transaction description.
 * @returns {string} The category ID (e.g. 'food', 'shopping') or 'others' if no match.
 */
const categorizeTransaction = (description) => {
  if (!description) return 'others';
  
  const desc = description.toLowerCase();

  // High Priority: Unified P2P / Fund Transfers (Any Direction)
  const p2pPatterns = [
    'sent to', 'received from', 'transfer to', 'transfer from', 
    'raast out', 'raast in', 'raast p2p', 'p2p', 'ibft out', 'ibft in',
    'fund transfer', 'money sent', 'money received', 'incoming fund', 'outgoing fund'
  ];
  
  if (p2pPatterns.some(pattern => desc.includes(pattern))) {
    return 'transfers';
  }
  
  // Keyword-based matching for other categories
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(keyword => desc.includes(keyword))) {
      return rule.id;
    }
  }
  
  return 'others';
};

module.exports = { categorizeTransaction };
