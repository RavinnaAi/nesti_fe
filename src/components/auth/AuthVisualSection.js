import Image from "next/image";
import { Home, TrendingUp, Shield } from "lucide-react";

export default function AuthVisualSection({ variant = "signup" }) {
  const isSignup = variant === "signup";

  return (
    <div
      className={`w-full md:w-[55%] relative overflow-hidden ${isSignup
        ? "bg-gradient-to-br from-primary-dark to-primary-light"
        : "bg-gradient-to-br from-primary-light/20 via-primary/10 to-primary-dark/20"
        }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-md blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-dark/15 rounded-md blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 md:p-12 lg:p-16">
        {isSignup && (
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo/logo-light.png"
              alt="signup"
              width={100}
              height={100}
            />
          </div>
        )}

        <div className="text-center mb-12">
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isSignup ? "text-white" : "text-text-heading"
              }`}
          >
            Your Dream Home
            <br />
            <span className={isSignup ? "text-white/90" : "text-primary"}>
              Awaits
            </span>
          </h2>
          <p
            className={`text-base md:text-lg max-w-md mx-auto ${isSignup ? "text-white/90" : "text-text-body"
              }`}
          >
            Join thousands of users finding their perfect property
          </p>
        </div>

        {!isSignup && (
          <div className="grid grid-cols-3 gap-6 md:gap-8 mb-12">
            <div className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-md flex items-center justify-center mb-3">
                <Home className="text-white text-3xl" />
              </div>
              <p className="text-text-heading font-semibold text-sm">
                Find Homes
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-md flex items-center justify-center mb-3">
                <TrendingUp className="text-white text-3xl" />
              </div>
              <p className="text-text-heading font-semibold text-sm">
                Track Market
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-md flex items-center justify-center mb-3">
                <Shield className="text-white text-3xl" />
              </div>
              <p className="text-text-heading font-semibold text-sm">
                Secure Deals
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 md:gap-8 w-full max-w-lg">
          <div className={`text-center ${isSignup ? "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg" : ""} `}>
            <div
              className={`text-3xl md:text-4xl font-bold mb-1 ${isSignup ? "text-text-heading" : "text-primary"
                }`}
            >
              50K+
            </div>
            <div
              className={`text-xs md:text-sm ${isSignup ? "text-text-heading/80" : "text-text-body"
                }`}
            >
              Properties
            </div>
          </div>
          <div
            className={`text-center border-x border-text-muted/30 ${isSignup ? "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg " : ""} `}
          >
            <div
              className={`text-3xl md:text-4xl font-bold mb-1 ${isSignup ? "text-text-heading" : "text-primary"
                }`}
            >
              100K+
            </div>
            <div
              className={`text-xs md:text-sm ${isSignup ? "text-text-heading/80" : "text-text-body"
                }`}
            >
              Happy Users
            </div>
          </div>
          <div className={`text-center ${isSignup ? "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-6 shadow-lg" : ""} `}>
            <div
              className={`text-3xl md:text-4xl font-bold mb-1 ${isSignup ? "text-text-heading" : "text-primary"
                }`}
            >
              500+
            </div>
            <div
              className={`text-xs md:text-sm ${isSignup ? "text-text-heading/80" : "text-text-body"
                }`}
            >
              Agents
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
