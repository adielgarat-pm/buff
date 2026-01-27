/**
 * Browser detection for PWA install instructions
 */

export type BrowserType = 
  | 'chrome' 
  | 'edge' 
  | 'firefox' 
  | 'safari' 
  | 'samsung' 
  | 'opera' 
  | 'brave'
  | 'unknown';

export interface BrowserInfo {
  browser: BrowserType;
  displayName: string;
  supportsInstall: boolean;
  menuIcon: string;
  menuLocation: string;
  installAction: string;
}

/**
 * Detects the current browser from user agent
 */
export function detectBrowser(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();
  
  // Order matters - more specific checks first
  
  // Samsung Internet
  if (ua.includes('samsungbrowser')) {
    return 'samsung';
  }
  
  // Brave (has Chrome in UA but also has Brave)
  if ((navigator as any).brave?.isBrave) {
    return 'brave';
  }
  
  // Edge (Chromium-based)
  if (ua.includes('edg/') || ua.includes('edge/')) {
    return 'edge';
  }
  
  // Opera
  if (ua.includes('opr/') || ua.includes('opera')) {
    return 'opera';
  }
  
  // Firefox
  if (ua.includes('firefox') || ua.includes('fxios')) {
    return 'firefox';
  }
  
  // Chrome (check after other Chromium browsers)
  if (ua.includes('chrome') || ua.includes('crios')) {
    return 'chrome';
  }
  
  // Safari (check after Chrome as Chrome also has Safari in UA)
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'safari';
  }
  
  return 'unknown';
}

/**
 * Get browser-specific installation instructions
 */
export function getBrowserInfo(browser: BrowserType, isDesktop: boolean): BrowserInfo {
  const browserConfigs: Record<BrowserType, BrowserInfo> = {
    chrome: {
      browser: 'chrome',
      displayName: 'Chrome',
      supportsInstall: true,
      menuIcon: '⋮',
      menuLocation: isDesktop ? 'בפינה הימנית העליונה' : 'למעלה',
      installAction: isDesktop ? 'התקן אפליקציה' : 'הוסף למסך הבית',
    },
    edge: {
      browser: 'edge',
      displayName: 'Edge',
      supportsInstall: true,
      menuIcon: '⋯',
      menuLocation: 'בפינה הימנית העליונה',
      installAction: 'התקן אתר כאפליקציה',
    },
    firefox: {
      browser: 'firefox',
      displayName: 'Firefox',
      supportsInstall: false,
      menuIcon: '☰',
      menuLocation: 'בפינה הימנית העליונה',
      installAction: 'לא נתמך - נסו Chrome',
    },
    safari: {
      browser: 'safari',
      displayName: 'Safari',
      supportsInstall: true, // Via share menu
      menuIcon: '↑',
      menuLocation: 'בתחתית המסך',
      installAction: 'הוסף למסך הבית',
    },
    samsung: {
      browser: 'samsung',
      displayName: 'Samsung Internet',
      supportsInstall: true,
      menuIcon: '☰',
      menuLocation: 'למטה',
      installAction: 'הוסף לדף הבית',
    },
    opera: {
      browser: 'opera',
      displayName: 'Opera',
      supportsInstall: true,
      menuIcon: '⋮',
      menuLocation: 'בפינה הימנית העליונה',
      installAction: 'הוסף למסך הבית',
    },
    brave: {
      browser: 'brave',
      displayName: 'Brave',
      supportsInstall: true,
      menuIcon: '☰',
      menuLocation: 'בפינה הימנית העליונה',
      installAction: 'התקן אפליקציה',
    },
    unknown: {
      browser: 'unknown',
      displayName: 'דפדפן',
      supportsInstall: false,
      menuIcon: '⋮',
      menuLocation: 'בתפריט',
      installAction: 'הוסף למסך הבית',
    },
  };
  
  return browserConfigs[browser];
}

/**
 * Hook to get current browser detection
 */
export function useBrowserDetection(isDesktop: boolean = false): BrowserInfo {
  const browser = detectBrowser();
  return getBrowserInfo(browser, isDesktop);
}
