'use client';

import { Calculator, Check, Home, Percent } from 'lucide-react';

export default function BrokerProgramsSection({ programs, onProgramClick }) {
  return (
    <section id="programs" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-heading mb-4">
            Mortgage Programs
          </h2>
          <p className="text-lg text-text-muted">
            Find the perfect mortgage solution tailored to your financial needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {programs.map((program, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => onProgramClick?.('pre_approval')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <Home size={24} />
                </div>
                <h3 className="text-xl font-semibold text-text-heading">
                  {program.name}
                </h3>
              </div>

              <p className="text-sm text-text-muted mb-4">
                {program.description}
              </p>

              <div className="space-y-2 mb-4">
                {program.min_credit_score && (
                  <div className="flex items-center gap-2 text-sm text-text-body">
                    <Check className="text-green-600" />
                    <span>Min Credit Score: {program.min_credit_score}</span>
                  </div>
                )}
                {program.down_payment_min && (
                  <div className="flex items-center gap-2 text-sm text-text-body">
                    <Percent className="text-blue-600" />
                    <span>Down Payment: {program.down_payment_min}</span>
                  </div>
                )}
              </div>

              <button className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md transition">
                Learn More
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => onProgramClick?.('calculate')}
            className="px-6 py-3 bg-white hover:bg-gray-50 text-primary font-semibold rounded-md border-2 border-primary transition inline-flex items-center gap-2"
          >
            <Calculator />
            Use Mortgage Calculator
          </button>
        </div>
      </div>
    </section>
  );
}

