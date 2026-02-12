import { ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';

interface ProGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProGate({ children, fallback }: ProGateProps) {
  const { isProUser } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  if (isProUser) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
      >
        <div className="opacity-40 pointer-events-none select-none">
          {fallback ?? children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>
      <UpgradeModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
