"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container-page">
        {/* Top section: links grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 pb-10 border-b border-white/8">
          {/* Brand */}
          <div>
            <div className="text-lg font-extrabold text-white tracking-wider mb-3">
              HANWOO
            </div>
            <p className="text-xs leading-relaxed text-[var(--fg-on-dark-muted)]">
              {t("home.hero.subtitle")}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="footer-heading">{t("nav.shop")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=Charger">Chargers</Link></li>
              <li><Link href="/products?category=Power+Bank">Power Banks</Link></li>
              <li><Link href="/products?category=Cable">Cables</Link></li>
              <li><Link href="/products?category=Hub">USB-C Hubs</Link></li>
              <li><Link href="/products?category=Earbuds">Audio</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="footer-heading">{t("footer.support")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account">{t("nav.account")}</Link></li>
              <li><Link href="/track">{t("footer.trackOrder")}</Link></li>
              <li><Link href="/faq">{t("footer.faqs")}</Link></li>
              <li><Link href="/shipping">{t("footer.shippingInfo")}</Link></li>
              <li><Link href="/returns">{t("footer.returns")}</Link></li>
              <li><Link href="/contact">{t("footer.contactUs")}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-heading">{t("footer.about")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact">{t("footer.contactUs")}</Link></li>
              <li><Link href="/privacy">{t("footer.privacy")}</Link></li>
              <li><Link href="/terms">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom: copyright + payment icons */}
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-[var(--fg-on-dark-muted)] sm:flex-row">
          <span>{(t("footer.copyright") ?? "© {year} Hanwoo International Inc.").replace("{year}", String(year))}</span>
          <div className="flex items-center gap-3 opacity-60">
            <span className="font-bold tracking-wide">Stripe</span>
            <span className="font-bold tracking-wide">Zelle</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
