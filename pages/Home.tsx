import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "../src/lib/supabase";
import bgHome from "../assets/bg-home.avif";
import { GraduationCap, User, Rocket, Map, FileText, Shield } from 'lucide-react';

const { data } = supabase.storage
  .from("docs")
  .getPublicUrl("APRO National Safety Code (NSOC) v1.pdf");

const safetyCodeUrl = data.publicUrl;

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={bgHome}
            alt="Rocket Launch" 
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-6 tracking-tight leading-tight">
            ADVANCING PAKISTAN'S<br />AEROSPACE FRONTIER
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200 font-light max-w-2xl mx-auto">
            Uniting students, engineers, and enthusiasts to build the future of rocketry.
          </p>
          <Link 
            to="/membership" 
            className="inline-block bg-apra-blue hover:bg-apra-dark text-white font-bold py-4 px-10 rounded shadow-lg transform hover:-translate-y-1 transition-all duration-200 text-lg uppercase tracking-wider"
          >
            Become a Member
          </Link>
        </div>
      </section>

      {/* Three Column Feature Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Col 1: Join APRA */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-apra-dark border-b-2 border-apra-blue pb-2 mb-2">Join APRO</h2>
              
              <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Student/Individual Member</h3>
                  <GraduationCap className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  Ideal for university and high school students. Access workshops, mentorship, and competitions.
                </p>
                <Link 
                  to="/student"
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  Join Now
                </Link>
              </div>

              <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Join Apro</h3>
                  <Map className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  Looking to intern or work with us? We are always on the lookout for fresh talent.
                </p>
                <Link 
                  to="/join" 
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  Apply now
                </Link>
              </div>

              {/* <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Charter Member</h3>
                  <User className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  For professionals and founding members. Strategic influence in the association.
                </p>
                <a 
                  href="https://forms.google.com/placeholder-join" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  Join Now
                </a>
              </div> */}
            </div>

            {/* Col 2: Chapter Development */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-apra-dark border-b-2 border-apra-blue pb-2 mb-2">Chapter Development</h2>
              
              <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Start a Chapter/Squadron</h3>
                  <Rocket className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  Bring APRO to your campus. Lead the way in Pakistani rocketry by founding a local chapter.
                </p>
                <Link 
                  to="chapter"
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  Apply Now
                </Link>
              </div>
              <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Chapter/Squadron Roadmap</h3>
                  <Map className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  View our expansion plan across Lahore, Karachi, Islamabad, and other major cities.
                </p>
                <Link 
                  to="/legal" 
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  View Roadmap
                </Link>
              </div>

              {/* <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Chapter Roadmap</h3>
                  <Map className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  View our expansion plan across Lahore, Karachi, Islamabad, and other major cities.
                </p>
                <Link 
                  to="/legal" 
                  className="block w-full text-center bg-apra-blue text-white font-bold py-2 rounded hover:bg-apra-dark transition-colors text-sm uppercase"
                >
                  View Roadmap
                </Link>
              </div> */}
            </div>

            {/* Col 3: Legal Documents */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-apra-dark border-b-2 border-apra-blue pb-2 mb-2">Legal Documents</h2>
              
              <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Constitution (v1.0)</h3>
                  <FileText className="text-apra-blue w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  The foundational governing document defining APRO's structure and operations.
                </p>
                <button 
                  className="block w-full text-center border-2 border-apra-blue text-apra-blue font-bold py-2 rounded hover:bg-apra-blue hover:text-white transition-colors text-sm uppercase"
                >
                  Download PDF
                </button>
              </div>

              <div className="bg-apra-light p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-apra-dark">Safety Code (v3.1)</h3>
                  <Shield className="text-apra-alert w-8 h-8" />
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  Critical safety protocols for all launch operations. Mandatory reading for members.
                </p>
                <a
                  href={safetyCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center border-2 border-apra-alert text-apra-alert font-bold py-2 rounded hover:bg-apra-alert hover:text-white transition-colors text-sm uppercase"
                >
                Download PDF
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;