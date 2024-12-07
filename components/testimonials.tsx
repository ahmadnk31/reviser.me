import { motion } from 'framer-motion';
import Image from 'next/image';

const testimonials = [
  {
    quote: "This app has completely transformed how I study. The AI-generated flashcards save me so much time!",
    author: "Sarah Johnson",
    role: "Medical Student",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
  },
  {
    quote: "The spaced repetition system really works. I've seen a huge improvement in my retention.",
    author: "Michael Chen",
    role: "Language Learner",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
  },
  {
    quote: "Perfect for exam preparation. The analytics help me focus on what I need to review most.",
    author: "Emily Rodriguez",
    role: "Law Student",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
  },
];

export function Testimonials() {
  return (
    <section className="bg-muted py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied learners using Flashcard Master
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-lg p-6 shadow-lg"
            >
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="ml-4">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground">{testimonial.quote}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}