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

  // Handle share functionality
  const handleShare = async () => {
    const shareText = "I Found This Gen Z Fashion Goldmine 💅🔥 Check out Haven Drip!";
    
    try {
      if (navigator.share) {
        console.log("Web Share API available, attempting to share");
        await navigator.share({
          title: 'Haven Fashion',
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

  // Enhanced install button handling
  const handleInstallClick = async () => {
    console.log("PWA DEBUG: Install button clicked, deferredPrompt:", deferredPrompt);
    
    try {
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA DEBUG: User ${outcome} the install prompt`);
        
        // Clear the saved prompt
        setDeferredPrompt(null);
      } else if (isStandalone) {
        // If already installed, show a message
        alert('This app is already installed on your device!');
      } else {
        // Show manual install instructions
        console.log("PWA DEBUG: No deferred prompt available, showing manual instructions");
        
        // Modern browsers may need user gesture to show alerts
        setTimeout(() => {
          alert(installInstructions || 'To install this app, add it to your home screen from your browser menu.');
        }, 100);
      }
    } catch (error) {
      console.error('PWA DEBUG: Install error:', error);
      alert('There was a problem installing the app. Please try adding to home screen from your browser menu.');
    }
  };

  // Check if we're already in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
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
            aria-label={installButtonText}
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
            aria-label="Share with Friends"
          >
            <Share2 size={20} />
            <span className="text-sm">Share with Friends</span>
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