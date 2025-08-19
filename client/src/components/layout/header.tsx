import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onMobileMenuToggle?: () => void;
}

export default function Header({ title, subtitle, action, onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 px-4 sm:px-6 py-4 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-cyan-500/5"></div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white transition-colors duration-300"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-300">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {action}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-primary transition-all duration-300 transform hover:scale-110">
              <i className="fas fa-bell"></i>
            </button>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
