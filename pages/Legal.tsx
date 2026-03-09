import React from 'react';
import { supabase } from "../src/lib/supabase";
import { Gavel, Shield, Ban, Zap, XCircle } from 'lucide-react';

const { data } = supabase.storage
  .from("docs")
  .getPublicUrl("APRO National Safety Code (NSOC) v1.pdf");

const safetyCodeUrl = data.publicUrl;

const Legal: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-apra-dark uppercase tracking-wide">
            Legal Framework & Safety Governance
          </h1>
          <p className="text-gray-600 mt-4 max-w-3xl mx-auto">
            Establishing the foundation for safe, responsible, and organized rocketry in Pakistan. These documents define our structure and operational standards.
          </p>
        </div>

        {/* Section 1: Governing Documents */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">Governing Documents</h2>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-gray-100 rounded-full">
              <Gavel className="w-16 h-16 text-apra-dark" />
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-xl font-bold text-apra-dark">APRA Constitution (v1.0)</h3>
              <p className="text-gray-600 text-sm mt-2">
                The foundational document defining APRA's democratic structure, election procedures, officer roles, and member rights and responsibilities.
              </p>
            </div>
            <button className="bg-apra-blue text-white font-bold py-3 px-6 rounded hover:bg-apra-dark transition-colors uppercase text-sm whitespace-nowrap">
              Download Constitution (PDF)
            </button>
          </div>
        </section>

        {/* Section 2: Safety Code */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">Pakistan Rocketry Safety Code</h2>
          
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Red Alert Header */}
            <div className="bg-apra-alert text-white text-center py-2 font-bold text-sm uppercase tracking-widest">
              Critical Safety Protocols
            </div>
            
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Shield className="w-10 h-10 text-gray-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-apra-dark">The Safety Code</h3>
                  <p className="text-sm text-gray-600">
                    Our adaptation of international standards, tailored for Pakistan. Adherence is mandatory for all APRA activities.
                  </p>
                </div>
              </div>

              <div className="space-y-4 ml-2 md:ml-14 mb-8">
                <div className="flex items-center gap-3">
                  <Ban className="w-5 h-5 text-apra-alert" />
                  <span className="text-sm font-semibold text-gray-700">NO TARGETS: We never aim rockets at any person, property, or living creature.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-semibold text-gray-700">ELECTRICAL IGNITION: All launches must use a remote-controlled electrical launch system.</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">NO METAL BODY TUBES: Airframes must be constructed from lightweight, non-metallic materials.</span>
                </div>
              </div>

              <div className="text-center">
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
        </section>

        {/* Section 3: Certification Tiers */}
        <section className="mb-20">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">Flight Certification Tiers (The Roadmap)</h2>
          
          <div className="relative pt-10 pb-10">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
            <div className="hidden md:block absolute top-1/2 left-[50%] w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-gray-200 border-b-[10px] border-b-transparent -translate-y-1/2 -ml-2"></div>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              
              {/* Level 1 */}
              <div className="flex-1 bg-white p-6 rounded-lg border-2 border-apra-blue shadow-lg">
                <h3 className="text-lg font-bold text-apra-dark mb-2">Level 1: Model Rocketry</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Standard engines (A-G class). Focus on fundamental construction, stability, and recovery.
                </p>
                <span className="inline-block bg-apra-blue text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Active</span>
              </div>

              {/* Arrow for mobile */}
              <div className="md:hidden text-center text-gray-300 text-3xl">↓</div>

              {/* Level 2 */}
              <div className="flex-1 bg-gray-100 p-6 rounded-lg border border-gray-300 shadow-sm opacity-80">
                <h3 className="text-lg font-bold text-apra-dark mb-2">Level 2: High Power (Future)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Composite motors (H+ class). Requires advanced materials, dual-deployment recovery, and L2 certification exam.
                </p>
                <span className="inline-block bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Future Roadmap</span>
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Legal;
