import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AboutSection() {
  const [aboutImage, setAboutImage] = useState('https://static.wixstatic.com/media/e9d727_b2c52e273a12463198e51100c1907f31~mv2.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadAboutImage = async () => {
      try {
        // Load from HomepageImages collection first
        const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
        if (homepageImages.items && homepageImages.items.length > 0) {
          const images = homepageImages.items[0] as any;
          if (images.aboutSectionImage) {
            setAboutImage(images.aboutSectionImage);
          }
        }
      } catch (error) {
        console.error('Error loading about image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAboutImage();
  }, []);

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6 },
    }),
  };

  return (
    <section id="about" className="relative w-full py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 100% 0%, rgba(73, 7, 8, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(73, 7, 8, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 0%, rgba(73, 7, 8, 0.08) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
        />
      </div>
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        {/* Asymmetrical layout - image right, text left */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-start">
          {/* Content - left side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white leading-tight tracking-tighter">
                About
                <br />
                <motion.span
                  className="text-primary"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Jordan
                </motion.span>
              </h2>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="h-1 bg-gradient-to-r from-primary to-primary/40"
              />
            </div>

            <div className="space-y-4 md:space-y-6">

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-base md:text-lg font-paragraph text-white/75 leading-relaxed"
              >Jordan Michael Zuñiga
              Some photographers document the world.
              Jordan Michael Zuñiga interrogates it.
              He was born into it. Father behind a camera. Mother behind a paintbrush. Los Angeles in his blood before he ever picked up a lens. The city did not raise him soft. It raised him sharp, gave him an eye for what is real and what is performance, and by the time he left for Amsterdam that eye was already dangerous. Europe did the rest. There is a particular kind of clarity that only comes from standing outside the culture that made you and seeing it whole for the first time. He came back with that clarity. He never lost it.
              What followed was not a career. It was an accumulation of weight.
              Jordan Michael Zuñiga
              Some photographers document the world.
              Jordan Michael Zuñiga interrogates it.
              He started with a Pentax film camera and a father who had been shooting for over 40 years. A mother whose hands made art. He did not choose photography. It was already in the room when he was born. Los Angeles handed him his first education: the light, the grit, the contrast between what the city shows the world and what it actually is. He absorbed it early. Then he went to Amsterdam and the rest of the world cracked open. Coming home after that is never really coming home. It is arriving somewhere familiar with new eyes. Those eyes never went back.
              He moved. He built. He found Miami and Miami found him back.
              In Wynwood, before the galleries arrived and the murals became a tourist attraction, he was already there with Red1 Studios. He shot runway. He tested talent for Elite Model Management, Ford, Next, MC2, Irene Marie. He covered three consecutive years of Fashion Week for fashiontv when that platform was reaching over 100 million viewers across the globe. He shot for Two Mundos Magazine. Warner Brothers. Stefano Versace Holdings. Brian Long PR, the publicist who moved between Pamela Anderson and the most culturally connected rooms in Miami, brought Jordan into the conversation. He trained at Miami Ad School and learned what most photographers never bother to learn: that an image is not a record of something that happened. It is an argument about what matters.
              Then he made one of the most talked-about photographs of 2011.
              On August 11th, Jordan debuted Women in Cages at Cafeina in Miami's Wynwood Arts District Repeating Islands, an exhibition that hit the internet like a lit fuse. The series featured some of Miami's most prominent women, each captured as an artistic nude as part of PETA's "I'd Rather Go Naked Than Wear Fur" campaign, with 80 percent of all sales donated to PETA. Blogger The concept came from a late-night conversation with his publicist about nonprofits. Jordan grabbed a cage from his own house and built the shoot from scratch. That is how it works when the idea is right. You do not wait for a budget. You move.
              The exhibit debuted to rave reviews. One portrait in particular stopped the internet cold: Brooke Hogan, nude, inside a cage. ContactOut Hulk Hogan, celebrating his 58th birthday that night, attended the opening with his daughter. LinkedIn He put Jordan in a choke hold for shooting Brooke nude, then stood there and looked at the image and went quiet. Jordan said later that he believed Hulk saw the beauty in it. Repeating Islands UPI ran it. HuffPost ran it. IMDB ran it. PETA ran it on their own site with the headline Brooke Hogan Gets Naked for Animals and offered signed prints at fifty dollars a piece. Getty Images photographed Jordan at the unveiling. SocialMiami The image was everywhere. It was not an accident. It was the result of a photographer who understood that the most powerful photographs are not the ones that make people comfortable.
              He told Huffington Post: "I have always respected what PETA has done with their imagery and I wanted to do something I hadn't seen before but put my spin and style on it." Repeating Islands That is the whole sentence. That is the whole philosophy.
              The same year, at Art Basel 2011, Jordan exhibited Haiti: Hope in Progress at the Moore Building in collaboration with Hard Hats for Haiti and the Pan American Development Foundation. Over 500 collectors, diplomats, and cultural figures came through. Reconstruction work backed by the World Bank and the American Red Cross was funded through the sales. The Pan American Development Foundation credited the work with a direct impact on hundreds of thousands of lives. Two exhibitions. One year. Both of them mattered beyond the frame.
              That was 2011. He kept going.
              In 2026, Jordan operates under RED2 Studios and RED2 Studios is not a building. It is not a zip code or a lease or a sign on a door. RED2 is a standard of work that travels in his hands and arrives wherever the project demands. He is fully mobile, running out of a production-ready vehicle across the United States, from coastlines to hotel corridors to desert highways to the kinds of locations that other photographers fly to, book permits for, and call their best work. He does not book. He arrives. The camera that started as a Pentax loaded with film has become a Sony A1 II with 50 megapixels of sensor and glass refined to the tolerances of surgical instruments. The eye behind it has not changed. It just sees more.
              500 projects. 50 collaborations. 25 years of work that has appeared in People magazine, on PETA's front page, in Getty's archives, in the rooms of the Versace estate, on three years of Fashion Week coverage, and in the hands of the World Bank.
              The record is long.
              He is nowhere near done writing it.</motion.p>
            </div>

            {/* Stats - enhanced with animations */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-primary/30"
            >
              {[
                { value: '500+', label: 'Projects' },
                { value: '50+', label: 'Collaborations' },
                { value: '25+', label: 'Years' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={statVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="space-y-3 group"
                >
                  <motion.p
                    className="text-5xl md:text-6xl font-heading font-black text-primary"
                    animate={{ opacity: [1, 0.8, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs md:text-sm font-mono text-white/50 uppercase tracking-widest group-hover:text-primary transition-colors">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image - right side with enhanced effects */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-full"
          >
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="aspect-square overflow-hidden bg-white/5 rounded-2xl border-2 border-primary/50 hover:border-primary transition-all duration-500 group"
            >
              {!isLoading && (
                <motion.div
                  initial={{ scale: 1.1, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="w-full h-full"
                >
                  <Image
                    src={aboutImage}
                    alt="Jordan Michael Zuniga"
                    width={600}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              )}
              {isLoading && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-full h-full bg-gradient-to-br from-primary/10 to-white/5"
                />
              )}
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-8 -right-8 w-32 h-32 border border-primary/20 rounded-full opacity-50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-12 -left-12 w-40 h-40 border border-primary/10 rounded-full opacity-30"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
