import { createClient } from '@supabase/supabase-js'

    // 把你刚才复制的 URL 和 Key 填在这里
    const supabaseUrl = 'https://gfknrwoxaxfdxsuryzaq.supabase.co'
    const supabaseKey = 'sb_secret_DUxvPxKi3eWmAMHCYYlVIA_s7FSvxcA'

    export const supabase = createClient(supabaseUrl, supabaseKey)