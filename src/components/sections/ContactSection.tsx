import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative w-full py-20 md:py-32 bg-white dark:bg-slate-950">
      <div className="max-w-[100rem] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-foreground dark:text-white mb-8">
              Get in Touch
            </h2>

            <p className="text-lg font-paragraph text-foreground/60 dark:text-gray-400 mb-12">
              Ready to collaborate on your next project? I'd love to hear about your vision and discuss how we can bring it to life.
            </p>

            {/* Contact Methods */}
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Mail className="h-6 w-6 text-primary dark:text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground dark:text-white mb-1">
                    Email
                  </h3>
                  <a
                    href="mailto:hello@studio.com"
                    className="text-foreground/60 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground transition-colors"
                  >
                    hello@studio.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Phone className="h-6 w-6 text-primary dark:text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground dark:text-white mb-1">
                    Phone
                  </h3>
                  <a
                    href="tel:+1234567890"
                    className="text-foreground/60 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground transition-colors"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <MapPin className="h-6 w-6 text-primary dark:text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground dark:text-white mb-1">
                    Location
                  </h3>
                  <p className="text-foreground/60 dark:text-gray-400">
                    New York, NY
                    <br />
                    Available for travel
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-12 pt-8 border-t border-foreground/10 dark:border-gray-700">
              <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 mb-4">
                Follow for daily inspiration
              </p>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground transition-colors font-paragraph text-sm"
                >
                  Instagram
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground transition-colors font-paragraph text-sm"
                >
                  LinkedIn
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground transition-colors font-paragraph text-sm"
                >
                  Twitter
                </a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-heading font-semibold text-foreground dark:text-white mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-foreground/20 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-foreground dark:text-white placeholder-foreground/40 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-foreground transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-heading font-semibold text-foreground dark:text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-foreground/20 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-foreground dark:text-white placeholder-foreground/40 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-foreground transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-heading font-semibold text-foreground dark:text-white mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-foreground/20 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-foreground dark:text-white placeholder-foreground/40 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-foreground transition-all"
                  placeholder="Project inquiry"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-heading font-semibold text-foreground dark:text-white mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-foreground/20 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-foreground dark:text-white placeholder-foreground/40 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-foreground transition-all resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <p className="text-sm font-paragraph text-green-800 dark:text-green-200">
                    Thank you! I'll get back to you soon.
                  </p>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm font-paragraph text-red-800 dark:text-red-200">
                    Something went wrong. Please try again.
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary dark:bg-primary-foreground text-white dark:text-foreground font-heading font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs font-paragraph text-foreground/50 dark:text-gray-500 text-center">
                I typically respond within 24 hours
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
