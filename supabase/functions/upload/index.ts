// Supabase Edge Function for file upload
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file uploaded" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const fileName = file.name;
    let extractedText = "";

    // Process based on file type
    if (file.type === "application/pdf") {
      // For PDF, you'll need to use a PDF parsing library
      // For now, return an error message suggesting manual upload
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "PDF processing requires additional setup. Please extract text manually and add as a document.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    } else if (file.type === "text/plain") {
      // Process TXT
      extractedText = await file.text();
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unsupported file type. Please use TXT files.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Extract keywords
    const keywords = extractKeywords(extractedText);

    // Create document entry
    const newDoc = {
      title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
      content: extractedText.trim(),
      source: fileName,
      section: "Uploaded Document",
      keywords: keywords,
      category: "general",
      last_updated: new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseClient
      .from("documents")
      .insert(newDoc)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        title: data.title,
        contentLength: extractedText.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing upload:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// Extract keywords from text
function extractKeywords(text: string): string[] {
  const commonWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "shall",
    "this",
    "that",
    "these",
    "those",
    "a",
    "an",
  ];

  const wordCount: { [key: string]: number } = {};
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !commonWords.includes(word));

  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Get most frequent words
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
