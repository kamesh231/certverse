import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By accessing and using Certverse ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Certverse is an online platform designed to help users prepare for the CISA (Certified Information Systems Auditor) certification exam. The Service provides:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Practice questions and study materials</li>
              <li>Performance tracking and analytics</li>
              <li>Study modes and test simulations</li>
              <li>Progress monitoring and recommendations</li>
            </ul>
            <p className="mt-4">
              <strong>Analytics and Tracking:</strong> We use Google Analytics and PostHog to analyze website usage, improve our Service, and understand user behavior. By using our Service, you consent to the collection and processing of analytics data as described in our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. You can opt-out of analytics tracking through our cookie consent banner.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2.1 Analytics and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We use third-party analytics services (Google Analytics and PostHog) to understand how users interact with our Service. These services may collect information about your use of the Service, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Pages visited and navigation patterns</li>
              <li>Time spent on pages</li>
              <li>User interactions and events</li>
              <li>Device and browser information</li>
            </ul>
            <p>
              This data helps us improve our Service and user experience. You can manage your analytics preferences through our cookie consent banner or by adjusting your browser settings. For more information, please see our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">3.1 Account Creation</h3>
              <p>To use certain features of the Service, you must create an account. You agree to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3.2 Account Termination</h3>
              <p>We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activity.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>4. Subscription and Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">4.1 Free and Premium Plans</h3>
              <p>The Service offers both free and premium subscription plans. Free users are limited to 2 questions per day. Premium subscribers receive unlimited access to questions and additional features.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4.2 Payment Terms</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Subscription fees are billed in advance on a recurring basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We reserve the right to change our pricing with 30 days' notice</li>
                <li>You may cancel your subscription at any time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4.3 Refunds</h3>
              <p>Refunds are provided only in accordance with our refund policy or as required by applicable law. Contact us for refund requests.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>5. Copyright and Intellectual Property Protection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold text-destructive">
              All questions, explanations, and study materials provided through the Service are protected by copyright and are the exclusive property of Certverse and its licensors.
            </p>
            <p>You expressly agree that you will NOT:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Reproduce</strong> any questions or content in any form or by any means</li>
              <li><strong>Tweak, modify, or alter</strong> any questions or content</li>
              <li><strong>Transmit, distribute, or share</strong> any questions or content with any third party, including but not limited to other users, websites, forums, social media platforms, or study groups</li>
              <li><strong>Copy, screenshot, or save</strong> questions for distribution purposes</li>
              <li><strong>Create derivative works</strong> based on our questions or content</li>
              <li><strong>Use automated tools</strong> to extract, scrape, or download questions</li>
            </ul>
            <p>
              Any violation of these copyright restrictions may result in immediate termination of your account, legal action, and liability for damages. We employ watermarking and tracking technologies to identify unauthorized sharing of our content.
            </p>
            <p>
              If you become aware of any unauthorized use or sharing of our questions, please report it immediately to <Link href="mailto:legal@figulus.io" className="text-primary hover:underline">legal@figulus.io</Link>.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>6. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Share, copy, reproduce, or distribute our questions or content without authorization</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              All content, features, and functionality of the Service, including but not limited to questions, explanations, software, and design, are owned by Certverse and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise exploit any content from the Service without our express written permission.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>8. Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p>
              We do not guarantee that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>9. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CERTVERSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p>
              Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>10. Indemnification</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You agree to indemnify and hold harmless Certverse, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of the Service or violation of these Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>11. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>12. Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Telangana, India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Telangana, India.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>13. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p className="mt-2">
              Email: legal@figulus.io<br />
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

