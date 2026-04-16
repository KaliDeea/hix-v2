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
                <h2 className="text-xl font-bold text-foreground mb-4">1. THE FACILITATOR STATUS</h2>
                <p>
                  <strong>1.1. Neutrality:</strong> Hartlepool Industrial Exchange LTD ("HiX") is a neutral platform provider and facilitation service. HiX is not an auctioneer, a stock-holding dealer, or a party to any contract of sale between Users.
                </p>
                <p className="mt-2">
                  <strong>1.2. Title and risk:</strong> Title and risk in any Asset pass directly from Seller to Buyer. At no point does HiX take legal possession or title of any Asset.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">2. ELIGIBILITY AND "BEYOND REASONABLE DOUBT" VETTING</h2>
                <p>
                  <strong>2.1. Registration:</strong> Registration is restricted to UK-registered business entities with a valid VAT number.
                </p>
                <p className="mt-2">
                  <strong>2.2. Termination:</strong> HiX reserves the right to terminate access instantly if a User is found to have misrepresented their business status or provided falsified ESG data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">3. MANDATORY COMMISSION FORMULAS</h2>
                <p>
                  By transacting on HiX, both parties agree to the following non-negotiable fees:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Seller Service Fee:</strong> 7% of Gross Price. Covers platform listing and facilitation.</li>
                  <li><strong>Buyer Certification Fee:</strong> 3% of Gross Price. Covers the ESG Audit and Compliance Certification.</li>
                </ul>
                <p className="mt-4">
                  <strong>Total Revenue:</strong> HiX captures a total of 10% per transaction. Attempting to bypass the platform ("Off-Platform Trading") results in a £5,000 Liquidated Damages penalty per instance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">4. WARRANTY DISCLAIMER</h2>
                <p>
                  <strong>4.1. No Inspection:</strong> HiX does not inspect, verify, weigh, or test any Assets. All Assets are sold "As-Is, Where-Is."
                </p>
                <p className="mt-2">
                  <strong>4.2. Due Diligence:</strong> The Buyer assumes 100% responsibility for verifying the quality, safety, and "Fitness for Purpose" of the Asset before purchase.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">5. ESG METHODOLOGY & CMA COMPLIANCE</h2>
                <p>
                  To prevent Greenwashing claims under the UK CMA Green Claims Code, HiX declares its carbon savings methodology:
                </p>
                <p className="mt-2">
                  <strong>Methodology:</strong> Displaced Production Model (DPM).
                </p>
                <p className="mt-2">
                  <strong>Formula:</strong> Mass (Tonnes) x 1.85 = tCO2e Diverted.
                </p>
                <p className="mt-2">
                  <strong>Status:</strong> Certificates are high-level estimates for Corporate Social Responsibility (CSR) reporting. They are not tradable carbon credits (Offsets) and should not be used for statutory financial filings without independent third-party verification.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">6. LOGISTICS INDEMNITY</h2>
                <p>
                  HiX may suggest "Vetted Haulers," but the contract for haulage is strictly between the User and the Hauler. HiX is not liable for transport delays, damage in transit, or industrial accidents occurring during loading/unloading.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">7. SECTION 8: (LIMITATION OF LIABILITY)</h2>
                <p className="font-bold text-foreground mb-2">PLEASE READ CAREFULLY. THIS SECTION LIMITS YOUR RIGHT TO SUE.</p>
                <p>
                  <strong>7.1. The Financial Cap:</strong> To the maximum extent permitted by the Unfair Contract Terms Act 1977, the total aggregate liability of HiX for any claim (whether in contract, tort, or negligence) is strictly capped at the total commission fee (10%) actually collected by HiX for the transaction in dispute.
                </p>
                <p className="mt-2">
                  <strong>7.2. No Consequential Loss:</strong> Under no circumstances is HiX liable for: Loss of profit or revenue; Factory or production downtime; Business interruption or "loss of opportunity"; Damage to corporate reputation.
                </p>
                <p className="mt-2">
                  <strong>7.3. The Insurance Warranty:</strong> Users warrant they maintain their own Public Liability insurance (min. £2,000,000). HiX is a secondary, capped recovery source only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">8. DISPUTE RESOLUTION AND JURISDICTION</h2>
                <p>
                  <strong>8.1. Governing Law:</strong> This agreement is governed by the laws of England and Wales.
                </p>
                <p className="mt-2">
                  <strong>8.2. Jurisdiction:</strong> Any legal proceedings shall be held exclusively in the courts of England, specifically the North East Circuit (Teesside/Newcastle).
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
