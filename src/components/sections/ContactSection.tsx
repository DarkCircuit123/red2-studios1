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
    <section id="contact" className="relative w-full py-24 md:py-32 bg-slate-950">
      <div className="max-w-[120rem] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-12 tracking-tighter">
              Get in Touch
            </h2>

            <p className="text-base font-paragraph text-white/70 mb-16 leading-relaxed">
              Ready to collaborate on your next project? I'd love to hear about your vision and discuss how we can bring it to life.
            </p>

            {/* Contact Methods - Ultra-minimal */}
            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="flex-shrink-0 pt-1">
                  <Mail className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest text-white/40 mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:hello@studio.com"
                    className="text-base font-paragraph text-white hover:text-white/70 transition-colors"
                  >
                    hello@studio.com
                  </a>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 pt-1">
                  <Phone className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest text-white/40 mb-2">
                    Phone
                  </h3>
                  <a
                    href="tel:+1234567890"
                    className="text-base font-paragraph text-white hover:text-white/70 transition-colors"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 pt-1">
                  <MapPin className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest text-white/40 mb-2">
                    Location
                  </h3>
                  <p className="text-base font-paragraph text-white">
                    New York, NY
                    <br />
                    Available for travel
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-16 pt-12 border-t border-white/10">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-6">
                Follow for daily inspiration
              </p>
              <div className="flex gap-6">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
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
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-0 py-3 border-b border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-0 py-3 border-b border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-0 py-3 border-b border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                  placeholder="Project inquiry"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-0 py-3 border-b border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white/5 border border-white/20"
                >
                  <p className="text-sm font-paragraph text-white/80">
                    Thank you! I'll get back to you soon.
                  </p>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30"
                >
                  <p className="text-sm font-paragraph text-red-300">
                    Something went wrong. Please try again.
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-white text-slate-950 font-heading font-semibold text-sm tracking-wide hover:bg-white/90 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs font-mono text-white/30 text-center uppercase tracking-widest">
                I typically respond within 24 hours
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
