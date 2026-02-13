import { ReactNode } from 'react';

interface ProGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Silent Launch mode: all features are open.
 * The gating logic is preserved but bypassed — simply renders children.
 */
export function ProGate({ children }: ProGateProps) {
  return <>{children}</>;
}
