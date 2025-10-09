import { useState, useEffect } from 'react';
import apiClient from '../config/api';

/**
 * Custom hook to check if user profile is complete
 * @returns {Object} { isProfileComplete, isLoading, checkProfile }
 */
export function useProfileCompletion() {
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const checkProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/users/profile');

      if (response.status === 200) {
        const userData = response.data.data.user;
        const profileData = response.data.data.profile;

        console.log('=== PROFILE COMPLETION CHECK ===');
        console.log('User Data:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        });
        console.log('Profile Data:', {
          contactNumber: profileData.contactNumber,
          address: profileData.address,
        });

        // Check addresses from separate endpoint
        let hasValidAddress = false;
        try {
          const addressResponse = await apiClient.get('/addresses');
          if (addressResponse.status === 200 && addressResponse.data?.data) {
            const addresses = Array.isArray(addressResponse.data.data) ? addressResponse.data.data : [];
            hasValidAddress = addresses.length > 0;
            console.log('Addresses from /addresses endpoint:', {
              count: addresses.length,
              addresses: addresses.map(a => ({
                label: a.label,
                street: a.street,
                city: a.city,
              })),
            });
          }
        } catch (addressError) {
          console.log('Error fetching addresses:', addressError);
        }

        // Check if address exists in profile data
        const hasProfileAddress = !!(
          profileData.address &&
          profileData.address.street &&
          profileData.address.city
        );

        console.log('Address Check:', {
          hasProfileAddress,
          hasValidAddress,
          profileAddress: profileData.address,
        });

        // Check if required fields are complete
        const isIncomplete = (
          !userData.firstName ||
          !userData.lastName ||
          !profileData.contactNumber ||
          (!hasProfileAddress && !hasValidAddress)
        );

        console.log('Field Check:', {
          hasFirstName: !!userData.firstName,
          hasLastName: !!userData.lastName,
          hasContactNumber: !!profileData.contactNumber,
          hasProfileAddress: hasProfileAddress,
          hasValidAddress: hasValidAddress,
          isIncomplete: isIncomplete,
          isProfileComplete: !isIncomplete,
        });
        console.log('=== END PROFILE CHECK ===');

        setIsProfileComplete(!isIncomplete);
        return !isIncomplete;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      // Assume incomplete on error to be safe
      setIsProfileComplete(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
  }, []);

  return { isProfileComplete, isLoading, checkProfile };
}
