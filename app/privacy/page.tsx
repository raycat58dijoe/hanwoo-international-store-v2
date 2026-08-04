import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Privacy Policy — Hanwoo International Inc." };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated="August 4, 2026">
      <p>
        Hanwoo International Inc. ("we", "us") operates this online store. This policy explains what
        personal information we collect, how we use it, and the choices you have.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">1. Information we collect</h2>
      <ul className="list-disc pl-5">
        <li><b>Order details</b> — your name, email, shipping address and order contents, needed to fulfill and deliver your order.</li>
        <li><b>Payment data</b> — payments are processed by Stripe (card) or Zelle (bank transfer). We never store your full card number.</li>
        <li><b>Device & usage data</b> — basic analytics such as pages visited and browser type, used to improve the store.</li>
      </ul>
      <h2 className="pt-2 font-semibold text-gray-900">2. How we use your information</h2>
      <ul className="list-disc pl-5">
        <li>To process and deliver your orders, including shipment tracking.</li>
        <li>To respond to support requests via our contact form or email.</li>
        <li>To send order updates (we do not send marketing emails unless you opt in).</li>
      </ul>
      <h2 className="pt-2 font-semibold text-gray-900">3. Sharing</h2>
      <p>
        We share data only with the service providers required to run the store: payment processors
        (Stripe, Zelle), the delivery carrier that ships your order, and our hosting provider (Vercel).
        We never sell your personal information.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">4. Data retention & your rights</h2>
      <p>
        Order records are kept as long as needed for accounting and warranty purposes. You may request
        access to, correction of, or deletion of your personal data by contacting us. Where required by
        law (e.g. GDPR), you also have the right to data portability and to object to processing.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">5. Contact</h2>
      <p>
        Questions about this policy? Contact us via the <a className="text-blue-600 underline" href="/contact">contact page</a>.
      </p>
    </InfoPage>
  );
}
