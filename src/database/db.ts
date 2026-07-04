import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Category } from './types';

export const isWeb = Platform.OS === 'web';
const DATABASE_NAME = 'expense_tracker.db';

let nativeDb: SQLite.SQLiteDatabase | null = null;

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', icon: 'coffee', color: '#F59E0B', is_default: 1 },
  { name: 'Transport', icon: 'truck', color: '#3B82F6', is_default: 1 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', is_default: 1 },
  { name: 'Entertainment', icon: 'film', color: '#8B5CF6', is_default: 1 },
  { name: 'Utilities', icon: 'zap', color: '#06B6D4', is_default: 1 },
  { name: 'Housing', icon: 'home', color: '#EF4444', is_default: 1 },
  { name: 'Salary', icon: 'dollar-sign', color: '#10B981', is_default: 1 },
  { name: 'Electricity Bill', icon: 'zap', color: '#EAB308', is_default: 1 },
  { name: 'Investment', icon: 'trending-up', color: '#84CC16', is_default: 1 },
  { name: 'Accessories/Gadgets', icon: 'cpu', color: '#F43F5E', is_default: 1 },
  { name: 'Snacks', icon: 'smile', color: '#F97316', is_default: 1 },
  { name: 'Savings', icon: 'trending-up', color: '#14B8A6', is_default: 1 },
  { name: 'Petrol', icon: 'droplet', color: '#0284C7', is_default: 1 },
  { name: 'EMI', icon: 'credit-card', color: '#6366F1', is_default: 1 },
  { name: 'Room Rent', icon: 'home', color: '#E11D48', is_default: 1 },
  { name: 'Mobile', icon: 'smartphone', color: '#D946EF', is_default: 1 },
  { name: 'Wifi/Internet', icon: 'wifi', color: '#0EA5E9', is_default: 1 },
  { name: 'Others', icon: 'grid', color: '#6B7280', is_default: 1 },
];

