import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zhsxmmrlucdpsgtfqspz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoc3htbXJsdWNkcHNndGZxc3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDc2NDEsImV4cCI6MjA3Mzg4MzY0MX0.YyzfyCqomzAGS2PtJ9aHG-Uzr5rQKhjGxPatKo_M9qA";
const supabase = createClient(supabaseUrl, supabaseKey);

export const getSentiments = async () => {
  const { data, error } = await supabase
    .from("sentiment")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching latest entry:", error);
    return null;
  }

  return data;
};
