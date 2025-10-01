import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function AddServiceModal({ visible, onClose, onAddService }) {
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    icon: 'star',
    color: '#1C86FF',
  });

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
              <TextInput
                style={styles.input}
                placeholder="e.g., Training, Grooming, Veterinary"
                value={newService.category}
                onChangeText={(text) => setNewService({ ...newService, category: text })}
              />
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
              <Text style={styles.submitButtonText}>Add Service</Text>
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
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  inputGroup: {
    marginBottom: moderateScale(4),
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
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
