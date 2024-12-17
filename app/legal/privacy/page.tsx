import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 mx-6 my-4">
      <h1 className="text-3xl font-bold text-center mb-6">Privacy Policy</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Payment information</li>
            <li>Usage data and interactions with our services</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Data Security</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Your Rights</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>The right to access your personal information</li>
            <li>The right to rectify inaccurate personal information</li>
            <li>The right to request deletion of your personal information</li>
            <li>The right to restrict or object to processing of your personal information</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-gray-500 mt-8">Last Updated: {new Date().toLocaleDateString()}</p>
    </div>
  )
}

