// Configuration for the Customer Service Coach application
// This file should be updated with your Supabase project details

const config = {
  // For local development with Express server (original setup)
  // Comment this out when using Supabase
  localMode: false,
  localApiUrl: "http://localhost:3000/api",

  // Supabase configuration
  // Get these values from: https://app.supabase.com/project/_/settings/api
  supabase: {
    url: "YOUR_SUPABASE_URL", // e.g., https://xxxxx.supabase.co
    anonKey: "YOUR_SUPABASE_ANON_KEY", // Your public anon key
  },

  // Validate configuration
  isConfigured() {
    if (!this.localMode) {
      if (this.supabase.url === "YOUR_SUPABASE_URL" || 
          this.supabase.anonKey === "YOUR_SUPABASE_ANON_KEY") {
        console.error("❌ Configuration Error: Please update config.js with your Supabase credentials");
        console.error("   Set localMode: true to use local server, or");
        console.error("   Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your actual values");
        return false;
      }
    }
    return true;
  },

  // API endpoints - these will be constructed based on your setup
  getApiUrl() {
    if (this.localMode) {
      return this.localApiUrl;
    } else {
      // Supabase Edge Functions URL pattern
      return `${this.supabase.url}/functions/v1`;
    }
  },

  getHeaders() {
    if (this.localMode) {
      return {
        "Content-Type": "application/json",
      };
    } else {
      return {
        "Content-Type": "application/json",
        apikey: this.supabase.anonKey,
        Authorization: `Bearer ${this.supabase.anonKey}`,
      };
    }
  },
};

// Make config available globally
if (typeof window !== "undefined") {
  window.appConfig = config;
}
