import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { Feather } from '@expo/vector-icons';

export default function BalanceCard() {
  const { stats, budgets, currencySymbol, theme } = useApp();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const burnRate = stats.totalIncome > 0 
    ? Math.min((stats.totalExpense / stats.totalIncome) * 100, 100) 
    : stats.totalExpense > 0 ? 100 : 0;

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = stats.totalExpense;
  const remainingBudget = totalBudget - totalSpent;
  const budgetProgress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Formatting helpers
  const formatAmount = (num: number) => {
    return `${currencySymbol}${Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const isNegative = stats.balance < 0;

  return (
    <View style={[
      styles.card, 
      isDark ? styles.cardDark : styles.cardLight,
      { width: width > 600 ? 560 : '100%' }
    ]}>
      {/* Title & Net Balance */}
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Net Balance
        </Text>
        <Text style={[
          styles.balanceText, 
          isDark ? styles.textWhite : styles.textBlack,
          isNegative && styles.textRed
        ]}>
          {isNegative ? '-' : ''}{formatAmount(stats.balance)}
        </Text>
      </View>

      {/* Income / Expense Split */}
      <View style={styles.statsRow}>
        {/* Income column */}
        <View style={styles.statCol}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Feather name="trending-up" size={18} color="#10B981" />
          </View>
          <View style={styles.statTexts}>
            <Text style={[styles.statLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Income
            </Text>
            <Text style={[styles.statValue, styles.textGreen]}>
              {formatAmount(stats.totalIncome)}
            </Text>
          </View>
        </View>

        {/* Divider line */}
        <View style={[styles.verticalDivider, isDark ? styles.dividerDark : styles.dividerLight]} />

        {/* Expense column */}
        <View style={styles.statCol}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Feather name="trending-down" size={18} color="#EF4444" />
          </View>
          <View style={styles.statTexts}>
            <Text style={[styles.statLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Expenses
            </Text>
            <Text style={[styles.statValue, styles.textRed]}>
              {formatAmount(stats.totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Burn Rate Indicator */}
      {stats.totalIncome > 0 && (
        <View style={styles.burnRateContainer}>
          <View style={styles.burnRateHeader}>
            <Text style={[styles.burnRateLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Monthly Spend Rate
            </Text>
            <Text style={[styles.burnRateValue, isDark ? styles.textWhite : styles.textBlack]}>
              {burnRate.toFixed(0)}%
            </Text>
          </View>
          <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
            <View style={[
              styles.progressBarFill, 
              { 
                width: `${burnRate}%`, 
                backgroundColor: burnRate > 85 ? '#EF4444' : burnRate > 60 ? '#F59E0B' : '#8B5CF6' 
              }
            ]} />
          </View>
        </View>
      )}

      {/* Monthly Budget Progress Section */}
      {totalBudget > 0 && (
        <View style={[
          styles.budgetContainer,
          isDark ? styles.borderDark : styles.borderLight,
          { borderTopWidth: stats.totalIncome > 0 ? 0 : 1, marginTop: stats.totalIncome > 0 ? 12 : 20, paddingTop: stats.totalIncome > 0 ? 0 : 16 }
        ]}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.budgetLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Monthly Budget
            </Text>
            <Text style={[styles.budgetValue, isDark ? styles.textWhite : styles.textBlack]}>
              {formatAmount(totalSpent)} / {formatAmount(totalBudget)}
            </Text>
          </View>
          
          <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
            <View style={[
              styles.progressBarFill, 
              { 
                width: `${budgetProgress}%`, 
                backgroundColor: budgetProgress >= 100 ? '#EF4444' : budgetProgress > 80 ? '#F59E0B' : '#10B981' 
              }
            ]} />
          </View>
          <View style={styles.budgetFooter}>
            {remainingBudget >= 0 ? (
              <Text style={styles.budgetFooterLeft}>
                {formatAmount(remainingBudget)} remaining
              </Text>
            ) : (
              <Text style={[styles.budgetFooterLeft, styles.textRed]}>
                Over budget by {formatAmount(Math.abs(remainingBudget))}
              </Text>
            )}
            <Text style={[styles.budgetFooterRight, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              {budgetProgress.toFixed(0)}% spent
            </Text>
          </View>

          {/* Exceeded Budget Warning Message */}
          {totalSpent > totalBudget && (
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={12} color="#EF4444" />
              <Text style={styles.warningText}>
                Expenses exceed your monthly budget!
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    alignSelf: 'center',
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  balanceText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statTexts: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
  dividerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  burnRateContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  burnRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  burnRateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  burnRateValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBgDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBgLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetContainer: {
    paddingTop: 16,
  },
  borderDark: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  borderLight: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  budgetEmptyLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  budgetFooterLeft: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  budgetFooterRight: {
    fontSize: 11,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  warningText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
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
  textGreen: {
    color: '#10B981',
  },
  textRed: {
    color: '#EF4444',
  },
});
