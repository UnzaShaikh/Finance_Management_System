const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// @route   GET /api/insights
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { CATEGORIES } = require("../constants/categories");

    // 1. Calculate Totals using Database Aggregation (Extreme performance)
    const summaryDataPromise = prisma.transaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const incomeSumPromise = prisma.transaction.aggregate({
      where: { userId, type: 'INCOME' },
      _sum: { amount: true },
    });

    const expenseSumPromise = prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    });

    // 2. Get latest balance (fastest lookup)
    const latestBalanceTxnPromise = prisma.transaction.findFirst({
      where: { userId, balance: { not: null } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      select: { balance: true }
    });

    const [incomeRes, expenseRes, balanceRes] = await Promise.all([
      incomeSumPromise,
      expenseSumPromise,
      latestBalanceTxnPromise
    ]);

    const totalIncome = incomeRes._sum.amount || 0;
    const totalExpense = expenseRes._sum.amount || 0;
    const currentBalance = balanceRes?.balance !== undefined ? balanceRes.balance : (totalIncome - totalExpense);

    // 3. Category Breakdown (Split-Aware) - Grouping at Database Level
    
    // Group A: Non-split transactions
    const standardCategoryGroupsPromise = prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type: 'EXPENSE', category: { not: 'split' } },
      _sum: { amount: true }
    });

    // Group B: Split transaction categories
    const splitCategoryGroupsPromise = prisma.transactionSplit.groupBy({
      by: ['category'],
      where: { transaction: { userId } },
      _sum: { amount: true }
    });

    const [stdGroups, splitGroups] = await Promise.all([
      standardCategoryGroupsPromise,
      splitCategoryGroupsPromise
    ]);

    // Merge groups in memory (very small subset now)
    const mergedTotals = {};
    stdGroups.forEach(g => mergedTotals[g.category || 'others'] = (mergedTotals[g.category] || 0) + g._sum.amount);
    splitGroups.forEach(g => mergedTotals[g.category] = (mergedTotals[g.category] || 0) + g._sum.amount);

    const categoryBreakdown = Object.keys(mergedTotals).map(catId => {
      const catConfig = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'others');
      return {
        id: catId,
        name: catConfig.name,
        icon: catConfig.icon,
        value: mergedTotals[catId]
      };
    }).sort((a, b) => b.value - a.value);

    // 4. Suggestions & Budgets (Month-specific fetch to keep it small)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const transactionsThisMonth = await prisma.transaction.findMany({
      where: { 
        userId, 
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: new Date(currentYear, currentMonth, 0)
        }
      },
      include: { splits: true }
    });

    const budgets = await prisma.budget.findMany({ where: { userId } });

    let suggestions = [];
    if (totalIncome > 0 && totalExpense > (totalIncome * 0.8)) {
      suggestions.push("Warning: Your outgoing total is over 80% of your incoming total. Consider reviewing your spending.");
    }
    
    budgets.forEach(b => {
      if (b.month === currentMonth && b.year === currentYear) {
        const spent = transactionsThisMonth
          .filter(t => t.type === 'EXPENSE')
          .reduce((acc, t) => {
            if (t.category === 'split') {
              const relevantSplit = t.splits.filter(s => s.category === b.category).reduce((sum, s) => sum + s.amount, 0);
              return acc + relevantSplit;
            } else if (t.category === b.category) {
              return acc + t.amount;
            }
            return acc;
          }, 0);
        
        if (spent > b.limitAmount) {
          const catName = CATEGORIES.find(c => c.id === b.category)?.name || b.category;
          suggestions.push(`Alert: You exceeded your budget limit for ${catName} (Rs. ${spent.toFixed(0)} / Rs. ${b.limitAmount}).`);
        }
      }
    });

    if (suggestions.length === 0) {
      if (totalIncome === 0 && totalExpense === 0) {
        suggestions.push("Welcome! Upload your financial statement to see your analysis.");
      } else {
        suggestions.push("Great job! Your profile looks balanced. Check your breakdown below.");
      }
    }

    res.json({
      summary: { totalIncome, totalExpense, currentBalance, netTotal: totalIncome - totalExpense },
      categoryBreakdown,
      suggestions
    });
  } catch (error) {
    console.error("Get Insights Error:", error);
    res.status(500).json({ message: "Server error fetching insights" });
  }
};

module.exports = { getInsights };
