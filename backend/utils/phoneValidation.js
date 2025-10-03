/**
 * Phone number validation utilities
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
 * Sanitizes phone number for logging (removes sensitive data)
 * @param {string} phoneNumber - Phone number to sanitize
 * @returns {string} - Sanitized phone number (e.g., +1234***7890)
 */
export const sanitizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleaned.length <= 4) {
        return '***';
    }
    
    // Show first 4 and last 4 digits, mask the middle
    const first = cleaned.slice(0, 4);
    const last = cleaned.slice(-4);
    const middle = '*'.repeat(Math.max(0, cleaned.length - 8));
    
    return `${first}${middle}${last}`;
};

/**
 * Rate limiting helper for call attempts
 * @param {string} userId - User ID
 * @param {Object} callHistory - Call history object
 * @returns {Object} - Rate limit check result
 */
export const checkCallRateLimit = (userId, callHistory = {}) => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const maxCallsPerHour = 50; // Configurable limit
    
    if (!callHistory[userId]) {
        callHistory[userId] = [];
    }
    
    // Remove calls older than 1 hour
    callHistory[userId] = callHistory[userId].filter(
        timestamp => now - timestamp < oneHour
    );
    
    if (callHistory[userId].length >= maxCallsPerHour) {
        return {
            allowed: false,
            error: 'Rate limit exceeded. Maximum 50 calls per hour.',
            remainingTime: Math.ceil((callHistory[userId][0] + oneHour - now) / 60000) // minutes
        };
    }
    
    // Add current call timestamp
    callHistory[userId].push(now);
    
    return {
        allowed: true,
        error: null,
        remainingCalls: maxCallsPerHour - callHistory[userId].length
    };
};

