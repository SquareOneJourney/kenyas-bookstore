
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

const HeroBanner: React.FC = () => {
  return (
    <div
      className="relative text-cream p-8 md:p-16 rounded-lg text-center my-8 shadow-xl overflow-hidden"
      style={{
        backgroundImage: "url('/Bookstore 2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-deep-blue/80"></div>
      <div className="relative z-10">
        <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">Discover Your Next Chapter</h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-cream/90">
          Journey through worlds of wonder, knowledge, and adventure. Kenya's Bookstore is your curated gateway to the stories that shape us.
        </p>
        <Link to="/catalog">
          <Button variant="secondary" size="lg">Explore the Catalog</Button>
        </Link>
      </div>
    </div>
  );
};

export default HeroBanner;
