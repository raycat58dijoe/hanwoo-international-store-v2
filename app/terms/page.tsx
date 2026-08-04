import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Terms of Service — Hanwoo International Inc." };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service" updated="August 4, 2026">
      <p>
        These terms govern your use of the Hanwoo International Inc. online store. By placing an order
        you agree to the terms below.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">1. Orders & payment</h2>
      <ul className="list-disc pl-5">
        <li>All prices are listed in USD. Payment is collected in USD at checkout.</li>
        <li>We accept credit/debit cards via Stripe and bank transfers via Zelle (manual confirmation).</li>
        <li>An order is confirmed once payment is received. We may cancel orders that appear fraudulent or contain incorrect details.</li>
      </ul>
      <h2 className="pt-2 font-semibold text-gray-900">2. Shipping</h2>
      <p>
        Orders ship within 1–3 business days after payment confirmation. International delivery
        typically takes 7–21 business days depending on destination and customs. Shipping fees and free
        shipping thresholds are shown at checkout and on our shipping page.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">3. Returns & warranty</h2>
      <p>
        See our <a className="text-blue-600 underline" href="/returns">Returns & Warranty</a> page for details.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">4. Liability</h2>
      <p>
        Products are provided "as is" to the extent permitted by law. Our liability is limited to the
        amount paid for the products in question. Nothing in these terms limits rights that cannot be
        limited under applicable consumer law.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">5. Contact</h2>
      <p>
        Questions? Reach us via the <a className="text-blue-600 underline" href="/contact">contact page</a>.
      </p>
    </InfoPage>
  );
}
