import { Link } from 'react-router-dom';
import { Instagram, Mail, Share2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { showManualInstallInstructions } from '../../utils/pwaHelpers';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installInstructions, setInstallInstructions] = useState('');

  // Get browser-specific install instructions
  useEffect(() => {
    const instructions = showManualInstallInstructions();
    setInstallInstructions(instructions.message);
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    console.log("PWA DEBUG: Footer component mounted, setting up event listeners");
    
    // For debugging - check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log("PWA DEBUG: App is already running in standalone mode");
      // Even if it's in standalone mode, we still show the button
      // But we'll show a different message when clicked
    } else {
      console.log("PWA DEBUG: App is running in browser mode, can potentially be installed");
    }
    
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Save the event for later use
      console.log("PWA DEBUG: beforeinstallprompt event fired!", e);
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also log if the app gets installed
    window.addEventListener('appinstalled', (event) => {
      console.log('PWA DEBUG: App was installed', event);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Handle install button click
  const handleInstallClick = () => {
    console.log("PWA DEBUG: Install button clicked, deferredPrompt:", deferredPrompt);
    
    if (!deferredPrompt) {
      console.log("PWA DEBUG: No deferred prompt available, showing manual install instructions");
      alert(installInstructions);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA DEBUG: User accepted the install prompt');
      } else {
        console.log('PWA DEBUG: User dismissed the install prompt');
      }
      // Clear the saved prompt
      setDeferredPrompt(null);
    });
  };

  // Handle share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Haven Fashion',
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

  // Check if we're already in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const installButtonText = isStandalone ? "Already Installed" : "Install App";

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-customBlack text-white pt-10 pb-12 mb-0">
      <div className="px-6 max-w-[480px] mx-auto">
        {/* Install App Button - Always show */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={handleInstallClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              isStandalone 
                ? "bg-gray-200 text-gray-500" 
                : "bg-white text-customBlack hover:bg-gray-100"
            }`}
          >
            <Download size={18} />
            {installButtonText}
          </button>
        </div>
        
        {/* Social Media Links */}
        <div className="flex justify-center gap-4 mb-1">
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
            href="mailto:nameste.kayo@gmail.com" 
            className="p-3 rounded-full bg-gray-800 hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:rotate-3 hover:shadow-lg"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>

        {/* Tagline */}
        <div className="text-center mb-4">
          <p className="text-white/90 text-sm font-medium tracking-widest">Your style ✦ Your era ✦ Your haven</p>
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
          <p>© {currentYear} Haven. All rights reserved.</p>
          <p className="mt-2">
            Made in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 