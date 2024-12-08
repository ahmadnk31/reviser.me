"use client"

import { ContactForm } from "@/components/contact-form"
import { Brain, Mail, MessageSquare, Phone } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen cotanienr bg-background">
      <main className="container py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Get in touch with our team for enterprise solutions, custom plans, or any questions.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-muted-foreground">nikzadahmadullah@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-muted-foreground">+32467871205</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MessageSquare className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Live Chat</h3>
                  <p className="text-muted-foreground">Available Monday to Friday, 9am-5pm EST</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-muted rounded-lg">
              <div className="flex items-center space-x-4 mb-4">
                <Brain className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold">Enterprise Features</h2>
              </div>
              <ul className="space-y-3">
                {[
                  "Dedicated account manager",
                  "Custom integration support",
                  "Advanced analytics and reporting",
                  "Custom branding options",
                  "Priority support",
                  "Bulk user management",
                  "API access",
                  "SLA guarantees",
                ].map((feature) => (
                  <li key={feature} className="flex items-center space-x-2">
                    <svg
                      className="h-4 w-4 text-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <ContactForm type="sales" />
          </div>
        </div>
      </main>
    </div>
  )
}