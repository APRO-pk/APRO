import React from 'react';
import { Mail, Instagram } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-extrabold font-heading text-apra-dark uppercase tracking-wide">
            Get In Touch With APRO
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            We'd love to hear from you. Reach out for inquiries, partnerships, or general questions about rocketry in Pakistan.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Info Cards */}
          <div className="md:w-5/12 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-apra-blue"></div>
              <div className="absolute -right-6 -top-6 bg-apra-light w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-apra-blue text-white rounded-lg flex items-center justify-center mb-4">
                  <Mail />
                </div>
                <h3 className="text-xl font-bold text-apra-dark">Email Us</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">General Inquiries & Support</p>
                <a href="mailto:allpakistanrocketryassociation@gmail.com" className="text-apra-blue hover:underline break-all">
                  contact.apro.pk@gmail.com
                </a>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-apra-dark"></div>
              <div className="absolute -right-6 -top-6 bg-apra-light w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-apra-dark text-white rounded-lg flex items-center justify-center mb-4">
                  <Instagram />
                </div>
                <h3 className="text-xl font-bold text-apra-dark">Follow Us on Instagram</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stay Updated</p>
                <a href="https://www.instagram.com/apro.pk?igsh=OGY1Mmw4ZWI3MXhx" target="_blank" rel="noreferrer" className="text-apra-dark font-bold hover:text-apra-blue transition-colors">
                  @apro.pk
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="md:w-7/12">
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-apra-dark mb-6">Send Us a Message</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Message sent (simulation)"); }}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded focus:border-apra-blue focus:ring-1 focus:ring-apra-blue outline-none" placeholder="Enter your name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded focus:border-apra-blue focus:ring-1 focus:ring-apra-blue outline-none" placeholder="Enter your email" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded focus:border-apra-blue focus:ring-1 focus:ring-apra-blue outline-none" placeholder="What is this about?" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                  <textarea rows={5} className="w-full px-4 py-3 border border-gray-300 rounded focus:border-apra-blue focus:ring-1 focus:ring-apra-blue outline-none" placeholder="Your message..." required></textarea>
                </div>
                <button type="submit" className="w-full bg-apra-blue hover:bg-apra-dark text-white font-bold py-3 rounded transition-colors uppercase tracking-wide">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
