// Generate a unique visitor ID for analytics tracking
export function generateVisitorId(): string {
  // Check if we already have a visitor ID stored
  let visitorId = localStorage.getItem('visitor_id');
  
  if (!visitorId) {
    // Generate a new UUID-like ID
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('visitor_id', visitorId);
  }
  
  return visitorId;
}

// Track page view
export async function trackPageView(page: string) {
  try {
    const visitorId = generateVisitorId();
    
    // Import backend client dynamically to avoid circular dependencies
    const { default: backend } = await import('~backend/client');
    
    await backend.analytics.trackPageView({
      page,
      visitorId
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}
