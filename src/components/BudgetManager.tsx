import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import CategoryIcon from './CategoryIcon';
import { Feather } from '@expo/vector-icons';
import { getContrastColor } from '../utils/color';

// Utility functions for month labels
const getPrevMonthStr = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
};

const getNextMonthStr = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
};

const formatMonthLabelLong = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatMonthLabelShort = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

// Row component to isolate state for fast, lag-free typing
interface BudgetRowProps {
  category: any;
  currentBudget: any;
  currencySymbol: string;
  isDark: boolean;
  onSave: (categoryId: number, value: string) => void;
}

function BudgetRow({ category, currentBudget, currencySymbol, isDark, onSave }: BudgetRowProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(currentBudget ? currentBudget.limit_amount.toString() : '');
  }, [currentBudget]);

  const handleBlur = () => {
    onSave(category.id, inputValue);
  };

  return (
    <View style={[styles.rowItem, isDark ? styles.borderDark : styles.borderLight]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: category.color }]}>
          <CategoryIcon name={category.icon} size={14} color={getContrastColor(category.color)} />
        </View>
        <Text style={[styles.catName, isDark ? styles.textWhite : styles.textBlack]}>
          {category.name}
        </Text>
      </View>
      
      <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
        <Text style={[styles.currencyPrefix, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {currencySymbol}
        </Text>
        <TextInput
          placeholder="0.00"
          placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
          keyboardType="decimal-pad"
          style={[styles.input, isDark ? styles.textWhite : styles.textBlack]}
          value={inputValue}
          onChangeText={setInputValue}
          onBlur={handleBlur}
          onSubmitEditing={handleBlur}
        />
      </View>
    </View>
  );
}

export default function BudgetManager() {
  const { categories, budgets, updateBudget, removeBudget, copyBudgetsForMonth, theme, currencySymbol, selectedMonth, setSelectedMonth } = useApp();
  const isDark = theme === 'dark';

  const currentMonthStr = selectedMonth === 'all' 
    ? (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })() 
    : selectedMonth;

  useEffect(() => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonthStr);
    }
  }, [selectedMonth]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);

  const handlePreviousMonth = () => {
    setSelectedMonth(getPrevMonthStr(currentMonthStr));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonthStr(currentMonthStr));
  };

  const handleSaveBudgetRow = (categoryId: number, val: string) => {
    const amount = parseFloat(val);
    if (val.trim() === '' || isNaN(amount) || amount <= 0) {
      removeBudget(categoryId);
    } else {
      updateBudget(categoryId, amount);
    }
  };

  const handleCopyLastMonthBudget = () => {
    const prevMonth = getPrevMonthStr(currentMonthStr);
    const success = copyBudgetsForMonth(prevMonth, currentMonthStr);
    
    const prevLabel = formatMonthLabelShort(prevMonth);
    const currLabel = formatMonthLabelShort(currentMonthStr);

    if (success) {
      const msg = `Successfully copied all budgets from ${prevLabel} to ${currLabel}!`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Copy Complete', msg);
      }
    } else {
      const msg = `No budget limits were set in ${prevLabel} to copy.`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('No Budgets Found', msg);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Selector */}
      <View style={styles.monthFilterRow}>
        <View style={[
          styles.monthSlider,
          isDark ? styles.sliderDark : styles.sliderLight
        ]}>
          <Pressable
            onPress={handlePreviousMonth}
            style={({ pressed }) => [
              styles.sliderChevron,
              pressed && styles.pressed
            ]}
          >
            <Feather name="chevron-left" size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[
              styles.sliderMonthText,
              isDark ? styles.textWhite : styles.textBlack
            ]}>
              {formatMonthLabelLong(currentMonthStr)}
            </Text>
          </View>

          <Pressable
            onPress={handleNextMonth}
            style={({ pressed }) => [
              styles.sliderChevron,
              pressed && styles.pressed
            ]}
          >
            <Feather name="chevron-right" size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
          </Pressable>
        </View>
      </View>

      {/* Aggregate card */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardSubTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Total Monthly Budget Limit
        </Text>
        <Text style={[styles.totalBudgetText, isDark ? styles.textWhite : styles.textBlack]}>
          {currencySymbol}{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        
        <Pressable
          onPress={handleCopyLastMonthBudget}
          style={({ pressed }) => [
            styles.copyBtn,
            pressed && styles.pressed
          ]}
        >
          <Feather name="copy" size={14} color="#FFFFFF" style={styles.copyIcon} />
          <Text style={styles.copyBtnText}>Copy Last Month's Budget</Text>
        </Pressable>
      </View>

      {/* Categories budgets list */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, { paddingBottom: 10 }]}>
        <Text style={[styles.cardTitle, isDark ? styles.textWhite : styles.textBlack]}>
          Category Limits
        </Text>
        
        <View style={styles.listContainer}>
          {categories.map((cat) => {
            const currentBudget = budgets.find(b => b.category_id === cat.id);
            return (
              <BudgetRow
                key={cat.id}
                category={cat}
                currentBudget={currentBudget}
                currencySymbol={currencySymbol}
                isDark={isDark}
                onSave={handleSaveBudgetRow}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  monthFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  monthSlider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  sliderLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sliderDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sliderChevron: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderMonthText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#6B7280',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardSubTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalBudgetText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 40,
  },
  copyIcon: {
    marginRight: 6,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    marginTop: 4,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  borderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  borderLight: {
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    width: 110,
    height: 36,
    paddingHorizontal: 8,
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  currencyPrefix: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
    height: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textBlack: {
    color: '#0F172A',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
  textMutedLight: {
    color: '#64748B',
  },
});
