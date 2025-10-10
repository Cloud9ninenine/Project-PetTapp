import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const [paymentGateways, setPaymentGateways] = useState([
    {
      id: 1,
      name: 'GCash',
      icon: 'wallet',
      color: '#007DFF',
      accountNumber: '0917-555-1234',
      accountName: 'Pawsome Pet Care',
    },
    {
      id: 2,
      name: 'PayMaya',
      icon: 'card',
      color: '#00D632',
      accountNumber: '0917-555-1234',
      accountName: 'Pawsome Pet Care',
    },
    {
      id: 3,
      name: 'Bank Transfer',
      icon: 'business',
      color: '#FF6B6B',
      bankName: 'BDO',
      accountName: 'Pawsome Pet Care',
      accountNumber: '0012345678',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'wallet',
    color: '#1C86FF',
    accountNumber: '',
    accountName: '',
    bankName: '',
  });

  const gatewayTypes = [
    { name: 'GCash', icon: 'wallet', color: '#007DFF', fields: ['accountNumber', 'accountName'] },
    { name: 'PayMaya', icon: 'card', color: '#00D632', fields: ['accountNumber', 'accountName'] },
    { name: 'Bank Transfer', icon: 'business', color: '#FF6B6B', fields: ['bankName', 'accountName', 'accountNumber'] },
    { name: 'Credit/Debit Card', icon: 'card-outline', color: '#9C27B0', fields: ['accountName'] },
    { name: 'PayPal', icon: 'logo-paypal', color: '#003087', fields: ['accountNumber', 'accountName'] },
    { name: 'Cash Payment', icon: 'cash', color: '#4CAF50', fields: [] },
  ];

  const openAddModal = () => {
    setEditingGateway(null);
    setFormData({
      name: '',
      icon: 'wallet',
      color: '#1C86FF',
      accountNumber: '',
      accountName: '',
      bankName: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      icon: gateway.icon,
      color: gateway.color,
      accountNumber: gateway.accountNumber || '',
      accountName: gateway.accountName || '',
      bankName: gateway.bankName || '',
    });
    setModalVisible(true);
  };

  const handleSaveGateway = () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please select a payment gateway type');
      return;
    }

    if (editingGateway) {
      // Update existing gateway
      setPaymentGateways(prev =>
        prev.map(gw => gw.id === editingGateway.id ? { ...gw, ...formData } : gw)
      );
      Alert.alert('Success', 'Payment gateway updated successfully!');
    } else {
      // Add new gateway
      const newGateway = {
        id: Date.now(),
        ...formData,
      };
      setPaymentGateways(prev => [...prev, newGateway]);
      Alert.alert('Success', 'Payment gateway added successfully!');
    }
    setModalVisible(false);
  };

  const handleDeleteGateway = (id) => {
    Alert.alert(
      'Delete Payment Gateway',
      'Are you sure you want to delete this payment gateway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentGateways(prev => prev.filter(gw => gw.id !== id));
            Alert.alert('Success', 'Payment gateway deleted successfully!');
          },
        },
      ]
    );
  };

  const selectGatewayType = (type) => {
    setFormData({
      ...formData,
      name: type.name,
      icon: type.icon,
      color: type.color,
    });
  };

  const getRequiredFields = () => {
    const type = gatewayTypes.find(t => t.name === formData.name);
    return type ? type.fields : [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        title="Payment Gateways"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle" size={moderateScale(24)} color="#fff" />
          <Text style={styles.addButtonText}>Add Payment Gateway</Text>
        </TouchableOpacity>

        {/* Payment Gateways List */}
        {paymentGateways.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.emptyStateText}>No payment gateways added</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the button above to add your first payment gateway
            </Text>
          </View>
        ) : (
          paymentGateways.map((gateway) => (
            <View key={gateway.id} style={styles.gatewayCard}>
              <View style={styles.gatewayHeader}>
                <View style={styles.gatewayTitleRow}>
                  <View style={[styles.iconContainer, { backgroundColor: gateway.color }]}>
                    <Ionicons name={gateway.icon} size={moderateScale(24)} color="#fff" />
                  </View>
                  <View style={styles.gatewayInfo}>
                    <Text style={styles.gatewayName}>{gateway.name}</Text>
                    {gateway.accountName && (
                      <Text style={styles.gatewayDetail}>{gateway.accountName}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(gateway)}
                  >
                    <Ionicons name="create-outline" size={moderateScale(22)} color="#1C86FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteGateway(gateway.id)}
                  >
                    <Ionicons name="trash-outline" size={moderateScale(22)} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.gatewayDetails}>
                {gateway.bankName && (
                  <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={moderateScale(16)} color="#666" />
                    <Text style={styles.detailText}>{gateway.bankName}</Text>
                  </View>
                )}
                {gateway.accountNumber && (
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={moderateScale(16)} color="#666" />
                    <Text style={styles.detailText}>{gateway.accountNumber}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={moderateScale(28)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Gateway Type Selection */}
              <Text style={styles.modalLabel}>Select Gateway Type</Text>
              <View style={styles.gatewayTypeGrid}>
                {gatewayTypes.map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.gatewayTypeCard,
                      formData.name === type.name && styles.gatewayTypeCardActive,
                    ]}
                    onPress={() => selectGatewayType(type)}
                  >
                    <View style={[styles.gatewayTypeIcon, { backgroundColor: type.color }]}>
                      <Ionicons name={type.icon} size={moderateScale(20)} color="#fff" />
                    </View>
                    <Text style={styles.gatewayTypeName}>{type.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dynamic Form Fields */}
              {formData.name && (
                <>
                  {getRequiredFields().includes('bankName') && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalLabel}>Bank Name</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={formData.bankName}
                        onChangeText={(text) => setFormData({ ...formData, bankName: text })}
                        placeholder="Enter bank name"
                      />
                    </View>
                  )}

                  {getRequiredFields().includes('accountName') && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalLabel}>Account Name</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={formData.accountName}
                        onChangeText={(text) => setFormData({ ...formData, accountName: text })}
                        placeholder="Enter account name"
                      />
                    </View>
                  )}

                  {getRequiredFields().includes('accountNumber') && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalLabel}>Account Number</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={formData.accountNumber}
                        onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                        placeholder="Enter account number"
                        keyboardType="phone-pad"
                      />
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={handleSaveGateway}
              >
                <Text style={styles.saveModalButtonText}>
                  {editingGateway ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  gatewayCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gatewayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  gatewayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: moderateScale(12),
  },
  iconContainer: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(22.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: scaleFontSize(17),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  gatewayDetail: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  actionButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8F9FA',
  },
  gatewayDetails: {
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  detailText: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyStateText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
  },
  emptyStateSubtext: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(8),
    paddingHorizontal: wp(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '85%',
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
    color: '#1C86FF',
  },
  modalBody: {
    padding: moderateScale(20),
    maxHeight: moderateScale(450),
  },
  modalLabel: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  gatewayTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  gatewayTypeCard: {
    width: '30%',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gatewayTypeCardActive: {
    borderColor: '#1C86FF',
    backgroundColor: '#E3F2FD',
  },
  gatewayTypeIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  gatewayTypeName: {
    fontSize: scaleFontSize(11),
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    fontSize: scaleFontSize(15),
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: moderateScale(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  saveModalButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    backgroundColor: '#1C86FF',
  },
  saveModalButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
