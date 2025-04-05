import { Link } from 'react-router-dom';
import { Instagram, Mail, Share2 } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Handle share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Genzy Fashion',
        text: 'Check out these amazing fashion products!',
        url: window.location.origin,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((error) => console.log('Error copying link:', error));
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white pt-10 pb-12 mb-0">
      <div className="px-6 max-w-[480px] mx-auto">
        {/* Social Media Links */}
        <div className="flex justify-center gap-4 mb-8">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gray-800 hover:bg-pink-600 transition-all duration-300 transform hover:scale-110 hover:rotate-3 hover:shadow-lg"
            aria-label="Instagram"
          >
            <Instagram size={20} />
          </a>
          <button 
            onClick={handleShare}
            className="p-3 rounded-full bg-gray-800 hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 hover:rotate-3 hover:shadow-lg flex items-center gap-2"
            aria-label="Share"
          >
            <Share2 size={20} />
            <span className="text-sm">Share</span>
          </button>
          <a 
            href="mailto:madhavvarshney1879@gmail.com" 
            className="p-3 rounded-full bg-gray-800 hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:rotate-3 hover:shadow-lg"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-y-3 mb-8 text-sm">
          <div className="space-y-3">
            <h3 className="text-gray-400 font-medium mb-1">Company</h3>
            <Link 
              to="/about" 
              className="block hover:text-white transition-all duration-300 transform hover:translate-x-1 hover:scale-105"
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className="block hover:text-white transition-all duration-300 transform hover:translate-x-1 hover:scale-105"
            >
              Contact
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-gray-400 font-medium mb-1">Legal</h3>
            <Link 
              to="/terms" 
              className="block hover:text-white transition-all duration-300 transform hover:translate-x-1 hover:scale-105"
            >
              Terms & Conditions
            </Link>
            <Link 
              to="/privacy" 
              className="block hover:text-white transition-all duration-300 transform hover:translate-x-1 hover:scale-105"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center text-gray-400 text-xs border-t border-gray-800 pt-6">
          <p>© {currentYear} Genzy. All rights reserved.</p>
          <p className="mt-2">
            Made in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 