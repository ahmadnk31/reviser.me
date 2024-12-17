import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TermsOfService() {
  return (
    <div className="space-y-6 mx-6 my-4">
      <h1 className="text-3xl font-bold text-center mb-6">Terms of Service</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p>By accessing or using our AI SaaS service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our service.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Use of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You agree to use our service only for lawful purposes and in accordance with these Terms. You are prohibited from:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Using the service in any way that violates any applicable laws</li>
            <li>Attempting to interfere with or disrupt the service or servers</li>
            <li>Impersonating or attempting to impersonate our company or employees</li>
            <li>Using the service for any fraudulent or illegal purpose</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The service and its original content, features, and functionality are owned by our company and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Termination</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We may terminate or suspend your access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent>
          <p>In no event shall our company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes by posting the new Terms on this page and updating the "Last Updated" date.</p>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-gray-500 mt-8">Last Updated: {new Date().toLocaleDateString()}</p>
    </div>
  )
}

