import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
  );
}

// Initialize Supabase client with service role key
// Service role bypasses RLS for backend operations
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database type definitions
export interface Question {
  id: string;
  domain: number;
  q_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation: string;
  created_at: string;
}

export interface Response {
  id: string;
  user_id: string;
  question_id: string;
  selected_choice: string;
  correct: boolean;
  created_at: string;
}

// Helper function to check database connection with timeout
export async function checkConnection(): Promise<boolean> {
  const CONNECTION_TIMEOUT = 10000; // 10 seconds

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection timeout after ${CONNECTION_TIMEOUT}ms`));
      }, CONNECTION_TIMEOUT);
    });

    // Create the connection check promise
    const connectionPromise = (async () => {
      const { error } = await supabase.from('questions').select('count').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
        return false;
      }
      return true;
    })();

    // Race between connection and timeout
    return await Promise.race([connectionPromise, timeoutPromise]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Failed to connect to Supabase:', errorMessage);
    
    // Provide helpful error messages
    if (errorMessage.includes('timeout')) {
      console.error('💡 Tip: Check your network connection and Supabase URL');
    } else if (errorMessage.includes('JWT') || errorMessage.includes('Invalid API key')) {
      console.error('💡 Tip: Verify your SUPABASE_SERVICE_KEY is correct');
    }
    
    return false;
  }
}
