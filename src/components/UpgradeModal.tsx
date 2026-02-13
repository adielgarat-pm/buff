interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Silent Launch mode: upgrade modal is hidden entirely.
 * The component signature is preserved so existing imports don't break.
 */
export function UpgradeModal(_props: UpgradeModalProps) {
  return null;
}
