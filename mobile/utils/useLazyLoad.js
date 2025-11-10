import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for lazy loading content when it comes into view
 * Useful for loading below-the-fold content on demand
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element visible to trigger load (0-1, default: 0.1)
 * @param {string} options.rootMargin - Margin around root before triggering (default: '100px')
 * @returns {Object} - { ref: ref for element, isVisible: boolean, isLoaded: boolean }
 */
export const useLazyLoad = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    // Create intersection observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setIsLoaded(true);
          // Stop observing once loaded
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(ref.current);

    // Cleanup
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return { ref, isVisible, isLoaded };
};

/**
 * Higher-order component to wrap components for lazy loading
 * @param {React.Component} Component - Component to lazy load
 * @param {Object} lazyOptions - Options for useLazyLoad hook
 * @returns {React.Component} - Wrapped component
 */
export const withLazyLoad = (Component, lazyOptions = {}) => {
  return (props) => {
    const { ref, isLoaded } = useLazyLoad(lazyOptions);

    return (
      <div ref={ref}>
        {isLoaded ? <Component {...props} /> : null}
      </div>
    );
  };
};
