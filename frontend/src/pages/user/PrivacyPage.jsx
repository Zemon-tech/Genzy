import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../../components/user/Footer';

const PrivacyPage = () => {
  const lastUpdated = "June 10, 2024";
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center px-4 py-3">
            <Link to="/" className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-medium ml-2">Privacy Policy</h1>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-500 mb-4">Last updated: {lastUpdated}</p>
            
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Introduction</h2>
              <p className="mb-3">
                Haven (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our website and tell 
                you about your privacy rights and how the law protects you.
              </p>
              <p>
                This privacy policy applies to all users of our platform, including customers, sellers, and visitors.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Information We Collect</h2>
              <p className="mb-3">We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-5 mb-3 space-y-2">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes billing address, delivery address, email address, and telephone numbers.</li>
                <li><strong>Financial Data</strong> includes payment card details.</li>
                <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your preferences, feedback, and survey responses.</li>
                <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">How We Use Your Information</h2>
              <p className="mb-3">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-5 mb-3 space-y-2">
                <li>To register you as a new customer or seller.</li>
                <li>To process and deliver your orders.</li>
                <li>To manage our relationship with you including notifying you about changes to our services or policies.</li>
                <li>To administer and protect our business and website.</li>
                <li>To deliver relevant website content and advertisements to you.</li>
                <li>To make suggestions and recommendations to you about goods or services that may be of interest to you.</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, 
                or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to 
                those employees, agents, contractors, and other third parties who have a business need to know. They will only 
                process your personal data on our instructions, and they are subject to a duty of confidentiality.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Your Legal Rights</h2>
              <p className="mb-3">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>Request erasure of your personal data.</li>
                <li>Object to processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
                <li>Request transfer of your personal data.</li>
                <li>Right to withdraw consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at{' '}
                <a href="mailto:nameste.kayo@gmail.com" className="text-indigo-600 hover:text-indigo-800">
                  nameste.kayo@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPage; 