/* IntelByte how.html InfoSec guide i18n */
window.INTEL_HOW_I18N = {
  en: {
    code: "EN",
    ui: {
      back: "Back",
      defense_metrics: "DEFENSE METRICS",
      hero_pre: "Securing Your ",
      hero_em: "Footprint",
      hero_desc: "A streamlined blueprint for personal information security. Operational guidelines to establish robust defenses and clean trace patterns.",
      meta_vectors: "15 VECTORS",
      meta_opsec: "OPSEC READY",
      meta_live: "LIVE GUIDE",
      vectors_title: "VECTORS",
      badge_core: "CORE",
      badge_crit: "CRIT",
      qs_start: "Start here",
      qs_core: "Core",
      content_head: "<em>FIELD MANUAL</em> // OPERATIONAL PROTOCOLS",
      footer_warn: "[!] TRUST NO ONE &nbsp;|&nbsp; VERIFY EVERYTHING &nbsp;|&nbsp; ASSUME COMPROMISE [!]",
      footer_sig: "INTELBYTE Knowledge Base",
      btt_label: "Back to top"
    },
    toc: {
      identity: "Identity & Privacy",
      passwords: "Passwords & Auth",
      "2fa": "Two-Factor Auth",
      email: "Email Security",
      messaging: "Messaging Apps",
      links: "Links & Downloads",
      browser: "Browser Privacy",
      vpn: "VPN & Network",
      fingerprint: "Fingerprinting",
      device: "Device Security",
      data: "Data & Backups",
      opsec: "OPSEC",
      incident: "Incident Response",
      ratted: "Ratted? What to Do?",
      attacks: "Common Attacks"
    },
    qs: {
      qs1_title: "Identity & Privacy",
      qs1_desc: "Hide emails, usernames, and your digital footprint.",
      qs2_title: "Passwords & Auth",
      qs2_desc: "Managers, unique passwords, zero reuse.",
      qs3_title: "Two-Factor Auth",
      qs3_desc: "TOTP, hardware keys, kill SMS 2FA."
    },
    sections: {
      identity: {
        title: "Identity & Privacy",
        sub: "EMAIL · USERNAMES · DIGITAL FOOTPRINT",
        steps: [
          {
            t: "Email Shielding",
            d: "Do not publish your primary email address. Utilize aliases or disposable forwards for forums, giveaways, and secondary registrations."
          },
          {
            t: "Namespace Separation",
            d: "Establish distinct usernames across separate platforms to deny cross-referencing capabilities to passive investigators."
          },
          {
            t: "Phone isolation",
            d: "Avoid binding your physical phone number to services. Silent contact syncing algorithms will link your profiles together. Use burner or virtual numbers for validation tasks."
          },
          {
            t: "Domain Privacy",
            d: "Enable WHOIS masking on registered domains. Public access returns owner name, contact emails, and physical location indexes."
          },
          {
            t: "Metadata Verification",
            d: "Examine photos for context leaks. Reflected surfaces, location indicators, and matching image hashes allow correlation across platforms."
          }
        ],
        infos: [
          "<strong>Data Brokers:</strong> Commercial aggregators collect and catalog personal metrics. Manual opt-out requests or automated tools like Incogni can significantly reduce your exposure index."
        ]
      },
      passwords: {
        title: "Passwords & Authentication",
        sub: "MANAGERS · GENERATION · BEST PRACTICES",
        steps: [
          {
            t: "Cryptographic Managers",
            d: "Deploy an audited password manager. <a href=\"https://bitwarden.com\" target=\"_blank\" rel=\"noopener\">Bitwarden</a> provides open-source transparency; <a href=\"https://keepass.info\" target=\"_blank\" rel=\"noopener\">KeePass</a> serves as an offline alternative."
          },
          {
            t: "Zero Password Reuse",
            d: "A single breach enables credential stuffing attacks across other portals. Generate randomized, unique strings for every application."
          },
          {
            t: "Diceware Entropy",
            d: "Establish master passphrases via physical dice and EFF word lists. Chains of 6+ words optimize human memory while maximizing defense against brute-forcing."
          }
        ],
        infos: [
          "Avoid standard password hints or patterns. Ensure your offline master password paper recovery is stored in a physically secure container."
        ]
      },
      "2fa": {
        title: "Two-Factor Authentication",
        sub: "TOTP · HARDWARE KEYS · RECOVERY",
        steps: [
          {
            t: "Multi-Factor Mandate",
            d: "Activate secondary authentication factors. SMS is prone to interception; utilize TOTP apps or physical security keys."
          },
          {
            t: "TOTP Applications",
            d: "Deploy <a href=\"https://getaegis.app\" target=\"_blank\" rel=\"noopener\">Aegis</a> or <a href=\"https://ente.io/auth\" target=\"_blank\" rel=\"noopener\">Ente Auth</a>. Backup structural configurations locally and encrypt database exports."
          },
          {
            t: "FIDO2 Hardening",
            d: "Deploy hardware keys like <a href=\"https://www.yubico.com\" target=\"_blank\" rel=\"noopener\">YubiKey</a> where possible. The cryptographic validation binding prevents authentication on spoofed domains."
          }
        ],
        infos: [
          "<strong>SIM Swapping:</strong> Hackers spoof cellular authorization to clone your identity. Bind carrier lines with custom account PINs to prevent number migration."
        ]
      },
      email: {
        title: "Email Security",
        sub: "PHISHING · ALIASES · TRACKING PIXELS",
        steps: [
          {
            t: "Encrypted Hosting",
            d: "Migrate critical vectors to privacy-focused servers such as <a href=\"https://proton.me/mail\" target=\"_blank\" rel=\"noopener\">ProtonMail</a>."
          },
          {
            t: "Tracking Pixel Suppression",
            d: "Configure client rules to block auto-rendering of images. Hidden tracking elements log IP addresses, opening timestamps, and browser configurations."
          },
          {
            t: "Masking Services",
            d: "Generate unique email aliases for third-party configurations, preventing your primary address from leaking during corporate database breaches."
          }
        ]
      },
      messaging: {
        title: "Messaging Apps",
        sub: "ENCRYPTION · TRUST · HARDENING",
        steps: [
          {
            t: "Trust Architectures",
            d: "Mainstream chat architectures log metadata. Utilize <a href=\"https://simplex.chat\" target=\"_blank\" rel=\"noopener\">SimpleX</a> or <a href=\"https://getsession.org\" target=\"_blank\" rel=\"noopener\">Session</a> to decouple chat streams from personal markers."
          },
          {
            t: "Self-Destruct Timers",
            d: "Activate vanishing message parameters. Local data caches on foreign endpoints are a constant security exposure."
          },
          {
            t: "Media Hardening",
            d: "Turn off automatic file downloads. Malicious payloads within media containers can initiate remote execution scripts."
          }
        ]
      },
      links: {
        title: "Links, Files & Downloads",
        sub: "EXECUTABLES · SCANNING · VERIFICATION",
        steps: [
          {
            t: "Masked Extensions",
            d: "Force operating system parameters to reveal all extensions. Malicious archives frequently double-format targets (e.g. <code>report.pdf.exe</code>)."
          },
          {
            t: "Multi-Engine Verification",
            d: "Scan downloaded scripts or binaries across various platforms like VirusTotal and Hybrid Analysis prior to execution."
          },
          {
            t: "Active Scripts",
            d: "Avoid executing raw command lines or scripts copied from forums without verifying what each parameter does."
          }
        ]
      },
      browser: {
        title: "Browser Privacy",
        sub: "EXTENSIONS · COOKIES · SEARCH ENGINES",
        steps: [
          {
            t: "Privacy Engines",
            d: "Deploy <a href=\"https://brave.com\" target=\"_blank\" rel=\"noopener\">Brave</a> or <a href=\"https://www.mozilla.org/firefox/\" target=\"_blank\" rel=\"noopener\">Firefox</a>. Integrate uBlock Origin to scrub tracking codes."
          },
          {
            t: "Compartmentalization",
            d: "Segregate profiles for personal identity vs anonymous navigation. Never merge credentials across these boundaries."
          },
          {
            t: "Tracking Protection",
            d: "Block third-party tracking scripts. Configure settings to isolate cookies to their host domains."
          }
        ]
      },
      vpn: {
        title: "VPN & Network Privacy",
        sub: "MULLVAD · DNS · WEBRTC LEAKS",
        steps: [
          {
            t: "Zero-Logs Encapsulation",
            d: "Route connections through <a href=\"https://mullvad.net\" target=\"_blank\" rel=\"noopener\">Mullvad</a>. Use WireGuard protocols to minimize footprint."
          },
          {
            t: "WebRTC Leaks",
            d: "Turn off WebRTC protocols in your browser settings. WebRTC leaks real local interfaces past active VPN boundaries."
          },
          {
            t: "Encrypted Domain Queries",
            d: "Deploy encrypted DNS queries (DNS over HTTPS). Standard DNS lookups leak site addresses to your service provider in plaintext."
          }
        ]
      },
      fingerprint: {
        title: "Browser Fingerprinting",
        sub: "CANVAS · WEBGL · BLENDING IN",
        steps: [
          {
            t: "Anonymity Pools",
            d: "Do not randomize fingerprint fields manually. Your browser must blend in with thousands of other targets to avoid detection."
          },
          {
            t: "Isolation Tools",
            d: "Deploy Mullvad Browser or Tor Browser. These standard configurations use strict canvas and window letterboxing protections by default."
          },
          {
            t: "Profile Testing",
            d: "Validate your browser configuration parameters using tools like Cover Your Tracks. Aim for randomized or shared characteristics."
          }
        ]
      },
      device: {
        title: "Device & System Security",
        sub: "ENCRYPTION · ANTIMALWARE · UPDATES",
        steps: [
          {
            t: "Cryptographic Volumes",
            d: "Activate full-disk encryption. Deploy <a href=\"https://www.veracrypt.fr\" target=\"_blank\" rel=\"noopener\">VeraCrypt</a> or system-level encryption protocols to protect data from physical tampering."
          },
          {
            t: "Endpoint Safeguards",
            d: "Configure baseline security updates. Run processes from restricted accounts instead of administrator profiles."
          },
          {
            t: "Physical Interface Locks",
            d: "Do not connect unknown USB drives. Disable auto-run properties, cover physical cameras, and avoid using untrusted charging interfaces."
          }
        ]
      },
      data: {
        title: "Data, Backups & Transfers",
        sub: "3-2-1-1 RULE · METADATA · CLOUD",
        steps: [
          {
            t: "EXIF Removal",
            d: "Strip EXIF parameters from photos and files before sharing. EXIF tags contain GPS lookups, camera models, and timestamps."
          },
          {
            t: "3-2-1-1 Backup Plan",
            d: "Store 3 copies of your data on 2 separate media formats, keep 1 off-site, and maintain 1 air-gapped copy fully disconnected from all network interfaces."
          },
          {
            t: "Client Encryption",
            d: "Encrypt sensitive assets before uploading them to cloud interfaces. Storage providers should only ever store your ciphertext."
          }
        ]
      },
      opsec: {
        title: "OPSEC & Mindset",
        sub: "PERSONAS · PATTERNS · AI EXPOSURE",
        steps: [
          {
            t: "Separation of Personas",
            d: "Never link anonymous identities to your real name. Once linked, browser cookies or network histories can compromise all personas."
          },
          {
            t: "Writing Style & Timezones",
            d: "Be mindful of typing patterns and consistent timezone activity. Stylometry engines can fingerprint writing styles and link accounts."
          },
          {
            t: "AI Input Shielding",
            d: "Do not input sensitive code, documents, or keys into public AI portals. Your data is stored on remote servers for model updates."
          }
        ]
      },
      incident: {
        title: "Incident Response",
        sub: "COMPROMISED? DO THIS NOW",
        steps: [
          {
            t: "Immediate Network Disconnection",
            d: "Disconnect the network interface immediately. Remove ethernet cabling, and disable WiFi/Bluetooth hardware."
          },
          {
            t: "Session Isolation",
            d: "Do not log into sensitive portals from a compromised device. Use a clean, isolated node to rotate credentials and revoke active sessions."
          },
          {
            t: "Zero-Trust Wipe",
            d: "A compromised device cannot be trusted. If infected, wipe all partition tables completely and reinstall the operating system."
          }
        ]
      },
      ratted: {
        title: "Ratted? What to Do?",
        sub: "RAT · STEALERS · FULL RECOVERY",
        steps: [
          {
            t: "Kill the Connection",
            d: "Pull ethernet, disable Wi‑Fi and Bluetooth, and unplug the machine if you can. A live RAT can exfiltrate keystrokes, screenshots, and clipboard data in real time."
          },
          {
            t: "Do Not “Fix It” on the Same PC",
            d: "Do not log into email, Discord, banks, or crypto wallets from the infected device. Assume every password you type is captured. Use a clean phone or another computer for recovery."
          },
          {
            t: "Revoke Sessions First",
            d: "From a clean device, sign out of all sessions on Discord, Google, Microsoft, and any exchange or wallet. Rotate passwords starting with email. It is the recovery key for everything else."
          },
          {
            t: "Check What Was Stolen",
            d: "Review saved browser passwords, autofill, crypto extensions, and 2FA backup codes stored locally. Token grabbers often harvest Discord tokens, cookies, and wallet seed phrases in one pass."
          },
          {
            t: "Assume Persistence",
            d: "RATs hide in startup entries, scheduled tasks, services, and AppData folders. Deleting one file rarely removes the infection. Treat the whole install as compromised."
          },
          {
            t: "Wipe and Reinstall",
            d: "Back up only personal files you can verify (photos, documents, not executables). Format the drive, reinstall Windows from official media, and patch before restoring data."
          }
        ],
        infos: [
          "<strong>After recovery:</strong> Enable hardware or app-based 2FA everywhere, use a password manager on the clean system, and never run cracked games, “free Nitro” tools, or unknown <code>.exe</code> files again. That is how most RATs land.",
          "<strong>Warning signs:</strong> Mouse moving alone, webcam LED flicker, unknown processes in Task Manager, new startup programs, friends getting scam DMs from your account, or wallets draining without your action."
        ]
      },
      attacks: {
        title: "Common Cyber Attacks",
        sub: "KNOW WHAT YOU'RE UP AGAINST",
        attacks: [
          {
            t: "Ransomware",
            d: "Encrypts your local files and demands payment to restore access keys."
          },
          {
            t: "Phishing",
            d: "Socially engineered targets designed to capture credentials via spoofed portals."
          },
          {
            t: "DDoS",
            d: "Flooding network targets with traffic to degrade infrastructure performance."
          },
          {
            t: "MITM",
            d: "Intercepting communication streams between target interfaces to extract data."
          },
          {
            t: "SQL Injection",
            d: "Injecting backend queries into active variables to extract server records."
          },
          {
            t: "Zero-Day",
            d: "Targeting unpatched security bugs before updates become available."
          }
        ]
      }
    }
  },
  tr: {
    code: "TR",
    ui: {
      back: "Geri",
      defense_metrics: "SAVUNMA METRİKLERİ",
      hero_pre: "Dijital ",
      hero_em: "İzinizi Güvenceye Alın",
      hero_desc: "Kişisel bilgi güvenliği için sade bir yol haritası. Sağlam savunmalar kurmak ve iz kalıplarını temizlemek için operasyonel yönergeler.",
      meta_vectors: "15 VEKTÖR",
      meta_opsec: "OPSEC HAZIR",
      meta_live: "CANLI REHBER",
      vectors_title: "VEKTÖRLER",
      badge_core: "TEMEL",
      badge_crit: "KRİT",
      qs_start: "Buradan başla",
      qs_core: "Temel",
      content_head: "<em>SAHA KILAVUZU</em> // OPERASYONEL PROTOKOLLER",
      footer_warn: "[!] KİMSEYE GÜVENME &nbsp;|&nbsp; HER ŞEYİ DOĞRULA &nbsp;|&nbsp; ELE GEÇİRİLMİŞ SAY [!]",
      footer_sig: "INTELBYTE Bilgi Bankası",
      btt_label: "Yukarı dön"
    },
    toc: {
      identity: "Kimlik ve Gizlilik",
      passwords: "Şifreler ve Kimlik Doğrulama",
      "2fa": "İki Faktörlü Doğrulama",
      email: "E-posta Güvenliği",
      messaging: "Mesajlaşma Uygulamaları",
      links: "Bağlantılar ve İndirmeler",
      browser: "Tarayıcı Gizliliği",
      vpn: "VPN ve Ağ",
      fingerprint: "Parmak İzi",
      device: "Cihaz Güvenliği",
      data: "Veri ve Yedekler",
      opsec: "OPSEC",
      incident: "Olay Müdahalesi",
      ratted: "RAT Bulaştı mı? Ne Yapmalı?",
      attacks: "Yaygın Saldırılar"
    },
    qs: {
      qs1_title: "Kimlik ve Gizlilik",
      qs1_desc: "E-postaları, kullanıcı adlarını ve dijital izinizi gizleyin.",
      qs2_title: "Şifreler ve Kimlik Doğrulama",
      qs2_desc: "Yöneticiler, benzersiz şifreler, sıfır yeniden kullanım.",
      qs3_title: "İki Faktörlü Doğrulama",
      qs3_desc: "TOTP, donanım anahtarları, SMS 2FA'yı kapatın."
    },
    sections: {
      identity: {
        title: "Kimlik ve Gizlilik",
        sub: "E-POSTA · KULLANICI ADLARI · DİJİTAL İZ",
        steps: [
          {
            t: "E-posta Koruması",
            d: "Birincil e-posta adresinizi yayınlamayın. Forumlar, çekilişler ve ikincil kayıtlar için takma adlar veya tek kullanımlık yönlendirmeler kullanın."
          },
          {
            t: "Ad Alanı Ayrımı",
            d: "Pasif araştırmacıların çapraz referans yapmasını engellemek için farklı platformlarda ayrı kullanıcı adları kullanın."
          },
          {
            t: "Telefon izolasyonu",
            d: "Fiziksel telefon numaranızı hizmetlere bağlamaktan kaçının. Sessiz kişi senkronizasyonu profillerinizi birbirine bağlar. Doğrulama için sanal veya geçici numaralar kullanın."
          },
          {
            t: "Alan Adı Gizliliği",
            d: "Kayıtlı alan adlarında WHOIS maskelemesini etkinleştirin. Herkese açık erişim sahip adı, iletişim e-postalarını ve fiziksel konum bilgilerini döndürür."
          },
          {
            t: "Meta Veri Doğrulama",
            d: "Fotoğraflarda bağlam sızıntılarını inceleyin. Yansımalar, konum göstergeleri ve eşleşen görsel hash'leri platformlar arası ilişkilendirmeye izin verir."
          }
        ],
        infos: [
          "<strong>Veri Brokerları:</strong> Ticari toplayıcılar kişisel metrikleri toplar ve kataloglar. Manuel opt-out veya Incogni gibi araçlar maruziyet endeksini önemli ölçüde azaltabilir."
        ]
      },
      passwords: {
        title: "Şifreler ve Kimlik Doğrulama",
        sub: "YÖNETİCİLER · ÜRETİM · EN İYİ UYGULAMALAR",
        steps: [
          {
            t: "Kriptografik Yöneticiler",
            d: "Denetlenmiş bir şifre yöneticisi kullanın. <a href=\"https://bitwarden.com\" target=\"_blank\" rel=\"noopener\">Bitwarden</a> açık kaynak şeffaflığı sunar; <a href=\"https://keepass.info\" target=\"_blank\" rel=\"noopener\">KeePass</a> çevrimdışı alternatiftir."
          },
          {
            t: "Sıfır Şifre Yeniden Kullanımı",
            d: "Tek bir ihlal, diğer portallarda kimlik bilgisi doldurma saldırılarına yol açar. Her uygulama için rastgele, benzersiz dizeler üretin."
          },
          {
            t: "Diceware Entropisi",
            d: "Fiziksel zar ve EFF kelime listeleriyle ana parolalar oluşturun. 6+ kelimelik zincirler hafızayı optimize ederken kaba kuvvete karşı savunmayı artırır."
          }
        ],
        infos: [
          "Standart şifre ipuçları veya kalıplarından kaçının. Çevrimdışı ana parola kağıt yedeğini fiziksel olarak güvenli bir yerde saklayın."
        ]
      },
      "2fa": {
        title: "İki Faktörlü Kimlik Doğrulama",
        sub: "TOTP · DONANIM ANAHTARLARI · KURTARMA",
        steps: [
          {
            t: "Çok Faktörlü Zorunluluk",
            d: "İkincil kimlik doğrulama faktörlerini etkinleştirin. SMS yakalanmaya açıktır; TOTP uygulamaları veya fiziksel güvenlik anahtarları kullanın."
          },
          {
            t: "TOTP Uygulamaları",
            d: "<a href=\"https://getaegis.app\" target=\"_blank\" rel=\"noopener\">Aegis</a> veya <a href=\"https://ente.io/auth\" target=\"_blank\" rel=\"noopener\">Ente Auth</a> kullanın. Yapılandırmaları yerel yedekleyin ve veritabanı dışa aktarımlarını şifreleyin."
          },
          {
            t: "FIDO2 Sertleştirme",
            d: "Mümkün olduğunda <a href=\"https://www.yubico.com\" target=\"_blank\" rel=\"noopener\">YubiKey</a> gibi donanım anahtarları kullanın. Kriptografik doğrulama, sahte alan adlarında kimlik doğrulamayı engeller."
          }
        ],
        infos: [
          "<strong>SIM Değişimi:</strong> Saldırganlar hücresel yetkilendirmeyi taklit ederek kimliğinizi klonlar. Numara taşımayı önlemek için operatör hatlarına özel PIN bağlayın."
        ]
      },
      email: {
        title: "E-posta Güvenliği",
        sub: "OLTALAMA · TAKMA ADLAR · İZLEME PİKSELİ",
        steps: [
          {
            t: "Şifreli Barındırma",
            d: "Kritik vektörleri <a href=\"https://proton.me/mail\" target=\"_blank\" rel=\"noopener\">ProtonMail</a> gibi gizlilik odaklı sunuculara taşıyın."
          },
          {
            t: "İzleme Pikseli Bastırma",
            d: "Görsellerin otomatik yüklenmesini engelleyen kurallar yapılandırın. Gizli izleme öğeleri IP, açılış zamanı ve tarayıcı yapılandırmasını kaydeder."
          },
          {
            t: "Maskeleme Hizmetleri",
            d: "Üçüncü taraf kayıtlar için benzersiz e-posta takma adları oluşturun; birincil adresiniz kurumsal veri ihlallerinde sızmasın."
          }
        ]
      },
      messaging: {
        title: "Mesajlaşma Uygulamaları",
        sub: "ŞİFRELEME · GÜVEN · SERTLEŞTİRME",
        steps: [
          {
            t: "Güven Mimarileri",
            d: "Ana akım sohbet uygulamaları meta veri kaydeder. Kişisel işaretlerden sohbet akışlarını ayırmak için <a href=\"https://simplex.chat\" target=\"_blank\" rel=\"noopener\">SimpleX</a> veya <a href=\"https://getsession.org\" target=\"_blank\" rel=\"noopener\">Session</a> kullanın."
          },
          {
            t: "Kendini İmha Zamanlayıcıları",
            d: "Kaybolan mesaj parametrelerini etkinleştirin. Uzak uçlardaki yerel önbellekler sürekli bir güvenlik riskidir."
          },
          {
            t: "Medya Sertleştirme",
            d: "Otomatik dosya indirmeyi kapatın. Medya kapsayıcılarındaki kötü amaçlı yükler uzaktan çalıştırma betiklerini başlatabilir."
          }
        ]
      },
      links: {
        title: "Bağlantılar, Dosyalar ve İndirmeler",
        sub: "ÇALIŞTIRILABİLİR · TARAMA · DOĞRULAMA",
        steps: [
          {
            t: "Maskelenmiş Uzantılar",
            d: "İşletim sisteminde tüm uzantıların görünmesini zorunlu kılın. Kötü amaçlı arşivler sık sık çift biçimlendirme kullanır (ör. <code>report.pdf.exe</code>)."
          },
          {
            t: "Çok Motorlu Doğrulama",
            d: "İndirilen betik veya ikili dosyaları çalıştırmadan önce VirusTotal ve Hybrid Analysis gibi platformlarda tarayın."
          },
          {
            t: "Aktif Betikler",
            d: "Forumdan kopyalanan ham komut satırlarını veya betikleri her parametrenin ne yaptığını doğrulamadan çalıştırmayın."
          }
        ]
      },
      browser: {
        title: "Tarayıcı Gizliliği",
        sub: "EKLENTİLER · ÇEREZLER · ARAMA MOTORLARI",
        steps: [
          {
            t: "Gizlilik Motorları",
            d: "<a href=\"https://brave.com\" target=\"_blank\" rel=\"noopener\">Brave</a> veya <a href=\"https://www.mozilla.org/firefox/\" target=\"_blank\" rel=\"noopener\">Firefox</a> kullanın. İzleme kodlarını temizlemek için uBlock Origin ekleyin."
          },
          {
            t: "Bölümlendirme",
            d: "Kişisel kimlik ile anonim gezinme için ayrı profiller kullanın. Kimlik bilgilerini bu sınırlar arasında birleştirmeyin."
          },
          {
            t: "İzleme Koruması",
            d: "Üçüncü taraf izleme betiklerini engelleyin. Çerezleri yalnızca kendi alan adlarında tutacak şekilde yapılandırın."
          }
        ]
      },
      vpn: {
        title: "VPN ve Ağ Gizliliği",
        sub: "MULLVAD · DNS · WEBRTC SIZINTISI",
        steps: [
          {
            t: "Sıfır Log Kapsülleme",
            d: "Bağlantıları <a href=\"https://mullvad.net\" target=\"_blank\" rel=\"noopener\">Mullvad</a> üzerinden yönlendirin. İzi en aza indirmek için WireGuard protokollerini kullanın."
          },
          {
            t: "WebRTC Sızıntıları",
            d: "Tarayıcı ayarlarında WebRTC protokollerini kapatın. WebRTC, aktif VPN sınırlarının ötesinde gerçek yerel arayüzleri sızdırır."
          },
          {
            t: "Şifreli Alan Sorguları",
            d: "Şifreli DNS (DNS over HTTPS) kullanın. Standart DNS sorguları site adreslerini sağlayıcınıza düz metin olarak sızdırır."
          }
        ]
      },
      fingerprint: {
        title: "Tarayıcı Parmak İzi",
        sub: "CANVAS · WEBGL · KALABALIKTA KAYBOLMA",
        steps: [
          {
            t: "Anonimlik Havuzları",
            d: "Parmak izi alanlarını elle rastgeleleştirmeyin. Tarayıcınız binlerce hedefle uyumlu olmalıdır."
          },
          {
            t: "İzolasyon Araçları",
            d: "Mullvad Browser veya Tor Browser kullanın. Bu yapılandırmalar varsayılan olarak sıkı canvas ve letterboxing koruması sağlar."
          },
          {
            t: "Profil Testi",
            d: "Cover Your Tracks gibi araçlarla tarayıcı yapılandırmanızı doğrulayın. Rastgele veya paylaşılan özellikler hedefleyin."
          }
        ]
      },
      device: {
        title: "Cihaz ve Sistem Güvenliği",
        sub: "ŞİFRELEME · KÖTÜ AMAÇLI YAZILIM · GÜNCELLEMELER",
        steps: [
          {
            t: "Kriptografik Birimler",
            d: "Tam disk şifrelemesini etkinleştirin. Fiziksel müdahaleye karşı <a href=\"https://www.veracrypt.fr\" target=\"_blank\" rel=\"noopener\">VeraCrypt</a> veya sistem düzeyi şifreleme kullanın."
          },
          {
            t: "Uç Nokta Korumaları",
            d: "Temel güvenlik güncellemelerini yapılandırın. İşlemleri yönetici profilleri yerine kısıtlı hesaplardan çalıştırın."
          },
          {
            t: "Fiziksel Arayüz Kilitleri",
            d: "Bilinmeyen USB sürücüleri takmayın. Otomatik çalıştırmayı kapatın, kameraları kapatın, güvenilmeyen şarj noktalarından kaçının."
          }
        ]
      },
      data: {
        title: "Veri, Yedekler ve Aktarım",
        sub: "3-2-1-1 KURALI · META VERİ · BULUT",
        steps: [
          {
            t: "EXIF Kaldırma",
            d: "Paylaşmadan önce fotoğraf ve dosyalardan EXIF parametrelerini temizleyin. EXIF etiketleri GPS, kamera modeli ve zaman damgası içerir."
          },
          {
            t: "3-2-1-1 Yedek Planı",
            d: "Verinizin 3 kopyasını 2 ayrı ortamda tutun, 1'ini uzak konumda saklayın ve 1 hava boşluklu kopyayı tüm ağlardan ayırın."
          },
          {
            t: "İstemci Şifreleme",
            d: "Hassas varlıkları buluta yüklemeden önce şifreleyin. Sağlayıcılar yalnızca şifreli metninizi saklamalıdır."
          }
        ]
      },
      opsec: {
        title: "OPSEC ve Zihniyet",
        sub: "KİMLİKLER · KALIPLAR · YAPAY ZEKA MARUZİYETİ",
        steps: [
          {
            t: "Kimlik Ayrımı",
            d: "Anonim kimlikleri gerçek adınıza bağlamayın. Bağlandıktan sonra çerezler veya ağ geçmişi tüm kimlikleri tehlikeye atabilir."
          },
          {
            t: "Yazım Stili ve Saat Dilimleri",
            d: "Yazım kalıplarına ve tutarlı saat dilimi etkinliğine dikkat edin. Stilometri motorları hesapları ilişkilendirebilir."
          },
          {
            t: "YZ Girdi Koruması",
            d: "Hassas kod, belge veya anahtarları herkese açık YZ portallarına girmeyin. Verileriniz model güncellemeleri için uzak sunucularda saklanır."
          }
        ]
      },
      incident: {
        title: "Olay Müdahalesi",
        sub: "ELE GEÇİRİLDİ Mİ? HEMEN YAPIN",
        steps: [
          {
            t: "Anında Ağ Kesintisi",
            d: "Ağ arayüzünü hemen kesin. ethernet kablosunu çıkarın, WiFi/Bluetooth donanımını devre dışı bırakın."
          },
          {
            t: "Oturum İzolasyonu",
            d: "Ele geçirilmiş cihazdan hassas portallara giriş yapmayın. Temiz, izole bir düğümden kimlik bilgilerini döndürün ve oturumları iptal edin."
          },
          {
            t: "Sıfır Güven Silme",
            d: "Ele geçirilmiş cihaza güvenilmez. Enfekte ise tüm bölüm tablolarını silin ve işletim sistemini yeniden kurun."
          }
        ]
      },
      ratted: {
        title: "RAT Bulaştı mı? Ne Yapmalı?",
        sub: "RAT · ÇALAN YAZILIM · TAM KURTARMA",
        steps: [
          {
            t: "Bağlantıyı Kesin",
            d: "Ethernet'i çekin, Wi‑Fi ve Bluetooth'u kapatın, mümkünse makineyi fişten çekin. Canlı bir RAT tuş vuruşlarını, ekran görüntülerini ve panoyu gerçek zamanlı sızdırabilir."
          },
          {
            t: "Aynı PC'de “Düzeltmeyin”",
            d: "Enfekte cihazdan e-posta, Discord, banka veya kripto cüzdanlarına giriş yapmayın. Yazdığınız her şifrenin kaydedildiğini varsayın. Kurtarma için temiz telefon veya başka bilgisayar kullanın."
          },
          {
            t: "Önce Oturumları İptal Edin",
            d: "Temiz cihazdan Discord, Google, Microsoft ve tüm borsa/cüzdan oturumlarını kapatın. Şifreleri e-postadan başlayarak değiştirin. diğer her şeyin kurtarma anahtarıdır."
          },
          {
            t: "Ne Çalındığını Kontrol Edin",
            d: "Kayıtlı tarayıcı şifreleri, otomatik doldurma, kripto eklentileri ve yerel 2FA yedek kodlarını inceleyin. Token grabber'lar Discord token'larını, çerezleri ve seed ifadelerini tek seferde toplar."
          },
          {
            t: "Kalıcılığı Varsayın",
            d: "RAT'ler başlangıç girişleri, zamanlanmış görevler, hizmetler ve AppData klasörlerinde gizlenir. Tek dosya silmek nadiren yeterlidir. tüm kurulumu tehlikeli sayın."
          },
          {
            t: "Sil ve Yeniden Kur",
            d: "Yalnızca doğrulayabildiğiniz kişisel dosyaları yedekleyin (fotoğraf, belge; çalıştırılabilir değil). Sürücüyü biçimlendirin, resmi medyadan Windows kurun, veriyi geri yüklemeden önce yamalayın."
          }
        ],
        infos: [
          "<strong>Kurtarma sonrası:</strong> Her yerde donanım veya uygulama tabanlı 2FA açın, temiz sistemde şifre yöneticisi kullanın; korsan oyunlar, “ücretsiz Nitro” araçları veya bilinmeyen <code>.exe</code> dosyalarını bir daha çalıştırmayın. RAT'lerin çoğu böyle bulaşır.",
          "<strong>Uyarı işaretleri:</strong> Fare kendi kendine hareket, webcam LED'i, Task Manager'da bilinmeyen süreçler, yeni başlangıç programları, hesabınızdan dolandırıcılık DM'leri veya cüzdan boşalması."
        ]
      },
      attacks: {
        title: "Yaygın Siber Saldırılar",
        sub: "NEYLE KARŞILAŞTIĞINIZI BİLİN",
        attacks: [
          {
            t: "Fidye Yazılımı",
            d: "Yerel dosyalarınızı şifreler ve erişim anahtarları için ödeme talep eder."
          },
          {
            t: "Oltalama",
            d: "Sahte portallar üzerinden kimlik bilgisi yakalamak için tasarlanmış sosyal mühendislik hedefleri."
          },
          {
            t: "DDoS",
            d: "Altyapı performansını düşürmek için ağ hedeflerini trafikle boğma."
          },
          {
            t: "MITM",
            d: "Hedef arayüzler arasındaki iletişim akışlarını keserek veri çıkarma."
          },
          {
            t: "SQL Enjeksiyonu",
            d: "Sunucu kayıtlarını çıkarmak için aktif değişkenlere arka uç sorguları enjekte etme."
          },
          {
            t: "Sıfır Gün",
            d: "Güncellemeler çıkmadan önce yamalanmamış güvenlik açıklarını hedefleme."
          }
        ]
      }
    }
  },
  ru: {
    code: "RU",
    ui: {
      back: "Назад",
      defense_metrics: "МЕТРИКИ ЗАЩИТЫ",
      hero_pre: "Защита вашего ",
      hero_em: "цифрового следа",
      hero_desc: "Сжатая схема личной информационной безопасности. Операционные рекомендации для надёжной защиты и чистых следов.",
      meta_vectors: "15 ВЕКТОРОВ",
      meta_opsec: "OPSEC ГОТОВ",
      meta_live: "ЖИВОЙ ГАЙД",
      vectors_title: "ВЕКТОРЫ",
      badge_core: "БАЗА",
      badge_crit: "КРИТ",
      qs_start: "Начните здесь",
      qs_core: "База",
      content_head: "<em>ПОЛЕВОЕ РУКОВОДСТВО</em> // ОПЕРАЦИОННЫЕ ПРОТОКОЛЫ",
      footer_warn: "[!] НИКОМУ НЕ ДОВЕРЯЙ &nbsp;|&nbsp; ВСЁ ПРОВЕРЯЙ &nbsp;|&nbsp; СЧИТАЙ СИСТЕМУ СКОМПРОМЕТИРОВАННОЙ [!]",
      footer_sig: "INTELBYTE База знаний",
      btt_label: "Наверх"
    },
    toc: {
      identity: "Личность и приватность",
      passwords: "Пароли и аутентификация",
      "2fa": "Двухфакторная аутентификация",
      email: "Безопасность почты",
      messaging: "Мессенджеры",
      links: "Ссылки и загрузки",
      browser: "Приватность браузера",
      vpn: "VPN и сеть",
      fingerprint: "Отпечаток браузера",
      device: "Безопасность устройства",
      data: "Данные и резервные копии",
      opsec: "OPSEC",
      incident: "Реагирование на инциденты",
      ratted: "RAT? Что делать?",
      attacks: "Распространённые атаки"
    },
    qs: {
      qs1_title: "Личность и приватность",
      qs1_desc: "Скрывайте почту, имена пользователей и цифровой след.",
      qs2_title: "Пароли и аутентификация",
      qs2_desc: "Менеджеры, уникальные пароли, нулевое повторное использование.",
      qs3_title: "Двухфакторная аутентификация",
      qs3_desc: "TOTP, аппаратные ключи, отключите SMS 2FA."
    },
    sections: {
      identity: {
        title: "Личность и приватность",
        sub: "ПОЧТА · ИМЕНА · ЦИФРОВОЙ СЛЕД",
        steps: [
          {
            t: "Защита почты",
            d: "Не публикуйте основной адрес. Используйте псевдонимы или одноразовые переадресации для форумов, розыгрышей и вторичных регистраций."
          },
          {
            t: "Разделение пространств имён",
            d: "Используйте разные имена на разных платформах, чтобы пассивные исследователи не могли их сопоставить."
          },
          {
            t: "Изоляция телефона",
            d: "Не привязывайте физический номер к сервисам. Тихая синхронизация контактов свяжет профили. Для проверки используйте виртуальные или одноразовые номера."
          },
          {
            t: "Приватность домена",
            d: "Включите маскировку WHOIS. Публичный доступ раскрывает имя владельца, почту и физическое местоположение."
          },
          {
            t: "Проверка метаданных",
            d: "Проверяйте фото на утечки контекста. Отражения, геометки и совпадающие хеши изображений позволяют сопоставлять аккаунты."
          }
        ],
        infos: [
          "<strong>Брокеры данных:</strong> Коммерческие агрегаторы собирают личные метрики. Ручной opt-out или Incogni существенно снижает вашу экспозицию."
        ]
      },
      passwords: {
        title: "Пароли и аутентификация",
        sub: "МЕНЕДЖЕРЫ · ГЕНЕРАЦИЯ · ЛУЧШИЕ ПРАКТИКИ",
        steps: [
          {
            t: "Криптографические менеджеры",
            d: "Используйте проверенный менеджер паролей. <a href=\"https://bitwarden.com\" target=\"_blank\" rel=\"noopener\">Bitwarden</a>: открытый исходный код; <a href=\"https://keepass.info\" target=\"_blank\" rel=\"noopener\">KeePass</a>: офлайн альтернатива."
          },
          {
            t: "Нулевое повторное использование",
            d: "Одна утечка открывает credential stuffing на других порталах. Генерируйте уникальные строки для каждого приложения."
          },
          {
            t: "Энтропия Diceware",
            d: "Создавайте мастер-пароли кубиками и списками EFF. Цепочки из 6+ слов удобны для памяти и устойчивы к перебору."
          }
        ],
        infos: [
          "Избегайте стандартных подсказок к паролю. Бумажную копию мастер-пароля храните в физически защищённом месте."
        ]
      },
      "2fa": {
        title: "Двухфакторная аутентификация",
        sub: "TOTP · АППАРАТНЫЕ КЛЮЧИ · ВОССТАНОВЛЕНИЕ",
        steps: [
          {
            t: "Обязательный второй фактор",
            d: "Включите второй фактор. SMS перехватывают; используйте TOTP или аппаратные ключи."
          },
          {
            t: "Приложения TOTP",
            d: "Используйте <a href=\"https://getaegis.app\" target=\"_blank\" rel=\"noopener\">Aegis</a> или <a href=\"https://ente.io/auth\" target=\"_blank\" rel=\"noopener\">Ente Auth</a>. Резервируйте конфигурации локально и шифруйте экспорт БД."
          },
          {
            t: "Усиление FIDO2",
            d: "Где возможно, используйте <a href=\"https://www.yubico.com\" target=\"_blank\" rel=\"noopener\">YubiKey</a>. Криптопривязка блокирует вход на поддельных доменах."
          }
        ],
        infos: [
          "<strong>SIM-своп:</strong> Злоумышленники подделывают сотовую авторизацию. Привяжите к линии оператора PIN, чтобы предотвратить перенос номера."
        ]
      },
      email: {
        title: "Безопасность почты",
        sub: "ФИШИНГ · ПСЕВДОНИМЫ · ПИКСЕЛИ ОТСЛЕЖИВАНИЯ",
        steps: [
          {
            t: "Шифрованный хостинг",
            d: "Перенесите критичные векторы на приватные серверы, например <a href=\"https://proton.me/mail\" target=\"_blank\" rel=\"noopener\">ProtonMail</a>."
          },
          {
            t: "Блокировка пикселей",
            d: "Запретите автозагрузку изображений. Скрытые трекеры фиксируют IP, время открытия и конфигурацию браузера."
          },
          {
            t: "Сервисы маскировки",
            d: "Создавайте уникальные псевдонимы для сторонних сервисов, чтобы основной адрес не утёк при утечках БД."
          }
        ]
      },
      messaging: {
        title: "Мессенджеры",
        sub: "ШИФРОВАНИЕ · ДОВЕРИЕ · УСИЛЕНИЕ",
        steps: [
          {
            t: "Архитектуры доверия",
            d: "Популярные чаты логируют метаданные. Используйте <a href=\"https://simplex.chat\" target=\"_blank\" rel=\"noopener\">SimpleX</a> или <a href=\"https://getsession.org\" target=\"_blank\" rel=\"noopener\">Session</a>, чтобы отвязать потоки от личных маркеров."
          },
          {
            t: "Таймеры самоуничтожения",
            d: "Включите исчезающие сообщения. Локальные кэши на чужих узлах. постоянный риск."
          },
          {
            t: "Усиление медиа",
            d: "Отключите автозагрузку файлов. Вредоносные полезные нагрузки в медиа могут запускать удалённые скрипты."
          }
        ]
      },
      links: {
        title: "Ссылки, файлы и загрузки",
        sub: "ИСПОЛНЯЕМЫЕ · СКАНИРОВАНИЕ · ПРОВЕРКА",
        steps: [
          {
            t: "Скрытые расширения",
            d: "Показывайте все расширения в ОС. Вредоносные архивы часто маскируются (напр. <code>report.pdf.exe</code>)."
          },
          {
            t: "Мульти-движковая проверка",
            d: "Сканируйте скрипты и бинарники на VirusTotal и Hybrid Analysis до запуска."
          },
          {
            t: "Активные скрипты",
            d: "Не выполняйте команды с форумов, не разобрав каждый параметр."
          }
        ]
      },
      browser: {
        title: "Приватность браузера",
        sub: "РАСШИРЕНИЯ · COOKIE · ПОИСК",
        steps: [
          {
            t: "Приватные движки",
            d: "Используйте <a href=\"https://brave.com\" target=\"_blank\" rel=\"noopener\">Brave</a> или <a href=\"https://www.mozilla.org/firefox/\" target=\"_blank\" rel=\"noopener\">Firefox</a>. Добавьте uBlock Origin."
          },
          {
            t: "Компартментализация",
            d: "Разделите профили для личной и анонимной навигации. Не смешивайте учётные данные."
          },
          {
            t: "Защита от трекинга",
            d: "Блокируйте сторонние трекеры. Изолируйте cookie по доменам хоста."
          }
        ]
      },
      vpn: {
        title: "VPN и сетевая приватность",
        sub: "MULLVAD · DNS · УТЕЧКИ WEBRTC",
        steps: [
          {
            t: "Инкапсуляция без логов",
            d: "Маршрутизируйте через <a href=\"https://mullvad.net\" target=\"_blank\" rel=\"noopener\">Mullvad</a>. Используйте WireGuard для минимального следа."
          },
          {
            t: "Утечки WebRTC",
            d: "Отключите WebRTC в браузере. Он обходит границы VPN и раскрывает локальные интерфейсы."
          },
          {
            t: "Шифрованные DNS-запросы",
            d: "Используйте DNS over HTTPS. Обычный DNS передаёт адреса сайтов провайдеру в открытом виде."
          }
        ]
      },
      fingerprint: {
        title: "Отпечаток браузера",
        sub: "CANVAS · WEBGL · СЛИЯНИЕ С ТОЛПОЙ",
        steps: [
          {
            t: "Пулы анонимности",
            d: "Не рандомизируйте отпечаток вручную. Браузер должен сливаться с тысячами других целей."
          },
          {
            t: "Инструменты изоляции",
            d: "Используйте Mullvad Browser или Tor Browser со строгим canvas и letterboxing."
          },
          {
            t: "Тест профиля",
            d: "Проверяйте конфигурацию через Cover Your Tracks. Цель. общие или случайные характеристики."
          }
        ]
      },
      device: {
        title: "Безопасность устройства и системы",
        sub: "ШИФРОВАНИЕ · АНТИВИРУС · ОБНОВЛЕНИЯ",
        steps: [
          {
            t: "Криптографические тома",
            d: "Включите полное шифрование диска. <a href=\"https://www.veracrypt.fr\" target=\"_blank\" rel=\"noopener\">VeraCrypt</a> или системное шифрование защищают от физического доступа."
          },
          {
            t: "Защита конечных точек",
            d: "Настройте базовые обновления. Запускайте процессы из ограниченных учётных записей, не администратора."
          },
          {
            t: "Физические интерфейсы",
            d: "Не подключайте неизвестные USB. Отключите autorun, закройте камеры, не доверяйте чужим зарядкам."
          }
        ]
      },
      data: {
        title: "Данные, резервные копии и передача",
        sub: "ПРАВИЛО 3-2-1-1 · МЕТАДАННЫЕ · ОБЛАКО",
        steps: [
          {
            t: "Удаление EXIF",
            d: "Удаляйте EXIF перед публикацией. Теги содержат GPS, модель камеры и метки времени."
          },
          {
            t: "План резервирования 3-2-1-1",
            d: "3 копии на 2 носителях, 1 вне площадки, 1 air-gapped без сети."
          },
          {
            t: "Шифрование на клиенте",
            d: "Шифруйте чувствительные данные до загрузки в облако. Провайдер должен хранить только шифротекст."
          }
        ]
      },
      opsec: {
        title: "OPSEC и мышление",
        sub: "ПЕРСОНЫ · ПАТТЕРНЫ · ИИ",
        steps: [
          {
            t: "Разделение персон",
            d: "Не связывайте анонимные личности с реальным именем. После связки cookie и история сети скомпрометируют все образы."
          },
          {
            t: "Стиль письма и часовые пояса",
            d: "Следите за паттернами набора и активностью по времени. Стилометрия связывает аккаунты."
          },
          {
            t: "Защита ввода в ИИ",
            d: "Не вводите чувствительный код, документы и ключи в публичные ИИ. Данные хранятся на удалённых серверах."
          }
        ]
      },
      incident: {
        title: "Реагирование на инциденты",
        sub: "СКОМПРОМЕТИРОВАНЫ? ДЕЙСТВУЙТЕ СЕЙЧАС",
        steps: [
          {
            t: "Немедленное отключение сети",
            d: "Сразу отключите интерфейс. вытащите ethernet, отключите WiFi/Bluetooth."
          },
          {
            t: "Изоляция сессий",
            d: "Не входите в чувствительные порталы с заражённого устройства. С чистого узла смените пароли и отзовите сессии."
          },
          {
            t: "Полное доверие нулю",
            d: "Заражённому устройству нельзя доверять. Сотрите разделы и переустановите ОС."
          }
        ]
      },
      ratted: {
        title: "RAT? Что делать?",
        sub: "RAT · СТИЛЕРЫ · ПОЛНОЕ ВОССТАНОВЛЕНИЕ",
        steps: [
          {
            t: "Оборвите соединение",
            d: "Вытащите ethernet, отключите Wi‑Fi и Bluetooth, по возможности обесточьте ПК. Живой RAT в реальном времени сливает нажатия, скриншоты и буфер."
          },
          {
            t: "Не «чините» на том же ПК",
            d: "Не входите в почту, Discord, банки и криптокошельки с заражённого устройства. Считайте, что каждый пароль перехвачен. Восстанавливайтесь с чистого телефона или ПК."
          },
          {
            t: "Сначала отзовите сессии",
            d: "С чистого устройства выйдите из всех сессий Discord, Google, Microsoft, бирж и кошельков. Меняйте пароли, начиная с почты. она ключ ко всему."
          },
          {
            t: "Проверьте, что украли",
            d: "Проверьте сохранённые пароли браузера, автозаполнение, крипто-расширения и локальные коды 2FA. Грабберы за раз забирают токены Discord, cookie и seed-фразы."
          },
          {
            t: "Считайте, что есть закрепление",
            d: "RAT прячутся в автозагрузке, задачах, службах и AppData. Удаление одного файла редко помогает. вся установка скомпрометирована."
          },
          {
            t: "Стереть и переустановить",
            d: "Сохраните только проверенные личные файлы (фото, документы; не exe). Отформатируйте диск, установите Windows с официального носителя, пропатчите до восстановления данных."
          }
        ],
        infos: [
          "<strong>После восстановления:</strong> Включите аппаратную или приложенческую 2FA везде, используйте менеджер паролей и больше не запускайте пиратские игры, «бесплатный Nitro» и неизвестные <code>.exe</code>. так попадают большинство RAT.",
          "<strong>Признаки:</strong> Мышь движется сама, мигает LED веб-камеры, неизвестные процессы, новые программы в автозагрузке, скам-ЛС от вашего аккаунта, опустошение кошельков."
        ]
      },
      attacks: {
        title: "Распространённые кибератаки",
        sub: "ЗНАЙТЕ, С ЧЕМ СТАЛКИВАЕТЕСЬ",
        attacks: [
          {
            t: "Ransomware",
            d: "Шифрует локальные файлы и требует плату за ключи доступа."
          },
          {
            t: "Фишинг",
            d: "Социальная инженерия через поддельные порталы для кражи учётных данных."
          },
          {
            t: "DDoS",
            d: "Затопление целей трафиком для деградации инфраструктуры."
          },
          {
            t: "MITM",
            d: "Перехват потоков между интерфейсами для извлечения данных."
          },
          {
            t: "SQL-инъекция",
            d: "Внедрение запросов в переменные для извлечения записей сервера."
          },
          {
            t: "Zero-Day",
            d: "Эксплуатация неисправленных уязвимостей до выхода патчей."
          }
        ]
      }
    }
  },
  ar: {
    code: "AR",
    ui: {
      back: "رجوع",
      defense_metrics: "مقاييس الدفاع",
      hero_pre: "تأمين ",
      hero_em: "بصمتك الرقمية",
      hero_desc: "مخطط مبسط لأمن المعلومات الشخصي. إرشادات تشغيلية لبناء دفاعات قوية وأنماط أثر نظيفة.",
      meta_vectors: "15 ناقلاً",
      meta_opsec: "OPSEC جاهز",
      meta_live: "دليل مباشر",
      vectors_title: "النواقل",
      badge_core: "أساسي",
      badge_crit: "حرج",
      qs_start: "ابدأ هنا",
      qs_core: "أساسي",
      content_head: "<em>دليل ميداني</em> // بروتوكولات تشغيلية",
      footer_warn: "[!] لا تثق بأحد &nbsp;|&nbsp; تحقق من كل شيء &nbsp;|&nbsp; افترض الاختراق [!]",
      footer_sig: "INTELBYTE قاعدة المعرفة",
      btt_label: "العودة للأعلى"
    },
    toc: {
      identity: "الهوية والخصوصية",
      passwords: "كلمات المرور والمصادقة",
      "2fa": "المصادقة الثنائية",
      email: "أمان البريد",
      messaging: "تطبيقات المراسلة",
      links: "الروابط والتنزيلات",
      browser: "خصوصية المتصفح",
      vpn: "VPN والشبكة",
      fingerprint: "بصمة المتصفح",
      device: "أمان الجهاز",
      data: "البيانات والنسخ الاحتياطي",
      opsec: "OPSEC",
      incident: "الاستجابة للحوادث",
      ratted: "RAT؟ ماذا تفعل؟",
      attacks: "هجمات شائعة"
    },
    qs: {
      qs1_title: "الهوية والخصوصية",
      qs1_desc: "أخفِ البريد وأسماء المستخدمين وبصمتك الرقمية.",
      qs2_title: "كلمات المرور والمصادقة",
      qs2_desc: "مديرو كلمات المرور، كلمات فريدة، صفر إعادة استخدام.",
      qs3_title: "المصادقة الثنائية",
      qs3_desc: "TOTP ومفاتيح الأجهزة وأوقف SMS 2FA."
    },
    sections: {
      identity: {
        title: "الهوية والخصوصية",
        sub: "البريد · أسماء المستخدمين · البصمة الرقمية",
        steps: [
          {
            t: "حماية البريد",
            d: "لا تنشر بريدك الأساسي. استخدم أسماء مستعارة أو إعادة توجيه مؤقتة للمنتديات والهدايا والتسجيلات الثانوية."
          },
          {
            t: "فصل مساحات الأسماء",
            d: "استخدم أسماء مستخدمين مختلفة عبر المنصات لمنع التحقيقات السلبية من الربط بينها."
          },
          {
            t: "عزل الهاتف",
            d: "تجنب ربط رقمك الفعلي بالخدمات. مزامنة جهات الاتصال الصامتة تربط ملفاتك. استخدم أرقاماً افتراضية أو مؤقتة للتحقق."
          },
          {
            t: "خصوصية النطاق",
            d: "فعّل إخفاء WHOIS. الوصول العام يكشف اسم المالك والبريد والموقع."
          },
          {
            t: "التحقق من البيانات الوصفية",
            d: "افحص الصور لتسريبات السياق. الانعكاسات ومؤشرات الموقع وتطابق hash الصور تربط الحسابات."
          }
        ],
        infos: [
          "<strong>وسطاء البيانات:</strong> المجمّعات التجارية تجمع المقاييس الشخصية. طلبات opt-out اليدوية أو أدوات مثل Incogni تقلل التعرض بشكل كبير."
        ]
      },
      passwords: {
        title: "كلمات المرور والمصادقة",
        sub: "المديرون · التوليد · أفضل الممارسات",
        steps: [
          {
            t: "مديرو كلمات مرور مشفّرة",
            d: "استخدم مديراً مدققاً. <a href=\"https://bitwarden.com\" target=\"_blank\" rel=\"noopener\">Bitwarden</a> مفتوح المصدر؛ <a href=\"https://keepass.info\" target=\"_blank\" rel=\"noopener\">KeePass</a> بديل دون اتصال."
          },
          {
            t: "صفر إعادة استخدام",
            d: "خرق واحد يمكّن هجمات credential stuffing. أنشئ سلاسل عشوائية فريدة لكل تطبيق."
          },
          {
            t: "إنتروبيا Diceware",
            d: "أنشئ عبارات رئيسية بنرد وقوائم EFF. سلاسل 6+ كلمات تحسّن الذاكرة وتقاوم التخمين."
          }
        ],
        infos: [
          "تجنب تلميحات كلمات المرور القياسية. احفظ نسخة الورق للكلمة الرئيسية في مكان آمن فعلياً."
        ]
      },
      "2fa": {
        title: "المصادقة الثنائية",
        sub: "TOTP · مفاتيح الأجهزة · الاسترداد",
        steps: [
          {
            t: "إلزام العامل الثاني",
            d: "فعّل عوامل مصادقة ثانوية. SMS عرضة للاعتراض؛ استخدم TOTP أو مفاتيح أمان فعلية."
          },
          {
            t: "تطبيقات TOTP",
            d: "استخدم <a href=\"https://getaegis.app\" target=\"_blank\" rel=\"noopener\">Aegis</a> أو <a href=\"https://ente.io/auth\" target=\"_blank\" rel=\"noopener\">Ente Auth</a>. احفظ الإعدادات محلياً وشفّر تصدير قاعدة البيانات."
          },
          {
            t: "تقوية FIDO2",
            d: "استخدم مفاتيح مثل <a href=\"https://www.yubico.com\" target=\"_blank\" rel=\"noopener\">YubiKey</a> حيث أمكن. الربط التشفيري يمنع المصادقة على نطاقات مزيفة."
          }
        ],
        infos: [
          "<strong>تبديل SIM:</strong> المهاجمون يزوّرون تفويض الخلوي لاستنساخ هويتك. اربط خطوط المشغل بـ PIN مخصص لمنع نقل الرقم."
        ]
      },
      email: {
        title: "أمان البريد الإلكتروني",
        sub: "التصيد · الأسماء المستعارة · بكسل التتبع",
        steps: [
          {
            t: "استضافة مشفّرة",
            d: "انقل النواقل الحرجة إلى خوادم تركز على الخصوصية مثل <a href=\"https://proton.me/mail\" target=\"_blank\" rel=\"noopener\">ProtonMail</a>."
          },
          {
            t: "قمع بكسل التتبع",
            d: "امنع التحميل التلقائي للصور. عناصر التتبع المخفية تسجّل IP ووقت الفتح وإعدادات المتصفح."
          },
          {
            t: "خدمات الإخفاء",
            d: "أنشئ أسماء بريد مستعارة فريدة لمنع تسريب عنوانك الأساسي عند خروقات قواعد البيانات."
          }
        ]
      },
      messaging: {
        title: "تطبيقات المراسلة",
        sub: "التشفير · الثقة · التقوية",
        steps: [
          {
            t: "هندسة الثقة",
            d: "تطبيقات الدردشة الشائعة تسجّل البيانات الوصفية. استخدم <a href=\"https://simplex.chat\" target=\"_blank\" rel=\"noopener\">SimpleX</a> أو <a href=\"https://getsession.org\" target=\"_blank\" rel=\"noopener\">Session</a> لفصل الدردشة عن العلامات الشخصية."
          },
          {
            t: "مؤقتات الاختفاء",
            d: "فعّل الرسائل المختفية. ذاكرة التخزين المؤقت على نقاط نهاية أجنبية خطر دائم."
          },
          {
            t: "تقوية الوسائط",
            d: "أوقف التنزيل التلقائي للملفات. الحمولات الخبيثة في الوسائط قد تشغّل سكربتات عن بُعد."
          }
        ]
      },
      links: {
        title: "الروابط والملفات والتنزيلات",
        sub: "التنفيذيات · المسح · التحقق",
        steps: [
          {
            t: "امتدادات مخفية",
            d: "أظهر كل الامتدادات في النظام. الأرشيفات الخبيثة تستخدم تنسيقاً مزدوجاً (مثل <code>report.pdf.exe</code>)."
          },
          {
            t: "تحقق متعدد المحركات",
            d: "امسح السكربتات والملفات الثنائية على VirusTotal وHybrid Analysis قبل التشغيل."
          },
          {
            t: "سكربتات نشطة",
            d: "لا تنفّذ أوامر أو سكربتات من المنتديات دون فهم كل معامل."
          }
        ]
      },
      browser: {
        title: "خصوصية المتصفح",
        sub: "الإضافات · الكوكيز · محركات البحث",
        steps: [
          {
            t: "محركات الخصوصية",
            d: "استخدم <a href=\"https://brave.com\" target=\"_blank\" rel=\"noopener\">Brave</a> أو <a href=\"https://www.mozilla.org/firefox/\" target=\"_blank\" rel=\"noopener\">Firefox</a>. أضف uBlock Origin."
          },
          {
            t: "التجزئة",
            d: "افصل الملفات الشخصية للهوية مقابل التصفح المجهول. لا تدمج بيانات الاعتماد."
          },
          {
            t: "حماية التتبع",
            d: "احجب سكربتات التتبع الطرف الثالث. عزل الكوكيز على نطاق المضيف."
          }
        ]
      },
      vpn: {
        title: "VPN وخصوصية الشبكة",
        sub: "MULLVAD · DNS · تسريبات WEBRTC",
        steps: [
          {
            t: "تغليف بلا سجلات",
            d: "وجّه الاتصالات عبر <a href=\"https://mullvad.net\" target=\"_blank\" rel=\"noopener\">Mullvad</a>. استخدم WireGuard لتقليل الأثر."
          },
          {
            t: "تسريبات WebRTC",
            d: "عطّل WebRTC في المتصفح. يكشف الواجهات المحلية الحقيقية خلف VPN."
          },
          {
            t: "استعلامات نطاق مشفّرة",
            d: "استخدم DNS over HTTPS. DNS العادي يسرّب عناوين المواقع لمزودك بنص واضح."
          }
        ]
      },
      fingerprint: {
        title: "بصمة المتصفح",
        sub: "CANVAS · WEBGL · الاندماج",
        steps: [
          {
            t: "مجموعات عدم الكشف",
            d: "لا تعشّئ حقول البصمة يدوياً. يجب أن يندمج متصفحك مع آلاف الأهداف."
          },
          {
            t: "أدوات العزل",
            d: "استخدم Mullvad Browser أو Tor Browser مع حماية canvas وletterboxing صارمة."
          },
          {
            t: "اختبار الملف",
            d: "تحقق عبر Cover Your Tracks. استهدف خصائص مشتركة أو عشوائية."
          }
        ]
      },
      device: {
        title: "أمان الجهاز والنظام",
        sub: "التشفير · مكافحة البرمجيات · التحديثات",
        steps: [
          {
            t: "أحجام مشفّرة",
            d: "فعّل تشفير القرص الكامل. <a href=\"https://www.veracrypt.fr\" target=\"_blank\" rel=\"noopener\">VeraCrypt</a> أو تشفير النظام يحمي من العبث الفعلي."
          },
          {
            t: "حماية نقاط النهاية",
            d: "اضبط التحديثات الأساسية. شغّل العمليات من حسابات مقيدة لا المسؤول."
          },
          {
            t: "قفل الواجهات الفعلية",
            d: "لا توصّل USB مجهولاً. عطّل التشغيل التلقائي، غطّ الكاميرات، تجنب شواحن غير موثوقة."
          }
        ]
      },
      data: {
        title: "البيانات والنسخ الاحتياطي والنقل",
        sub: "قاعدة 3-2-1-1 · البيانات الوصفية · السحابة",
        steps: [
          {
            t: "إزالة EXIF",
            d: "أزل EXIF من الصور والملفات قبل المشاركة. تحتوي على GPS وطراز الكاميرا والطوابع الزمنية."
          },
          {
            t: "خطة نسخ 3-2-1-1",
            d: "3 نسخ على وسيطين، 1 خارج الموقع، 1 معزولة عن الشبكة بالكامل."
          },
          {
            t: "تشفير العميل",
            d: "شفّر الأصول الحساسة قبل الرفع للسحابة. يجب أن يخزن المزود النص المشفّر فقط."
          }
        ]
      },
      opsec: {
        title: "OPSEC والعقلية",
        sub: "الشخصيات · الأنماط · الذكاء الاصطناعي",
        steps: [
          {
            t: "فصل الشخصيات",
            d: "لا تربط الهويات المجهولة باسمك الحقيقي. بعد الربط، الكوكيز أو سجل الشبكة يخترق كل الشخصيات."
          },
          {
            t: "أسلوب الكتابة والمناطق الزمنية",
            d: "انتبه لأنماط الكتابة والنشاط الزمني المتسق. محركات الأسلوب تربط الحسابات."
          },
          {
            t: "حماية إدخال الذكاء الاصطناعي",
            d: "لا تدخل كوداً أو مستندات أو مفاتيح حساسة في بوابات ذكاء اصطناعي عامة. بياناتك تُخزّن على خوادم بعيدة."
          }
        ]
      },
      incident: {
        title: "الاستجابة للحوادث",
        sub: "اخترقت؟ افعل هذا الآن",
        steps: [
          {
            t: "قطع الشبكة فوراً",
            d: "افصل الواجهة فوراً. أزل ethernet وعطّل WiFi/Bluetooth."
          },
          {
            t: "عزل الجلسات",
            d: "لا تسجّل الدخول للبوابات الحساسة من جهاز مخترق. استخدم عقدة نظيفة لتدوير الاعتمادات وإلغاء الجلسات."
          },
          {
            t: "مسح بلا ثقة",
            d: "لا يُوثق بالجهاز المخترق. إن أُصيب، امسح جداول الأقسام وأعد تثبيت النظام."
          }
        ]
      },
      ratted: {
        title: "RAT؟ ماذا تفعل؟",
        sub: "RAT · السارقون · استرداد كامل",
        steps: [
          {
            t: "اقطع الاتصال",
            d: "اسحب ethernet، عطّل Wi‑Fi وBluetooth، وافصل الجهاز إن أمكن. RAT حيّ يسرّب الضغطات واللقطات والحافظة لحظياً."
          },
          {
            t: "لا «تصلّح» على نفس الحاسوب",
            d: "لا تدخل البريد أو Discord أو البنوك أو المحافظ من الجهاز المصاب. افترض أن كل كلمة مرور تُلتقط. استخدم هاتفاً أو حاسوباً نظيفاً."
          },
          {
            t: "ألغِ الجلسات أولاً",
            d: "من جهاز نظيف، سجّل الخروج من Discord وGoogle وMicrosoft والبورصات والمحافظ. غيّر كلمات المرور بدءاً بالبريد. مفتاح استرداد كل شيء."
          },
          {
            t: "تحقق مما سُرق",
            d: "راجع كلمات مرور المتصفح والملء التلقائي وامتدادات الكريبتو ورموز 2FA المحلية. جامعو الرموز يجمعون توكن Discord والكوكيز وعبارات seed دفعة واحدة."
          },
          {
            t: "افترض الاستمرارية",
            d: "RAT تختبئ في بدء التشغيل والمهام المجدولة والخدمات وAppData. حذف ملف واحد نادراً يكفي. اعتبر التثبيت كاملاً مخترقاً."
          },
          {
            t: "مسح وإعادة تثبيت",
            d: "احفظ فقط ملفاتك الشخصية الموثوقة (صور، مستندات; لا exe). نسّق القرص، أعد Windows من وسائط رسمية، رقّ قبل الاستعادة."
          }
        ],
        infos: [
          "<strong>بعد الاسترداد:</strong> فعّل 2FA بالأجهزة أو التطبيقات في كل مكان، استخدم مدير كلمات مرور، ولا تشغّل ألعاباً مقرصنة أو «Nitro مجاني» أو <code>.exe</code> مجهولة. هكذا تصل معظم RAT.",
          "<strong>علامات تحذير:</strong> الفأرة تتحرك وحدها، وميض LED الكاميرا، عمليات غير معروفة، برامج بدء جديدة، رسائل احتيال من حسابك، أو تفريغ المحافظ."
        ]
      },
      attacks: {
        title: "هجمات سيبرانية شائعة",
        sub: "اعرف ما تواجهه",
        attacks: [
          {
            t: "برمجيات الفدية",
            d: "تشفّر ملفاتك المحلية وتطلب دفعاً لاستعادة مفاتيح الوصول."
          },
          {
            t: "التصيد",
            d: "أهداف هندسة اجتماعية لالتقاط بيانات الاعتماد عبر بوابات مزيفة."
          },
          {
            t: "DDoS",
            d: "إغراق الأهداف بحركة المرور لتدهور الأداء."
          },
          {
            t: "MITM",
            d: "اعتراض تدفقات الاتصال بين الواجهات لاستخراج البيانات."
          },
          {
            t: "حقن SQL",
            d: "حقن استعلامات خلفية في متغيرات نشطة لاستخراج سجلات الخادم."
          },
          {
            t: "يوم الصفر",
            d: "استهداف ثغرات غير مُرقّعة قبل توفر التحديثات."
          }
        ]
      }
    }
  },
  fr: {
    code: "FR",
    ui: {
      back: "Retour",
      defense_metrics: "MÉTRIQUES DE DÉFENSE",
      hero_pre: "Sécuriser votre ",
      hero_em: "empreinte",
      hero_desc: "Plan simplifié pour la sécurité des informations personnelles. Directives opérationnelles pour des défenses solides et des traces propres.",
      meta_vectors: "15 VECTEURS",
      meta_opsec: "OPSEC PRÊT",
      meta_live: "GUIDE EN DIRECT",
      vectors_title: "VECTEURS",
      badge_core: "BASE",
      badge_crit: "CRIT",
      qs_start: "Commencer ici",
      qs_core: "Base",
      content_head: "<em>MANUEL DE TERRAIN</em> // PROTOCOLES OPÉRATIONNELS",
      footer_warn: "[!] NE FAITES CONFIANCE À PERSONNE &nbsp;|&nbsp; VÉRIFIEZ TOUT &nbsp;|&nbsp; SUPPOSEZ LA COMPROMISSION [!]",
      footer_sig: "INTELBYTE Base de connaissances",
      btt_label: "Retour en haut"
    },
    toc: {
      identity: "Identité et confidentialité",
      passwords: "Mots de passe et auth",
      "2fa": "Authentification à deux facteurs",
      email: "Sécurité e-mail",
      messaging: "Applications de messagerie",
      links: "Liens et téléchargements",
      browser: "Confidentialité du navigateur",
      vpn: "VPN et réseau",
      fingerprint: "Empreinte digitale",
      device: "Sécurité des appareils",
      data: "Données et sauvegardes",
      opsec: "OPSEC",
      incident: "Réponse aux incidents",
      ratted: "RAT ? Que faire ?",
      attacks: "Attaques courantes"
    },
    qs: {
      qs1_title: "Identité et confidentialité",
      qs1_desc: "Masquez e-mails, noms d'utilisateur et empreinte numérique.",
      qs2_title: "Mots de passe et auth",
      qs2_desc: "Gestionnaires, mots de passe uniques, zéro réutilisation.",
      qs3_title: "Authentification à deux facteurs",
      qs3_desc: "TOTP, clés matérielles, supprimez la 2FA SMS."
    },
    sections: {
      identity: {
        title: "Identité et confidentialité",
        sub: "E-MAIL · NOMS D'UTILISATEUR · EMPREINTE NUMÉRIQUE",
        steps: [
          {
            t: "Protection de l'e-mail",
            d: "Ne publiez pas votre adresse principale. Utilisez des alias ou des redirections jetables pour forums, concours et inscriptions secondaires."
          },
          {
            t: "Séparation des espaces de noms",
            d: "Utilisez des noms d'utilisateur distincts sur chaque plateforme pour empêcher le recoupement par des enquêteurs passifs."
          },
          {
            t: "Isolation du téléphone",
            d: "Évitez de lier votre numéro physique aux services. La synchronisation silencieuse des contacts relie vos profils. Utilisez des numéros virtuels ou jetables pour la validation."
          },
          {
            t: "Confidentialité du domaine",
            d: "Activez le masquage WHOIS. L'accès public révèle le propriétaire, les e-mails et la localisation."
          },
          {
            t: "Vérification des métadonnées",
            d: "Examinez les photos pour les fuites de contexte. Reflets, indicateurs de lieu et hash d'images permettent la corrélation entre plateformes."
          }
        ],
        infos: [
          "<strong>Courtiers de données :</strong> Les agrégateurs commerciaux cataloguent vos métriques personnelles. Opt-out manuel ou outils comme Incogni réduisent fortement l'exposition."
        ]
      },
      passwords: {
        title: "Mots de passe et authentification",
        sub: "GESTIONNAIRES · GÉNÉRATION · BONNES PRATIQUES",
        steps: [
          {
            t: "Gestionnaires cryptographiques",
            d: "Déployez un gestionnaire audité. <a href=\"https://bitwarden.com\" target=\"_blank\" rel=\"noopener\">Bitwarden</a> est open source ; <a href=\"https://keepass.info\" target=\"_blank\" rel=\"noopener\">KeePass</a> est une alternative hors ligne."
          },
          {
            t: "Zéro réutilisation",
            d: "Une seule fuite permet le credential stuffing sur d'autres portails. Générez des chaînes uniques pour chaque application."
          },
          {
            t: "Entropie Diceware",
            d: "Créez des phrases maîtres avec dés et listes EFF. Des chaînes de 6+ mots optimisent la mémoire et résistent au brute-force."
          }
        ],
        infos: [
          "Évitez les indices ou motifs de mot de passe standard. Stockez la copie papier du mot de passe maître dans un conteneur physiquement sécurisé."
        ]
      },
      "2fa": {
        title: "Authentification à deux facteurs",
        sub: "TOTP · CLÉS MATÉRIELLES · RÉCUPÉRATION",
        steps: [
          {
            t: "Obligation multi-facteurs",
            d: "Activez un second facteur. Le SMS est interceptable ; utilisez TOTP ou des clés de sécurité physiques."
          },
          {
            t: "Applications TOTP",
            d: "Utilisez <a href=\"https://getaegis.app\" target=\"_blank\" rel=\"noopener\">Aegis</a> ou <a href=\"https://ente.io/auth\" target=\"_blank\" rel=\"noopener\">Ente Auth</a>. Sauvegardez localement et chiffrez les exports de base."
          },
          {
            t: "Renforcement FIDO2",
            d: "Déployez des clés comme <a href=\"https://www.yubico.com\" target=\"_blank\" rel=\"noopener\">YubiKey</a> si possible. La liaison cryptographique bloque l'auth sur domaines usurpés."
          }
        ],
        infos: [
          "<strong>SIM swapping :</strong> Les attaquants usurpent l'autorisation cellulaire. Liez les lignes opérateur avec un PIN personnalisé pour empêcher la migration du numéro."
        ]
      },
      email: {
        title: "Sécurité e-mail",
        sub: "PHISHING · ALIAS · PIXELS DE SUIVI",
        steps: [
          {
            t: "Hébergement chiffré",
            d: "Migrez les vecteurs critiques vers des serveurs axés confidentialité comme <a href=\"https://proton.me/mail\" target=\"_blank\" rel=\"noopener\">ProtonMail</a>."
          },
          {
            t: "Suppression des pixels",
            d: "Bloquez le rendu automatique des images. Les trackers cachés enregistrent IP, horodatage d'ouverture et configuration du navigateur."
          },
          {
            t: "Services de masquage",
            d: "Générez des alias uniques pour empêcher la fuite de votre adresse principale lors de brèches de bases de données."
          }
        ]
      },
      messaging: {
        title: "Applications de messagerie",
        sub: "CHIFFREMENT · CONFIANCE · DURCISSEMENT",
        steps: [
          {
            t: "Architectures de confiance",
            d: "Les chats grand public journalisent les métadonnées. Utilisez <a href=\"https://simplex.chat\" target=\"_blank\" rel=\"noopener\">SimpleX</a> ou <a href=\"https://getsession.org\" target=\"_blank\" rel=\"noopener\">Session</a> pour découpler les flux des marqueurs personnels."
          },
          {
            t: "Minuteries d'autodestruction",
            d: "Activez les messages éphémères. Les caches locaux sur des points distants sont une exposition constante."
          },
          {
            t: "Durcissement des médias",
            d: "Désactivez le téléchargement automatique. Des charges malveillantes dans les médias peuvent exécuter des scripts à distance."
          }
        ]
      },
      links: {
        title: "Liens, fichiers et téléchargements",
        sub: "EXÉCUTABLES · ANALYSE · VÉRIFICATION",
        steps: [
          {
            t: "Extensions masquées",
            d: "Forcez l'affichage de toutes les extensions. Les archives malveillantes utilisent souvent un double format (ex. <code>report.pdf.exe</code>)."
          },
          {
            t: "Vérification multi-moteurs",
            d: "Analysez scripts et binaires sur VirusTotal et Hybrid Analysis avant exécution."
          },
          {
            t: "Scripts actifs",
            d: "N'exécutez pas de lignes de commande ou scripts copiés des forums sans comprendre chaque paramètre."
          }
        ]
      },
      browser: {
        title: "Confidentialité du navigateur",
        sub: "EXTENSIONS · COOKIES · MOTEURS",
        steps: [
          {
            t: "Moteurs privés",
            d: "Utilisez <a href=\"https://brave.com\" target=\"_blank\" rel=\"noopener\">Brave</a> ou <a href=\"https://www.mozilla.org/firefox/\" target=\"_blank\" rel=\"noopener\">Firefox</a>. Intégrez uBlock Origin."
          },
          {
            t: "Compartimentage",
            d: "Séparez les profils identité personnelle et navigation anonyme. Ne fusionnez jamais les identifiants."
          },
          {
            t: "Protection du suivi",
            d: "Bloquez les scripts tiers. Isolez les cookies à leur domaine hôte."
          }
        ]
      },
      vpn: {
        title: "VPN et confidentialité réseau",
        sub: "MULLVAD · DNS · FUITES WEBRTC",
        steps: [
          {
            t: "Encapsulation zéro log",
            d: "Routez via <a href=\"https://mullvad.net\" target=\"_blank\" rel=\"noopener\">Mullvad</a>. Utilisez WireGuard pour minimiser l'empreinte."
          },
          {
            t: "Fuites WebRTC",
            d: "Désactivez WebRTC dans le navigateur. Il révèle les interfaces locales réelles au-delà du VPN."
          },
          {
            t: "Requêtes DNS chiffrées",
            d: "Déployez DNS over HTTPS. Le DNS standard fuite les adresses de sites en clair à votre FAI."
          }
        ]
      },
      fingerprint: {
        title: "Empreinte du navigateur",
        sub: "CANVAS · WEBGL · SE FONDRE",
        steps: [
          {
            t: "Pools d'anonymat",
            d: "Ne randomisez pas manuellement l'empreinte. Le navigateur doit se fondre parmi des milliers de cibles."
          },
          {
            t: "Outils d'isolation",
            d: "Utilisez Mullvad Browser ou Tor Browser avec protections canvas et letterboxing strictes."
          },
          {
            t: "Test de profil",
            d: "Validez via Cover Your Tracks. Visez des caractéristiques partagées ou randomisées."
          }
        ]
      },
      device: {
        title: "Sécurité appareil et système",
        sub: "CHIFFREMENT · ANTIMALWARE · MISES À JOUR",
        steps: [
          {
            t: "Volumes cryptographiques",
            d: "Activez le chiffrement complet du disque. <a href=\"https://www.veracrypt.fr\" target=\"_blank\" rel=\"noopener\">VeraCrypt</a> ou le chiffrement système protège contre l'accès physique."
          },
          {
            t: "Protections des terminaux",
            d: "Configurez les mises à jour de base. Exécutez depuis des comptes restreints, pas administrateur."
          },
          {
            t: "Verrous d'interface physique",
            d: "Ne branchez pas de clés USB inconnues. Désactivez l'exécution auto, couvrez les caméras, évitez les chargeurs non fiables."
          }
        ]
      },
      data: {
        title: "Données, sauvegardes et transferts",
        sub: "RÈGLE 3-2-1-1 · MÉTADONNÉES · CLOUD",
        steps: [
          {
            t: "Suppression EXIF",
            d: "Retirez l'EXIF des photos et fichiers avant partage. Les tags contiennent GPS, modèle d'appareil et horodatages."
          },
          {
            t: "Plan de sauvegarde 3-2-1-1",
            d: "3 copies sur 2 supports, 1 hors site, 1 copie air-gapped déconnectée de tout réseau."
          },
          {
            t: "Chiffrement client",
            d: "Chiffrez les actifs sensibles avant upload cloud. Le fournisseur ne doit stocker que du chiffré."
          }
        ]
      },
      opsec: {
        title: "OPSEC et état d'esprit",
        sub: "PERSONAS · MOTIFS · EXPOSITION IA",
        steps: [
          {
            t: "Séparation des personas",
            d: "Ne liez jamais des identités anonymes à votre vrai nom. Une fois liées, cookies ou historique réseau compromettent tout."
          },
          {
            t: "Style d'écriture et fuseaux",
            d: "Attention aux motifs de frappe et à l'activité horaire cohérente. La stylométrie relie les comptes."
          },
          {
            t: "Protection des entrées IA",
            d: "N'entrez pas de code, documents ou clés sensibles dans des portails IA publics. Vos données sont stockées à distance."
          }
        ]
      },
      incident: {
        title: "Réponse aux incidents",
        sub: "COMPROMIS ? AGISSEZ MAINTENANT",
        steps: [
          {
            t: "Déconnexion réseau immédiate",
            d: "Coupez l'interface tout de suite. retirez l'ethernet, désactivez WiFi/Bluetooth."
          },
          {
            t: "Isolation des sessions",
            d: "Ne connectez pas aux portails sensibles depuis un appareil compromis. Utilisez un nœud propre pour faire tourner les identifiants et révoquer les sessions."
          },
          {
            t: "Effacement zéro confiance",
            d: "Un appareil compromis n'est pas fiable. Si infecté, effacez les tables de partition et réinstallez l'OS."
          }
        ]
      },
      ratted: {
        title: "RAT ? Que faire ?",
        sub: "RAT · STEALERS · RÉCUPÉRATION COMPLÈTE",
        steps: [
          {
            t: "Couper la connexion",
            d: "Retirez l'ethernet, désactivez Wi‑Fi et Bluetooth, débranchez la machine si possible. Un RAT actif exfiltre frappe, captures et presse-papiers en temps réel."
          },
          {
            t: "Ne pas « réparer » sur le même PC",
            d: "Ne connectez pas e-mail, Discord, banques ou portefeuilles crypto depuis l'appareil infecté. Supposez que chaque mot de passe est capturé. Utilisez un téléphone ou PC propre."
          },
          {
            t: "Révoquer les sessions d'abord",
            d: "Depuis un appareil propre, déconnectez toutes les sessions Discord, Google, Microsoft, exchanges et portefeuilles. Changez les mots de passe en commençant par l'e-mail. clé de récupération de tout."
          },
          {
            t: "Vérifier ce qui a été volé",
            d: "Passez en revue mots de passe enregistrés, saisie auto, extensions crypto et codes 2FA locaux. Les grabbers récoltent tokens Discord, cookies et seed en une passe."
          },
          {
            t: "Supposer la persistance",
            d: "Les RAT se cachent au démarrage, tâches planifiées, services et AppData. Supprimer un fichier suffit rarement. considérez toute l'installation compromise."
          },
          {
            t: "Effacer et réinstaller",
            d: "Sauvegardez uniquement des fichiers personnels vérifiés (photos, documents; pas d'exécutables). Formatez, réinstallez Windows depuis support officiel, patchez avant restauration."
          }
        ],
        infos: [
          "<strong>Après récupération :</strong> Activez la 2FA matérielle ou applicative partout, utilisez un gestionnaire sur le système propre, et ne relancez plus de jeux crackés, outils « Nitro gratuit » ou <code>.exe</code> inconnus. c'est ainsi que la plupart des RAT arrivent.",
          "<strong>Signes d'alerte :</strong> Souris qui bouge seule, LED webcam, processus inconnus, nouveaux programmes au démarrage, arnaques DM depuis votre compte, ou portefeuilles vidés."
        ]
      },
      attacks: {
        title: "Cyberattaques courantes",
        sub: "SACHEZ CE QUE VOUS AFFRONTEZ",
        attacks: [
          {
            t: "Rançongiciel",
            d: "Chiffre vos fichiers locaux et exige un paiement pour restaurer les clés d'accès."
          },
          {
            t: "Hameçonnage",
            d: "Cibles d'ingénierie sociale pour capturer des identifiants via portails usurpés."
          },
          {
            t: "DDoS",
            d: "Inondation de cibles réseau pour dégrader les performances."
          },
          {
            t: "MITM",
            d: "Interception des flux entre interfaces pour extraire des données."
          },
          {
            t: "Injection SQL",
            d: "Injection de requêtes backend dans des variables actives pour extraire des enregistrements."
          },
          {
            t: "Zero-Day",
            d: "Exploitation de failles non corrigées avant la disponibilité des correctifs."
          }
        ]
      }
    }
  }
};
