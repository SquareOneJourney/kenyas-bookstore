
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

const HeroBanner: React.FC = () => {
  return (
    <section className="relative my-6 md:my-16 overflow-hidden rounded-[24px] md:rounded-[32px] shadow-soft-plate bg-midnight text-ecru">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(120deg, rgba(12,26,44,0.88), rgba(12,26,44,0.55)), url('/Bookstore 2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'saturate(0.9) contrast(1.05) brightness(0.9)',
        }}
      />
      <div className="absolute inset-0 hero-overlay mix-blend-multiply" />

      <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-16 p-6 md:p-16 items-center">
        <div className="surface-card brass-border rounded-3xl p-6 md:p-10">
          <p className="section-heading mb-3 md:mb-4 text-xs md:text-sm">Curated for the Curious</p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold ink-shadow leading-tight mb-4">
            Discover Your Next Chapter
          </h1>
          <p className="text-base md:text-lg text-ecru/90 mb-6 md:mb-8">
            An intimate collection of titles, hand-selected for their craft, voice, and lasting resonance. Settle in and let our curators guide you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/catalog">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto justify-center">Shop the Edit</Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto justify-center border-ecru text-ecru hover:bg-ecru hover:text-deep-blue">
                Meet the Curators
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6 hidden md:block">
          <div className="rounded-3xl overflow-hidden brass-border shadow-elevate">
            <img
              src="/Bookstore 2.png"
              alt="Books arranged on a shelf"
              className="w-full h-64 md:h-80 object-cover"
              loading="lazy"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-ecru/80">
            <div className="border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
              <p className="uppercase tracking-wider text-[11px] text-ecru/70 mb-2">New Arrivals</p>
              <p className="text-2xl font-semibold">Weekly</p>
            </div>
            <div className="border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
              <p className="uppercase tracking-wider text-[11px] text-ecru/70 mb-2">In-house picks</p>
              <p className="text-2xl font-semibold">Curated</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
