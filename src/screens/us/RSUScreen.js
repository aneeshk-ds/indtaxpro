import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius, card } from '../../theme';
import ChecklistItem from '../../components/ChecklistItem';
import { calculateRSUTax } from '../../logic/rsuCalculator';
import { getSBIRateForDate } from '../../logic/sbiRates';

const EMPTY_LOT = {
  id: Date.now().toString(),
  ticker: '',
  sharesVested: '',
  vestDate: '',
  fmvOnVestUSD: '',
  sharesSold: '',
  saleDate: '',
  salePriceUSD: '',
  tdsDeductedINR: '',
};

export default function RSUScreen({ route, navigation }) {
  const [lots, setLots] = useState([{ ...EMPTY_LOT }]);
  const [result, setResult] = useState(null);

  const updateLot = (index, key, val) => {
    const updated = [...lots];
    updated[index] = { ...updated[index], [key]: val };
    setLots(updated);
  };

  const addLot = () => setLots([...lots, { ...EMPTY_LOT, id: Date.now().toString() }]);

  const calculate = () => {
    const processed = lots
      .filter(l => l.sharesVested && l.vestDate && l.fmvOnVestUSD)
      .map(l => {
        const vestRate = getSBIRateForDate(l.vestDate)?.rate || 85.94;
        const saleRate = l.saleDate ? getSBIRateForDate(l.saleDate)?.rate || 85.94 : 85.94;
        return {
          id: l.id,
          ticker: l.ticker || 'UNKNOWN',
          sharesVested: parseFloat(l.sharesVested) || 0,
          vestDate: l.vestDate,
          fmvOnVestUSD: parseFloat(l.fmvOnVestUSD) || 0,
          sbiRateOnVest: vestRate,
          sharesSold: parseFloat(l.sharesSold) || 0,
          saleDate: l.saleDate || null,
          salePriceUSD: parseFloat(l.salePriceUSD) || 0,
          sbiRateOnSale: saleRate,
          tdsDeductedINR: parseFloat(l.tdsDeductedINR) || 0,
        };
      });

    if (processed.length > 0) {
      setResult(calculateRSUTax(processed));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          Each RSU vesting is a salary event. Each sale is a capital gains event.
          They are taxed separately at different rates.
        </Text>

        {lots.map((lot, index) => (
          <View key={lot.id} style={styles.lotCard}>
            <Text style={styles.lotTitle}>Lot {index + 1}</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Ticker</Text>
                <TextInput
                  style={styles.input}
                  value={lot.ticker}
                  onChangeText={v => updateLot(index, 'ticker', v)}
                  placeholder="MSFT"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Shares vested</Text>
                <TextInput
                  style={styles.input}
                  value={lot.sharesVested}
                  onChangeText={v => updateLot(index, 'sharesVested', v)}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Vest date</Text>
                <TextInput
                  style={styles.input}
                  value={lot.vestDate}
                  onChangeText={v => updateLot(index, 'vestDate', v)}
                  placeholder="2025-03-01"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>FMV on vest date (USD)</Text>
                <TextInput
                  style={styles.input}
                  value={lot.fmvOnVestUSD}
                  onChangeText={v => updateLot(index, 'fmvOnVestUSD', v)}
                  keyboardType="numeric"
                  placeholder="350.00"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <Text style={styles.subLabel}>If you sold shares from this lot:</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Shares sold</Text>
                <TextInput
                  style={styles.input}
                  value={lot.sharesSold}
                  onChangeText={v => updateLot(index, 'sharesSold', v)}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Sale date</Text>
                <TextInput
                  style={styles.input}
                  value={lot.saleDate}
                  onChangeText={v => updateLot(index, 'saleDate', v)}
                  placeholder="2025-08-15"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Sale price (USD)</Text>
                <TextInput
                  style={styles.input}
                  value={lot.salePriceUSD}
                  onChangeText={v => updateLot(index, 'salePriceUSD', v)}
                  keyboardType="numeric"
                  placeholder="380.00"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>TDS deducted (INR)</Text>
                <TextInput
                  style={styles.input}
                  value={lot.tdsDeductedINR}
                  onChangeText={v => updateLot(index, 'tdsDeductedINR', v)}
                  keyboardType="numeric"
                  placeholder="90000"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addLot}>
          <Text style={styles.addBtnText}>+ Add another lot</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
          <Text style={styles.calcBtnText}>Calculate</Text>
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>RSU Tax Breakdown</Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Perquisite (Salary)</Text>
                <Text style={styles.summaryValue}>
                  INR {(result.summary.totalPerquisiteINR / 100000).toFixed(2)}L
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>STCG</Text>
                <Text style={styles.summaryValue}>
                  INR {(result.summary.totalSTCG / 100000).toFixed(2)}L
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>LTCG (taxable)</Text>
                <Text style={styles.summaryValue}>
                  INR {(result.summary.taxableLTCG / 100000).toFixed(2)}L
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total CG tax</Text>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>
                  INR {(result.summary.totalCGTax / 100000).toFixed(2)}L
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.noteTitle}>ITR schedule requirements</Text>
            <ChecklistItem
              text="Perquisite income in Salary schedule"
              passed={result.scheduleRequirements.salarySchedule}
            />
            <ChecklistItem
              text="Sale gains in Schedule CG"
              passed={result.scheduleRequirements.scheduleCG}
            />
            <Text style={styles.scheduleNote}>{result.scheduleRequirements.note}</Text>

            {result.issues.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.noteTitle}>Issues flagged</Text>
                {result.issues.map((issue, i) => (
                  <View key={i} style={styles.issueItem}>
                    <Text style={styles.issueTitle}>{issue.title}</Text>
                    <Text style={styles.issueDetail}>{issue.detail}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  lotCard: { ...card, marginBottom: spacing.md },
  lotTitle: { ...typography.label, color: colors.accent, marginBottom: spacing.md },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  inputHalf: { flex: 1 },
  label: { ...typography.label, marginBottom: 4 },
  subLabel: { ...typography.small, color: colors.accent, marginVertical: spacing.sm },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  addBtn: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderStyle: 'dashed',
  },
  addBtnText: { ...typography.body, color: colors.muted },
  calcBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calcBtnText: { fontSize: 16, fontWeight: '700', color: colors.bg },
  resultCard: { ...card },
  resultTitle: { ...typography.h3, marginBottom: spacing.md },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgInput,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  summaryLabel: { ...typography.label, marginBottom: 4 },
  summaryValue: { ...typography.h3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  noteTitle: { ...typography.label, marginBottom: spacing.sm },
  scheduleNote: { ...typography.small, marginTop: spacing.sm, fontStyle: 'italic' },
  issueItem: {
    backgroundColor: '#1a1200',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    marginBottom: spacing.sm,
  },
  issueTitle: { ...typography.body, fontWeight: '600', color: colors.warning, marginBottom: 4 },
  issueDetail: { ...typography.small, lineHeight: 18 },
});
