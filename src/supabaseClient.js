// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://irfftosjoonaziqvvjos.supabase.co";  // 🔁 Replace this
const SUPABASE_ANON = "sb_publishable_F5XOWi7VBPDVnIwPjOqs9Q_DkXZjzkY";                        // 🔁 Replace this

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);