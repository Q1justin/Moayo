import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import { TransactionWithCategory } from '../lib/supabase';

interface ReportPageProps {
  type: 'earnings' | 'spending';
  transactions: TransactionWithCategory[];
  onClose: () => void;
}

export default function ReportPage({ type, transactions, onClose }: ReportPageProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedView, setSelectedView] = useState<'earnings' | 'spending'>(type === 'earnings' ? 'earnings' : 'spending');

  const colors = {
    primary: '#A78BFA',
    background: isDarkMode ? '#1a1a1a' : '#F8F6FF',
    surface: isDarkMode ? '#2a2a2a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
  };

  // Filter transactions for the selected view
  const filtered = useMemo(() => {
    return transactions.filter(t => (selectedView === 'earnings' ? t.type === 'income' : t.type === 'expense'));
  }, [transactions, selectedView]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);

  // For spending view, aggregate by category
  const categoryTotals = useMemo(() => {
    if (selectedView !== 'spending') return [] as { name: string; icon?: string; total: number }[];

    const map: Record<string, { name: string; icon?: string; total: number }> = {};
    filtered.forEach(t => {
      const key = t.category?.name || 'Uncategorized';
      if (!map[key]) {
        map[key] = { name: key, icon: t.category?.icon, total: 0 };
      }
      map[key].total += t.amount;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, selectedView]);

  const renderTransactionItem = ({ item }: { item: TransactionWithCategory }) => (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={styles.left}>
        <Text style={[styles.cat, { color: colors.text }]}>{item.category.icon} {item.category.name}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: selectedView === 'earnings' ? '#2ED573' : '#FF4757' }]}>
          {selectedView === 'earnings' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
      </View>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: { name: string; icon?: string; total: number } }) => (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={styles.left}>
        <Text style={[styles.cat, { color: colors.text }]}>{item.icon} {item.name}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: '#FF4757' }]}>
          -${item.total.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, selectedView === 'earnings' && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedView('earnings')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, selectedView === 'earnings' && { color: '#fff' }]}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, selectedView === 'spending' && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedView('spending')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, selectedView === 'spending' && { color: '#fff' }]}>Spendings</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total {selectedView === 'earnings' ? 'Earnings' : 'Spending'}</Text>
          <Text style={[styles.summaryAmount, { color: selectedView === 'earnings' ? '#2ED573' : '#FF4757' }]}>${total.toFixed(2)}</Text>
        </View>

        {selectedView === 'spending' ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>By Category</Text>
            <FlatList
              data={categoryTotals}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Earnings</Text>
            <FlatList
              data={filtered}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  closeButton: { position: 'absolute', right: 12, top: 8, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontSize: 18 },
  content: { flex: 1, padding: 16 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14, fontWeight: '600' },
  summaryCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  summaryLabel: { fontSize: 12, fontWeight: '600' },
  summaryAmount: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  left: { flex: 1 },
  cat: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 13 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 4 },
});
