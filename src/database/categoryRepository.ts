import { isWeb, getNativeDb } from './db';
import { Category, Budget } from './types';

// Fetch all categories
export function getAllCategories(): Category[] {
  if (isWeb) {
    const data = localStorage.getItem('expense_tracker_categories');
    const categories: Category[] = data ? JSON.parse(data) : [];
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    try {
      const db = getNativeDb();
      return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name ASC;');
    } catch (error) {
      console.error('Failed to get categories from SQLite:', error);
      return [];
    }
  }
}

// Add a custom category
export function addCategory(name: string, icon: string, color: string): Category | null {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  if (isWeb) {
    const data = localStorage.getItem('expense_tracker_categories');
    const categories: Category[] = data ? JSON.parse(data) : [];
    
    // Check for duplicates
    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Category name already exists.');
    }
    
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory: Category = {
      id: newId,
      name: trimmedName,
      icon,
      color,
      is_default: 0,
    };
    
    categories.push(newCategory);
    localStorage.setItem('expense_tracker_categories', JSON.stringify(categories));
    return newCategory;
  } else {
    try {
      const db = getNativeDb();
      // Check for duplicates first to prevent native constraint crash and throw clean error
      const existing = db.getFirstSync<Category>('SELECT * FROM categories WHERE LOWER(name) = LOWER(?);', [trimmedName]);
      if (existing) {
        throw new Error('Category name already exists.');
      }

      const result = db.runSync(
        'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 0);',
        [trimmedName, icon, color]
      );
      
      return {
        id: result.lastInsertRowId,
        name: trimmedName,
        icon,
        color,
        is_default: 0,
      };
    } catch (error: any) {
      console.error('Failed to add category to SQLite:', error);
      throw error;
    }
  }
}

