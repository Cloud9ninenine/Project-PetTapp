import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  ImageBackground,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '@components/Header';

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const [profileInfo, setProfileInfo] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    homeAddress: '123 Pet Street, Animal City, PC 12345',
    phoneNumber: '+1 234 567 8900',
  });

  const [paymentOptions, setPaymentOptions] = useState([
    {
      id: '1',
      name: 'Option 1',
      cardNumber: '**** **** **** 1234',
      cardHolder: 'John Doe',
      expiryDate: '12/25',
    },
    {
      id: '2',
      name: 'Option 2',
      cardNumber: '**** **** **** 5678',
      cardHolder: 'John Doe',
      expiryDate: '06/26',
    },
  ]);

  const [newPayment, setNewPayment] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Profile
      </Text>
    </View>
  );

  const updateProfileInfo = (field, value) => {
    setProfileInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateNewPayment = (field, value) => {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    if (!isEditing) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setShowConfirmModal(true);
    } else {
      setIsEditing(true);
    }
  };

  const confirmUpdate = () => {
    setShowConfirmModal(false);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    Alert.alert('Logged Out', 'You have been logged out successfully.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') }
    ]);
  };

  const handleAddPayment = () => {
    setShowPaymentModal(true);
  };

  const handleViewPayment = (option) => {
    setSelectedPayment(option);
    setShowViewPaymentModal(true);
  };

  const savePayment = () => {
    const { cardNumber, cardHolder, expiryDate, cvv } = newPayment;
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all payment fields');
      return;
    }

    const newOption = {
      id: String(paymentOptions.length + 1),
      name: `Option ${paymentOptions.length + 1}`,
      cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
      cardHolder: cardHolder,
      expiryDate: expiryDate,
    };

    setPaymentOptions([...paymentOptions, newOption]);
    setNewPayment({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
    setShowPaymentModal(false);
    Alert.alert('Success', 'Payment option added successfully!');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Photo */}
          <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderIcon}>
                <Ionicons name="person" size={50} color="#1C86FF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profileInfo.firstName}
                onChangeText={(value) => updateProfileInfo('firstName', value)}
                placeholder="Enter first name"
                editable={isEditing}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profileInfo.lastName}
                onChangeText={(value) => updateProfileInfo('lastName', value)}
                placeholder="Enter last name"
                editable={isEditing}
              />
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profileInfo.email}
                onChangeText={(value) => updateProfileInfo('email', value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                editable={isEditing}
              />
            </View>

            {/* Home Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Home Address</Text>
              <TextInput
                style={[styles.input, styles.textArea, !isEditing && styles.disabledInput]}
                value={profileInfo.homeAddress}
                onChangeText={(value) => updateProfileInfo('homeAddress', value)}
                placeholder="Enter home address"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                editable={isEditing}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profileInfo.phoneNumber}
                onChangeText={(value) => updateProfileInfo('phoneNumber', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            {/* Payment Options */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Options</Text>

              <View style={styles.paymentCardsRow}>
                {paymentOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.paymentCard}
                    onPress={() => handleViewPayment(option)}
                  >
                    <View style={styles.paymentCardContent}>
                      <Ionicons name="card-outline" size={40} color="#1C86FF" />
                    </View>
                    <Text style={styles.paymentCardLabel}>{option.name}</Text>
                  </TouchableOpacity>
                ))}

                {/* Add Payment Card */}
                <TouchableOpacity style={styles.addPaymentCard} onPress={handleAddPayment}>
                  <View style={styles.paymentCardContent}>
                    <Ionicons name="add" size={40} color="#1C86FF" />
                  </View>
                  <Text style={styles.paymentCardLabel}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleEditToggle}>
                <Text style={styles.confirmButtonText}>
                  {isEditing ? 'Confirm' : 'Edit'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#1C86FF" style={styles.confirmIcon} />
            <Text style={styles.confirmModalTitle}>Confirm Update</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to save these changes to your profile?
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButtonModal}
                onPress={confirmUpdate}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="log-out" size={60} color="#ff9b79" style={styles.confirmIcon} />
            <Text style={styles.confirmModalTitle}>Logout</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonModal, styles.logoutButtonModal]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Payment Details Modal */}
      <Modal
        visible={showViewPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewPaymentModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.viewPaymentModalContent}>
            <View style={styles.viewPaymentHeader}>
              <Ionicons name="card" size={60} color="#1C86FF" style={styles.confirmIcon} />
              <Text style={styles.viewPaymentTitle}>{selectedPayment?.name}</Text>
            </View>

            <View style={styles.viewPaymentDetails}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Card Number</Text>
                <Text style={styles.paymentDetailValue}>{selectedPayment?.cardNumber}</Text>
              </View>

              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Card Holder</Text>
                <Text style={styles.paymentDetailValue}>{selectedPayment?.cardHolder}</Text>
              </View>

              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Expiry Date</Text>
                <Text style={styles.paymentDetailValue}>{selectedPayment?.expiryDate}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowViewPaymentModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>Add Payment Option</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={newPayment.cardNumber}
                onChangeText={(value) => updateNewPayment('cardNumber', value)}
                placeholder="1234 5678 9012 3456"
                keyboardType="number-pad"
                maxLength={16}
              />
            </View>

            {/* Card Holder */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Holder Name</Text>
              <TextInput
                style={styles.input}
                value={newPayment.cardHolder}
                onChangeText={(value) => updateNewPayment('cardHolder', value)}
                placeholder="John Doe"
              />
            </View>

            {/* Expiry and CVV */}
            <View style={styles.rowInputGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  value={newPayment.expiryDate}
                  onChangeText={(value) => updateNewPayment('expiryDate', value)}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  value={newPayment.cvv}
                  onChangeText={(value) => updateNewPayment('cvv', value)}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.addPaymentConfirmButton} onPress={savePayment}>
              <Text style={styles.confirmButtonText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  addCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    backgroundColor: '#E3F2FD',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholderIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowInputGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: 'black',
    marginBottom: 6,
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'SFProReg',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  textArea: {
    minHeight: 60,
    paddingTop: 12,
  },
  paymentSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SFProBold',
    color: 'black',
    marginBottom: 16,
  },
  paymentCardsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 12,
    width: 125,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  paymentCardLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#333',
    textAlign: 'center',
    paddingBottom: 8,
  },
  addPaymentCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 12,
    width: 125,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'SFProReg',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#1C86FF',
    fontSize: 20,
    fontFamily: 'SFProReg',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: 20,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmModalText: {
    fontSize: 16,
    fontFamily: 'SFProReg',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: 20,
    fontFamily: 'SFProReg',
  },
  confirmButtonModal: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonModal: {
    backgroundColor: '#ff9b79',
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
  },
  viewPaymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  viewPaymentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  viewPaymentTitle: {
    fontSize: 22,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginTop: 12,
  },
  viewPaymentDetails: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  paymentDetailRow: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 10,
  },
  paymentDetailLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: 4,
  },
  paymentDetailValue: {
    fontSize: 16,
    fontFamily: 'SFProSB',
    color: 'black',
  },
  closeModalButton: {
    width: '100%',
    backgroundColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addPaymentConfirmButton: {
    width: '100%',
    backgroundColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
});
