import { PortfolioWithImages } from '@/lib/portfolio-service';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface PortfolioCardProps {
  portfolio: PortfolioWithImages;
  variant?: 'grid' | 'carousel' | 'featured';
  onClick?: () => void;
}

export default function PortfolioCard({ portfolio, variant = 'grid', onClick }: PortfolioCardProps) {
  const mainImage = portfolio.mainImage || (portfolio.images?.[0]?.imageUrl);
  const imageCount = portfolio.images?.length || 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -8, transition: { duration: 0.2 } },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`group relative overflow-hidden rounded-lg bg-secondary ${
        variant === 'featured' ? 'col-span-2 row-span-2' : ''
      }`}
      onClick={onClick}
    >
      {/* Main Image */}
      {mainImage && (
        <div className="relative h-64 w-full overflow-hidden bg-gray-200">
          <Image
            src={mainImage}
            alt={portfolio.imageAltText || portfolio.projectName || 'Portfolio item'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            width={500}
            height={400}
          />
        </div>
      )}

      {/* Overlay */}
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        whileHover="visible"
        className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4"
      >
        <div className="space-y-2">
          <h3 className="font-heading text-lg font-bold text-white">{portfolio.projectName}</h3>
          {portfolio.shortDescription && (
            <p className="font-paragraph line-clamp-2 text-sm text-gray-200">{portfolio.shortDescription}</p>
          )}
          {portfolio.category && (
            <p className="font-paragraph text-xs uppercase tracking-wider text-primary">{portfolio.category}</p>
          )}
          {imageCount > 0 && (
            <p className="font-paragraph text-xs text-gray-300">{imageCount} image{imageCount !== 1 ? 's' : ''}</p>
          )}
        </div>
      </motion.div>

      {/* Link to Detail */}
      <Link to={`/portfolio/${portfolio._id}`} className="absolute inset-0" />
    </motion.div>
  );
}
