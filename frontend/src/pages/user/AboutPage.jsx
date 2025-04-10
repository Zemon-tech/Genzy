import { ArrowLeft, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../../components/user/Footer';

const AboutPage = () => {
  // Team members data
  const teamMembers = [
    {
      name: "Madhav Varshney",
      role: "Co-Founder & Developer",
      bio: "Passionate about creating elegant user experiences and building scalable web applications. Core team member of Zemon.",
      linkedin: "https://www.linkedin.com/in/madhav-varshney-70b25132a/",
      email: "madhavvarshney1879@gmail.com",
      imageSrc: "https://media.licdn.com/dms/image/v2/D5603AQE1BKwrsjYk1Q/profile-displayphoto-shrink_400_400/B56ZWvPJQ1GsAg-/0/1742401740272?e=1749081600&v=beta&t=-KQJRUeUKy6ByLOx4UFbi0kxDmWwPAHQueyn-F5qZcM" // Update with actual image
    },
    {
      name: "Satyajit Jena",
      role: "Co-Founder & Designer",
      bio: "Creative thinker focused on innovative design solutions and brand identity development. Core team member of Zemon.",
      linkedin: "https://www.linkedin.com/in/jenasatyajit/",
      email: "jenasatyajit@gmail.com",
      imageSrc: "https://media.licdn.com/dms/image/v2/D4E03AQFTEHXvMo1Esw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1722946238912?e=1749081600&v=beta&t=8wkmw5TDHYejhFsISExYlGSpnEYgNUivnaFeNrWZlnY" // Update with actual image
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center px-4 py-3">
            <Link to="/" className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-medium ml-2">About Us</h1>
          </div>
        </header>

        <main className="px-4 py-6">
          {/* Company Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Haven was founded with a vision to revolutionize the fashion industry by providing a platform 
              where quality meets affordability. We believe in creating a seamless shopping experience 
              that connects customers with authentic brands and unique styles.
            </p>
            <p className="text-gray-700 mb-4">
              Our mission is to empower fashion enthusiasts to express their unique identity through 
              carefully curated collections from various designers and brands. We are committed to 
              sustainability, ethical practices, and celebrating diversity in fashion.
            </p>
          </section>

          {/* Team Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Meet Our Team</h2>
            <div className="space-y-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img 
                        src={member.imageSrc} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-bold">{member.name}</h3>
                      <p className="text-indigo-600 font-medium text-sm mb-2">{member.role}</p>
                      <p className="text-gray-700 mb-3">{member.bio}</p>
                      <div className="flex justify-center sm:justify-start space-x-3">
                        <a 
                          href={member.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-colors"
                          aria-label={`${member.name}'s LinkedIn profile`}
                        >
                          <Linkedin size={18} />
                        </a>
                        <a 
                          href={`mailto:${member.email}`}
                          className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Zemon Section */}
          <section className="mt-10 mb-10">
            <h2 className="text-2xl font-bold mb-4">About Zemon</h2>
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl">
              <p className="text-gray-700 mb-3">
                Zemon is an innovative technology organization focused on creating cutting-edge digital experiences and 
                solutions across various industries. With expertise in web development, design,integrating ai and e-commerce, 
                Zemon builds platforms that connect people with the products and services they love.
              </p>
              <p className="text-gray-700">
                The team at Zemon combines technical expertise with creative vision to develop solutions 
                that are not only functional but also aesthetically pleasing and user-friendly.
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">Quality</h3>
                <p className="text-gray-700">We are committed to offering products of the highest quality, curating items that meet our standards for craftsmanship and durability.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">Authenticity</h3>
                <p className="text-gray-700">We ensure all products are authentic, working directly with brands to provide genuine items to our customers.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">Customer-Centric</h3>
                <p className="text-gray-700">Our customers are at the heart of everything we do, from the products we select to the service we provide.</p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AboutPage; 