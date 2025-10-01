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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '@components/Header';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  // Determine layout based on screen width
  const isVeryNarrow = width < 360;
  const isNarrow = width < 400;

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
                <Ionicons name="person" size={moderateScale(50)} color="#1C86FF" />
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

              <View style={[
                styles.paymentCardsRow,
                isVeryNarrow && styles.paymentCardsRowNarrow
              ]}>
                {paymentOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.paymentCard,
                      isVeryNarrow && styles.paymentCardNarrow
                    ]}
                    onPress={() => handleViewPayment(option)}
                  >
                    <View style={styles.paymentCardContent}>
                      <Ionicons
                        name="card-outline"
                        size={isVeryNarrow ? moderateScale(32) : moderateScale(40)}
                        color="#1C86FF"
                      />
                    </View>
                    <Text style={[
                      styles.paymentCardLabel,
                      isVeryNarrow && styles.paymentCardLabelSmall
                    ]}>{option.name}</Text>
                  </TouchableOpacity>
                ))}

                {/* Add Payment Card */}
                <TouchableOpacity
                  style={[
                    styles.addPaymentCard,
                    isVeryNarrow && styles.paymentCardNarrow
                  ]}
                  onPress={handleAddPayment}
                >
                  <View style={styles.paymentCardContent}>
                    <Ionicons
                      name="add"
                      size={isVeryNarrow ? moderateScale(32) : moderateScale(40)}
                      color="#1C86FF"
                    />
                  </View>
                  <Text style={[
                    styles.paymentCardLabel,
                    isVeryNarrow && styles.paymentCardLabelSmall
                  ]}>Add</Text>
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
            <Ionicons name="checkmark-circle" size={moderateScale(60)} color="#1C86FF" style={styles.confirmIcon} />
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
            <Ionicons name="log-out" size={moderateScale(60)} color="#ff9b79" style={styles.confirmIcon} />
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
              <Ionicons name="card" size={moderateScale(60)} color="#1C86FF" style={styles.confirmIcon} />
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
                <Ionicons name="close" size={moderateScale(28)} color="#666" />
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
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(8),
    paddingTop: moderateScale(30),
    paddingBottom: moderateScale(40),
    alignItems: 'center',
  },
  addCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(30),
    overflow: 'hidden',
    backgroundColor: '#E3F2FD',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(60),
  },
  placeholderIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: moderateScale(12),
  },
  rowInputGroup: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: scaleFontSize(16),
    color: 'black',
    marginBottom: moderateScale(6),
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  textArea: {
    minHeight: moderateScale(60),
    paddingTop: moderateScale(12),
  },
  paymentSection: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProBold',
    color: 'black',
    marginBottom: moderateScale(16),
  },
  paymentCardsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  paymentCardsRowNarrow: {
    gap: moderateScale(8),
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(12),
    width: moderateScale(100),
    height: moderateScale(100),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: moderateScale(90),
    maxWidth: moderateScale(125),
  },
  paymentCardNarrow: {
    width: moderateScale(80),
    height: moderateScale(80),
    minWidth: moderateScale(70),
    maxWidth: moderateScale(90),
    borderRadius: moderateScale(8),
  },
  paymentCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: moderateScale(10),
  },
  paymentCardLabel: {
    fontSize: scaleFontSize(12),
    fontFamily: 'SFProReg',
    color: '#333',
    textAlign: 'center',
    paddingBottom: moderateScale(8),
  },
  paymentCardLabelSmall: {
    fontSize: scaleFontSize(10),
    paddingBottom: moderateScale(6),
  },
  addPaymentCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(12),
    width: moderateScale(100),
    height: moderateScale(100),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: moderateScale(90),
    maxWidth: moderateScale(125),
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: moderateScale(12),
    marginTop: moderateScale(20),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: moderateScale(20),
  },
  confirmModalTitle: {
    fontSize: scaleFontSize(22),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  confirmModalText: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(24),
    lineHeight: moderateScale(22),
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
  },
  confirmButtonModal: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
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
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(24),
    maxHeight: '80%',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  paymentModalTitle: {
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
  },
  viewPaymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  viewPaymentHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  viewPaymentTitle: {
    fontSize: scaleFontSize(22),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginTop: moderateScale(12),
  },
  viewPaymentDetails: {
    width: '100%',
    gap: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  paymentDetailRow: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: moderateScale(16),
    borderRadius: moderateScale(10),
  },
  paymentDetailLabel: {
    fontSize: scaleFontSize(12),
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: moderateScale(4),
  },
  paymentDetailValue: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProSB',
    color: 'black',
  },
  closeModalButton: {
    width: '100%',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  addPaymentConfirmButton: {
    width: '100%',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginTop: moderateScale(12),
  },
});
