// Supabase Edge Function for document search
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

    const { query, app_name } = await req.json();
    const appName = app_name || req.headers.get("X-App-Name") || "customer-service-coach";

    if (!query || query.trim() === "") {
      return new Response(
        JSON.stringify({ results: [], message: "Please enter a search term" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log("Search request received:", query, "for app:", appName);

    // Log the search
    await supabaseClient.from("search_logs").insert({ 
      query: query.trim(),
      app_name: appName
    });

    // Perform the search using custom lenient search logic
    const results = await searchDocuments(supabaseClient, query.toLowerCase().trim(), appName);

    // Log as unanswered if no results found
    if (results.length === 0) {
      console.log("Logging as unanswered question:", query);
      await supabaseClient.rpc("increment_unanswered_count", {
        p_question: query.trim(),
        p_agent: "unknown",
        p_app_name: appName,
      });
    }

    return new Response(
      JSON.stringify({
        results: results,
        query: query,
        total: results.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in search function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// Lenient search function matching the original server.js logic
async function searchDocuments(supabaseClient: any, query: string, appName: string) {
  // Minimal stop words - only filter truly meaningless words
  const stopWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
  ];

  // Extract and clean query words with LENIENT filtering
  const allWords = query
    .toLowerCase()
    .split(" ")
    .filter((word: string) => word.length > 2)
    .filter((word: string) => !stopWords.includes(word))
    .filter((word: string) => word.match(/^[a-zA-Z]+$/));

  console.log("Original query:", query);
  console.log("Search words:", allWords);

  if (allWords.length === 0) {
    console.log("No searchable words found");
    return [];
  }

  // Fetch all documents for this app
  const { data: documents, error } = await supabaseClient
    .from("documents")
    .select("*")
    .eq("app_name", appName);

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  const results: any[] = [];

  documents.forEach((doc: any) => {
    let score = 0;
    let matchedWords = 0;
    const docText =
      `${doc.title} ${doc.content} ${(doc.keywords || []).join(" ")}`.toLowerCase();

    // Check for phrase match first (boost scoring)
    const queryPhrase = allWords.join(" ");
    if (docText.includes(queryPhrase)) {
      score += 100; // Major boost for exact phrase
      matchedWords = allWords.length;
    }

    // Check each word individually with generous scoring
    allWords.forEach((word: string) => {
      let wordFound = false;

      // Title matches (very high value)
      if (doc.title.toLowerCase().includes(word)) {
        score += 20;
        wordFound = true;
      }

      // Keyword matches (high value)
      if (
        doc.keywords &&
        doc.keywords.some((k: string) => k.toLowerCase().includes(word))
      ) {
        score += 15;
        wordFound = true;
      }

      // Category matches (medium value)
      if (doc.category && doc.category.toLowerCase().includes(word)) {
        score += 10;
        wordFound = true;
      }

      // Content matches (lower value but still counts)
      const contentMatches = (
        doc.content.toLowerCase().match(new RegExp(word, "g")) || []
      ).length;
      if (contentMatches > 0) {
        score += Math.min(contentMatches * 3, 15);
        wordFound = true;
      }

      // Partial word matches (fuzzy matching)
      if (!wordFound && word.length > 4) {
        const partial = word.substring(0, word.length - 1);
        if (docText.includes(partial)) {
          score += 5;
          wordFound = true;
        }
      }

      if (wordFound) {
        matchedWords++;
      }
    });

    // LENIENT REQUIREMENTS
    const requiredMatches =
      allWords.length <= 2 ? 1 : Math.ceil(allWords.length * 0.4);
    const minimumScore = 8;

    console.log(
      `"${doc.title}": score=${score}, matched=${matchedWords}/${allWords.length}, required=${requiredMatches}`
    );

    if (matchedWords >= requiredMatches && score >= minimumScore) {
      results.push({
        ...doc,
        score,
        matchedWords,
        matchRatio: matchedWords / allWords.length,
      });
    }
  });

  console.log(`Found ${results.length} matching documents`);

  // Sort by score primarily, then by match ratio
  return results
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) > 10) {
        return b.score - a.score;
      }
      return b.matchRatio - a.matchRatio;
    })
    .slice(0, 5);
}
