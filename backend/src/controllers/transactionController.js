const { PrismaClient } = require("@prisma/client");
const { categorizeTransaction } = require("../utils/categorization");

const prisma = new PrismaClient();

// Helper to find a category based on user history or rules
const getSmartCategory = async (userId, description) => {
  if (!description) return { category: 'others', source: 'auto' };

  // 1. Check for manual mappings (learned from user)
  const mapping = await prisma.categoryMapping.findUnique({
    where: { userId_pattern: { userId, pattern: description } }
  });

  if (mapping) {
    // Learned patterns are now considered "Confirmed" (manual) by default
    return { category: mapping.categoryId, source: 'manual' };
  }

  // 2. Fallback to keyword rules
  const detected = categorizeTransaction(description);
  
  // If we found a specific category (not 'others'), we consider it confirmed (manual)
  // as per user request: "no need to confirm"
  return { 
    category: detected, 
    source: detected !== 'others' ? 'manual' : 'auto' 
  };
};

// @route   POST /api/transactions
const createTransaction = async (req, res) => {
  const { amount, type, category, categorySource, notes, date, description } = req.body;
  
  if (!amount || !type || !date) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }

  try {
    const { category: autoCategory, source: autoSource } = await getSmartCategory(req.user.id, description);
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        currency: "PKR",
        type,
        category: category || autoCategory,
        categorySource: category ? 'manual' : autoSource,
        notes: notes || null,
        date: new Date(date),
        description,
        userId: req.user.id,
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Create Transaction Error:", error);
    res.status(500).json({ message: "Server error creating transaction" });
  }
};

// @route   GET /api/transactions
const getTransactions = async (req, res) => {
  const { category, type, startDate, endDate, limit, page } = req.query;

  // Build filter object
  const where = {
    userId: req.user.id,
  };

  if (category) where.category = category;
  if (type) where.type = type;
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Pagination logic
  const take = limit ? parseInt(limit) : 200; // Default to 200
  const skip = page ? (parseInt(page) - 1) * take : 0;

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { splits: true },
        orderBy: { date: "desc" },
        take,
        skip,
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: page ? parseInt(page) : 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Server error fetching transactions" });
  }
};

