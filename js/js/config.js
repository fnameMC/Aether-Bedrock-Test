// CONFIGURACIÓN GLOBAL DE SUPABASE
const SUPABASE_URL = "https://ckpaxfxohrcddxmsgsuh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hC1mHOXhTvhqzc4vy8QTgw_StFjxTXm";

// Instancia global del cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);