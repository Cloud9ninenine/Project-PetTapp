import apiClient from '@config/api';

/**
 * Pet API - Handles all pet-related API calls
 */

/**
 * Fetch all pets for the current user
 * @returns {Promise<Array>} Array of pet objects
 */
export const fetchUserPets = async () => {
  try {
    const response = await apiClient.get('/pets');

    if (response.data.success) {
      return response.data.data || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching user pets:', error);
    throw error;
  }
};

/**
 * Fetch a single pet by ID
 * @param {string} petId - Pet ID
 * @returns {Promise<Object>} Pet object
 */
export const fetchPetById = async (petId) => {
  if (!petId) {
    throw new Error('Pet ID is required');
  }

  try {
    const response = await apiClient.get(`/pets/${petId}`);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch pet details');
  } catch (error) {
    console.error('Error fetching pet by ID:', error);
    throw error;
  }
};

/**
 * Create a new pet
 * @param {Object} petData - Pet details
 * @param {string} petData.name - Pet name
 * @param {string} petData.species - Pet species (dog, cat, bird, etc.)
 * @param {string} petData.breed - Pet breed
 * @param {number} petData.age - Pet age
 * @param {string} petData.gender - Pet gender (male, female)
 * @param {Object} petData.medicalHistory - Medical history (optional)
 * @returns {Promise<Object>} Created pet object
 */
export const createPet = async (petData) => {
  if (!petData.name) {
    throw new Error('Pet name is required');
  }
  if (!petData.species) {
    throw new Error('Pet species is required');
  }

  try {
    const response = await apiClient.post('/pets', petData);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to create pet');
  } catch (error) {
    console.error('Error creating pet:', error);
    throw error;
  }
};

/**
 * Update a pet
 * @param {string} petId - Pet ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated pet object
 */
export const updatePet = async (petId, updateData) => {
  if (!petId) {
    throw new Error('Pet ID is required');
  }

  try {
    const response = await apiClient.patch(`/pets/${petId}`, updateData);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update pet');
  } catch (error) {
    console.error('Error updating pet:', error);
    throw error;
  }
};

/**
 * Delete a pet
 * @param {string} petId - Pet ID
 * @returns {Promise<boolean>} Success status
 */
export const deletePet = async (petId) => {
  if (!petId) {
    throw new Error('Pet ID is required');
  }

  try {
    const response = await apiClient.delete(`/pets/${petId}`);

    if (response.data.success) {
      return true;
    }

    throw new Error(response.data.message || 'Failed to delete pet');
  } catch (error) {
    console.error('Error deleting pet:', error);
    throw error;
  }
};

/**
 * Upload pet image/photo
 * @param {string} petId - Pet ID
 * @param {Object} imageData - Image data (FormData or URI)
 * @returns {Promise<Object>} Updated pet object with image URL
 */
export const uploadPetImage = async (petId, imageData) => {
  if (!petId) {
    throw new Error('Pet ID is required');
  }
  if (!imageData) {
    throw new Error('Image data is required');
  }

  try {
    const formData = new FormData();
    formData.append('image', imageData);

    const response = await apiClient.post(`/pets/${petId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to upload pet image');
  } catch (error) {
    console.error('Error uploading pet image:', error);
    throw error;
  }
};