// Delete a category (only if not default)
export function deleteCategory(id: number): boolean {
  if (isWeb) {
    const data = localStorage.getItem('expense_tracker_categories');
    let categories: Category[] = data ? JSON.parse(data) : [];
    
    const category = categories.find(c => c.id === id);
    if (!category || category.is_default === 1) {
      return false; // Can't delete default categories
    }
    
    // Remove category
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem('expense_tracker_categories', JSON.stringify(categories));
    
    // Manual Cascade Delete for Transactions on Web
    const txData = localStorage.getItem('expense_tracker_transactions');
    if (txData) {
      const transactions = JSON.parse(txData);
      const filteredTx = transactions.filter((t: any) => t.category_id !== id);
      localStorage.setItem('expense_tracker_transactions', JSON.stringify(filteredTx));
    }

    // Manual Cascade Delete for Budgets on Web
    const budgetData = localStorage.getItem('expense_tracker_budgets');
    if (budgetData) {
      const budgets = JSON.parse(budgetData);
      const filteredBudgets = budgets.filter((b: any) => b.category_id !== id);
      localStorage.setItem('expense_tracker_budgets', JSON.stringify(filteredBudgets));
    }
    
    return true;
  } else {
    try {
      const db = getNativeDb();
      // Check if it's default
      const category = db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?;', [id]);
      if (!category || category.is_default === 1) {
        return false;
      }
      
      db.runSync('DELETE FROM categories WHERE id = ?;', [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete category from SQLite:', error);
      return false;
    }
  }
}

// Fetch all budgets for a specific month
export function getAllBudgets(month: string): Budget[] {
  if (isWeb) {
    const budgetData = localStorage.getItem('expense_tracker_budgets');
    const budgets: Budget[] = budgetData ? JSON.parse(budgetData) : [];
    
    const filtered = budgets.filter(b => b.month === month);
    
    const catData = localStorage.getItem('expense_tracker_categories');
    const categories: Category[] = catData ? JSON.parse(catData) : [];
    
    // Hydrate budgets
    return filtered.map(b => {
      const cat = categories.find(c => c.id === b.category_id);
      return {
        ...b,
        category_name: cat ? cat.name : 'Unknown',
        category_color: cat ? cat.color : '#6B7280',
      };
    });
  } else {
    try {
      const db = getNativeDb();
      return db.getAllSync<Budget>(`
        SELECT b.category_id, b.month, b.limit_amount, c.name as category_name, c.color as category_color 
        FROM budgets b 
        JOIN categories c ON b.category_id = c.id
        WHERE b.month = ?;
      `, [month]);
    } catch (error) {
      console.error('Failed to get budgets from SQLite:', error);
      return [];
    }
  }
}

// Set or update a budget for a category for a specific month
export function setBudget(categoryId: number, limitAmount: number, month: string): Budget | null {
  if (limitAmount <= 0) return null;

  if (isWeb) {
    const budgetData = localStorage.getItem('expense_tracker_budgets');
    let budgets: Budget[] = budgetData ? JSON.parse(budgetData) : [];
    
    const catData = localStorage.getItem('expense_tracker_categories');
    const categories: Category[] = catData ? JSON.parse(catData) : [];
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) return null;
    
    const existingIndex = budgets.findIndex(b => b.category_id === categoryId && b.month === month);
    const newBudget: Budget = {
      category_id: categoryId,
      month: month,
      limit_amount: limitAmount,
      category_name: category.name,
      category_color: category.color,
    };
    
    if (existingIndex >= 0) {
      budgets[existingIndex] = { category_id: categoryId, month: month, limit_amount: limitAmount };
    } else {
      budgets.push({ category_id: categoryId, month: month, limit_amount: limitAmount });
    }
    
    localStorage.setItem('expense_tracker_budgets', JSON.stringify(budgets));
    return newBudget;
  } else {
    try {
      const db = getNativeDb();
      
      const category = db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?;', [categoryId]);
      if (!category) return null;

      db.runSync(
        'INSERT OR REPLACE INTO budgets (category_id, month, limit_amount) VALUES (?, ?, ?);',
        [categoryId, month, limitAmount]
      );
      
      return {
        category_id: categoryId,
        month: month,
        limit_amount: limitAmount,
        category_name: category.name,
        category_color: category.color,
      };
    } catch (error) {
      console.error('Failed to set budget in SQLite:', error);
      return null;
    }
  }
}

// Delete budget for a category for a specific month
export function deleteBudget(categoryId: number, month: string): boolean {
  if (isWeb) {
    const budgetData = localStorage.getItem('expense_tracker_budgets');
    if (!budgetData) return false;
    let budgets: Budget[] = JSON.parse(budgetData);
    
    const lengthBefore = budgets.length;
    budgets = budgets.filter(b => !(b.category_id === categoryId && b.month === month));
    
    localStorage.setItem('expense_tracker_budgets', JSON.stringify(budgets));
    return budgets.length < lengthBefore;
  } else {
    try {
      const db = getNativeDb();
      db.runSync('DELETE FROM budgets WHERE category_id = ? AND month = ?;', [categoryId, month]);
      return true;
    } catch (error) {
      console.error('Failed to delete budget from SQLite:', error);
      return false;
    }
  }
}

// Copy all budgets from one month to another month
export function copyBudgets(fromMonth: string, toMonth: string): boolean {
  if (isWeb) {
    const budgetData = localStorage.getItem('expense_tracker_budgets');
    let budgets: Budget[] = budgetData ? JSON.parse(budgetData) : [];
    
    // Get budgets of fromMonth
    const sourceBudgets = budgets.filter(b => b.month === fromMonth);
    if (sourceBudgets.length === 0) return false;
    
    // Remove existing budgets of toMonth for categories we are copying
    const sourceCategoryIds = new Set(sourceBudgets.map(b => b.category_id));
    budgets = budgets.filter(b => !(b.month === toMonth && sourceCategoryIds.has(b.category_id)));
    
    // Add copied budgets
    sourceBudgets.forEach(b => {
      budgets.push({
        category_id: b.category_id,
        month: toMonth,
        limit_amount: b.limit_amount
      });
    });
    
    localStorage.setItem('expense_tracker_budgets', JSON.stringify(budgets));
    return true;
  } else {
    try {
      const db = getNativeDb();
      // First delete toMonth budgets for categories that exist in fromMonth to prevent primary key constraint errors
      db.runSync(`
        DELETE FROM budgets 
        WHERE month = ? 
          AND category_id IN (SELECT category_id FROM budgets WHERE month = ?);
      `, [toMonth, fromMonth]);

      // Copy fromMonth budgets into toMonth
      db.runSync(`
        INSERT INTO budgets (category_id, month, limit_amount)
        SELECT category_id, ?, limit_amount FROM budgets WHERE month = ?;
      `, [toMonth, fromMonth]);
      
      const changesResult = db.getFirstSync<{ changes: number }>('SELECT changes() as changes;');
      return changesResult ? changesResult.changes > 0 : true;
    } catch (error) {
      console.error('Failed to copy budgets in SQLite:', error);
      return false;
    }
  }
}
