import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Cpu, LifeBuoy, Zap, Rocket, Award } from 'lucide-react';

const Events: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-apra-dark uppercase tracking-wide">
            Mission Manifest: Events & Workshops
          </h1>
          <p className="text-gray-500 mt-2">Our structured pathway from design to launch.</p>
        </div>

        {/* Phase 1: Active Training */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl font-bold text-apra-dark uppercase tracking-wider">Active Training (Phase 1)</h2>
            <div className="h-0.5 bg-gray-300 flex-grow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EventCard 
              icon={<Settings className="w-10 h-10 text-apra-blue" />}
              title="Rocket Design Workshop"
              description="Full-Stack Rocketry: Propulsion, Dynamics, and Mission Design."
              actionLabel="Register Now"
              active={true}
            />
            <EventCard 
              icon={<Cpu className="w-10 h-10 text-apra-blue" />}
              title="Avionics Bay Integration"
              description="Focus on altimeters, dual-deployment wiring, and payload safety systems. Build your electronic core."
              actionLabel="Register Now"
              active={true}
            />
            <EventCard 
              icon={<LifeBuoy className="w-10 h-10 text-apra-blue" />}
              title="Recovery Systems 101"
              description="Parachutes, shock cords, and mounting techniques. Essential training for safe and successful failure."
              actionLabel="Register Now"
              active={true}
            />
          </div>
        </section>

        {/* Phase 2: Advanced R&D */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl font-bold text-apra-dark uppercase tracking-wider">Advanced R&D (Coming Soon)</h2>
            <div className="h-0.5 bg-gray-300 flex-grow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-lg p-6 border border-gray-200 opacity-90 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded">COMING SOON</div>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Zap className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-apra-dark">TVC Design Lab</h3>
                  <p className="text-sm text-gray-500 mt-1">Introduction to Thrust Vector Control and gimbal systems for active stabilization.</p>
                </div>
              </div>
              <button className="w-full mt-4 bg-gray-400 text-white py-2 rounded font-bold text-sm hover:bg-gray-500 transition-colors">NOTIFY ME</button>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 border border-gray-200 opacity-90 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded">COMING SOON</div>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Rocket className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-apra-dark">The Inaugural Launch</h3>
                  <p className="text-sm text-gray-500 mt-1">Flight Window: Opening Soon. Witness our first official rocket launch event.</p>
                </div>
              </div>
              <button className="w-full mt-4 bg-gray-400 text-white py-2 rounded font-bold text-sm hover:bg-gray-500 transition-colors">NOTIFY ME</button>
            </div>
          </div>
        </section>

        {/* Phase 3: The Roadmap */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl font-bold text-apra-dark uppercase tracking-wider">The Roadmap (Future)</h2>
            <div className="h-0.5 bg-gray-300 flex-grow"></div>
          </div>

          <div className="bg-white rounded-lg p-8 border-2 border-apra-blue/20 shadow-md flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-apra-light rounded-full">
              <Award className="w-12 h-12 text-apra-blue" />
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-2xl font-bold text-apra-dark">National Certification Trials</h3>
              <p className="text-gray-600 mt-2">
                <span className="font-bold text-apra-blue">FUTURE PHASE.</span> The ultimate goal: a standardized certification process for Pakistani amateur rocketeers.
              </p>
            </div>
            <Link to="/legal" className="bg-apra-dark text-white px-8 py-3 rounded hover:bg-apra-blue transition-colors font-bold uppercase whitespace-nowrap">
              View Roadmap
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

interface EventCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  active?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ icon, title, description, actionLabel }) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-apra-light rounded-lg">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-apra-dark leading-tight">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6 flex-grow">{description}</p>
      <a 
        href="https://forms.gle/D1QV1Evxd6iC2hVo7"
        target="_blank"
        className="w-full block text-center bg-apra-blue text-white py-2 rounded font-bold text-sm hover:bg-apra-dark transition-colors uppercase"
      >
        {actionLabel}
      </a>
    </div>
  );
}

export default Events;
