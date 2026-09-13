# ANKA-ASI

10 uzmanlik yonunden olusan, ucretsiz AI API'lerini birlestiren cok-ajanli platform.

## Modüller

| Modül | Rol |
|---|---|
| Architect Mode | Yazılımcı |
| Visionary & Strategist | CEO |
| Guardian | Siber Güvenlik |
| Engine Room | Sistem Mühendisi |
| Insight Engine | Veri Analisti |
| Designer | Estetik Uzman |
| Hukuk Danışmanı | Genel hukuki bilgilendirme |
| Mali Müşavir | Genel mali bilgilendirme |
| CTO | Teknoloji stratejisi |
| Orkestratör | Hangi modülün devreye gireceğine karar verir |

## Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasini ac, elindeki 5 API key'i ilgili satirlara yapistir
npm start
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Mimari

```
Kullanıcı sorusu
      │
      ▼
 Orkestratör (hangi uzman(lar) gerekli?)
      │
      ├──► Architect ──► [Groq → OpenRouter → NVIDIA] (fallback sırası)
      ├──► CEO        ──► [Google → OpenRouter]
      ├──► Guardian    ──► [NVIDIA → Groq]
      └──► ... (diğer modüller)
```

Her modülün kendi `providerOrder` listesi var (`src/agents/definitions.js`).
Bir sağlayıcı hata verirse veya kota dolarsa, otomatik olarak listedeki
bir sonraki sağlayıcıya geçilir (`src/core/providers.js`).

## ÖNEMLİ - Sınırlamalar

- Bu sistem **ücretsiz API kotalarına** bağlıdır. Gerçek/yoğun kullanımda
  (çok sayıda kullanıcı, kurumsal trafik) kotalar hızla dolar.
- Hukuk Danışmanı ve Mali Müşavir modülleri **gerçek lisanslı danışmanların
  yerini tutmaz** — sadece genel bilgilendirme amaçlıdır.
- `.env` dosyasını asla GitHub'a yükleme (`.gitignore` içinde zaten hariç
  tutuluyor).
- Guardian modülü sadece savunma/analiz amaçlıdır, saldırı kodu üretmez.

## Yol Haritası

- [ ] Kullanıcı kimlik doğrulama
- [ ] Konuşma geçmişi / hafıza
- [ ] RAG (hukuk/mali modüller için güncel mevzuat veritabanı)
- [ ] Kota izleme ve otomatik uyarı sistemi
- [ ] Docker ile deploy
