import { Brain, Sparkles, Users, LineChart, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: "Smart Learning",
    description: "Adaptive algorithm that learns with you and optimizes your study schedule",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Generate high-quality flashcards instantly with our advanced AI technology",
  },
  {
    icon: Users,
    title: "Collaborative",
    description: "Share decks and study together with friends or classmates",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "Detailed analytics and insights to monitor your learning journey",
  },
  {
    icon: Clock,
    title: "Spaced Repetition",
    description: "Scientifically proven method to improve long-term retention",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description: "Your study materials are always private and secure",
  },
];

export function Features() {
  return (
    <section className="container py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
        <p className="text-lg text-muted-foreground">
          Everything you need to master any subject effectively
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-lg border bg-background p-2"
          >
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <feature.icon className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <h3 className="font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}