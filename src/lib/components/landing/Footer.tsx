import React from 'react';
import Link from 'next/link';

const Footer = () => {
   const year = new Date().getFullYear();

   return (
      <footer className="border-t border-primary-800 py-5 mt-auto">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 place-content-between mx-auto font-semibold">
               <div className="text-primary-100 mr-auto w-1/3">
                  <p>&copy; {year} SolanaBot</p>
               </div>
               
               <div className="flex space-x-8 mx-auto w-1/3 place-content-center">
                  <Link href="/privacy" className="text-primary-200 hover:text-accent-400 transition-colors duration-300">
                     Privacy
                  </Link>
                  <Link href="/terms" className="text-primary-200 hover:text-accent-400 transition-colors duration-300">
                     Terms
                  </Link>
               </div>
            </div>
         </div>
      </footer>
   );
};

export default Footer;