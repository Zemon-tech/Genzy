import { ArrowLeft, Mail, Phone, MapPin, Instagram, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../../components/user/Footer';

const ContactPage = () => {
  const contactInfo = {
    phone: "+91 ..........",
    email: "nameste.kayo@gmail.com",
    instagram: "@genzy", // Replace with actual handle
    address: "New Delhi, India",
    businessHours: "Monday - Saturday: 10:00 AM - 7:00 PM"
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center px-4 py-3">
            <Link to="/" className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-medium ml-2">Contact Us</h1>
          </div>
        </header>

        <main className="px-4 py-6">
          {/* Hero Image / Section */}
          <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Get In Touch</h2>
            <p className="opacity-90">We&apos;re here to help and answer any questions you might have.</p>
          </div>

          {/* Contact Information Cards */}
          <div className="space-y-4 mb-8">
            <a 
              href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
              className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Phone</h3>
                <p className="text-gray-600">{contactInfo.phone}</p>
              </div>
            </a>

            <a 
              href={`mailto:${contactInfo.email}`}
              className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <Mail className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Email</h3>
                <p className="text-gray-600">{contactInfo.email}</p>
              </div>
            </a>

            <a 
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="bg-pink-100 p-3 rounded-full mr-4">
                <Instagram className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Instagram</h3>
                <p className="text-gray-600">{contactInfo.instagram}</p>
              </div>
            </a>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Address</h3>
                <p className="text-gray-600">{contactInfo.address}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Business Hours</h3>
                <p className="text-gray-600">{contactInfo.businessHours}</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Send Us a Message</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="johndoe@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ContactPage; 