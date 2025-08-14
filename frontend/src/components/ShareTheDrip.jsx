import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

const ShareTheDrip = () => {
  // Handle share functionality
  const handleShare = async () => {
    const shareText = "Brooo check this site 💀🔥 HavenDrip got actual student-led fashion drops. Not even on Instagram yet.";
    
    try {
      if (navigator.share) {
        console.log("Web Share API available, attempting to share");
        await navigator.share({
          title: 'Haven Drip',
          text: shareText,
          url: window.location.href,
        });
        console.log('Content shared successfully');
      } else {
        console.log("Web Share API not available, using clipboard fallback");
        // Fallback for browsers that don't support Web Share API
        const shareMessage = `${shareText} ${window.location.href}`;
        await navigator.clipboard.writeText(shareMessage);
        alert('Share message copied to clipboard! Paste it to share with friends.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Additional fallback if clipboard API fails
      if (error.name === 'NotAllowedError') {
        alert('Permission to share was denied. You can manually copy the current URL.');
      } else {
        try {
          // Try clipboard as a last resort
          const shareMessage = `${shareText} ${window.location.href}`;
          await navigator.clipboard.writeText(shareMessage);
          alert('Share message copied to clipboard! Paste it to share with friends.');
        } catch (clipboardError) {
          console.error('Clipboard fallback failed:', clipboardError);
          alert('Unable to share. Please manually copy the URL from your address bar.');
        }
      }
    }
  };

  return (
    <section className="px-4 py-3">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#292728] to-[#111] py-3 px-4"
      >
        {/* Simplified background elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#eaaa07]/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-10 w-16 h-16 bg-[#eaaa07]/5 rounded-full blur-lg"></div>
        
        {/* Subtle diagonal pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="absolute inset-0 transform -rotate-12">
            <div className="h-1 w-full bg-white/30 animate-marquee"></div>
            <div className="h-4 w-full bg-transparent"></div>
            <div className="h-1 w-full bg-white/20 animate-marquee-reverse"></div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            {/* Heading with emoji and modern styling */}
            <h2 className="text-lg font-bold text-white mb-0.5 flex items-center gap-2">
              Put Your Friends On <span className="text-xl">👀</span>
            </h2>
            
            {/* Shorter subheading */}
            <p className="text-white/70 text-xs mb-0">
              Share the drip and spread the vibe.
            </p>
          </div>
          
          {/* Share button with animations and effects */}
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#eaaa07] text-[#292728] font-medium px-4 py-2 rounded-full 
                      inline-flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all text-sm"
          >
            <Share2 size={16} />
            <span>Share 🔥</span>
          </motion.button>
          
          {/* Smaller floating badge */}
          <div className="absolute -top-1 -right-1 rotate-12 bg-[#eaaa07] text-[#292728] text-[10px] font-bold px-2 py-0.5 rounded-md">
            Gen Z
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ShareTheDrip; 