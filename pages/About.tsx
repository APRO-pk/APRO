import React from 'react';
import { Rocket, RefreshCw, Shield } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=2070&auto=format&fit=crop" 
            alt="Static Fire Test" 
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold font-heading tracking-tight">
            From Equations to Engines
          </h1>
        </div>
      </section>

      {/* History Section */}
      <section className="bg-apra-dark text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold font-heading mb-6 border-l-4 border-apra-blue pl-4">Our History</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                There was a time when Pakistani students found no defined path to practical rocketry. While curiosity existed, the infrastructure did not. APRO was born from a refusal to wait. It began as a specialized technical branch known as RPS (Rocket Propulsion Systems) within a university space society. This small group of engineers focused on understanding the physics of flight even when launch permissions were unavailable, operating under the philosophy that "if rockets could not fly, they would still be understood".
              </p>
            </div>
            
            {/* Timeline Visual */}
            <div className="lg:w-1/2 w-full">
              <div className="relative flex justify-between items-center w-full px-4 pt-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-600 -translate-y-1/2 z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-6 h-6 bg-apra-blue rounded-full border-4 border-apra-dark mb-4"></div>
                  <div className="text-center">
                    <span className="block font-bold text-apra-blue">2018</span>
                    <span className="text-sm text-gray-400">No Path</span>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-6 h-6 bg-apra-blue rounded-full border-4 border-apra-dark mb-4"></div>
                  <div className="text-center">
                    <span className="block font-bold text-apra-blue">2019</span>
                    <span className="text-sm text-gray-400">RPS Formed</span>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-6 h-6 bg-apra-blue rounded-full border-4 border-apra-dark mb-4"></div>
                  <div className="text-center">
                    <span className="block font-bold text-apra-blue">2020</span>
                    <span className="text-sm text-gray-400">Focus on<br/>Understanding</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Philosophy Section */}
      <section className="bg-apra-dark text-white pb-20 pt-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-heading mb-4">Our Technical Philosophy</h2>
            <p className="text-gray-400">
              Today, the All Pakistan Rocketry Association serves as the "absolute hammer" for systems engineering and safety in Pakistan. Our methodology is built on three pillars:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white text-apra-dark p-8 rounded-lg shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-apra-light rounded-full flex items-center justify-center mb-6 text-apra-blue">
                <Rocket size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">Static Fire & Propulsion Analysis</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We prioritize rigorous ground testing. In environments where flight restrictions exist, "data replaces altitude". We focus on static engine firing to validate specific impulse, thrust curves, and combustion stability.
              </p>
            </div>

            <div className="bg-white text-apra-dark p-8 rounded-lg shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-apra-light rounded-full flex items-center justify-center mb-6 text-apra-blue">
                <RefreshCw size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">Iterative Design Cycles</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We teach members to "design, test, and fail safely". By treating failure as a data point rather than a defeat, we enable rapid prototyping and the development of robust propulsion systems.
              </p>
            </div>

            <div className="bg-white text-apra-dark p-8 rounded-lg shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-apra-light rounded-full flex items-center justify-center mb-6 text-apra-alert">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4">Regulatory & Safety Standards</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Recognizing that early "flight was illegal", APRO is dedicated to legalizing and standardizing amateur rocketry. We are building the safety codes and responsibility frameworks required to open up Pakistan's airspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-apra-dark text-white pb-20 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center pt-12">
          <h2 className="text-2xl font-bold font-heading mb-4 text-apra-blue">Our Mission</h2>
          <p className="max-w-4xl mx-auto text-lg text-gray-300 italic">
            "We invite the 'space citizens of Pakistan' to join us. APRO was formed not for immediate glory, but to 'prepare patiently'. We are here to help your skies learn to answer back."
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
