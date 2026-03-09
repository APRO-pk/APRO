import React from 'react';
import { Link } from 'react-router-dom';
import bgImage from "../assets/bg.jpg";

const Resources: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50">
      {/* Blueprint Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) contrast(150%)'
        }}>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl border-t-4 border-apra-dark">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-heading text-apra-dark">APRO Resource Portal</h1>
            <p className="text-sm text-gray-500 mt-2">Exclusive access for members. Please log in to continue.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">APRO ID</label>
              <input 
                type="text" 
                placeholder="Enter your APRO ID"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all"
              />
            </div>

            <button className="w-full bg-apra-blue text-white font-bold py-3 rounded hover:bg-apra-dark transition-colors uppercase tracking-wider">
              Login
            </button>
            
            <div className="text-center">
              <a href="#" className="text-xs text-apra-blue hover:underline">Forgot Password?</a>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center bg-gray-50 -mx-8 -mb-8 p-4 rounded-b-lg">
            <p className="text-sm text-gray-600">
              Not a member yet?{' '}
              <Link to="/membership" className="text-apra-dark font-bold hover:underline">
                Join APRO
              </Link>{' '}
              to gain access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
