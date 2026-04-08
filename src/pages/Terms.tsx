import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
        
        <div className="glass rounded-3xl p-8 md:p-12">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">1. Introduction</h2>
                <p>
                  Welcome to Hartlepool Industrial Exchange (HiX). These Terms and Conditions govern your use of our platform and services. By registering as a user, you agree to be bound by these terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">2. Eligibility & Registration</h2>
                <p>
                  HiX is a B2B marketplace. Only legally registered companies and small businesses with a valid VAT registration are eligible to use the platform. All registrations are subject to manual vetting by our administration team.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">3. Commissions & Payments</h2>
                <p>
                  HiX charges a commission on every successful transaction:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Sellers: 7% of the total sale price.</li>
                  <li>Buyers: 3% of the total purchase price.</li>
                </ul>
                <p className="mt-4">
                  All financial transactions are processed securely via Stripe Connect. Users must maintain a valid company bank account connected to their Stripe account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">4. Seller Responsibilities</h2>
                <p>
                  Sellers are strictly bound to provide assets that exactly match their advertisement in terms of description, quantity, and condition. Any discrepancy between the advertised asset and the delivered asset is a violation of these terms and may result in immediate suspension or deletion of the seller's account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">5. Reporting & Dispute Resolution</h2>
                <p>
                  Users (both buyers and sellers) have the right to report any counterparty that violates these terms during a transaction. Reports are reviewed by the HiX administration team.
                </p>
                <p className="mt-4">
                  The Super Admin reserves the right to suspend or permanently delete any user account found to be in breach of platform rules, including but not limited to: misrepresentation of assets, failure to pay commissions, or unprofessional conduct.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">6. Buyer Responsibilities</h2>
                <p>
                  Buyers are responsible for arranging logistics and transport for purchased assets. HiX provides a list of vetted hauling partners, but the final contract for transport is between the buyer and the hauler.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">6. Sustainability & ESG</h2>
                <p>
                  HiX provides automated ESG certificates based on CO2 savings calculated from transactions. These certificates are for informational purposes and represent the estimated environmental impact of the trade.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
                <p>
                  Hartlepool Industrial Exchange LTD acts as a facilitator for trades and is not responsible for the quality of goods traded or the performance of logistics partners. Our liability is limited to the commissions collected on the specific transaction in dispute.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">8. Governing Law</h2>
                <p>
                  These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England.
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
