import { isWeb, getNativeDb, DEFAULT_CATEGORIES } from './db';
import { Transaction, Category } from './types';
import { getAllCategories } from './categoryRepository';

export interface TransactionFilters {
  searchTerm?: string;
  categoryId?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  type?: 'expense' | 'income';
}

// Fetch all transactions matching filters
export function getAllTransactions(filters?: TransactionFilters): Transaction[] {
  if (isWeb) {
    const txData = localStorage.getItem('expense_tracker_transactions');
    let transactions: Transaction[] = txData ? JSON.parse(txData) : [];
    const categories = getAllCategories();

    // Hydrate transactions
    transactions = transactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id);
      return {
        ...t,
        category_name: cat ? cat.name : 'Unknown',
        category_color: cat ? cat.color : '#6B7280',
        category_icon: cat ? cat.icon : 'grid',
      };
    });

    // Apply filters
    if (filters) {
      const { searchTerm, categoryId, startDate, endDate, type } = filters;
      
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        transactions = transactions.filter(
          t => 
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.category_name && t.category_name.toLowerCase().includes(query))
        );
      }
      
      if (categoryId !== undefined) {
        transactions = transactions.filter(t => t.category_id === categoryId);
      }
      
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }
      
      if (startDate) {
        // SQLite dates are stored as YYYY-MM-DD HH:MM:SS, comparison by string slicing
        transactions = transactions.filter(t => t.date.slice(0, 10) >= startDate);
      }
      
      if (endDate) {
        transactions = transactions.filter(t => t.date.slice(0, 10) <= endDate);
      }
    }

    // Sort by date descending, then id descending
    return transactions.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  } else {
    try {
      const db = getNativeDb();
      let query = `
        SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters) {
        const { searchTerm, categoryId, startDate, endDate, type } = filters;

        if (searchTerm) {
          query += ' AND (t.description LIKE ? OR c.name LIKE ?)';
          params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (categoryId !== undefined) {
          query += ' AND t.category_id = ?';
          params.push(categoryId);
        }

        if (type) {
          query += ' AND t.type = ?';
          params.push(type);
        }

        if (startDate) {
          query += ' AND date(t.date) >= date(?)';
          params.push(startDate);
        }

        if (endDate) {
          query += ' AND date(t.date) <= date(?)';
          params.push(endDate);
        }
      }

      query += ' ORDER BY t.date DESC, t.id DESC;';
      return db.getAllSync<Transaction>(query, params);
    } catch (error) {
      console.error('Failed to get transactions from SQLite:', error);
      return [];
    }
  }
}

// Add a transaction
export function addTransaction(
  type: 'expense' | 'income',
  amount: number,
  categoryId: number,
  date: string, // 'YYYY-MM-DD HH:MM:SS'
  description?: string
): Transaction | null {
  if (amount <= 0) return null;

  if (isWeb) {
    const txData = localStorage.getItem('expense_tracker_transactions');
    const transactions: Transaction[] = txData ? JSON.parse(txData) : [];
    
    const categories = getAllCategories();
    const cat = categories.find(c => c.id === categoryId);
    
    if (!cat) return null;

    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    const newTx: Transaction = {
      id: newId,
      type,
      amount,
      category_id: categoryId,
      date,
      description: description || '',
      category_name: cat.name,
      category_color: cat.color,
      category_icon: cat.icon,
    };

    transactions.push(newTx);
    localStorage.setItem('expense_tracker_transactions', JSON.stringify(transactions));
    return newTx;
  } else {
    try {
      const db = getNativeDb();
      const cat = db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?;', [categoryId]);
      if (!cat) return null;

      const result = db.runSync(
        'INSERT INTO transactions (type, amount, category_id, date, description) VALUES (?, ?, ?, ?, ?);',
        [type, amount, categoryId, date, description || '']
      );

      return {
        id: result.lastInsertRowId,
        type,
        amount,
        category_id: categoryId,
        date,
        description: description || '',
        category_name: cat.name,
        category_color: cat.color,
        category_icon: cat.icon,
      };
    } catch (error) {
      console.error('Failed to add transaction to SQLite:', error);
      return null;
    }
  }
}

// Delete a transaction
export function deleteTransaction(id: number): boolean {
  if (isWeb) {
    const txData = localStorage.getItem('expense_tracker_transactions');
    if (!txData) return false;
    let transactions: Transaction[] = JSON.parse(txData);
    
    const lengthBefore = transactions.length;
    transactions = transactions.filter(t => t.id !== id);
    
    localStorage.setItem('expense_tracker_transactions', JSON.stringify(transactions));
    return transactions.length < lengthBefore;
  } else {
    try {
      const db = getNativeDb();
      db.runSync('DELETE FROM transactions WHERE id = ?;', [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete transaction from SQLite:', error);
      return false;
    }
  }
}

export interface StatsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    totalAmount: number;
    percentage: number;
  }[];
}

// Get transaction stats summaries for dashboard / analytics charts
export function getTransactionStats(startDate?: string, endDate?: string): StatsSummary {
  const transactions = getAllTransactions({ startDate, endDate });
  
  let totalIncome = 0;
  let totalExpense = 0;
  
  const categorySums: Record<number, { cat: Category; sum: number }> = {};
  
  // Cache categories
  const categories = getAllCategories();
  const categoriesMap = new Map<number, Category>();
  categories.forEach(c => categoriesMap.set(c.id, c));

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      
      const cat = categoriesMap.get(t.category_id);
      if (cat) {
        if (!categorySums[cat.id]) {
          categorySums[cat.id] = { cat, sum: 0 };
        }
        categorySums[cat.id].sum += t.amount;
      }
    }
  });

  const categoryBreakdown = Object.values(categorySums)
    .map(({ cat, sum }) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      categoryIcon: cat.icon,
      totalAmount: sum,
      percentage: totalExpense > 0 ? (sum / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount); // Sort from highest spend to lowest

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryBreakdown,
  };
}

// Clear all databases/reset
export function clearAllDatabaseData(): void {
  if (isWeb) {
    localStorage.removeItem('expense_tracker_transactions');
    localStorage.removeItem('expense_tracker_budgets');
    localStorage.removeItem('expense_tracker_categories');
    
    // Seed default categories back
    const seeded = DEFAULT_CATEGORIES.map((c, index) => ({
      id: index + 1,
      ...c,
    }));
    localStorage.setItem('expense_tracker_categories', JSON.stringify(seeded));
    localStorage.setItem('expense_tracker_transactions', JSON.stringify([]));
    localStorage.setItem('expense_tracker_budgets', JSON.stringify([]));
  } else {
    try {
      const db = getNativeDb();
      db.runSync('DELETE FROM transactions;');
      db.runSync('DELETE FROM budgets;');
      db.runSync('DELETE FROM categories WHERE is_default = 0;');
    } catch (error) {
      console.error('Failed to clear database in SQLite:', error);
    }
  }
}
