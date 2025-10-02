import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function AddServiceModal({ visible, onClose, onAddService, editingService }) {
  const [newService, setNewService] = useState(editingService || {
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    icon: 'star',
    color: '#1C86FF',
  });

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categories = [
    { name: 'Veterinary', icon: 'medical', color: '#4CAF50' },
    { name: 'Grooming', icon: 'cut', color: '#2196F3' },
    { name: 'Boarding', icon: 'home', color: '#FF9B79' },
    { name: 'Training', icon: 'school', color: '#9C27B0' },
    { name: 'Delivery', icon: 'car', color: '#FF6B6B' },
    { name: 'Daycare', icon: 'sunny', color: '#FFD700' },
    { name: 'Photography', icon: 'camera', color: '#00BCD4' },
    { name: 'Other', icon: 'ellipsis-horizontal', color: '#607D8B' },
  ];

  React.useEffect(() => {
    if (editingService) {
      setNewService(editingService);
    }
  }, [editingService]);

  const handleAdd = () => {
    if (newService.name && newService.category && newService.price) {
      onAddService(newService);
      setNewService({
        name: '',
        category: '',
        price: '',
        duration: '',
        description: '',
        icon: 'star',
        color: '#1C86FF',
      });
    }
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Service</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={moderateScale(28)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Pet Training"
                value={newService.name}
                onChangeText={(text) => setNewService({ ...newService, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <View style={styles.dropdownContent}>
                  {newService.category && newService.icon && (
                    <View style={[styles.categoryIconSmall, { backgroundColor: newService.color }]}>
                      <Ionicons name={newService.icon} size={moderateScale(16)} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.dropdownText, !newService.category && styles.dropdownPlaceholder]}>
                    {newService.category || 'Select category'}
                  </Text>
                </View>
                <Ionicons
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                  size={moderateScale(20)}
                  color="#666"
                />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {categories.map((cat, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        newService.category === cat.name && styles.dropdownItemSelected,
                        pressed && styles.dropdownItemPressed,
                        index === categories.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setNewService({
                          ...newService,
                          category: cat.name,
                          icon: cat.icon,
                          color: cat.color,
                        });
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                        <Ionicons name={cat.icon} size={moderateScale(20)} color="#fff" />
                      </View>
                      <Text style={[
                        styles.dropdownItemText,
                        newService.category === cat.name && styles.dropdownItemTextSelected
                      ]}>
                        {cat.name}
                      </Text>
                      {newService.category === cat.name && (
                        <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#1C86FF" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="₱600"
                  value={newService.price}
                  onChangeText={(text) => setNewService({ ...newService, price: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.input}
                  placeholder="45 mins"
                  value={newService.duration}
                  onChangeText={(text) => setNewService({ ...newService, duration: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of the service"
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAdd}
            >
              <Ionicons name={editingService ? "checkmark-circle" : "add-circle"} size={moderateScale(20)} color="#fff" />
              <Text style={styles.submitButtonText}>{editingService ? 'Update Service' : 'Add Service'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    maxHeight: hp(80),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  inputRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    fontFamily: 'SFProReg',
  },
  textArea: {
    minHeight: moderateScale(80),
    paddingTop: moderateScale(12),
  },
  submitButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#1C86FF',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
  },
  dropdownText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
    fontFamily: 'SFProReg',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    marginTop: moderateScale(8),
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    maxHeight: moderateScale(250),
    elevation: 5,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: moderateScale(12),
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#1C86FF',
  },
  dropdownItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    flex: 1,
    fontWeight: '500',
    fontFamily: 'SFProReg',
  },
  dropdownItemTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  categoryIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconSmall: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
