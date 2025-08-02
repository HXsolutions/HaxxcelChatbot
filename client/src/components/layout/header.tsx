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
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {action}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <i className="fas fa-bell"></i>
            </button>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
