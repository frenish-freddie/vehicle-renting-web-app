"use client";

import React from "react";

interface FlexiRideLoaderProps {
  fullscreen?: boolean;
}

export default function FlexiRideLoader({ fullscreen = true }: FlexiRideLoaderProps) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden font-sans ${
        fullscreen
          ? "fixed inset-0 z-[99999] w-screen h-screen bg-black/75 backdrop-blur-[2px] pointer-events-auto"
          : "p-10 w-full h-full"
      }`}
    >
      {/* Centered Dark Card Overlay (dark navy/charcoal background, rounded corners) */}
      <div className="relative z-10 w-[300px] bg-[#121225] border border-white/[0.04] rounded-[28px] p-8 flex flex-col items-center justify-center shadow-2xl shadow-black/80 animate-[floatCard_6s_ease-in-out_infinite]">
        
        {/* Spinner Ring Structure */}
        <div className="relative flex items-center justify-center">
          
          <svg className="w-[200px] h-[200px] drop-shadow-[0_0_16px_rgba(0,0,0,0.3)]" viewBox="0 0 220 220">
            <defs>
              {/* Premium teal-green gradient */}
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C896" stopOpacity="0" />
                <stop offset="50%" stopColor="#00C896" stopOpacity="0.25" />
                <stop offset="80%" stopColor="#00C896" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#00C896" stopOpacity="1" />
              </linearGradient>

              {/* Glowing bright dot filter */}
              <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Circular Road-Track Background Ring (thin track) */}
            <circle cx="110" cy="110" r="90" fill="none" className="stroke-white/[0.03] stroke-[3]" />
            <circle cx="110" cy="110" r="90" fill="none" className="stroke-[#00C896]/[0.05] stroke-[1]" strokeDasharray="6 6" />

            {/* Rotating Active 270-degree Overlay Group */}
            <g className="origin-[110px_110px] animate-[rotateRing_1.8s_linear_infinite]">
              {/* Active Gradient Arc covering 270 degrees (dasharray 424 out of 565) */}
              <circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke="url(#greenGradient)"
                className="stroke-[4]"
                strokeLinecap="round"
                strokeDasharray="424 565.48"
              />

              {/* Glowing Bright Dot at the Leading Tip (cx=110, cy=20 corresponds to top 12 o'clock) */}
              <circle
                cx="110"
                cy="20"
                r="5.5"
                fill="#00C896"
                filter="url(#glowFilter)"
                className="animate-[pulseDot_1.8s_ease-in-out_infinite]"
              />
            </g>
          </svg>

          {/* Centered Brand Wordmark/Logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span 
              className="font-sans font-extrabold text-[18px] tracking-[0.2em] text-white pl-[0.2em] drop-shadow-md select-none"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              FLEXIRIDE
            </span>
          </div>

        </div>

        {/* LOADING Status with three animated pulsing dots */}
        <div className="flex items-center mt-8 gap-2 select-none">
          <span 
            className="font-bold text-[11px] tracking-[0.28em] text-[#00C896] drop-shadow-[0_0_8px_rgba(0,200,150,0.25)]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            LOADING
          </span>
          <div className="flex items-center gap-1 ml-1">
            <div className="w-1.5 h-1.5 bg-[#00C896] rounded-full animate-[pulseDotSeq_1.2s_infinite_0s]" />
            <div className="w-1.5 h-1.5 bg-[#00C896] rounded-full animate-[pulseDotSeq_1.2s_infinite_0.2s]" />
            <div className="w-1.5 h-1.5 bg-[#00C896] rounded-full animate-[pulseDotSeq_1.2s_infinite_0.4s]" />
          </div>
        </div>

      </div>

      {/* Styled animation keyframes embedded directly in standard CSS style tags */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0px) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translateY(-8px) rotateX(1.5deg) rotateY(-1deg);
          }
        }
        @keyframes rotateRing {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes pulseDot {
          0%, 100% {
            r: 5;
            fill: #00C896;
          }
          50% {
            r: 6.5;
            fill: #3effcc;
          }
        }
        @keyframes pulseDotSeq {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
            background-color: #3effcc;
            box-shadow: 0 0 6px #3effcc;
          }
        }
      `}} />
    </div>
  );
}
