import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <main className="container mx-auto px-4 py-16 space-y-24">
        {/* Hero Section */}
        <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Revolutionizing Your Study Experience
            </h1>
            <p className="text-xl text-muted-foreground">
              Hi, I'm Ahmadullah Nekzad, founder and CEO of REVISER AI.
              We're on a mission to transform the way you learn and retain information.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src="ahmad.jpeg"
              alt="CEO Portrait"
              width={400}
              height={400}
              className="rounded-lg border-4 border-primary shadow-lg"
            />
          </div>
        </section>

        {/* Mission Statement */}
        <section className="text-center space-y-4">
          <h2 className="text-3xl font-semibold">Our Mission</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            At [Your SaaS Name], we believe in [core belief]. Our goal is to [mission statement].
            We're committed to delivering innovative solutions that [key benefit for customers].
          </p>
        </section>

        {/* Personal Story */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold text-center">My Story</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-2xl font-semibold">The Journey</h3>
                <p className="text-muted-foreground">
                  My journey began when I wanted to learn Microsoft ACCESS.When I created a simple calculator in MS ACCESS, it was amazing but I pondered a lot. How does Facebook and how it is created. After all these researches, I found that it is created by PHP and MySQL. So I decided to follow programming. I started with Java and ended up with Javascript.
                  I knew there had to be a better way. That's when the idea for REVISER AI was born.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-2xl font-semibold">The Vision</h3>
                <p className="text-muted-foreground">
                  I envision a future where transform the way people learn and retain information.
                  REVISER AI is at the forefront of this transformation,
                  empowering teachers and students to achieve their full potential.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Company Values */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold text-center">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Innovation", description: "We constantly push the boundaries of what's possible." },
              { title: "Customer-Centric", description: "Our customers' success is our top priority." },
              { title: "Integrity", description: "We believe in transparency and ethical business practices." },
              { title: "Collaboration", description: "Great ideas come from diverse perspectives working together." },
              { title: "Excellence", description: "We strive for excellence in everything we do." },
              { title: "Adaptability", description: "We embrace change and evolve with the market." },
            ].map((value, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-6">
          <h2 className="text-3xl font-semibold">Join Us on This Journey</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're excited about the future and we'd love for you to be a part of it.
            Experience the REVISER AI difference today.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Start Your Free Trial</Link>
          </Button>
        </section>
      </main>
    </div>
  )
}

