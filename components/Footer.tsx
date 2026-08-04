"use client";

import { useI18n } from "./I18nProvider";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="container-page flex flex-col items-center justify-between gap-2 py-8 text-sm text-gray-500 sm:flex-row">
        <span className="font-bold text-gray-800">Hanwoo International Inc.</span>
        <span>
          © {year} Hanwoo International Inc. {t("footer.rights")}
        </span>
      </div>
    </footer>
  );
}
