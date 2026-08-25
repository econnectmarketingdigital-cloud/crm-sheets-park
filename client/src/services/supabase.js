import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrsfqktxavdrjoduclma.supabase.co';
const supabaseKey = 'sb_publishable_zFl9mtztE0UMK2NS8MSPKw_wgKY2ASn';

export const supabase = createClient(supabaseUrl, supabaseKey);
