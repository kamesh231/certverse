import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. How We Use Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use cookies for the following purposes:</p>
            <div>
              <h3 className="font-semibold mb-2">2.1 Necessary Cookies</h3>
              <p>These cookies are essential for the website to function properly. They enable core functionality such as security, authentication, and session management.</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Authentication cookies (Clerk)</li>
                <li>Session management</li>
                <li>Security features</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2.2 Analytics Cookies</h3>
              <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Google Analytics - Page views and navigation patterns</li>
                <li>PostHog - User interactions and product analytics</li>
                <li>Sentry - Error tracking and performance monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2.3 Marketing Cookies</h3>
              <p>These cookies are used to deliver personalized advertisements and track campaign effectiveness.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. Types of Cookies We Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Session Cookies</h3>
              <p>Temporary cookies that are deleted when you close your browser. Used for session management and authentication.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Persistent Cookies</h3>
              <p>Cookies that remain on your device for a set period or until you delete them. Used for preferences and analytics.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>4. Third-Party Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We may use third-party services that set cookies:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>Google Analytics:</strong> Website analytics and user behavior tracking</li>
              <li><strong>PostHog:</strong> Product analytics and user session recording</li>
              <li><strong>Sentry:</strong> Error tracking and performance monitoring</li>
              <li><strong>Polar.sh:</strong> Payment processing</li>
            </ul>
            <p>These third parties have their own privacy policies and cookie practices.</p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>5. Google Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We use Google Analytics to understand how visitors interact with our website. Google Analytics collects information such as:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Pages visited and time spent on pages</li>
              <li>Device and browser information</li>
              <li>Geographic location (country/city level)</li>
              <li>Referral sources</li>
            </ul>
            <p>
              Google Analytics uses cookies and may share data with Google. You can opt-out by installing the <Link href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out Browser Add-on</Link> or by managing your preferences through our cookie consent banner.
            </p>
            <p>
              For more information, please review Google's <Link href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>6. PostHog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We use PostHog for product analytics and user behavior analysis. PostHog may collect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>User interactions and events</li>
              <li>Session recordings (with your consent)</li>
              <li>Feature usage and engagement metrics</li>
              <li>Performance data</li>
            </ul>
            <p>
              PostHog's data processing is subject to their <Link href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</Link>. You can opt-out of PostHog tracking through our cookie consent banner.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>7. Managing Your Cookie Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You can manage your cookie preferences in several ways:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use our cookie consent banner to accept or reject cookies</li>
              <li>Customize which types of cookies you accept</li>
              <li>Change your preferences at any time through your browser settings</li>
              <li>Delete cookies that have already been set</li>
            </ul>
            <p>
              Note: Disabling certain cookies may affect the functionality of our website.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>8. Browser Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or alert you when cookies are being sent. However, some features of our website may not function properly if cookies are disabled.
            </p>
            <p className="mt-2">
              Instructions for managing cookies in popular browsers:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li><Link href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</Link></li>
              <li><Link href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</Link></li>
              <li><Link href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</Link></li>
              <li><Link href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</Link></li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>9. Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>10. Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you have any questions about our use of cookies, please contact us:
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


