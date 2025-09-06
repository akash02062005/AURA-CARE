import { useAuth } from "@/hooks/useAuth";
import Navigation from "./Navigation";
import ParticleBackground from "./ParticleBackground";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10">
        {isAuthenticated && !isLoading && <Navigation />}
        <main className={isAuthenticated && !isLoading ? "pt-16" : ""}>
          {children}
        </main>
      </div>
    </div>
  );
}
