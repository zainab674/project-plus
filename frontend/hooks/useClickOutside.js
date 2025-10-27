import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle click outside functionality
 * @param {Function} handler - Function to call when clicking outside
 * @param {Array} dependencies - Dependencies array for the effect
 * @returns {Object} ref - Ref to attach to the element that should not trigger the handler
 */
const useClickOutside = (handler, dependencies = []) => {
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                handler();
            }
        };

        // Add event listener when component mounts
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        // Cleanup event listeners when component unmounts or dependencies change
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, dependencies);

    return ref;
};

export default useClickOutside;
