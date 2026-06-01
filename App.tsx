import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Pressable, Platform, StatusBar, Alert, Image, FlatList } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import BalanceCard from './src/components/BalanceCard';
import TransactionList from './src/components/TransactionList';
import AnalyticsCharts from './src/components/AnalyticsCharts';
import CategoryManager from './src/components/CategoryManager';
import AddTransactionModal from './src/components/AddTransactionModal';
import { exportToExcel, importFromExcel } from './src/utils/excel';
import { Feather } from '@expo/vector-icons';

type TabType = 'dashboard' | 'analytics' | 'categories' | 'settings';

function MainAppContent() {
  const { theme, toggleTheme, currencyCode, updateCurrency, resetAll, refreshData, transactions } = useApp();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedExportMonth, setSelectedExportMonth] = useState<string>('all');

  // Compute available months dynamically from transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Format YYYY-MM label to short month and year (e.g. Jun 2026)
  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  // Currency Options
  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'INR', symbol: '₹' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'JPY', symbol: '¥' },
  ];

  const handleExport = async () => {
    const filter = selectedExportMonth === 'all' ? undefined : selectedExportMonth;
    const success = await exportToExcel(filter);
    if (success) {
      if (Platform.OS === 'web') {
        alert('Excel report downloaded successfully!');
      } else {
        Alert.alert('Export Success', 'Excel report shared successfully!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Failed to export. No transactions found or file error.');
      } else {
        Alert.alert('Export Failed', 'Unable to export transactions for this period.');
      }
    }
  };

  const handleImport = async () => {
    const result = await importFromExcel();
    if (result.success) {
      refreshData();
      const msg = `Successfully imported ${result.importedCount} transactions!`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Import Success', msg);
      }
    } else if (result.error !== 'Import cancelled') {
      const msg = result.error || 'Failed to parse Excel file.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Import Failed', msg);
      }
    }
  };

  const handleReset = () => {
    const performReset = () => {
      resetAll();
      if (Platform.OS === 'web') {
        alert('All app data has been reset.');
      } else {
        Alert.alert('Reset Complete', 'All app data has been reset.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmReset = window.confirm('Reset all transactions, budgets, and categories? This cannot be undone!');
      if (confirmReset) {
        performReset();
      }
    } else {
      Alert.alert(
        'Reset App Data',
        'Are you sure you want to reset all transactions, budgets, and custom categories? This action is irreversible.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Everything', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.root, isDark ? styles.rootDark : styles.rootLight]}>
      {/* Set status bar overlay for both mobile platforms */}
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} />

      {/* Main Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('./assets/logo.png')}
            style={{ width: 34, height: 34, borderRadius: 8 }}
          />
          <View>
            <Text style={[styles.appName, isDark ? styles.textWhite : styles.textBlack]}>Expense Tracker</Text>
            <Text style={[styles.appSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Offline Financial Vault</Text>
          </View>
        </View>

        {/* Dark/Light mode toggle */}
        <Pressable
          onPress={toggleTheme}
          style={[styles.headerAction, isDark ? styles.headerActionDark : styles.headerActionLight]}
        >
          <Feather name={isDark ? 'sun' : 'moon'} size={18} color={isDark ? '#F59E0B' : '#475569'} />
        </Pressable>
      </View>

      {/* Screen Body */}
      <View style={styles.screenBody}>
        {activeTab === 'dashboard' && (
          <View style={styles.screenInner}>
            <BalanceCard />

            {/* Transactions Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark ? styles.textWhite : styles.textBlack]}>
                Transactions
              </Text>

              {/* Add Transaction Button */}
              <Pressable
                onPress={() => setIsAddModalVisible(true)}
                style={({ pressed }) => [
                  styles.addFloatingBtn,
                  pressed && styles.pressed
                ]}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>

            <TransactionList />
          </View>
        )}

        {activeTab === 'analytics' && <AnalyticsCharts />}

        {activeTab === 'categories' && <CategoryManager />}

        {activeTab === 'settings' && (
          <View style={styles.screenInner}>
            {/* Currency settings card */}
            <View style={[styles.settingsCard, isDark ? styles.settingsCardDark : styles.settingsCardLight]}>
              <Text style={[styles.settingsTitle, isDark ? styles.textWhite : styles.textBlack]}>
                Base Currency
              </Text>
              <Text style={[styles.settingsDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Select the default currency symbol for balances and transactions.
              </Text>
              <View style={styles.currencyOptionsGrid}>
                {currencies.map((curr) => {
                  const isSelected = currencyCode === curr.code;
                  return (
                    <Pressable
                      key={curr.code}
                      onPress={() => updateCurrency(curr.code, curr.symbol)}
                      style={[
                        styles.currencyChip,
                        isDark ? styles.chipDark : styles.chipLight,
                        isSelected && styles.currencyChipActive
                      ]}
                    >
                      <Text style={[
                        styles.currencySymbolText,
                        isSelected ? styles.textWhite : (isDark ? styles.textMutedDark : styles.textMutedLight)
                      ]}>
                        {curr.symbol}
                      </Text>
                      <Text style={[
                        styles.currencyCodeText,
                        isSelected ? styles.textWhite : (isDark ? styles.textMutedDark : styles.textMutedLight)
                      ]}>
                        {curr.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Import & Export Settings */}
            <View style={[styles.settingsCard, isDark ? styles.settingsCardDark : styles.settingsCardLight]}>
              <Text style={[styles.settingsTitle, isDark ? styles.textWhite : styles.textBlack]}>
                Backup & Share Data
              </Text>
              <Text style={[styles.settingsDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Import expenses from CSV/Excel or export your ledger as an Excel spreadsheet.
              </Text>

              {/* Month Selector for Export */}
              <View style={styles.exportSelectionContainer}>
                <Text style={[styles.settingsSubTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Export Range
                </Text>
                <FlatList
                  data={['all', ...availableMonths]}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item}
                  contentContainerStyle={styles.exportChipsScroll}
                  renderItem={({ item }) => {
                    const isSelected = selectedExportMonth === item;
                    const label = item === 'all' ? 'All Time' : formatMonthLabel(item);
                    return (
                      <Pressable
                        onPress={() => setSelectedExportMonth(item)}
                        style={[
                          styles.exportChip,
                          isDark ? styles.chipDark : styles.chipLight,
                          isSelected && styles.exportChipActive
                        ]}
                      >
                        <Text style={[
                          styles.exportChipText,
                          isSelected ? styles.textWhite : (isDark ? styles.textMutedDark : styles.textMutedLight)
                        ]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>

              <View style={styles.btnRow}>
                <Pressable
                  onPress={handleExport}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.primaryActionBtn,
                    pressed && styles.pressed
                  ]}
                >
                  <Feather name="download" size={16} color="#FFFFFF" style={styles.actionIcon} />
                  <Text style={styles.actionBtnText}>
                    {selectedExportMonth === 'all' ? 'Export All' : `Export ${formatMonthLabel(selectedExportMonth)}`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleImport}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.secondaryActionBtn,
                    pressed && styles.pressed
                  ]}
                >
                  <Feather name="upload" size={16} color="#8B5CF6" style={styles.actionIcon} />
                  <Text style={styles.secondaryActionBtnText}>Import File</Text>
                </Pressable>
              </View>
            </View>

            {/* Reset Card */}
            <View style={[styles.settingsCard, isDark ? styles.settingsCardDark : styles.settingsCardLight]}>
              <Text style={[styles.settingsTitle, styles.textRed]}>
                Danger Zone
              </Text>
              <Text style={[styles.settingsDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Clears all data transactions and custom categories, returning the database to factory settings.
              </Text>

              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                  styles.resetBtn,
                  pressed && styles.pressed
                ]}
              >
                <Feather name="trash-2" size={16} color="#FFFFFF" style={styles.actionIcon} />
                <Text style={styles.resetBtnText}>Clear Database</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Custom Bottom Tab Navigation Bar */}
      <View style={[styles.tabBar, isDark ? styles.tabBarDark : styles.tabBarLight]}>
        <Pressable
          onPress={() => setActiveTab('dashboard')}
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
        >
          <Feather
            name="home"
            size={20}
            color={activeTab === 'dashboard' ? '#8B5CF6' : (isDark ? '#64748B' : '#94A3B8')}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'dashboard' ? styles.tabTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)
          ]}>Dashboard</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('analytics')}
          style={[styles.tabItem, activeTab === 'analytics' && styles.tabItemActive]}
        >
          <Feather
            name="pie-chart"
            size={20}
            color={activeTab === 'analytics' ? '#8B5CF6' : (isDark ? '#64748B' : '#94A3B8')}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'analytics' ? styles.tabTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)
          ]}>Analytics</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('categories')}
          style={[styles.tabItem, activeTab === 'categories' && styles.tabItemActive]}
        >
          <Feather
            name="grid"
            size={20}
            color={activeTab === 'categories' ? '#8B5CF6' : (isDark ? '#64748B' : '#94A3B8')}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'categories' ? styles.tabTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)
          ]}>Categories</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('settings')}
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
        >
          <Feather
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#8B5CF6' : (isDark ? '#64748B' : '#94A3B8')}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'settings' ? styles.tabTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)
          ]}>Settings</Text>
        </Pressable>
      </View>

      {/* Quick Add modal dialog sheet */}
      <AddTransactionModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  rootDark: {
    backgroundColor: '#090D16',
  },
  rootLight: {
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerActionDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerActionLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  screenBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  screenInner: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  addFloatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 78 : 72,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBarDark: {
    backgroundColor: '#0F172A',
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBarLight: {
    backgroundColor: '#FFFFFF',
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabItemActive: {
    // Styling can be added to make tab glow
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  settingsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingsCardDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingsCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingsDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 16,
  },
  currencyOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 70,
    gap: 4,
  },
  currencyChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  currencySymbolText: {
    fontSize: 14,
    fontWeight: '800',
  },
  currencyCodeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    flex: 1,
  },
  primaryActionBtn: {
    backgroundColor: '#8B5CF6',
  },
  secondaryActionBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  actionIcon: {
    marginRight: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtnText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  textRed: {
    color: '#EF4444',
  },
  exportSelectionContainer: {
    marginBottom: 16,
  },
  settingsSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  exportChipsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  exportChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 4,
  },
  exportChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  exportChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
