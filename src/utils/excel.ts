import { cacheDirectory, writeAsStringAsync, readAsStringAsync, EncodingType, StorageAccessFramework } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import { getAllTransactions, addTransaction } from '../database/transactionRepository';
import { getAllCategories, addCategory } from '../database/categoryRepository';
import { isWeb } from '../database/db';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  error?: string;
}

// Format date to local YYYY-MM-DD HH:MM:SS
function formatLocalDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Export all transactions to Excel (.xlsx)
export async function exportToExcel(monthFilter?: string): Promise<boolean> {
  try {
    let transactions = getAllTransactions();
    
    // Filter by month (YYYY-MM) if provided
    if (monthFilter) {
      transactions = transactions.filter(t => t.date.startsWith(monthFilter));
    }

    if (transactions.length === 0) {
      return false;
    }
    
    // Map transaction data to flat structures for Excel sheets
    const dataToExport = transactions.map(t => ({
      ID: t.id,
      Type: t.type === 'income' ? 'Income' : 'Expense',
      Amount: t.amount,
      Category: t.category_name || 'Others',
      Date: t.date,
      Description: t.description || '',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Create and append Transactions sheet (First tab so import reads it correctly)
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // 2. Calculate summary statistics
    let totalIncome = 0;
    let totalExpense = 0;
    const categorySums: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        const catName = t.category_name || 'Others';
        categorySums[catName] = (categorySums[catName] || 0) + t.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    // 3. Create a beautiful array-of-arrays for the Summary sheet
    const summaryRows = [
      ['Expense Tracker - Financial Summary Report'],
      ['Generated On', new Date().toLocaleString()],
      monthFilter ? [`Export Filter Month: ${monthFilter}`] : ['Export Filter: All-Time'],
      [],
      ['Overview Metric', 'Value'],
      ['Total Income', totalIncome],
      ['Total Expenses', totalExpense],
      ['Net Balance', netBalance],
      ['Total Transactions Count', transactions.length],
      [],
      ['Category Spending Breakdown', 'Total Spent', 'Percentage']
    ];

    Object.keys(categorySums).forEach(cat => {
      const amount = categorySums[cat];
      const pct = totalExpense > 0 ? amount / totalExpense : 0;
      summaryRows.push([cat, amount, `${(pct * 100).toFixed(1)}%`]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const fileName = monthFilter
      ? `Expense_Report_${monthFilter.replace('-', '_')}.xlsx`
      : `Expense_Report_AllTime_${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (isWeb) {
      // Browser trigger download
      XLSX.writeFile(wb, fileName);
      return true;
    } else if (Platform.OS === 'android') {
      // Android: Ask user to select directory (like Downloads) and write directly
      try {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          console.warn('Directory permission denied by user');
          return false;
        }

        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        await writeAsStringAsync(fileUri, wbout, {
          encoding: EncodingType.Base64,
        });
        return true;
      } catch (err) {
        console.error('Failed to save Excel file directly on Android:', err);
        return false;
      }
    } else {
      // iOS / other mobile platforms (use native share sheet)
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileUri = `${cacheDirectory}${fileName}`;
      
      await writeAsStringAsync(fileUri, wbout, {
        encoding: EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Expense Report',
          UTI: 'com.microsoft.excel.xlsx',
        });
        return true;
      } else {
        console.warn('Sharing is not available on this device');
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    return false;
  }
}

// Import transactions from an Excel or CSV file
export async function importFromExcel(): Promise<ImportResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, importedCount: 0, error: 'Import cancelled' };
    }

    const fileAsset = result.assets[0];
    let workbook: XLSX.WorkBook;

    if (isWeb) {
      // On web, read file blob using FileReader
      const file = fileAsset.file;
      if (!file) {
        return { success: false, importedCount: 0, error: 'Could not access file object' };
      }
      
      const arrayBuffer = await file.arrayBuffer();
      workbook = XLSX.read(arrayBuffer, { type: 'array' });
    } else {
      // On mobile native, read cached file as base64 string
      const fileUri = fileAsset.uri;
      const base64Data = await readAsStringAsync(fileUri, {
        encoding: EncodingType.Base64,
      });
      workbook = XLSX.read(base64Data, { type: 'base64' });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

    if (rawData.length === 0) {
      return { success: false, importedCount: 0, error: 'The selected file has no data rows' };
    }

    // Process transactions and import
    const existingCategories = getAllCategories();
    const categoryMap = new Map<string, number>();
    existingCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

    let importedCount = 0;

    for (const row of rawData) {
      // Extract properties mapping possible sheet header variations
      const rawType = (row.Type || row.type || 'expense').toString().trim().toLowerCase();
      const type: 'expense' | 'income' = rawType === 'income' ? 'income' : 'expense';

      const amount = parseFloat(row.Amount || row.amount);
      if (isNaN(amount) || amount <= 0) continue;

      const rawCategory = (row.Category || row.category || 'Others').toString().trim();
      const dateStr = (row.Date || row.date || formatLocalDate(new Date())).toString().trim();
      const description = (row.Description || row.description || '').toString().trim();

      // Find or create category on-the-fly (Ensures scalability and resilience)
      let categoryId = categoryMap.get(rawCategory.toLowerCase());
      
      if (!categoryId) {
        // Create custom category with random clean muted color and grid icon
        const randomColors = ['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4', '#6B7280'];
        const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
        
        try {
          const newCat = addCategory(rawCategory, 'grid', randomColor);
          if (newCat) {
            categoryId = newCat.id;
            categoryMap.set(rawCategory.toLowerCase(), newCat.id);
          } else {
            // Fallback to "Others" category
            categoryId = categoryMap.get('others') || 1;
          }
        } catch {
          // If addition fails (e.g. duplicate constraint check), re-query or fallback
          const refreshedCats = getAllCategories();
          const refreshedMatch = refreshedCats.find(c => c.name.toLowerCase() === rawCategory.toLowerCase());
          if (refreshedMatch) {
            categoryId = refreshedMatch.id;
          } else {
            categoryId = categoryMap.get('others') || 1;
          }
        }
      }

      // Format input date into SQLite/ISO string if it's parsed as serial number (Excel dates sometimes parse as numbers)
      let finalDate = dateStr;
      if (!isNaN(Number(dateStr)) && Number(dateStr) > 30000) {
        // Excel date serial number
        try {
          const parsedExcelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
          finalDate = formatLocalDate(parsedExcelDate);
        } catch {
          finalDate = formatLocalDate(new Date());
        }
      } else {
        // Parse date string
        try {
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj.getTime())) {
            finalDate = formatLocalDate(new Date());
          } else {
            finalDate = formatLocalDate(dateObj);
          }
        } catch {
          finalDate = formatLocalDate(new Date());
        }
      }

      const tx = addTransaction(type, amount, categoryId, finalDate, description);
      if (tx) {
        importedCount++;
      }
    }

    return { success: true, importedCount };
  } catch (error: any) {
    console.error('Failed to import Excel file:', error);
    return { success: false, importedCount: 0, error: error.message || 'Unknown error during import' };
  }
}
