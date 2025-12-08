import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Certverse ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our CISA exam preparation platform (the "Service").
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">2.1 Personal Information</h3>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Name and email address (via Clerk authentication)</li>
                <li>Account preferences and settings</li>
                <li>Payment information (processed securely through Polar.sh)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2.2 Usage Data</h3>
              <p>We automatically collect information about how you use our Service:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Questions answered and responses submitted</li>
                <li>Study session data and performance metrics</li>
                <li>Device information and IP address (for security and analytics)</li>
                <li>Browser type and version</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2.3 Cookies and Tracking</h3>
              <p>We use cookies and similar tracking technologies to track activity on our Service and store certain information. We use the following analytics and tracking services:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li><strong>Google Analytics:</strong> To analyze website traffic and user behavior</li>
                <li><strong>PostHog:</strong> For product analytics and user session recording</li>
                <li><strong>Sentry:</strong> For error tracking and performance monitoring</li>
              </ul>
              <p className="mt-2">You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. You can also manage your cookie preferences through our cookie consent banner.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use the collected information for various purposes:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>To provide and maintain our Service</li>
              <li>To personalize your learning experience</li>
              <li>To track your progress and performance</li>
              <li>To analyze website usage and improve our Service (via Google Analytics and PostHog)</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send you notifications and updates (with your consent)</li>
              <li>To detect, prevent, and address technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>4. Data Storage and Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your data is stored securely using Supabase (PostgreSQL database) with industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>5. Data Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Service Providers:</strong> With third-party service providers including:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Clerk for authentication</li>
                  <li>Polar.sh for payments</li>
                  <li>Supabase for database storage</li>
                  <li>Vercel and Railway for hosting</li>
                  <li>Google Analytics for website analytics</li>
                  <li>PostHog for product analytics and user behavior tracking</li>
                  <li>Sentry for error tracking and monitoring</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
            </ul>
            <p className="mt-2">
              <strong>Analytics Services:</strong> Google Analytics and PostHog may collect information about your use of our Service, including pages visited, time spent, and interactions. This data is used to improve our Service and understand user behavior. You can opt-out of analytics tracking through our cookie consent banner.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>5.1 Third-Party Analytics Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Google Analytics</h3>
              <p>
                We use Google Analytics to understand how visitors interact with our website. Google Analytics collects information such as:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Pages visited and time spent on pages</li>
                <li>Device and browser information</li>
                <li>Geographic location (country/city level)</li>
                <li>Referral sources</li>
              </ul>
              <p className="mt-2">
                Google Analytics uses cookies and may share data with Google. You can opt-out by installing the <Link href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out Browser Add-on</Link> or by managing your preferences through our cookie consent banner.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">PostHog</h3>
              <p>
                We use PostHog for product analytics and user behavior analysis. PostHog may collect:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>User interactions and events</li>
                <li>Session recordings (with your consent)</li>
                <li>Feature usage and engagement metrics</li>
                <li>Performance data</li>
              </ul>
              <p className="mt-2">
                PostHog's data processing is subject to their <Link href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</Link>. You can opt-out of PostHog tracking through our cookie consent banner.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>6. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise these rights, please contact us at the email address provided below.</p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>7. Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>8. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>9. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>10. Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p className="mt-2">
              Email: privacy@figulus.io<br />
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

