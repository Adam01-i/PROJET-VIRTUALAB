import {createClient} from '@supabase/supabase-js';

export const supabase = createClient(
    "https://dviccoqpvhriwxruxjby.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWNjb3FwdmhyaXd4cnV4amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjU2ODYsImV4cCI6MjA2MDYwMTY4Nn0.ziHyNM3C5GiNQYqwrjCY7aHV8ACI-Wx_HwBwpwqagaI"
)