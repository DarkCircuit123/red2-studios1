import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { playClickSound } from '@/lib/click-sound';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const clearStatusMessage = useCallback(() => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
  }, []);

  const showStatus = useCallback((status: 'success' | 'error', message: string) => {
    clearStatusMessage();
    setSubmitStatus(status);
    setStatusMessage(message);
    statusTimeoutRef.current = setTimeout(() => {
      setSubmitStatus('idle');
      setStatusMessage('');
    }, 4000);
  }, [clearStatusMessage]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    clearStatusMessage();

    try {
      // Basic validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        showStatus('error', 'Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        showStatus('error', 'Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // Simulate form submission (in production, this would send to a backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showStatus('success', 'Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset form if ref exists
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error) {
      console.error('[ContactSection] Form submission error:', error);
      showStatus('error', 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, clearStatusMessage, showStatus]);

  return (
    <section id="contact" className="relative w-full py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 0% 100%, rgba(73, 7, 8, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 0%, rgba(73, 7, 8, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 100%, rgba(73, 7, 8, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
        />
      </div>

      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black text-white mb-6 md:mb-8 tracking-tighter leading-none">
              Get in
              <br />
              <motion.span
                className="text-primary"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Touch
              </motion.span>
            </h2>

            <p className="text-sm md:text-base font-paragraph text-white/70 mb-8 md:mb-10 leading-relaxed">
              Ready to collaborate on your next project? I'd love to hear about your vision and discuss how we can bring it to life.
            </p>

            {/* Contact Methods - Enhanced with animations */}
            <div className="space-y-6 md:space-y-8">
              {[
                { icon: Mail, label: 'Email', value: 'hello@red2studios.com', href: 'mailto:hello@red2studios.com' },
                { icon: Phone, label: 'Phone', value: '+1 (310) 386-0405', href: 'tel:+13103860405' },
                { icon: MapPin, label: 'Location', value: 'Los Angeles, CA & Worldwide', href: '#' },
              ].map((contact, i) => {
                const Icon = contact.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="flex gap-6 group"
                  >
                    <motion.div
                      className="flex-shrink-0 pt-1"
                      whileHover={{ scale: 1.2, color: '#4A0820' }}
                    >
                      <Icon className="w-5 h-5 text-white/60 group-hover:text-primary transition-colors" />
                    </motion.div>
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2 group-hover:text-primary transition-colors">
                        {contact.label}
                      </h3>
                      <a
                        href={contact.href}
                        onClick={playClickSound}
                        className="text-base font-paragraph text-white hover:text-primary transition-colors duration-300"
                      >
                        {contact.value}
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 pt-8 border-t border-primary/30"
            >
              <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-6">
                Follow for daily inspiration
              </p>
              <div className="flex gap-6">
                {['Instagram', 'LinkedIn', 'Twitter'].map((social, i) => (
                  <motion.a
                    key={i}
                    href={`https://${social.toLowerCase()}.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={playClickSound}
                    whileHover={{ scale: 1.1, color: '#4A0820' }}
                    className="text-sm font-paragraph text-white/60 hover:text-primary transition-colors duration-300"
                  >
                    {social}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              {[
                { id: 'name', label: 'Full Name', placeholder: 'Your name', type: 'text' },
                { id: 'email', label: 'Email Address', placeholder: 'your@email.com', type: 'email' },
                { id: 'subject', label: 'Subject', placeholder: 'Project inquiry', type: 'text' },
              ].map((field, i) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <label htmlFor={field.id} className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3 group-hover:text-primary transition-colors">
                    {field.label} *
                  </label>
                  <input
                    type={field.type}
                    id={field.id}
                    name={field.id}
                    value={formData[field.id as keyof typeof formData]}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-3 border-b-2 border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors duration-300"
                    placeholder={field.placeholder}
                  />
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <label htmlFor="message" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-0 py-3 border-b-2 border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors duration-300 resize-none"
                  placeholder="Tell me about your project..."
                />
              </motion.div>

              {/* Status Messages - Enhanced */}
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 bg-primary/10 border-2 border-primary rounded-lg"
                >
                  <p className="text-sm font-paragraph text-primary font-semibold">
                    ✓ Thank you! I'll get back to you soon.
                  </p>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 bg-red-500/10 border-2 border-red-500/50 rounded-lg"
                >
                  <p className="text-sm font-paragraph text-red-400">
                    {statusMessage || 'Something went wrong. Please try again.'}
                  </p>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(73, 7, 8, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-4 bg-primary text-white font-heading font-bold text-sm tracking-widest uppercase hover:bg-primary/90 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
                <span className="relative z-10">
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block mr-2"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Send className="w-4 h-4 inline-block ml-2" />
                      </motion.div>
                    </>
                  )}
                </span>
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
                className="text-xs font-mono text-white/30 text-center uppercase tracking-widest hover:text-primary transition-colors"
              >
                I typically respond within 24 hours
              </motion.p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