// @route   PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, categorySource, notes, date, description } = req.body;
  
  try {
    let transaction = await prisma.transaction.findUnique({ where: { id } });
    
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    if (transaction.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        currency: "PKR",
        type: type !== undefined ? type : undefined,
        category: category !== undefined ? category : undefined,
        categorySource: categorySource !== undefined ? categorySource : undefined,
        notes: notes !== undefined ? notes : undefined,
        date: date ? new Date(date) : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    // --- Phase 5: Learn from manual tagging ---
    if (categorySource === 'manual' && transaction.description && transaction.category) {
      await prisma.categoryMapping.upsert({
        where: { userId_pattern: { userId: req.user.id, pattern: transaction.description } },
        update: { categoryId: transaction.category },
        create: { userId: req.user.id, pattern: transaction.description, categoryId: transaction.category }
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Update Transaction Error:", error);
    res.status(500).json({ message: "Server error updating transaction" });
  }
};

// @route   DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    let transaction = await prisma.transaction.findUnique({ where: { id } });
    
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    if (transaction.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await prisma.transaction.delete({ where: { id } });

    res.json({ message: "Transaction removed" });
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({ message: "Server error deleting transaction" });
  }
};

const PDFParser = require('pdf2json');

const uploadTransactions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // --- Step 1: Extract raw text using pdf2json ---
    const text = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataError', (e) => reject(new Error(e.parserError)));
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        const lines = [];
        (pdfData.Pages || []).forEach(page => {
          (page.Texts || []).forEach(t => {
            lines.push(t.R.map(r => decodeURIComponent(r.T)).join(' '));
          });
        });
        resolve(lines.join('\n'));
      });
      pdfParser.parseBuffer(req.file.buffer);
    });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Could not extract text. The PDF may be scanned/image-based." });
    }

    console.log("=== PDF TEXT (5000 chars) ===\n" + text.substring(0, 5000) + "\n=== END ===");

    // --- Step 2: NayaPay State-Machine Parser ---
    // NayaPay multi-line format per transaction:
    //   [description lines]
    //   DD MMM YYYY
    //   HH:MM AM/PM
    //   Raast In / Peer to Peer / etc.
    //   +Rs. X,XXX  or  -Rs. X,XXX
    //   Rs. X,XXX.XX  (balance)

    const DATE_RE    = /^(\d{1,2} [A-Za-z]{3} \d{4})$/;
    const TIME_RE    = /^(\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM)?)$/i;
    const TYPE_RE    = /^(Raast In|Raast Out|Peer to Peer|IBFT In|IBFT Out|Bill Payment|Mobile Top-up|Cash Out|Cash In|Salary|ATM)$/i;
    // Amount MUST have a sign prefix (+/-) to distinguish from the balance line
    const AMOUNT_RE  = /^([+-])Rs\.\s?([\d,]+(?:\.\d+)?)$/i;
    // Balance has NO sign — just Rs. followed by digits
    const BALANCE_RE = /^Rs\.\s?([\d,]+(?:\.\d+)?)$/i;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const skipPatterns = [
      /^Account Statement$/i, /^TIME$/i, /^TYPE$/i, /^DESCRIPTION$/i, /^AMOUNT$/i, /^BALANCE$/i,
      /^Service Charges Rs\. 0$/i, /^CARRIED FORWARD$/i, /^Transaction ID/i,
      /^\d{1,2} [A-Za-z]{3} \d{4} - \d{1,2} [A-Za-z]{3} \d{4}$/, // date ranges in header
      /nayapay|www\.|support@|opening balance|closing balance|total spent|total income|IBAN|NayaPay ID/i,
      /^\([0-9() -]+\)$/, /^\d+$/, /^[A-Z0-9]{10,}$/ // phone numbers, page #s, txn IDs
    ];

    const shouldSkip = (line) => skipPatterns.some(p => p.test(line));

    const parsedTxns = [];
    let descParts = [];
    let date = null, time = null, type = null, amount = null, amountSign = null, balance = null;

    const flush = () => {
      if (date && amount) {
        const isIncome = amountSign === '+';
        parsedTxns.push({
          date: (() => { try { return new Date(date).toISOString(); } catch { return new Date().toISOString(); } })(),
          time: time || null,
          type: isIncome ? 'INCOME' : 'EXPENSE',
          description: descParts.join(' ').replace(/\s+/g, ' ').trim() || 'Bank Transaction',
          amount: parseFloat(amount.replace(/,/g, '')),
          balance: balance ? parseFloat(balance.replace(/,/g, '')) : null,
          currency: 'PKR',
          category: categorizeTransaction(descParts.join(' ')),
          categorySource: 'auto',
          notes: null,
        });
      }
      descParts = []; date = null; time = null; type = null; amount = null; amountSign = null; balance = null;
    };

    for (const line of lines) {
      if (shouldSkip(line)) continue;

      const dateM = line.match(DATE_RE);
      const timeM = line.match(TIME_RE);
      const typeM = line.match(TYPE_RE);
      const amtM  = line.match(AMOUNT_RE);
      const balM  = line.match(BALANCE_RE);

      if (dateM) {
        // Seeing a new date: flush any pending transaction first
        if (date) flush();
        date = dateM[1];
      } else if (timeM && date && !time) {
        time = timeM[1];
      } else if (typeM && date) {
        type = typeM[1];
      } else if (amtM && date) {
        // AMOUNT line: has a mandatory +/- sign
        amountSign = amtM[1];
        amount = amtM[2];
      } else if (balM && date && amount) {
        // BALANCE line: no sign, comes right after amount → flush complete transaction
        balance = balM[1];
        flush();
      } else if (!date) {
        // Pre-date lines = description parts (sender/receiver name, transaction details)
        descParts.push(line);
      }
    }
    flush(); // flush last pending transaction

    if (parsedTxns.length === 0) {
      return res.status(400).json({ message: "No transactions found. Make sure this is a NayaPay or similar text-based bank statement." });
    }

    // --- Step 2.5: Prepare Transactions & Deduplicate ---
    const saved = [];
    let skippedCount = 0;
    const finalTxnsToSave = [];

    for (const txn of parsedTxns) {
      // Duplicate Check: Match with rounded precision for amount and balance
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: req.user.id,
          date: new Date(txn.date),
          description: txn.description,
          // Use a small range to account for floating point precision in bank decimals
          amount: {
            gte: txn.amount - 0.001,
            lte: txn.amount + 0.001
          },
          ...(txn.balance !== null ? {
            balance: {
              gte: txn.balance - 0.001,
              lte: txn.balance + 0.001
            }
          } : {})
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }
      finalTxnsToSave.push(txn);
    }

    if (finalTxnsToSave.length === 0) {
      return res.json({ 
        message: `All ${parsedTxns.length} transactions were identified as duplicates and skipped. No new data added.`, 
        count: 0,
        skipped: skippedCount 
      });
    }

    // --- Step 3: Create Upload Record & Save New Transactions ---
    const uploadRecord = await prisma.upload.create({
      data: {
        filename: req.file.originalname || 'statement.pdf',
        type: 'PDF',
        transactionCount: finalTxnsToSave.length,
        userId: req.user.id
      }
    });

    for (const txn of finalTxnsToSave) {
      const { category: smartCat, source: smartSource } = await getSmartCategory(req.user.id, txn.description);
      const row = await prisma.transaction.create({ 
        data: { 
          ...txn, 
          category: smartCat,
          categorySource: smartSource,
          userId: req.user.id,
          uploadId: uploadRecord.id // Link to upload
        } 
      });
      saved.push(row);
    }

    res.json({ 
      message: `Extracted ${parsedTxns.length} items. Saved ${saved.length} new transactions. ${skippedCount > 0 ? skippedCount + ' duplicates skipped.' : ''}`, 
      count: saved.length,
      skipped: skippedCount,
      uploadId: uploadRecord.id
    });
  } catch (error) {
    console.error("PDF Upload Error:", error);
    res.status(500).json({ message: "Failed to parse PDF. Error: " + error.message });
  }
};

