import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import CategoryIcon from './CategoryIcon';
import { Feather } from '@expo/vector-icons';
import { getContrastColor, getTranslucentColor } from '../utils/color';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const { categories, addNewTransaction, theme } = useApp();
  const isDark = theme === 'dark';

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Format date helper: YYYY-MM-DD
  const getFormattedDate = (d: Date): string => {
    return d.toISOString().split('T')[0];
  };

  // Set default values on modal open
  useEffect(() => {
    if (visible) {
      setType('expense');
      setAmount('');
      setDescription('');
      setDate(getFormattedDate(new Date()));
      setErrorMsg('');
      
      // Auto select first category of appropriate type if available
      if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      } else {
        setSelectedCategoryId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = () => {
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedCategoryId) {
      setErrorMsg('Please select a category.');
      return;
    }

    // Standardize date to full ISO format: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const fullIsoDate = `${date} ${timeStr}`;

    const tx = addNewTransaction(type, parsedAmount, selectedCategoryId, fullIsoDate, description.trim());
    if (tx) {
      onClose();
    } else {
      setErrorMsg('Failed to save transaction. Try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBg}
      >
        <View style={[styles.modalSheet, isDark ? styles.sheetDark : styles.sheetLight]}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, isDark ? styles.textWhite : styles.textBlack]}>
              Add Transaction
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </Pressable>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
            {/* 1. Type Switcher */}
            <View style={styles.typeSelectorContainer}>
              <Pressable
                onPress={() => setType('expense')}
                style={[
                  styles.typeTabBtn,
                  type === 'expense' ? styles.expenseActiveTab : (isDark ? styles.tabInactiveDark : styles.tabInactiveLight)
                ]}
              >
                <Text style={[
                  styles.typeTabText,
                  type === 'expense' ? styles.textWhite : (isDark ? styles.textMutedDark : styles.textMutedLight)
                ]}>Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => setType('income')}
                style={[
                  styles.typeTabBtn,
                  type === 'income' ? styles.incomeActiveTab : (isDark ? styles.tabInactiveDark : styles.tabInactiveLight)
                ]}
              >
                <Text style={[
                  styles.typeTabText,
                  type === 'income' ? styles.textWhite : (isDark ? styles.textMutedDark : styles.textMutedLight)
                ]}>Income</Text>
              </Pressable>
            </View>

            {/* 2. Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Amount</Text>
              <View style={[styles.amountInputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  style={[styles.amountInputText, isDark ? styles.textWhite : styles.textBlack]}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={true}
                />
              </View>
            </View>

            {/* 3. Category Grid */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const activeBg = getTranslucentColor(cat.color, isDark ? 0.25 : 0.12);
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[
                        styles.catBubble,
                        isDark ? styles.catBubbleDark : styles.catBubbleLight,
                        isSelected && { borderColor: cat.color, borderWidth: 2, backgroundColor: activeBg }
                      ]}
                    >
                      <View style={[styles.catIconCircle, { backgroundColor: cat.color }]}>
                        <CategoryIcon name={cat.icon} size={14} color={getContrastColor(cat.color)} />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.catNameText,
                          isDark ? styles.textWhite : styles.textBlack,
                          isSelected && { fontWeight: '800', color: isDark ? '#FFFFFF' : '#0F172A' }
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 4. Presets & Custom Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Date</Text>
              <View style={styles.datePresets}>
                <Pressable
                  onPress={() => setDate(getFormattedDate(new Date()))}
                  style={[
                    styles.datePresetBtn,
                    isDark ? styles.datePresetDark : styles.datePresetLight,
                    date === getFormattedDate(new Date()) && (isDark ? styles.dateActiveDark : styles.dateActiveLight)
                  ]}
                >
                  <Text style={[styles.datePresetText, isDark ? styles.textWhite : styles.textBlack]}>Today</Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setDate(getFormattedDate(yesterday));
                  }}
                  style={[
                    styles.datePresetBtn,
                    isDark ? styles.datePresetDark : styles.datePresetLight,
                    date === getFormattedDate(new Date(Date.now() - 86400000)) && (isDark ? styles.dateActiveDark : styles.dateActiveLight)
                  ]}
                >
                  <Text style={[styles.datePresetText, isDark ? styles.textWhite : styles.textBlack]}>Yesterday</Text>
                </Pressable>

                <View style={[styles.dateTextInputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                    style={[styles.dateTextInput, isDark ? styles.textWhite : styles.textBlack]}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>
            </View>

            {/* 5. Description Note */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Description (Optional)</Text>
              <View style={[styles.descInputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  placeholder="Dinner, groceries, taxi fare..."
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  style={[styles.descTextInput, isDark ? styles.textWhite : styles.textBlack]}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                type === 'expense' ? styles.expenseBtn : styles.incomeBtn,
                pressed && styles.pressed
              ]}
            >
              <Text style={styles.saveBtnText}>Save Transaction</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  sheetDark: {
    backgroundColor: '#0F172A',
  },
  sheetLight: {
    backgroundColor: '#F8FAFC',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 50,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sheetScroll: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 20,
  },
  typeTabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInactiveDark: {
    backgroundColor: 'transparent',
  },
  tabInactiveLight: {
    backgroundColor: 'transparent',
  },
  expenseActiveTab: {
    backgroundColor: '#EF4444',
  },
  incomeActiveTab: {
    backgroundColor: '#10B981',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountInputWrapper: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    borderWidth: 1,
  },
  amountInputText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '29%',
    flexGrow: 1,
  },
  catBubbleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  catBubbleLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  catIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  catNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  datePresets: {
    flexDirection: 'row',
    gap: 8,
  },
  datePresetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  datePresetDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  datePresetLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateActiveLight: {
    backgroundColor: '#E2E8F0',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  datePresetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTextInputWrapper: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    borderWidth: 1,
  },
  dateTextInput: {
    fontSize: 12,
    fontWeight: '600',
  },
  descInputWrapper: {
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1,
  },
  descTextInput: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  expenseBtn: {
    backgroundColor: '#EF4444',
  },
  incomeBtn: {
    backgroundColor: '#10B981',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
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
