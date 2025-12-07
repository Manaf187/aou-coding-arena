
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Terminal, LogOut, Shield, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/Button';
import { checkHealth } from '../services/apiClient';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSystemOnline, setIsSystemOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
        const online = await checkHealth();
        setIsSystemOnline(online);
    };
    check();
    const interval = setInterval(check, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-aou-dark text-gray-300 relative overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-aou-border bg-aou-darker/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('/')}
          >
            <div className="bg-aou-green/10 p-2 rounded border border-aou-green/30 shadow-[0_0_10px_rgba(0,255,65,0.1)]">
              <Terminal className="text-aou-green" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-none text-lg">AOU</h1>
              <span className="text-[10px] font-mono text-aou-green tracking-[0.2em] uppercase block">Coding Arena // Bahrain</span>
            </div>
          </div>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">{user.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  {user.role === UserRole.ADMIN && <Shield size={10} className="text-red-500" />}
                  {user.role === UserRole.ADMIN ? 'Administrator' : 'Student'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout} title="Sign Out">
                <LogOut size={18} />
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {user && (
            <button 
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-aou-panel border-b border-aou-border p-4 flex flex-col gap-4 shadow-xl">
             <div className="flex items-center gap-3 pb-4 border-b border-aou-border/50">
               <div className="h-10 w-10 rounded-full bg-aou-darker flex items-center justify-center border border-aou-border">
                 <span className="font-mono text-aou-green text-lg">{user.name.charAt(0)}</span>
               </div>
               <div>
                 <div className="text-white font-medium">{user.name}</div>
                 <div className="text-xs text-gray-500">{user.email || user.role}</div>
               </div>
             </div>
             <Button variant="danger" onClick={onLogout} className="w-full justify-center">
               Sign Out
             </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-aou-border py-8 bg-aou-darker">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <div className="text-center md:text-left">
            <p className="text-gray-400 font-medium">Arab Open University - Bahrain Branch</p>
            <p>&copy; {new Date().getFullYear()} Faculty of Computer Studies</p>
          </div>
          <div className="flex gap-6 font-mono text-xs">
             <span className={`flex items-center gap-1 transition-colors ${isSystemOnline ? 'text-aou-green/60' : 'text-red-500/60'}`}>
               {isSystemOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-aou-green animate-pulse"></span>
                    <Wifi size={12} className="inline mr-1"/> SYSTEM ONLINE
                  </>
               ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <WifiOff size={12} className="inline mr-1"/> SYSTEM OFFLINE
                  </>
               )}
             </span>
             <span className="hover:text-aou-green cursor-pointer transition-colors">v2.4.2-stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
