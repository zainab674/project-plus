import React, { useState, useEffect } from 'react';
import { Mail, Bell } from 'lucide-react';

const EmailBadge = ({ count = 0, onClick, className = '', showIcon = true, variant = 'default' }) => {
    const [displayCount, setDisplayCount] = useState(count);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (count !== displayCount) {
            setIsAnimating(true);
            setDisplayCount(count);
            
            // Reset animation state after animation completes
            setTimeout(() => setIsAnimating(false), 300);
        }
    }, [count]);

    const getBadgeContent = () => {
        if (count === 0) return null;
        
        if (count > 99) {
            return '99+';
        }
        
        return count.toString();
    };

    const getBadgeClasses = () => {
        const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium text-xs transition-all duration-200';
        
        switch (variant) {
            case 'primary':
                return `${baseClasses} bg-blue-600 text-white`;
            case 'secondary':
                return `${baseClasses} bg-gray-600 text-white`;
            case 'success':
                return `${baseClasses} bg-green-600 text-white`;
            case 'warning':
                return `${baseClasses} bg-yellow-600 text-white`;
            case 'danger':
                return `${baseClasses} bg-red-600 text-white`;
            case 'minimal':
                return `${baseClasses} bg-red-500 text-white`;
            default:
                return `${baseClasses} bg-red-500 text-white`;
        }
    };

    const getSizeClasses = () => {
        if (count === 0) return 'w-0 h-0';
        if (count < 10) return 'min-w-[20px] h-5 px-1';
        if (count < 100) return 'min-w-[24px] h-6 px-1.5';
        return 'min-w-[28px] h-7 px-2';
    };

    const getIconClasses = () => {
        if (count === 0) return 'text-gray-400';
        if (count < 5) return 'text-blue-600';
        if (count < 10) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (count === 0 && variant !== 'minimal') {
        return (
            <div className={`relative ${className}`} onClick={onClick}>
                {showIcon && (
                    <Mail className={`w-5 h-5 ${getIconClasses()} transition-colors duration-200`} />
                )}
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} onClick={onClick}>
            {showIcon && (
                <Mail className={`w-5 h-5 ${getIconClasses()} transition-colors duration-200`} />
            )}
            
            {count > 0 && (
                <div 
                    className={`absolute -top-2 -right-2 ${getBadgeClasses()} ${getSizeClasses()} ${onClick ? 'cursor-pointer' : ''} ${
                        isAnimating ? 'scale-110' : 'scale-100'
                    } transition-transform duration-200`}
                >
                    <span className="leading-none">
                        {getBadgeContent()}
                    </span>
                </div>
            )}

            {/* Pulse animation for high priority emails */}
            {count > 10 && (
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            )}
        </div>
    );
};

// Specialized badge for navigation
export const EmailNotificationBadge = ({ count = 0, onClick, className = '' }) => {
    return (
        <div className={`relative ${className}`} onClick={onClick}>
            <Bell className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
            
            {count > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 transition-all duration-200">
                    <span className="leading-none text-[10px] font-medium">
                        {count > 99 ? '99+' : count}
                    </span>
                </div>
            )}
        </div>
    );
};

// Floating action badge for mobile
export const FloatingEmailBadge = ({ count = 0, onClick, className = '' }) => {
    return (
        <div className={`fixed bottom-6 right-6 z-40 transition-transform duration-200 hover:scale-105 active:scale-95 ${className}`}>
            <div className="relative">
                <div className="w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center cursor-pointer">
                    <Mail className="w-6 h-6 text-white" />
                </div>
                
                {count > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 transition-all duration-200">
                        <span className="leading-none font-medium">
                            {count > 99 ? '99+' : count}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailBadge;
