import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, Pressable, Alert, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { Transaction } from '../database/types';
import CategoryIcon from './CategoryIcon';
import { Feather } from '@expo/vector-icons';
import { getContrastColor, getTranslucentColor } from '../utils/color';

export default function TransactionList() {
  const { transactions, categories, deleteTx, currencySymbol, theme } = useApp();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Formatting helpers
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered transactions computed locally for real-time performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.category_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());

      const matchesType = selectedType === 'all' || t.type === selectedType;

      const matchesCategory = selectedCategoryId === null || t.category_id === selectedCategoryId;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, selectedType, selectedCategoryId]);

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('Are you sure you want to delete this transaction?');
      if (confirmDelete) {
        deleteTx(id);
      }
    } else {
      Alert.alert(
        'Delete Transaction',
        'Are you sure you want to delete this transaction?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteTx(id) },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === 'expense';
    
    return (
      <View style={[styles.txItem, isDark ? styles.txItemDark : styles.txItemLight]}>
        <View style={styles.txLeft}>
          {/* Category Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: item.category_color || '#6B7280' }]}>
            <CategoryIcon name={item.category_icon || 'grid'} size={16} color={getContrastColor(item.category_color || '#6B7280')} />
          </View>
          
          <View style={styles.txInfo}>
            <Text style={[styles.txCategoryName, isDark ? styles.textWhite : styles.textBlack]}>
              {item.category_name}
            </Text>
            {item.description ? (
              <Text style={[styles.txDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                {item.description}
              </Text>
            ) : null}
            <Text style={[styles.txDate, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              {formatDate(item.date)}
            </Text>
          </View>
        </View>

        <View style={styles.txRight}>
          <Text style={[
            styles.txAmount,
            isExpense ? styles.textRed : styles.textGreen
          ]}>
            {isExpense ? '-' : '+'}{formatAmount(item.amount)}
          </Text>
          <Pressable 
            onPress={() => handleDelete(item.id)}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.pressed
            ]}
          >
            <Feather name="trash-2" size={14} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.searchBar, isDark ? styles.searchBarDark : styles.searchBarLight]}>
        <Feather name="search" size={16} color={isDark ? '#64748B' : '#94A3B8'} style={styles.searchIcon} />
        <TextInput
          placeholder="Search descriptions or categories..."
          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
          style={[styles.searchInput, isDark ? styles.textWhite : styles.textBlack]}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Feather name="x" size={16} color={isDark ? '#64748B' : '#94A3B8'} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips Container */}
      <View style={styles.filtersRow}>
        {/* Type selector */}
        <View style={styles.typeSelector}>
          <Pressable
            onPress={() => setSelectedType('all')}
            style={[
              styles.typeChip,
              isDark ? styles.chipDark : styles.chipLight,
              selectedType === 'all' && (isDark ? styles.chipActiveDark : styles.chipActiveLight)
            ]}
          >
            <Text style={[
              styles.chipText,
              selectedType === 'all' ? (isDark ? styles.textWhite : styles.textBlack) : (isDark ? styles.textMutedDark : styles.textMutedLight)
            ]}>All</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedType('expense')}
            style={[
              styles.typeChip,
              isDark ? styles.chipDark : styles.chipLight,
              selectedType === 'expense' && (isDark ? styles.chipActiveDark : styles.chipActiveLight)
            ]}
          >
            <Text style={[
              styles.chipText,
              selectedType === 'expense' ? styles.textRed : (isDark ? styles.textMutedDark : styles.textMutedLight)
            ]}>Expenses</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedType('income')}
            style={[
              styles.typeChip,
              isDark ? styles.chipDark : styles.chipLight,
              selectedType === 'income' && (isDark ? styles.chipActiveDark : styles.chipActiveLight)
            ]}
          >
            <Text style={[
              styles.chipText,
              selectedType === 'income' ? styles.textGreen : (isDark ? styles.textMutedDark : styles.textMutedLight)
            ]}>Income</Text>
          </Pressable>
        </View>
      </View>

      {/* Category horizontal filter list */}
      <View style={styles.categoryFilters}>
        <FlatList
          data={[{ id: null, name: 'All Categories' } as any, ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => (item.id === null ? 'all-cat' : item.id.toString())}
          renderItem={({ item }) => {
            const isSelected = selectedCategoryId === item.id;
            const hasColor = !!item.color;
            const activeBg = hasColor 
              ? getTranslucentColor(item.color, isDark ? 0.25 : 0.12) 
              : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0');
            const activeBorder = hasColor 
              ? item.color 
              : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)');

            return (
              <Pressable
                onPress={() => setSelectedCategoryId(item.id)}
                style={[
                  styles.catChip,
                  isDark ? styles.chipDark : styles.chipLight,
                  isSelected && {
                    backgroundColor: activeBg,
                    borderColor: activeBorder,
                    borderWidth: 1.5,
                  }
                ]}
              >
                {item.icon && (
                  <View style={styles.catChipIcon}>
                    <CategoryIcon 
                      name={item.icon} 
                      size={10} 
                      color={isSelected ? (hasColor ? item.color : (isDark ? '#FFFFFF' : '#0F172A')) : (isDark ? '#94A3B8' : '#64748B')} 
                    />
                  </View>
                )}
                <Text style={[
                  styles.catChipText,
                  isSelected 
                    ? { fontWeight: '700', color: isDark ? '#FFFFFF' : '#0F172A' }
                    : (isDark ? styles.textMutedDark : styles.textMutedLight)
                ]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.catFiltersScroll}
        />
      </View>

      {/* Transaction list */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              No transactions match filters.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchBarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchBarLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  chipActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipActiveLight: {
    backgroundColor: '#E2E8F0',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryFilters: {
    marginBottom: 16,
    marginHorizontal: -16, // Bleed to edges
  },
  catFiltersScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  catChipIcon: {
    marginRight: 4,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 24,
    gap: 8,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  txItemDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  txItemLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  txDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 10,
    fontWeight: '500',
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textBlack: {
    color: '#0F172A',
  },
  textMutedDark: {
    color: '#64748B',
  },
  textMutedLight: {
    color: '#94A3B8',
  },
  textGreen: {
    color: '#10B981',
  },
  textRed: {
    color: '#EF4444',
  },
});
