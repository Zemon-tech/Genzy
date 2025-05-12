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
    <section className="px-4 py-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#292728] to-[#111] p-5"
      >
        {/* Background pattern elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#eaaa07]/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-10 w-20 h-20 bg-[#eaaa07]/5 rounded-full blur-lg"></div>
        
        {/* Animated diagonal pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0 transform -rotate-12">
            <div className="h-2 w-full bg-white/30 animate-marquee"></div>
            <div className="h-1 w-full bg-transparent"></div>
            <div className="h-3 w-full bg-white/20 animate-marquee-reverse"></div>
            <div className="h-5 w-full bg-transparent"></div>
            <div className="h-2 w-full bg-white/30 animate-marquee"></div>
            <div className="h-8 w-full bg-transparent"></div>
            <div className="h-1 w-full bg-white/20 animate-marquee-reverse"></div>
          </div>
        </div>
        
        <div className="relative z-10">
          {/* Heading with emoji and modern styling */}
          <h2 className="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            Put Your Friends On <span className="text-2xl">👀</span>
          </h2>
          
          {/* Subheading with gradient text */}
          <p className="text-white/70 text-sm mb-4 max-w-[90%]">
            Found your next fashion obsession? Share the drip and spread the vibe.
          </p>
          
          {/* Share button with animations and effects */}
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#eaaa07] text-[#292728] font-medium px-5 py-2.5 rounded-full 
                      inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Share2 size={18} />
            <span>Share the Drip 🔥</span>
          </motion.button>
          
          {/* Floating badge element for visual interest */}
          <div className="absolute -top-1 -right-1 rotate-12 bg-[#eaaa07] text-[#292728] text-xs font-bold px-3 py-1 rounded-lg">
            Gen Z Approved
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ShareTheDrip; 