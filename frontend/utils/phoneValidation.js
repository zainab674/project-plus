/**
 * Phone number validation utilities for frontend
 */

/**
 * Validates phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} - Validation result with isValid and formatted number
 */
export const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return {
            isValid: false,
            error: 'Phone number is required',
            formatted: null
        };
    }

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it starts with + (international format)
    if (cleaned.startsWith('+')) {
        // International format: +1234567890 (10-15 digits after +)
        const digits = cleaned.slice(1);
        if (digits.length >= 10 && digits.length <= 15 && /^\d+$/.test(digits)) {
            return {
                isValid: true,
                error: null,
                formatted: cleaned
            };
        }
    } else {
        // Local format: 1234567890 (10 digits)
        if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
            return {
                isValid: true,
                error: null,
                formatted: `+1${cleaned}` // Assume US if no country code
            };
        }
    }

    return {
        isValid: false,
        error: 'Invalid phone number format. Use +1234567890 or 1234567890',
        formatted: null
    };
};

/**
 * Rate limiting helper for call attempts
 * @param {string} userId - User ID
 * @param {Object} callHistory - Call history object
 * @returns {Object} - Rate limit check result
 */
export const checkCallRateLimit = (userId, callHistory = []) => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const maxCallsPerHour = 50; // Configurable limit
    
    // Filter calls from the last hour
    const recentCalls = callHistory.filter(
        call => now - call.timestamp < oneHour
    );
    
    if (recentCalls.length >= maxCallsPerHour) {
        const oldestCall = Math.min(...recentCalls.map(call => call.timestamp));
        const remainingTime = Math.ceil((oldestCall + oneHour - now) / 60000); // minutes
        
        return {
            allowed: false,
            error: `Rate limit exceeded. Maximum ${maxCallsPerHour} calls per hour. Try again in ${remainingTime} minutes.`,
            remainingTime
        };
    }
    
    return {
        allowed: true,
        error: null,
        remainingCalls: maxCallsPerHour - recentCalls.length
    };
};

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
        // US format: +1 (234) 567-8900
        const number = cleaned.slice(2);
        return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    } else if (cleaned.startsWith('+') && cleaned.length >= 11) {
        // International format: +12 345 678 9012
        const countryCode = cleaned.slice(0, 3);
        const number = cleaned.slice(3);
        return `${countryCode} ${number.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
    } else if (cleaned.length === 10) {
        // Local format: (234) 567-8900
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phoneNumber;
};

