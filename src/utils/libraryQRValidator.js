import { LIBRARY_QR_SECRETS } from '../lib/constants';

/**
 * Validates QR code data by checking if the secret code exists in our whitelist
 * @param {string} qrData - The scanned QR code data
 * @returns {object} - { isValid: boolean, secret: string | null }
 */
export const validateLibraryQR = (qrData) => {
  try {
    if (!qrData || typeof qrData !== 'string') {
      return { isValid: false, secret: null, error: 'Invalid QR data format' };
    }

    // Try to parse if it's JSON format
    let secret = null;
    try {
      const parsedData = JSON.parse(qrData);
      secret = parsedData.secret || qrData;
    } catch (e) {
      // If not JSON, treat the whole data as secret
      secret = qrData;
    }

    // Check if secret exists in our whitelist
    const isValid = LIBRARY_QR_SECRETS.includes(secret);

    return {
      isValid,
      secret: isValid ? secret : null,
      error: isValid ? null : 'QR code not recognized',
    };
  } catch (error) {
    return {
      isValid: false,
      secret: null,
      error: error.message || 'QR validation error',
    };
  }
};
