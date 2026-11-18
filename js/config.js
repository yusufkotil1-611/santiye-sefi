/* Şantiye Şefi — bulut yapılandırması
   Bu iki değer boşsa uygulama bugüne kadarki gibi YALNIZCA bu cihazda çalışır (hesap/giriş/senkron yok).
   Doldurulunca giriş zorunlu olur ve veriler firmaya bağlı olarak buluta eşitlenir.

   Supabase panelinde: Project Settings → API
     supabaseUrl     = Project URL            (ör. https://abcdxyz.supabase.co)
     supabaseAnonKey = "anon" / "publishable" anahtar   (herkese açık olması NORMALDİR; güvenliği RLS sağlar)
   ASLA buraya "service_role" / "secret" anahtarını koymayın. */
window.SS_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  /* true: davetler Edge Function (invite-send) ile e-postayla gönderilir. Fonksiyonlar dağıtılıp e-posta sağlayıcısı (RESEND_API_KEY) ayarlanınca açın. */
  emailInvites: false,
  /* Hukuki sayfa adresleri (Faz 3'te site yayınlanınca doldurulur); boşsa metin bağlantısız görünür */
  termsUrl: '',
  privacyUrl: '',
};
