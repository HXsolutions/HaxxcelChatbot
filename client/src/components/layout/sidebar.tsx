import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: "fas fa-th-large" },
  { name: "Chatbots", href: "/chatbots", icon: "fas fa-robot" },
  { name: "Analytics", href: "/analytics", icon: "fas fa-chart-bar" },
  { name: "Settings", href: "/settings", icon: "fas fa-cog" },
  { name: "Billing", href: "/billing", icon: "fas fa-credit-card" },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700/50 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 backdrop-blur-sm",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-700/50 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-cyan-500/10"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <span className="text-xl font-semibold text-white">Haxxcel</span>
            </div>
            <button 
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white transition-colors duration-300"
              onClick={onMobileClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "group flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer relative overflow-hidden",
                  location === item.href
                    ? "bg-gradient-to-r from-primary/20 to-cyan-500/20 text-primary border border-primary/30"
                    : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50"
                )}
                onClick={() => onMobileClose?.()}
              >
                <i className={`${item.icon} w-5 transition-transform duration-300 ${location === item.href ? 'scale-110' : 'group-hover:scale-110'}`}></i>
                <span>{item.name}</span>
                {location === item.href && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-cyan-500/10 rounded-lg"></div>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm border border-gray-600/30 group hover:from-gray-700/70 hover:to-gray-600/70 transition-all duration-300">
            <img 
              src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"} 
              alt="User profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/50 transition-colors duration-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {(user as any)?.firstName || (user as any)?.email || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                <span className="text-primary">{(user as any)?.planType || "Starter"}</span> Plan
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
