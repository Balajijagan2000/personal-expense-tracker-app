export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_default: number; // 1 = true, 0 = false
}

export interface Transaction {
  id: number;
  type: 'expense' | 'income';
  amount: number;
  category_id: number;
  category_name?: string; // Hydrated from categories table
  category_color?: string; // Hydrated from categories table
  category_icon?: string; // Hydrated from categories table
  date: string; // ISO 8601 string: YYYY-MM-DD HH:MM:SS
  description?: string;
}

export interface Budget {
  category_id: number;
  limit_amount: number;
  category_name?: string; // Hydrated
  category_color?: string; // Hydrated
}
