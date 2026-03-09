import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderOpen, Calendar } from 'lucide-react';

const Membership: React.FC = () => {
  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <section className="bg-white pt-16 pb-10 text-center px-4">
        <h1 className="text-4xl font-extrabold font-heading text-apra-dark uppercase mb-4">
          Become an APRO Member
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Unlock exclusive resources, connect with the rocketry community, and support Pakistan's aerospace future.
        </p>
      </section>

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-apra-dark mb-8">Membership Benefits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="group relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[300px]">
            {/* Diagonal Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-apra-blue transform translate-x-16 -translate-y-16 rotate-45 group-hover:bg-apra-dark transition-colors"></div>
            
            <div className="p-8 flex flex-col h-full relative z-10">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6 text-apra-dark group-hover:text-apra-blue transition-colors">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-apra-dark mb-3">Community Access</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Join a network of passionate rocketry enthusiasts, students, and professionals. Gain mentorship and collaboration opportunities.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-apra-blue transform translate-x-16 -translate-y-16 rotate-45 group-hover:bg-apra-dark transition-colors"></div>
            
            <div className="p-8 flex flex-col h-full relative z-10">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6 text-apra-dark group-hover:text-apra-blue transition-colors">
                <FolderOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-apra-dark mb-3">Resource Library</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Gain access to our exclusive technical documents, safety guides, simulation software tutorials, and research papers.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-apra-blue transform translate-x-16 -translate-y-16 rotate-45 group-hover:bg-apra-dark transition-colors"></div>
            
            <div className="p-8 flex flex-col h-full relative z-10">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6 text-apra-dark group-hover:text-apra-blue transition-colors">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold text-apra-dark mb-3">Exclusive Events</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Receive priority invitations to workshops, launches, and networking events before they are announced to the public.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="container mx-auto px-4">
    
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      
          {/* CTA 1 */}
          <div className="bg-white p-10 rounded-2xl shadow-xl border-l-8 border-apra-blue text-center">
            <h2 className="text-3xl font-bold font-heading text-apra-dark mb-4">
              Student/Individual
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Ideal for university and high school students. Access workshops, mentorship, and competitions.
            </p>
            <Link 
                  to="/student"
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  Join Now
            </Link>
          </div>

          {/* CTA 2 */}
          <div className="bg-white p-10 rounded-2xl shadow-xl border-l-8 border-apra-dark text-center">
           <h2 className="text-3xl font-bold font-heading text-apra-dark mb-4">
              Chapter/Squadron
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              For professionals and founding members. Strategic influence in the association.
            </p>
            <Link 
                  to="/chapter"
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  Join Now
            </Link>

          </div>

        </div>
      </div>
    </section>

    </div>
  );
};

export default Membership;
