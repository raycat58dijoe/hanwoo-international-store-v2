// Map of product category strings to localized labels.
const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  Charger: { en: "Charger", zh: "充电器" },
  "Power Bank": { en: "Power Bank", zh: "充电宝" },
  Cable: { en: "Cable", zh: "数据线" },
  Hub: { en: "USB-C Hub", zh: "USB-C 扩展坞" },
  Earbuds: { en: "Earbuds", zh: "耳机" },
  Headphone: { en: "Headphone", zh: "头戴式耳机" },
  Speaker: { en: "Speaker", zh: "音箱" },
  Keyboard: { en: "Keyboard", zh: "键盘" },
  Mouse: { en: "Mouse", zh: "鼠标" },
  Gaming: { en: "Gaming", zh: "游戏" },
  Watch: { en: "Watch", zh: "手表" },
  Storage: { en: "Storage", zh: "存储" },
  General: { en: "Other", zh: "其他" },
};

export function categoryLabel(category: string, locale: "en" | "zh"): string {
  return CATEGORY_LABELS[category]?.[locale] ?? category;
}