const prisma = require("../prisma");

// @route   POST /api/budgets
const createBudget = async (req, res) => {
  const { category, limitAmount, month, year } = req.body;
  
  if (!category || limitAmount === undefined || !month || !year) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }

  try {
    // Check if budget already exists for this category/month/year
    const existing = await prisma.budget.findFirst({
      where: {
        userId: req.user.id,
        category,
        month: parseInt(month),
        year: parseInt(year)
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Budget for this category and month already exists." });
    }

    const budget = await prisma.budget.create({
      data: {
        category,
        limitAmount: parseFloat(limitAmount),
        month: parseInt(month),
        year: parseInt(year),
        userId: req.user.id,
      },
    });
    res.status(201).json(budget);
  } catch (error) {
    console.error("Create Budget Error:", error);
    res.status(500).json({ message: "Server error creating budget" });
  }
};

// @route   GET /api/budgets
const getBudgets = async (req, res) => {
  const { month, year } = req.query;

  const where = { userId: req.user.id };
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);

  try {
    const budgets = await prisma.budget.findMany({ where });
    res.json(budgets);
  } catch (error) {
    console.error("Get Budgets Error:", error);
    res.status(500).json({ message: "Server error fetching budgets" });
  }
};

// @route   PUT /api/budgets/:id
const updateBudget = async (req, res) => {
  const { id } = req.params;
  const { limitAmount } = req.body;
  
  try {
    let budget = await prisma.budget.findUnique({ where: { id } });
    
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    if (budget.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    budget = await prisma.budget.update({
      where: { id },
      data: { limitAmount: parseFloat(limitAmount) },
    });

    res.json(budget);
  } catch (error) {
    console.error("Update Budget Error:", error);
    res.status(500).json({ message: "Server error updating budget" });
  }
};

// @route   DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  const { id } = req.params;

  try {
    let budget = await prisma.budget.findUnique({ where: { id } });
    
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    if (budget.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await prisma.budget.delete({ where: { id } });

    res.json({ message: "Budget removed" });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    res.status(500).json({ message: "Server error deleting budget" });
  }
};

module.exports = { createBudget, getBudgets, updateBudget, deleteBudget };