const bulkCreateTransactions = async (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions)) return res.status(400).json({ message: "Invalid data format" });

  try {
    const saved = [];
    let skippedCount = 0;
    const finalTxnsToSave = [];

    for (const txn of transactions) {
      // Duplicate Check with rounded precision
      const amountFloat = parseFloat(txn.amount);
      const balanceFloat = txn.balance ? parseFloat(txn.balance) : null;

      const existing = await prisma.transaction.findFirst({
        where: {
          userId: req.user.id,
          description: txn.description,
          date: new Date(txn.date),
          amount: {
            gte: amountFloat - 0.001,
            lte: amountFloat + 0.001
          },
          ...(balanceFloat !== null ? {
            balance: {
              gte: balanceFloat - 0.001,
              lte: balanceFloat + 0.001
            }
          } : {})
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }
      finalTxnsToSave.push({ ...txn, amountFloat, balanceFloat });
    }

    if (finalTxnsToSave.length === 0) {
      return res.json({ 
        message: `All ${transactions.length} items were already imported. No changes made.`, 
        count: 0, 
        skipped: skippedCount 
      });
    }

    // --- Create Upload Record ---
    const uploadRecord = await prisma.upload.create({
      data: {
        filename: 'Imported CSV',
        type: 'CSV',
        transactionCount: finalTxnsToSave.length,
        userId: req.user.id
      }
    });

    for (const txnData of finalTxnsToSave) {
      const { amountFloat, balanceFloat, ...txn } = txnData;
      const { category: smartCat, source: smartSource } = await getSmartCategory(req.user.id, txn.description);
      const finalCategory = txn.category && txn.category !== 'others' ? txn.category : smartCat;
      const finalSource = txn.category && txn.category !== 'others' ? 'manual' : smartSource;

      const newTxn = await prisma.transaction.create({
        data: { 
          ...txn, 
          amount: amountFloat,
          balance: balanceFloat,
          date: new Date(txn.date),
          category: finalCategory,
          categorySource: finalSource,
          userId: req.user.id,
          uploadId: uploadRecord.id // Link to upload history
        }
      });
      saved.push(newTxn);
    }

    res.json({ 
      message: `Processed ${transactions.length} items. Saved ${saved.length} new. ${skippedCount > 0 ? skippedCount + ' duplicates skipped.' : ''}`, 
      count: saved.length,
      skipped: skippedCount,
      uploadId: uploadRecord.id
    });
  } catch (error) {
    console.error("Bulk Create Error:", error);
    res.status(500).json({ message: "Failed to save transactions." });
  }
};

// @route   POST /api/transactions/:id/split
const splitTransaction = async (req, res) => {
  const { id } = req.params;
  const { splits } = req.body; // Array of { category, amount, notes }

  if (!Array.isArray(splits) || splits.length < 2) {
    return res.status(400).json({ message: "At least two splits are required." });
  }

  try {
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // Validate total amount
    const totalSplitAmount = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    if (Math.abs(totalSplitAmount - transaction.amount) > 0.01) {
      return res.status(400).json({ 
        message: `Total split amount (Rs. ${totalSplitAmount}) must equal transaction amount (Rs. ${transaction.amount}).` 
      });
    }

    // Use a transaction to ensure atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing splits if any
      await tx.transactionSplit.deleteMany({ where: { transactionId: id } });

      // 2. Create new splits
      const createdSplits = await Promise.all(
        splits.map(s => tx.transactionSplit.create({
          data: {
            amount: parseFloat(s.amount),
            category: s.category,
            notes: s.notes || null,
            transactionId: id
          }
        }))
      );

      // 3. Update main transaction to indicate it's split
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          category: "split", // Special marker
          categorySource: "manual"
        },
        include: { splits: true }
      });

      return updatedTx;
    });

    res.json(result);
  } catch (error) {
    console.error("Split Transaction Error:", error);
    res.status(500).json({ message: "Server error during splitting." });
  }
};

module.exports = { createTransaction, getTransactions, updateTransaction, deleteTransaction, uploadTransactions, bulkCreateTransactions, splitTransaction };
