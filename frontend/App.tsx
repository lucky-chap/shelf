import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import CheckoutResult from "./pages/CheckoutResult";
import { isStripeConfigured, isUnsplashConfigured } from "./config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Log configuration status
if (isStripeConfigured()) {
  console.log("Stripe integration enabled");
} else {
  console.log("Stripe integration disabled - set VITE_STRIPE_PUBLISHABLE_KEY to enable store functionality");
}

if (isUnsplashConfigured()) {
  console.log("Unsplash integration enabled");
} else {
  console.log("Unsplash integration disabled - set VITE_UNSPLASH_ACCESS_KEY to enable background images");
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/checkout/success" element={<CheckoutResult />} />
                {/* Redirect legacy store URLs no longer needed */}
                <Route path="/product/*" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              <Toaster />
            </div>
          </Router>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
