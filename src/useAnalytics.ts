import { useEffect } from 'react';
import { analytics } from './api';

export function useAnalytics() {
    const trackEvent = (eventType: string, action?: string, metadata?: any) => {
        // Only track in production or if explicitly enabled
        if (import.meta.env.DEV && !localStorage.getItem('enable_analytics')) {
            return;
        }
        
        analytics.trackEvent({
            eventType,
            page: window.location.pathname,
            action,
            metadata
        }).catch(err => {
            console.error('Analytics tracking failed:', err);
        });
    };

    const trackPageView = (page?: string) => {
        trackEvent('page_view', undefined, { page: page || window.location.pathname });
    };

    const trackClick = (action: string, metadata?: any) => {
        trackEvent('click', action, metadata);
    };

    const trackFormSubmit = (formName: string, metadata?: any) => {
        trackEvent('form_submit', formName, metadata);
    };

    const trackFeatureUse = (featureName: string, metadata?: any) => {
        trackEvent('feature_use', featureName, metadata);
    };

    const trackError = (error: string, metadata?: any) => {
        trackEvent('error', error, metadata);
    };

    return {
        trackEvent,
        trackPageView,
        trackClick,
        trackFormSubmit,
        trackFeatureUse,
        trackError
    };
}

// Hook to automatically track page views
export function usePageViewTracking() {
    const { trackPageView } = useAnalytics();
    
    useEffect(() => {
        trackPageView();
    }, [trackPageView]);
}