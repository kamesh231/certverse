import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function GDPRPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">GDPR Compliance Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Certverse is committed to compliance with the General Data Protection Regulation (GDPR) (EU) 2016/679. This GDPR Compliance Policy explains how we protect the personal data of users located in the European Economic Area (EEA) and outlines your rights under GDPR.
            </p>
            <p>
              This policy supplements our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and applies specifically to users in the EEA.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. Legal Basis for Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We process your personal data based on the following legal grounds:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Consent:</strong> When you provide explicit consent for specific processing activities (e.g., marketing emails)</li>
              <li><strong>Contract Performance:</strong> To fulfill our contractual obligations to provide the Service</li>
              <li><strong>Legitimate Interests:</strong> For service improvement, security, and fraud prevention</li>
              <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. Your Rights Under GDPR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">3.1 Right of Access</h3>
              <p>You have the right to obtain confirmation as to whether we process your personal data and to access that data, including copies of your data.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.2 Right to Rectification</h3>
              <p>You have the right to have inaccurate personal data corrected and incomplete data completed.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.3 Right to Erasure ("Right to be Forgotten")</h3>
              <p>You have the right to request deletion of your personal data when:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>The data is no longer necessary for the original purpose</li>
                <li>You withdraw consent and there is no other legal basis</li>
                <li>You object to processing and there are no overriding legitimate grounds</li>
                <li>The data has been unlawfully processed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.4 Right to Restrict Processing</h3>
              <p>You have the right to request restriction of processing in certain circumstances, such as when you contest the accuracy of data or object to processing.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.5 Right to Data Portability</h3>
              <p>You have the right to receive your personal data in a structured, commonly used, and machine-readable format and to transmit that data to another controller.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.6 Right to Object</h3>
              <p>You have the right to object to processing of your personal data based on legitimate interests or for direct marketing purposes.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.7 Rights Related to Automated Decision-Making</h3>
              <p>You have the right not to be subject to decisions based solely on automated processing, including profiling, that produce legal effects or similarly significantly affect you.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.8 Right to Withdraw Consent</h3>
              <p>Where processing is based on consent, you have the right to withdraw consent at any time without affecting the lawfulness of processing based on consent before withdrawal.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>4. Exercising Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>To exercise any of your GDPR rights, please contact us at:</p>
            <p className="mt-2">
              Email: privacy@figulus.io<br />
              Subject: "GDPR Request"
            </p>
            <p>
              We will respond to your request within one month. If we need more time, we will inform you of the reason and the extension period (up to two additional months).
            </p>
            <p>
              We may request verification of your identity before processing your request to ensure the security of your personal data.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>5. Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your personal data may be transferred to and processed in countries outside the EEA, including the United States. We ensure that such transfers comply with GDPR requirements through:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Other appropriate safeguards as required by GDPR</li>
            </ul>
            <p>
              Our service providers (Clerk, Supabase, Polar.sh, Vercel, Railway) have appropriate safeguards in place to protect your data.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>6. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We retain your personal data only for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Provide the Service to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
            <p>
              When you request account deletion, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>7. Data Protection Officer (DPO)</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you have questions about our data processing activities or wish to exercise your rights, you can contact our Data Protection Officer at:
            </p>
            <p className="mt-2">
              Email: dpo@figulus.io<br />
              Subject: "GDPR Inquiry"
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>8. Right to Lodge a Complaint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If you believe that our processing of your personal data violates GDPR, you have the right to lodge a complaint with your local supervisory authority. You can find your local data protection authority at:
            </p>
            <p>
              <Link href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                European Data Protection Board Members
              </Link>
            </p>
            <p>
              However, we encourage you to contact us first so we can address your concerns directly.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>9. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We use cookies and similar technologies in compliance with GDPR and the ePrivacy Directive. We obtain your consent before placing non-essential cookies on your device.
            </p>
            <p>
              You can manage your cookie preferences through your browser settings or our cookie consent banner.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>10. Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update this GDPR Compliance Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes and update the "Last updated" date.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>11. Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              For any questions about our GDPR compliance or to exercise your rights, please contact us:
            </p>
            <p className="mt-2">
              Email: privacy@figulus.io<br />
              Data Protection Officer: dpo@figulus.io<br />
              Website: <Link href="/" className="text-primary hover:underline">certverse.com</Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">← Back to Home</Link>
        </div>
      </main>
    </div>
  )
}

