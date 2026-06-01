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
          const transport = categories.find((c: any) => c.name === 'Transport' && c.icon === 'car');
          if (transport) {
            transport.icon = 'truck';
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
      
      // Create Budgets Table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS budgets (
          category_id INTEGER PRIMARY KEY,
          limit_amount REAL NOT NULL,
          FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);

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
