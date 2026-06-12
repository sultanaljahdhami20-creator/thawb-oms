import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gyezvlwqnmkxcuklgxxa.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8qMCf50pwtgtmbg3jSZgoQ_QX3qsOgQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
