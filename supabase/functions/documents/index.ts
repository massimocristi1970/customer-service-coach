// Supabase Edge Function for document management
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter((p) => p);
    // Extract document ID if path is like /documents/{id}
    // The function name 'documents' should be in the path, so ID is after it
    const documentsIndex = pathParts.indexOf('documents');
    const documentId = documentsIndex >= 0 && pathParts.length > documentsIndex + 1 
      ? pathParts[documentsIndex + 1] 
      : null;

    // Get app_name from request header or body
    const appName = req.headers.get("X-App-Name") || "customer-service-coach";

    // GET all documents
    if (req.method === "GET" && !documentId) {
      const { data, error } = await supabaseClient
        .from("documents")
        .select("*")
        .eq("app_name", appName)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ documents: data || [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // POST - Create new document
    if (req.method === "POST") {
      const doc = await req.json();
      const docAppName = doc.app_name || appName;
      
      const newDoc = {
        app_name: docAppName,
        title: doc.title,
        content: doc.content,
        source: doc.source || null,
        section: doc.section || null,
        keywords: doc.keywords || [],
        category: doc.category || "general",
        last_updated: new Date().toISOString().split("T")[0],
      };

      const { data, error } = await supabaseClient
        .from("documents")
        .insert(newDoc)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, id: data.id }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // PUT - Update document
    if (req.method === "PUT" && documentId) {
      const updatedDoc = await req.json();
      
      const updateData = {
        title: updatedDoc.title,
        content: updatedDoc.content,
        source: updatedDoc.source,
        section: updatedDoc.section,
        keywords: updatedDoc.keywords,
        category: updatedDoc.category,
        last_updated: new Date().toISOString().split("T")[0],
      };

      const { error } = await supabaseClient
        .from("documents")
        .update(updateData)
        .eq("id", documentId)
        .eq("app_name", appName);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // DELETE - Delete document
    if (req.method === "DELETE" && documentId) {
      const { error } = await supabaseClient
        .from("documents")
        .delete()
        .eq("id", documentId)
        .eq("app_name", appName);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      }
    );
  } catch (error) {
    console.error("Error in documents function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