export function getNativeDb(): SQLite.SQLiteDatabase {
  if (isWeb) {
    throw new Error('SQLite is not available on Web platform');
  }
  if (!nativeDb) {
    nativeDb = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return nativeDb;
}

export const getCurrentMonthStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export function initDatabase() {
  if (isWeb) {
    // Initialize LocalStorage for Web preview
    if (!localStorage.getItem('expense_tracker_categories')) {
      const seeded = DEFAULT_CATEGORIES.map((c, index) => ({
        id: index + 1,
        ...c,
      }));
      localStorage.setItem('expense_tracker_categories', JSON.stringify(seeded));
    } else {
      // Migration: Update existing Web Transport category icon if it is using 'car'
      try {
        const data = localStorage.getItem('expense_tracker_categories');
        if (data) {
          const categories = JSON.parse(data);
          let modified = false;
          const transport = categories.find((c: any) => c.name === 'Transport' && c.icon === 'car');
          if (transport) {
            transport.icon = 'truck';
            modified = true;
          }

          // Migration: Seed Snacks and Savings if missing
          const snacks = categories.find((c: any) => c.name.toLowerCase() === 'snacks');
          if (!snacks) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Snacks', icon: 'smile', color: '#F97316', is_default: 1 });
            modified = true;
          }

          const savings = categories.find((c: any) => c.name.toLowerCase() === 'savings');
          if (!savings) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Savings', icon: 'trending-up', color: '#14B8A6', is_default: 1 });
            modified = true;
          }

          // Migration: Seed Petrol, EMI, and Room Rent if missing
          const petrol = categories.find((c: any) => c.name.toLowerCase() === 'petrol');
          if (!petrol) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Petrol', icon: 'droplet', color: '#0284C7', is_default: 1 });
            modified = true;
          }

          const emi = categories.find((c: any) => c.name.toLowerCase() === 'emi');
          if (!emi) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'EMI', icon: 'credit-card', color: '#6366F1', is_default: 1 });
            modified = true;
          }

          const roomRent = categories.find((c: any) => c.name.toLowerCase() === 'room rent');
          if (!roomRent) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Room Rent', icon: 'home', color: '#E11D48', is_default: 1 });
            modified = true;
          }

          const mobile = categories.find((c: any) => c.name.toLowerCase() === 'mobile');
          if (!mobile) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Mobile', icon: 'smartphone', color: '#D946EF', is_default: 1 });
            modified = true;
          }

          const wifiInternet = categories.find((c: any) => c.name.toLowerCase() === 'wifi/internet');
          if (!wifiInternet) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Wifi/Internet', icon: 'wifi', color: '#0EA5E9', is_default: 1 });
            modified = true;
          }

          const electricityBill = categories.find((c: any) => c.name.toLowerCase() === 'electricity bill');
          if (!electricityBill) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Electricity Bill', icon: 'zap', color: '#EAB308', is_default: 1 });
            modified = true;
          }

          const investment = categories.find((c: any) => c.name.toLowerCase() === 'investment');
          if (!investment) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Investment', icon: 'trending-up', color: '#84CC16', is_default: 1 });
            modified = true;
          }

          const accessories = categories.find((c: any) => c.name.toLowerCase() === 'accessories/gadgets');
          if (!accessories) {
            const nextId = categories.length > 0 ? Math.max(...categories.map((c: any) => c.id)) + 1 : 1;
            categories.push({ id: nextId, name: 'Accessories/Gadgets', icon: 'cpu', color: '#F43F5E', is_default: 1 });
            modified = true;
          }

          if (modified) {
            localStorage.setItem('expense_tracker_categories', JSON.stringify(categories));
          }
        }
      } catch (e) {
        console.error('Failed to run categories migration in localStorage:', e);
      }
    }
    if (!localStorage.getItem('expense_tracker_transactions')) {
      localStorage.setItem('expense_tracker_transactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('expense_tracker_budgets')) {
      localStorage.setItem('expense_tracker_budgets', JSON.stringify([]));
    } else {
      // Migration: Add month to existing web budgets if missing
      try {
        const budgetData = localStorage.getItem('expense_tracker_budgets');
        if (budgetData) {
          const budgets = JSON.parse(budgetData);
          let modified = false;
          budgets.forEach((b: any) => {
            if (!b.month) {
              b.month = getCurrentMonthStr();
              modified = true;
            }
          });
          if (modified) {
            localStorage.setItem('expense_tracker_budgets', JSON.stringify(budgets));
          }
        }
      } catch (e) {
        console.error('Failed to run budgets migration in localStorage:', e);
      }
    }
    console.log('Web localStorage database initialized.');
  } else {
    // Initialize SQLite for Native
    try {
      const db = getNativeDb();
      
      // Enable Foreign Keys
      db.execSync('PRAGMA foreign_keys = ON;');
      
      // Create Categories Table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          is_default INTEGER DEFAULT 0
        );
      `);
      
      // Create Transactions Table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
          amount REAL NOT NULL,
          category_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);
      
      // Create Budgets Table with month support
      db.execSync(`
        CREATE TABLE IF NOT EXISTS budgets (
          category_id INTEGER,
          month TEXT NOT NULL,
          limit_amount REAL NOT NULL,
          PRIMARY KEY (category_id, month),
          FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);

      // SQLite Migration: Check if budgets table has month column
      let hasMonthColumn = false;
      try {
        const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(budgets);');
        hasMonthColumn = columns.some(col => col.name === 'month');
      } catch (e) {
        console.error('Failed to query budgets table info:', e);
      }

      if (!hasMonthColumn) {
        console.log('Migrating SQLite budgets table to include month column...');
        db.execSync('ALTER TABLE budgets RENAME TO budgets_old;');
        db.execSync(`
          CREATE TABLE budgets (
            category_id INTEGER,
            month TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            PRIMARY KEY (category_id, month),
            FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
          );
        `);
        const currentMonth = getCurrentMonthStr();
        try {
          db.runSync(
            'INSERT INTO budgets (category_id, month, limit_amount) SELECT category_id, ?, limit_amount FROM budgets_old;',
            [currentMonth]
          );
        } catch (e) {
          console.error('Failed to migrate data from budgets_old:', e);
        }
        db.execSync('DROP TABLE IF EXISTS budgets_old;');
        console.log('SQLite budgets table migration completed.');
      }

      // Create Settings Table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Seed default categories if empty
      const countResult = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories;');
      if (countResult && countResult.count === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          db.runSync(
            'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, ?);',
            [cat.name, cat.icon, cat.color, cat.is_default]
          );
        }
        console.log('Native SQLite default categories seeded.');
      } else {
        // Migration: Update existing Transport category icon if it is using 'car'
        try {
          db.runSync(
            "UPDATE categories SET icon = 'truck' WHERE name = 'Transport' AND icon = 'car';"
          );
        } catch (e) {
          console.error('Failed to run categories migration in SQLite:', e);
        }

        // Migration: Seed Snacks and Savings if missing
        try {
          const snacksRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['snacks']);
          if (!snacksRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Snacks', 'smile', '#F97316']
            );
          }
          const savingsRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['savings']);
          if (!savingsRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Savings', 'trending-up', '#14B8A6']
            );
          }

          // Seeding Petrol, EMI, and Room Rent
          const petrolRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['petrol']);
          if (!petrolRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Petrol', 'droplet', '#0284C7']
            );
          }
          const emiRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['emi']);
          if (!emiRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['EMI', 'credit-card', '#6366F1']
            );
          }
          const roomRentRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['room rent']);
          if (!roomRentRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Room Rent', 'home', '#E11D48']
            );
          }

          const mobileRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['mobile']);
          if (!mobileRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Mobile', 'smartphone', '#D946EF']
            );
          }

          const wifiInternetRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['wifi/internet']);
          if (!wifiInternetRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Wifi/Internet', 'wifi', '#0EA5E9']
            );
          }

          const electricityRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['electricity bill']);
          if (!electricityRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Electricity Bill', 'zap', '#EAB308']
            );
          }

          const investmentRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['investment']);
          if (!investmentRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Investment', 'trending-up', '#84CC16']
            );
          }

          const accessoriesRow = db.getFirstSync<{ id: number }>('SELECT id FROM categories WHERE LOWER(name) = ?;', ['accessories/gadgets']);
          if (!accessoriesRow) {
            db.runSync(
              'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1);',
              ['Accessories/Gadgets', 'cpu', '#F43F5E']
            );
          }
        } catch (e) {
          console.error('Failed to seed missing categories in SQLite:', e);
        }
      }
      console.log('Native SQLite database initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
    }
  }
}

// Get key value setting helper
export function getSetting(key: string, defaultValue: string): string {
  if (isWeb) {
    return localStorage.getItem(`setting_${key}`) || defaultValue;
  } else {
    try {
      const db = getNativeDb();
      const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?;', [key]);
      return row ? row.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

// Set key value setting helper
export function setSetting(key: string, value: string): void {
  if (isWeb) {
    localStorage.setItem(`setting_${key}`, value);
  } else {
    try {
      const db = getNativeDb();
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
    }
  }
}
