import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../../components/user/Footer';

const TermsPage = () => {
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
            <h1 className="text-lg font-medium ml-2">Terms & Conditions</h1>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-500 mb-4">Last updated: {lastUpdated}</p>
            
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Introduction</h2>
              <p className="mb-3">
                Welcome to Haven. These terms and conditions outline the rules and regulations for the use of our website and services.
              </p>
              <p>
                By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use Haven 
                if you do not accept all of the terms and conditions stated on this page.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Products and Services</h2>
              <p className="mb-3">
                Haven is a marketplace that connects customers with various brands and sellers. All products sold on our platform 
                are provided by independent sellers or brands. The availability, quality, description, and content of products 
                depend on the respective brands and sellers.
              </p>
              <p className="mb-3">
                <strong>Important Note:</strong> Haven relies on information provided by sellers for product descriptions, images, 
                specifications, and pricing. While we make reasonable efforts to verify this information, we cannot guarantee its 
                complete accuracy. Product availability is subject to change without prior notice.
              </p>
              <p>
                We serve as a platform to facilitate transactions between buyers and sellers, but we are not directly involved in 
                the production, manufacturing, or shipping of products unless explicitly stated.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">User Accounts</h2>
              <p className="mb-3">
                When you create an account with us, you guarantee that the information you provide is accurate, complete, and current at all times.
                Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on our platform.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your account and password, including but not limited to restricting 
                access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under 
                your account and/or password.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Ordering & Payment</h2>
              <p className="mb-3">
                When placing an order, you agree to provide current, complete, and accurate purchase and account information. We reserve the right 
                to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.
              </p>
              <p>
                All payments made on our platform are processed through secure third-party payment processors. We do not store your payment information 
                directly on our servers.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Shipping & Delivery</h2>
              <p>
                Shipping and delivery times are estimates provided by sellers and are not guaranteed. Delays can occur due to various factors 
                including customs processing, weather conditions, or logistics challenges. We recommend checking the estimated delivery time provided 
                by each seller before placing your order.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Returns & Refunds</h2>
              <p className="mb-3">
                Return and refund policies may vary by seller. Each seller on our platform sets their own return policy, which is displayed on 
                their product listings. Generally, items must be returned in their original condition with all tags and packaging intact.
              </p>
              <p>
                In case of damaged or defective items, please contact the seller directly through our platform within 48 hours of receiving the item.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">Intellectual Property</h2>
              <p>
                The content on this website, including without limitation the text, graphics, logos, icons, images, audio clips, digital downloads, 
                and software, is the property of Haven or its content suppliers and is protected by international copyright laws. The compilation of 
                all content on this site is the exclusive property of Haven and is protected by international copyright laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Contact Us</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at{' '}
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

export default TermsPage; 