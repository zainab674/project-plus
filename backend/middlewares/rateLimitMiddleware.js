import catchAsyncError from './catchAsyncError.js';

// In-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.keyGenerator - Function to generate rate limit key
 * @returns {Function} Express middleware function
 */
export const rateLimit = (options = {}) => {
    const {
        windowMs = 60 * 60 * 1000, // 1 hour default
        maxRequests = 50, // 50 requests per hour default
        keyGenerator = (req) => req.user?.user_id || req.ip || 'anonymous'
    } = options;

    return catchAsyncError(async (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        
        // Get or create rate limit entry
        let entry = rateLimitStore.get(key);
        if (!entry) {
            entry = { requests: [], windowStart: now };
            rateLimitStore.set(key, entry);
        }
        
        // Clean old requests outside the window
        entry.requests = entry.requests.filter(
            timestamp => now - timestamp < windowMs
        );
        
        // Check if limit exceeded
        if (entry.requests.length >= maxRequests) {
            const oldestRequest = Math.min(...entry.requests);
            const resetTime = oldestRequest + windowMs;
            const retryAfter = Math.ceil((resetTime - now) / 1000);
            
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
                retryAfter,
                limit: maxRequests,
                remaining: 0
            });
        }
        
        // Add current request
        entry.requests.push(now);
        
        // Set rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - entry.requests.length,
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });
        
        next();
    });
};

/**
 * Cleanup expired entries periodically
 */
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.windowStart > maxAge) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000); // Cleanup every hour

