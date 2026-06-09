import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import CategoryIcon from './CategoryIcon';
import { Feather } from '@expo/vector-icons';
import { getContrastColor, getTranslucentColor } from '../utils/color';

export default function CategoryManager() {
  const { categories, addNewCategory, deleteCat, theme } = useApp();
  const isDark = theme === 'dark';

  // Form States
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('grid');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');

  const [errorMsg, setErrorMsg] = useState('');

  // Icon Palette
  const iconOptions = [
    'coffee', 'truck', 'shopping-bag', 'film', 'zap', 'home', 
    'dollar-sign', 'grid', 'credit-card', 'gift', 'heart', 
    'book', 'activity', 'smile', 'briefcase', 'tool',
    'trending-up', 'tag', 'umbrella', 'award', 'globe'
  ];

  // Color Palette
  const colorOptions = [
    '#8B5CF6', // Violet
    '#EF4444', // Red
    '#10B981', // Emerald Green
    '#F59E0B', // Amber Orange
    '#3B82F6', // Royal Blue
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#84CC16', // Lime
    '#D946EF', // Fuchsia
    '#0EA5E9', // Sky Blue
    '#F43F5E', // Rose
    '#EAB308', // Yellow
    '#6B7280', // Slate Gray
  ];

  const handleAddCategory = () => {
    setErrorMsg('');
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }

    try {
      const cat = addNewCategory(trimmed, selectedIcon, selectedColor);
      if (cat) {
        setNewCatName('');
        setSelectedIcon('grid');
        setSelectedColor('#8B5CF6');
      } else {
        setErrorMsg('Failed to add category.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Category already exists.');
    }
  };

  const handleDeleteCategory = (id: number, name: string) => {
    const performDelete = () => {
      const success = deleteCat(id);
      if (!success) {
        Alert.alert('Error', 'Cannot delete default system categories.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Delete "${name}" category? This will delete all transactions and budgets in this category!`);
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${name}"? This deletes all associated transactions and budgets.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Add Category Form */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textWhite : styles.textBlack]}>
          Create Custom Category
        </Text>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Name input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Name</Text>
          <View style={[styles.textInputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
            <TextInput
              placeholder="e.g. Subscriptions, Groceries..."
              placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
              style={[styles.textInput, isDark ? styles.textWhite : styles.textBlack]}
              value={newCatName}
              onChangeText={setNewCatName}
              maxLength={20}
            />
          </View>
        </View>

        {/* Icon picker */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Select Icon</Text>
          <View style={styles.pickerGrid}>
            {iconOptions.map((icon) => {
              const isSelected = selectedIcon === icon;
              const activeBg = getTranslucentColor(selectedColor, isDark ? 0.25 : 0.15);
              return (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.pickerItem,
                    isDark ? styles.pickerDark : styles.pickerLight,
                    isSelected && {
                      backgroundColor: activeBg,
                      borderColor: selectedColor,
                      borderWidth: 2,
                    }
                  ]}
                >
                  <CategoryIcon
                    name={icon}
                    size={16}
                    color={isSelected ? selectedColor : (isDark ? '#94A3B8' : '#64748B')}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color picker */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Select Color</Text>
          <View style={styles.pickerGrid}>
            {colorOptions.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    isSelected && styles.colorCircleSelected,
                    isSelected && { borderColor: isDark ? '#FFFFFF' : '#0F172A' }
                  ]}
                >
                  {isSelected && (
                    <Feather name="check" size={14} color={getContrastColor(color)} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleAddCategory}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: selectedColor },
            pressed && styles.pressed
          ]}
        >
          <Text style={styles.addBtnText}>Add Category</Text>
        </Pressable>
      </View>

      {/* 2. Manage Categories List */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textWhite : styles.textBlack]}>
          Existing Categories
        </Text>

        <View style={styles.listContainer}>
          {categories.map((cat) => {
            return (
              <View 
                key={cat.id} 
                style={[
                  styles.categoryListItem, 
                  isDark ? styles.itemBorderDark : styles.itemBorderLight
                ]}
              >
                {/* Category Identity Info */}
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: cat.color }]}>
                      <CategoryIcon name={cat.icon} size={14} color={getContrastColor(cat.color)} />
                    </View>
                    <Text style={[styles.catName, isDark ? styles.textWhite : styles.textBlack]}>
                      {cat.name}
                    </Text>
                  </View>

                  <View style={styles.itemActions}>
                    {/* Delete button (only visible if not system categories) */}
                    {cat.is_default === 0 ? (
                      <Pressable
                        onPress={() => handleDeleteCategory(cat.id, cat.name)}
                        style={[styles.actionBtn, styles.deleteActionBtn]}
                      >
                        <Feather name="trash-2" size={13} color="#EF4444" />
                      </Pressable>
                    ) : (
                      <View style={styles.actionBtnPlaceholder} />
                    )}
                  </View>
                </View>
              </View>
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
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    borderWidth: 1,
  },
  textInput: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  addBtn: {
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    gap: 2,
  },
  categoryListItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemBorderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemBorderLight: {
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  actionBtnPlaceholder: {
    width: 30,
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
    color: '#64748B',
  },
  textMutedLight: {
    color: '#94A3B8',
  },
});
