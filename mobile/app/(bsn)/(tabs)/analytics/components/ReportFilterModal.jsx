import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

const ReportFilterModal = ({ visible, onClose, onGenerate, currentPeriod }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod || 'allTime');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'allTime', label: 'All Time' },
  ];

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      description: 'Formatted report with charts and graphics',
      icon: 'document-text',
      color: '#F44336',
    },
    {
      value: 'csv',
      label: 'CSV Spreadsheet',
      description: 'Data in spreadsheet format for analysis',
      icon: 'grid',
      color: '#4CAF50',
    },
  ];

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await onGenerate(selectedPeriod, selectedFormat);
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      // Error will be handled by parent component
    } finally {
      setIsGenerating(false);
    }
  };

  const getPeriodLabel = () => {
    const option = periodOptions.find((opt) => opt.value === selectedPeriod);
    return option ? option.label : 'All Time';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Analytics Report</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={moderateScale(24)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Period Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Period</Text>
              <Text style={styles.sectionSubtitle}>
                Choose the date range for your report
              </Text>

              <View style={styles.periodGrid}>
                {periodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.periodOption,
                      selectedPeriod === option.value &&
                        styles.periodOptionSelected,
                    ]}
                    onPress={() => setSelectedPeriod(option.value)}
                  >
                    <Text
                      style={[
                        styles.periodOptionText,
                        selectedPeriod === option.value &&
                          styles.periodOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedPeriod === option.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(20)}
                        color="#1C86FF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Format Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Format</Text>
              <Text style={styles.sectionSubtitle}>
                Select the format for your analytics report
              </Text>

              <View style={styles.formatGrid}>
                {formatOptions.map((format) => (
                  <TouchableOpacity
                    key={format.value}
                    style={[
                      styles.formatOption,
                      selectedFormat === format.value &&
                        styles.formatOptionSelected,
                    ]}
                    onPress={() => setSelectedFormat(format.value)}
                  >
                    <View
                      style={[
                        styles.formatIcon,
                        { backgroundColor: format.color },
                      ]}
                    >
                      <Ionicons
                        name={format.icon}
                        size={moderateScale(24)}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.formatInfo}>
                      <Text style={styles.formatLabel}>{format.label}</Text>
                      <Text style={styles.formatDescription}>
                        {format.description}
                      </Text>
                    </View>
                    {selectedFormat === format.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(24)}
                        color="#1C86FF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Period:</Text>
                <Text style={styles.summaryValue}>{getPeriodLabel()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Format:</Text>
                <Text style={styles.summaryValue}>
                  {selectedFormat.toUpperCase()}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isGenerating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.generateButton,
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateButtonText}>Downloading...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="download"
                    size={moderateScale(20)}
                    color="#fff"
                  />
                  <Text style={styles.generateButtonText}>Download Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: moderateScale(4),
  },
  modalBody: {
    padding: moderateScale(20),
  },
  section: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(16),
  },
  periodGrid: {
    gap: moderateScale(8),
  },
  periodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  periodOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1C86FF',
  },
  periodOptionText: {
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  periodOptionTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  formatGrid: {
    gap: moderateScale(12),
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
  },
  formatOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1C86FF',
  },
  formatIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatInfo: {
    flex: 1,
  },
  formatLabel: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  formatDescription: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  summarySection: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  summaryValue: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: moderateScale(20),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: moderateScale(12),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#666',
  },
  generateButton: {
    flex: 2,
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  generateButtonDisabled: {
    backgroundColor: '#A0C4E8',
  },
  generateButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#fff',
  },
});

export default ReportFilterModal;
