// Configuration for the Customer Service Coach application
// This file should be updated with your Supabase project details

const config = {
  // For local development with Express server (original setup)
  // Comment this out when using Supabase
  localMode: true,
  localApiUrl: "http://localhost:3000/api",

  // Application identifier for multi-app support
  // Each application sharing the same Supabase project should have a unique appName
  // This enables multiple independent applications in a single Supabase project
  appName: "customer-service-coach",

  // Supabase configuration
  // For Training Portal project, get these values from: https://app.supabase.com/project/_/settings/api
  // Multiple applications can share the same Training Portal project credentials
  supabase: {
    url: "https://tkjazdeyppsluhlpfgso.supabase.co", // e.g., https://xxxxx.supabase.co (Training Portal project URL)
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramF6ZGV5cHBzbHVobHBmZ3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjQwNDQsImV4cCI6MjA3NzE0MDA0NH0._6CSyddvL_hqifVPVeZklRN1fjSmo6Dpu_kPkc20du8", // Your Training Portal project anon key
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
        "X-App-Name": this.appName, // Send app identifier with each request
      };
    }
  },

  // Helper to inject app_name into request bodies for Supabase
  // This ensures data isolation when multiple apps share the same Supabase project
  getRequestBody(data) {
    if (this.localMode) {
      return data;
    } else {
      // Inject app_name into the request body for Supabase filtering
      return {
        ...data,
        app_name: this.appName,
      };
    }
  },
};

// Make config available globally
if (typeof window !== "undefined") {
  window.appConfig = config;
}
