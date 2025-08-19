import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import AdminPanel from "@/components/admin/admin-panel";

interface PlatformStats {
  totalUsers: number;
  totalChatbots: number;
  totalConversations: number;
  monthlyRevenue: number;
}

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
    enabled: true, // Always enabled for demo
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Admin Access",
        description: "For demo purposes, loading admin panel...",
        variant: "default",
      });
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || statsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AdminPanel stats={stats} />;
}
