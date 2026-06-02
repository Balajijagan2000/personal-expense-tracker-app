import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, useWindowDimensions, Modal } from 'react-native';
import Svg, { Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { Feather } from '@expo/vector-icons';
import { Transaction } from '../database/types';

export default function AnalyticsCharts() {
  const { stats, transactions, currencySymbol, theme, selectedMonth, setSelectedMonth } = useApp();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownMonths = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      list.push(`${currentYear}-${monthStr}`);
    }
    return list;
  }, []);

  const formatMonthLabelLong = (monthStr: string) => {
    if (monthStr === 'all') return 'All Time';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatAmount = (num: number) => {
    return `${currencySymbol}${num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // 1. Donut Chart Calculations
  const breakdown = stats.categoryBreakdown;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const cx = 80;
  const cy = 80;

  let currentAngle = -90; // Start at top

  // 2. Bar Chart (Last 7 Days) Calculations
  const getDailyTrend = (): { label: string; amount: number }[] => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend: { label: string; amount: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      const dateString = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

      const dailySum = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(dateString))
        .reduce((sum, t) => sum + t.amount, 0);

      trend.push({
        label: dayNames[targetDate.getDay()],
        amount: dailySum,
      });
    }
    return trend;
  };

  const dailyTrendData = getDailyTrend();
  const maxTrendAmount = Math.max(...dailyTrendData.map(d => d.amount), 100); // Prevent divide by zero

  const barChartWidth = width > 600 ? 500 : width - 64;
  const barChartHeight = 120;
  const barPadding = 12;
  const barWidth = (barChartWidth - barPadding * (dailyTrendData.length + 1)) / dailyTrendData.length;

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      {/* 7-Day Spending Trend (Bar Chart) */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textWhite : styles.textBlack]}>
          7-Day Spending Trend
        </Text>
        
        <View style={styles.chartContainer}>
          <Svg width={barChartWidth} height={barChartHeight + 30}>
            {dailyTrendData.map((data, index) => {
              const barHeight = (data.amount / maxTrendAmount) * barChartHeight;
              const x = barPadding + index * (barWidth + barPadding);
              const y = barChartHeight - barHeight;

              return (
                <G key={index}>
                  {/* Background Bar track */}
                  <Rect
                    x={x}
                    y={0}
                    width={barWidth}
                    height={barChartHeight}
                    rx={6}
                    fill={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'}
                  />
                  {/* Active Spending Bar */}
                  {data.amount > 0 && (
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill="#8B5CF6"
                    />
                  )}
                  {/* Amount label above bar if it fits */}
                  {data.amount > 0 && (
                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 6}
                      fill={isDark ? '#94A3B8' : '#64748B'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {formatAmount(data.amount)}
                    </SvgText>
                  )}
                  {/* X Axis Day Label */}
                  <SvgText
                    x={x + barWidth / 2}
                    y={barChartHeight + 18}
                    fill={isDark ? '#64748B' : '#94A3B8'}
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {data.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* Category Breakdown (Donut Chart) */}
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, isDark ? styles.textWhite : styles.textBlack, { marginBottom: 0 }]}>
            Category Breakdown
          </Text>
          
          <Pressable
            onPress={() => setShowDropdown(true)}
            style={[
              styles.dropdownBtn,
              isDark ? styles.dropdownBtnDark : styles.dropdownBtnLight
            ]}
          >
            <Text style={[styles.dropdownBtnText, isDark ? styles.textWhite : styles.textBlack]}>
              {selectedMonth === 'all' ? 'All Time' : formatMonthLabelLong(selectedMonth)}
            </Text>
            <Feather name="chevron-down" size={14} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginLeft: 6 }} />
          </Pressable>
        </View>

        {/* Month Selection Modal */}
        <Modal
          visible={showDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowDropdown(false)}
          >
            <View style={[styles.dropdownModalContent, isDark ? styles.modalDark : styles.modalLight]}>
              <Text style={[styles.modalTitle, isDark ? styles.textWhite : styles.textBlack]}>
                Select Month
              </Text>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                <Pressable
                  onPress={() => {
                    setSelectedMonth('all');
                    setShowDropdown(false);
                  }}
                  style={[
                    styles.dropdownOption,
                    selectedMonth === 'all' && (isDark ? styles.optionActiveDark : styles.optionActiveLight)
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    isDark ? styles.textWhite : styles.textBlack,
                    selectedMonth === 'all' && styles.optionTextActive
                  ]}>
                    All Time
                  </Text>
                  {selectedMonth === 'all' && (
                    <Feather name="check" size={16} color="#8B5CF6" />
                  )}
                </Pressable>
                
                {dropdownMonths.map((m) => {
                  const isSelected = selectedMonth === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setSelectedMonth(m);
                        setShowDropdown(false);
                      }}
                      style={[
                        styles.dropdownOption,
                        isSelected && (isDark ? styles.optionActiveDark : styles.optionActiveLight)
                      ]}
                    >
                      <Text style={[
                        styles.optionText,
                        isDark ? styles.textWhite : styles.textBlack,
                        isSelected && styles.optionTextActive
                      ]}>
                        {formatMonthLabelLong(m)}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={16} color="#8B5CF6" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {breakdown.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              No expense transactions logged.
            </Text>
          </View>
        ) : (
          <View style={styles.donutSection}>
            {/* SVG Donut Circle */}
            <View style={styles.donutChartWrapper}>
              <Svg width={cx * 2} height={cy * 2}>
                {breakdown.map((item, index) => {
                  const percentage = item.percentage;
                  const strokeDashoffset = circumference - (percentage / 100) * circumference;
                  const angle = currentAngle;
                  currentAngle += (percentage / 100) * 360;

                  const isSelected = selectedCategoryIndex === index;

                  return (
                    <Circle
                      key={item.categoryId}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      stroke={item.categoryColor}
                      strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      fill="transparent"
                      transform={`rotate(${angle} ${cx} ${cy})`}
                      onPress={() => setSelectedCategoryIndex(isSelected ? null : index)}
                    />
                  );
                })}
              </Svg>
              {/* Donut Center Label */}
              <View style={styles.donutCenter}>
                <Text style={[styles.centerSub, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  {selectedCategoryIndex !== null ? breakdown[selectedCategoryIndex].categoryName : 'Total Spent'}
                </Text>
                <Text style={[styles.centerVal, isDark ? styles.textWhite : styles.textBlack]}>
                  {formatAmount(
                    selectedCategoryIndex !== null 
                      ? breakdown[selectedCategoryIndex].totalAmount 
                      : stats.totalExpense
                  )}
                </Text>
              </View>
            </View>

            {/* Category Legends */}
            <View style={styles.legendContainer}>
              {breakdown.map((item, index) => {
                const isSelected = selectedCategoryIndex === index;
                return (
                  <Pressable 
                    key={item.categoryId}
                    style={[
                      styles.legendItem,
                      isSelected && (isDark ? styles.legendItemActiveDark : styles.legendItemActiveLight)
                    ]}
                    onPress={() => setSelectedCategoryIndex(isSelected ? null : index)}
                  >
                    <View style={styles.legendLeft}>
                      <View style={[styles.colorDot, { backgroundColor: item.categoryColor }]} />
                      <Text style={[styles.legendName, isDark ? styles.textWhite : styles.textBlack]}>
                        {item.categoryName}
                      </Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={[styles.legendAmount, isDark ? styles.textWhite : styles.textBlack]}>
                        {formatAmount(item.totalAmount)}
                      </Text>
                      <Text style={[styles.legendPct, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {item.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  donutSection: {
    alignItems: 'center',
  },
  donutChartWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSub: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  centerVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  legendContainer: {
    width: '100%',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  legendItemActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendItemActiveLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  legendPct: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
  },
  dropdownBtnLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  dropdownBtnDark: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  dropdownBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownModalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalDark: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionActiveLight: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  optionActiveDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
});
