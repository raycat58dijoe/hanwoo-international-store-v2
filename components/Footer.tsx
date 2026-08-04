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
              Premium electronics & tech accessories. Free international shipping on orders over $80.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="footer-heading">Shop</h4>
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
            <h4 className="footer-heading">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Returns & Warranty</a></li>
              <li><a href="#">Track Order</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-heading">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Wholesale</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom: copyright + payment icons */}
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-[var(--fg-on-dark-muted)] sm:flex-row">
          <span>© {year} Hanwoo International Inc. {t("footer.rights")}</span>
          <div className="flex items-center gap-3 opacity-60">
            {/* Payment method icons (SVG placeholders) */}
            <span className="font-bold tracking-wide">VISA</span>
            <span className="font-bold tracking-wide">MC</span>
            <span className="font-bold tracking-wide">AMEX</span>
            <span className="font-bold tracking-wide">PayPal</span>
            <span className="font-bold tracking-wide">Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
