
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      easing: 'ease-out-cubic'
    });
    
    // Update AOS on window resize
    window.addEventListener('resize', () => {
      AOS.refresh();
    });
    
    return () => {
      window.removeEventListener('resize', () => {
        AOS.refresh();
      });
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 ease-in-out">
          <div className="container px-4 py-8 mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <footer className="py-3 px-4 text-center text-sm text-muted-foreground border-t">
        <p>
          Developed by{' '}
          <a 
            href="http://linkedin.com/in/sahasra-varadati-396b35296" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Sahasra
          </a>
          {', '}
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Ayushi
          </a>
          {' & '}
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Meghana Madasu
          </a>
        </p>
      </footer>
    </div>
  );
};
