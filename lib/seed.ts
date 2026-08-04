import type { Product } from "./types";

export const SEED_VERSION = 3;

// Local product images (AI-generated photorealistic e-commerce shots)
const img = (filename: string) => `/products/${filename}`;

export const SEED_PRODUCTS: Product[] = [
  /* ─── CHARGERS ─────────────────────────────── */
  {
    id: "p_magtrio_plus",
    slug: "magtrio-plus-wireless-charger",
    name: { en: "MagTrio Plus — 3-in-1 Wireless Charger", zh: "MagTrio Plus 三合一无线充电器" },
    description: {
      en: "Q2 Certified 3-in-1 wireless charger stand for iPhone, Apple Watch & AirPods. MagSafe compatible, 15W fast charge, aluminum alloy body with premium matte finish.",
      zh: "Q2 认证三合一无线充电支架，兼容 iPhone / Apple Watch / AirPods。MagSafe 兼容，15W 快充，铝合金哑光机身。",
    },
    priceUSD: 55.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-21-14.webp")],
    category: "Charger",
    inventory: 150,
    featured: true,
    active: true,
  },
  {
    id: "p_ampcharge_ga65_uk",
    slug: "ampcharge-ga65uk-gan-charger",
    name: { en: "AmpCharge Ga65 UK — 65W GaN Charger", zh: "AmpCharge Ga65 UK 65W 氮化镓充电器" },
    description: {
      en: "Compact 65W GaN charger with Power Delivery 3.0. 2x USB-C + 1x USB-A ports. UK plug, universal voltage. Charges laptop + phone simultaneously.",
      zh: "紧凑型 65W 氮化镓充电器，PD 3.0 协议。双 USB-C + 单 USB-A 接口。英规插头，全球电压。笔记本手机同时充。",
    },
    priceUSD: 34.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-31-09.webp")],
    category: "Charger",
    inventory: 180,
    featured: false,
    active: true,
  },
  {
    id: "p_carbolt_dual",
    slug: "carbolt-dual-car-charger",
    name: { en: "CarBolt Dual — 45W Car Charger", zh: "CarBolt Dual 45W 车载充电器" },
    description: {
      en: "Dual-port car charger (USB-C 35W + USB-A 18W). Compact aluminum shell, intelligent current distribution. Works with all smartphones and tablets.",
      zh: "双口车载充电器（USB-C 35W + USB-A 18W）。紧凑铝合金外壳，智能分流。兼容所有手机和平板。",
    },
    priceUSD: 19.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-31-47.webp")],
    category: "Charger",
    inventory: 250,
    featured: false,
    active: true,
  },

  /* ─── POWER BANKS ───────────────────────────── */
  {
    id: "p_aupac_mini_5k",
    slug: "aupac-mini-5k-power-bank",
    name: { en: "AuPac Mini 5K — Magnetic Power Bank", zh: "AuPac Mini 5K 磁吸移动电源" },
    description: {
      en: "5000mAh MagSafe-compatible power bank with pass-through charging. Ultra-slim design, LED indicator, 20W PD output. Perfect for on-the-go.",
      zh: "5000mAh 磁吸兼容移动电源，支持边充边放。超薄设计，LED 指示灯，20W PD 输出。出行必备。",
    },
    priceUSD: 24.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-26-08.webp")],
    category: "Power Bank",
    inventory: 300,
    featured: true,
    active: true,
  },
  {
    id: "p_compac_ultra7",
    slug: "compac-ultra7-power-bank",
    name: { en: "ComPac Ultra7 — 20000mAh Power Bank", zh: "ComPac Ultra7 20000mAh 移动电源" },
    description: {
      en: "Massive 20000mAh capacity, 100W PD output, digital display. Charges MacBook Pro up to 1.5 times. Built-in cables included.",
      zh: "超大 20000mAh 容量，100W PD 输出，数字显示屏。可充满 MacBook Pro 1.5 次。自带多协议线材。",
    },
    priceUSD: 74.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-26-38.webp")],
    category: "Power Bank",
    inventory: 120,
    featured: true,
    active: true,
  },

  /* ─── AUDIO ────────────────────────────────── */
  {
    id: "p_gosound_jolt",
    slug: "gosound-jolt-open-earbuds",
    name: { en: "GoSound Jolt — Open-Ear Earbuds", zh: "GoSound Jolt 开放式耳机" },
    description: {
      en: "Open-ear comfort fit, 40h total battery, IPX4 water resistant, Bluetooth 5.3. Awareness mode for outdoor safety.",
      zh: "开放式舒适佩戴，总续航 40 小时，IPX4 防水，蓝牙 5.3。环境音模式保障户外安全。",
    },
    priceUSD: 29.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-30-32.webp")],
    category: "Earbuds",
    inventory: 200,
    featured: true,
    active: true,
  },
  {
    id: "p_sonicover_pro",
    slug: "sonicover-pro-anc-headphones",
    name: { en: "SonicOver Pro — ANC Over-Ear Headphones", zh: "SonicOver Pro 主动降噪头戴耳机" },
    description: {
      en: "Premium over-ear headphones with Hybrid Active Noise Cancellation, 60h battery, Hi-Res Audio certified, plush memory foam ear cushions.",
      zh: "高端头戴式混合主动降噪耳机，60 小时续航，Hi-Res Audio 认证，记忆海绵耳垫。",
    },
    priceUSD: 59.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-32-15.webp")],
    category: "Headphone",
    inventory: 85,
    featured: true,
    active: true,
  },
  {
    id: "p_boomvibe_360",
    slug: "boomvibe-360-bluetooth-speaker",
    name: { en: "BoomVibe 360 — Portable Bluetooth Speaker", zh: "BoomVibe 360 便携蓝牙音箱" },
    description: {
      en: "360° immersive sound, IPX7 waterproof, 24h playtime. Fabric mesh design with rugged rubber base. Perfect for outdoor adventures.",
      zh: "360° 环绕沉浸音效，IPX7 防水，24 小时续航。织物网面 + 加固橡胶底座。户外探险首选。",
    },
    priceUSD: 39.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-28-04.webp")],
    category: "Speaker",
    inventory: 160,
    featured: false,
    active: true,
  },

  /* ─── CONNECTIVITY / HUBS ──────────────────── */
  {
    id: "p_aluhub_max",
    slug: "aluhub-max-usb-c-hub",
    name: { en: "AluHub Max — 7-in-1 USB-C Hub", zh: "AluHub Max 七合一 USB-C 扩展坞" },
    description: {
      en: "Premium aluminum 7-in-1 USB-C hub: 4K HDMI, 3x USB-A 3.0, SD/microSD reader, 100W PD passthrough. Machined from a single block of aluminum.",
      zh: "高端铝合金七合一 USB-C 扩展坞：4K HDMI、3×USB-A 3.0、SD/TF 读卡器、100W PD 直通。整块铝合金 CNC 加工。",
    },
    priceUSD: 63.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-26-09.webp")],
    category: "Hub",
    inventory: 90,
    featured: true,
    active: true,
  },
  {
    id: "p_flexcable_pro_6ft",
    slug: "flexcable-pro-6ft-usbc-cable",
    name: { en: "FlexCable Pro — 6ft Braided USB-C Cable", zh: "FlexCable Pro 1.8米 编织 USB-C 数据线" },
    description: {
      en: "Reinforced braided nylon cable, 100W PD support, USB-IF certified. Available in 3ft / 6ft / 10ft lengths. 10,000+ bend lifespan.",
      zh: "加强型尼龙编织数据线，100W PD 支持，USB-IF 认证。提供 0.9m / 1.8m / 3m 长度。万次弯折寿命。",
    },
    priceUSD: 12.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-26-29.webp")],
    category: "Cable",
    inventory: 500,
    featured: false,
    active: true,
  },

  /* ─── WEARABLES ─────────────────────────────── */
  {
    id: "p_pulsefit_s2",
    slug: "pulsefit-s2-smart-watch",
    name: { en: "PulseFit S2 — Smart Fitness Watch", zh: "PulseFit S2 智能运动手表" },
    description: {
      en: "Round AMOLED always-on display, SpO2 & heart rate monitoring, 100+ workout modes, GPS + GLONASS, 14-day battery life. Titanium case option.",
      zh: "圆形 AMOLED 常亮屏，血氧心率监测，100+ 运动模式，GPS + GLONASS，14 天续航。钛金属表壳可选。",
    },
    priceUSD: 49.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-32-41.webp")],
    category: "Watch",
    inventory: 130,
    featured: true,
    active: true,
  },

  /* ─── STORAGE ──────────────────────────────── */
  {
    id: "p_vaultssd_1t",
    slug: "vaultssd-1t-portable-ssd",
    name: { en: "VaultSSD 1T — Portable SSD", zh: "VaultSSD 1T 便携固态硬盘" },
    description: {
      en: "Ultra-fast portable SSD with up to 1050MB/s read/write. USB 3.2 Gen 2, hardware encryption, shock-resistant aluminum shell. Cross-platform compatible.",
      zh: "超高速便携 SSD，读写高达 1050MB/s。USB 3.2 Gen 2，硬件加密，防震铝合金外壳。跨平台兼容。",
    },
    priceUSD: 89.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-33-10.webp")],
    category: "Storage",
    inventory: 70,
    featured: true,
    active: true,
  },

  /* ─── PERIPHERALS ───────────────────────────── */
  {
    id: "p_typeforge_k1",
    slug: "typeforge-k1-mechanical-keyboard",
    name: { en: "TypeForge K1 — Mechanical Keyboard", zh: "TypeForge K1 机械键盘" },
    description: {
      en: "Full-size hot-swappable mechanical keyboard, PBT double-shot keycaps, per-key RGB, aluminum frame, Cherry MX-style switches. USB-C detachable cable.",
      zh: "全尺寸热插拔机械键盘，PBT 二次注塑键帽，单键 RGB，铝合金框架，Cherry MX 风格轴体。可拆卸 USB-C 线。",
    },
    priceUSD: 45.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-33-39.webp")],
    category: "Keyboard",
    inventory: 95,
    featured: false,
    active: true,
  },
  {
    id: "p_glidemouse_x",
    slug: "glidemouse-x-wireless-mouse",
    name: { en: "GlideMouse X — Wireless Ergo Mouse", zh: "GlideMouse X 无线人体工学鼠标" },
    description: {
      en: "Ergonomic vertical wireless mouse, silent click buttons, precision scroll wheel, 4000 DPI sensor. USB-C rechargeable, multi-device pairing.",
      zh: "垂直人体工学无线鼠标，静音按键，精密滚轮，4000 DPI 传感器。USB-C 充电，多设备配对。",
    },
    priceUSD: 22.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-37-00.webp")],
    category: "Mouse",
    inventory: 210,
    featured: false,
    active: true,
  },

  /* ─── GAMING ────────────────────────────────── */
  {
    id: "p_gamepad_neo",
    slug: "gamepad-neo-wireless-controller",
    name: { en: "GamePad Neo — Wireless Controller", zh: "GamePad Neo 无线游戏手柄" },
    description: {
      en: "Universal wireless game controller for PC, Switch, Android, and iOS. Hall effect analog sticks, programmable back buttons, 25h battery life.",
      zh: "通用无线游戏手柄，支持 PC/Switch/Android/iOS。霍尔效应摇杆，可编程背键，25 小时续航。",
    },
    priceUSD: 42.9,
    images: [img("Professional_e_commerce_produc_2026-08-04T15-37-27.webp")],
    category: "Gaming",
    inventory: 140,
    featured: false,
    active: true,
  },
];
