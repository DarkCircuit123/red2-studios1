import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, AlertCircle } from 'lucide-react';
import { playClickSound } from '@/lib/click-sound';
import { advancedSpamDetection, behavioralBiometrics, ddosMitigation } from '@/lib/next-gen-security';
import { InputValidator, RateLimiter } from '@/lib/security-enhanced';

const contactFormLimiter = new RateLimiter(3, 60000); // 3 submissions per minute

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '', // Hidden field for bot detection
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'blocked'>('idle');
  const [blockMessage, setBlockMessage] = useState('');
  const formStartTime = useRef<number>(0);
  const lastKeyPressTime = useRef<number>(0);
  const keyPressIntervals = useRef<number[]>([]);
  const mouseMovements = useRef<{ x: number; y: number }[]>([]);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize form tracking on mount
  useEffect(() => {
    formStartTime.current = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastMousePos.current.x, 2) +
        Math.pow(e.clientY - lastMousePos.current.y, 2)
      );
      mouseMovements.current.push({ x: e.clientX, y: e.clientY });
      if (mouseMovements.current.length > 100) {
        mouseMovements.current.shift();
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      // Track behavior for biometrics
      behavioralBiometrics.recordBehavior({
        mouseX: e.clientX,
        mouseY: e.clientY,
        keyPressInterval: 0,
        scrollVelocity: 0,
        clickPrecision: distance,
        focusTime: 0,
        blurTime: 0,
      });
    };

    const handleKeyPress = () => {
      const now = Date.now();
      if (lastKeyPressTime.current > 0) {
        keyPressIntervals.current.push(now - lastKeyPressTime.current);
        if (keyPressIntervals.current.length > 50) {
          keyPressIntervals.current.shift();
        }
      }
      lastKeyPressTime.current = now;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setIsSubmitting(true);

    try {
      // 1. Check honeypot (bot detection)
      if (formData.honeypot) {
        setSubmitStatus('blocked');
        setBlockMessage('Submission blocked: Invalid data detected');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // 2. Rate limiting check
      const clientFingerprint = `${navigator.userAgent}-${window.location.hostname}`;
      if (!contactFormLimiter.isAllowed(clientFingerprint)) {
        setSubmitStatus('blocked');
        setBlockMessage('Too many submissions. Please try again later.');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // 3. DDoS check
      const ddosCheck = ddosMitigation.recordRequest(clientFingerprint);
      if (ddosCheck.recommendation === 'BLOCK') {
        console.warn('[SECURITY] DDoS mitigation triggered');
        setSubmitStatus('blocked');
        setBlockMessage('Request blocked for security reasons');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // 4. Input validation
      if (!InputValidator.isValidEmail(formData.email)) {
        setSubmitStatus('error');
        setBlockMessage('Invalid email address');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // 5. Form fill time check (bots fill too fast)
      const fillTime = Date.now() - formStartTime.current;
      if (fillTime < 2000) {
        console.warn('[SECURITY] Form filled too quickly - likely bot');
        setSubmitStatus('blocked');
        setBlockMessage('Submission blocked: Invalid behavior detected');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // 6. Behavioral biometrics check
      if (behavioralBiometrics.isBotLikeBehavior()) {
        console.warn('[SECURITY] Bot-like behavior detected');
        setSubmitStatus('blocked');
        setBlockMessage('Submission blocked: Suspicious activity detected');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // 7. Advanced spam detection
      const spamAnalysis = advancedSpamDetection.analyzeSubmission({
        timestamp: Date.now(),
        data: formData,
        fillTime,
        honeypotTriggered: false,
      });

      if (spamAnalysis.isSpam) {
        console.warn('[SECURITY] Spam detected:', spamAnalysis.detectedPatterns);
        setSubmitStatus('blocked');
        setBlockMessage('Submission blocked: Spam detected');
        setTimeout(() => setSubmitStatus('idle'), 3000);
        setIsSubmitting(false);
        return;
      }

      // All security checks passed - simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
      formStartTime.current = Date.now();
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('[FORM ERROR]', error);
      setSubmitStatus('error');
      setBlockMessage('An error occurred. Please try again.');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative w-full py-24 md:py-40 lg:py-48 bg-black overflow-hidden">
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

      <div className="max-w-[120rem] mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-heading font-black text-white mb-12 tracking-tighter leading-none">
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

            <p className="text-base md:text-lg font-paragraph text-white/70 mb-16 leading-relaxed">
              Ready to collaborate on your next project? I'd love to hear about your vision and discuss how we can bring it to life.
            </p>

            {/* Contact Methods - Enhanced with animations */}
            <div className="space-y-12">
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
              className="mt-16 pt-12 border-t border-primary/30"
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
            <form onSubmit={handleSubmit} className="space-y-8">
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
                  <motion.input
                    type={field.type}
                    id={field.id}
                    name={field.id}
                    value={formData[field.id as keyof typeof formData]}
                    onChange={handleChange}
                    required
                    whileFocus={{ borderColor: '#4A0820' }}
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
                <motion.textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  whileFocus={{ borderColor: '#4A0820' }}
                  className="w-full px-0 py-3 border-b-2 border-white/20 bg-transparent text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors duration-300 resize-none"
                  placeholder="Tell me about your project..."
                />
              </motion.div>

              {/* Honeypot field */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleChange}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

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
                    {blockMessage || 'Something went wrong. Please try again.'}
                  </p>
                </motion.div>
              )}

              {submitStatus === 'blocked' && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 bg-orange-500/10 border-2 border-orange-500/50 rounded-lg flex gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-paragraph text-orange-400">
                    {blockMessage}
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
