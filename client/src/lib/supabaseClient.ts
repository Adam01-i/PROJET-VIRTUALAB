import {createClient} from '@supabase/supabase-js';

export const supabase = createClient(
    "https://dviccoqpvhriwxruxjby.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWNjb3FwdmhyaXd4cnV4amJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTAyNTY4NiwiZXhwIjoyMDYwNjAxNjg2fQ.e-1OZ8OFnUbHMa2DptJWDGfEFTJ-JJS0I5NQI5JcGYw"
)