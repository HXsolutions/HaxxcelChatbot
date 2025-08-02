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
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <span className="text-xl font-semibold text-gray-900">Haxxcel</span>
            </div>
            <button 
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
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
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                  location === item.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
                onClick={() => onMobileClose?.()}
              >
                <i className={`${item.icon} w-5`}></i>
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <img 
              src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"} 
              alt="User profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(user as any)?.firstName || (user as any)?.email || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {(user as any)?.planType || "Starter"} Plan
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
