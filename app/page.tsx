'use client'
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Features } from '@/components/features';
import { Testimonial } from '@/components/testimonial';
import { motion } from 'framer-motion';
import { PricingTables } from '@/components/pricing-tables';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import RetroGrid from '@/components/ui/retro-grid';
import { AvatarCircle } from '@/components/avatar-circle';
import { HowItWorksVideo } from '@/components/how-it-works-video';

export default function Home() {
  const supabase=createClient()
  const router=useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const fetchUserId = async () => {
      const { data:{user} } = await supabase.auth.getUser()
      if(user?.id){
        setUserId(user.id)
      }
    };
    fetchUserId();
  }, []);
  if(userId){
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 flex items-center justify-center md:pt-10 lg:py-32 h-[80vh]">
          <div className="container flex max-w-[64rem] flex-col justify-center items-center gap-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                Master Any Subject with Smart{" "}
                <span className="text-primary">Spaced Repetition</span>
              </h1>
              <p className="mt-4 max-w-[42rem] mx-auto leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                Learn more effectively with our scientifically-proven spaced repetition system.
                Create, share, and master flashcards that adapt to your learning pace.
              </p>
              <div className='flex items-center justify-center mt-6'>
              <AvatarCircle  />
              </div>
              <div className="mt-8 space-x-4 relative z-50">
                <Button size="lg" asChild>
                  <Link href="/signup">Start Learning</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">Try Demo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
          <RetroGrid />
        </section>
        <div className='mx-6 mt-40'>
          <h1 className="text-3xl mb-16 font-bold text-center text-white">
            How it works
          </h1>
          <HowItWorksVideo />
        </div>
        <Features />

        <section className="container py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                  alt="Students studying"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-4">
                  AI-Powered Learning Assistant
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Our advanced AI technology helps you create high-quality flashcards instantly.
                  Focus on learning while we handle the content creation.
                </p>
                <ul className="space-y-4">
                  {[
                    "Instant flashcard generation for any topic",
                    "Smart review scheduling based on your performance",
                    "Detailed analytics to track your progress",
                    "Collaborative learning features",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="h-6 w-6 text-primary mr-2"
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
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

          
        <Testimonial />

        <section className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that's right for you
            </p>
          </div>
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <PricingTables billingInterval="monthly" />
            </motion.div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/pricing">Compare Plans</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-muted-foreground hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
                <li><Link href="/demo" className="text-muted-foreground hover:text-primary">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about-me" className="text-muted-foreground hover:text-primary">About</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Blog</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-muted-foreground hover:text-primary">Documentation</Link></li>
                <li><Link href="/help" className="text-muted-foreground hover:text-primary">Help Center</Link></li>
                <li><Link href="/guides" className="text-muted-foreground hover:text-primary">Guides</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/legal/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link></li>
                <li><Link href="/legal/terms" className="text-muted-foreground hover:text-primary">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t">
            <p className="text-center text-muted-foreground">
              © {new Date().getFullYear()} Reviser. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}