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
  
  if (ua.includes('samsungbrowser')) return 'samsung';
  if ((navigator as any).brave?.isBrave) return 'brave';
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if (ua.includes('firefox') || ua.includes('fxios')) return 'firefox';
  if (ua.includes('chrome') || ua.includes('crios')) return 'chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  
  return 'unknown';
}

/**
 * Get browser-specific installation instructions
 */
export function getBrowserInfo(browser: BrowserType, isDesktop: boolean, language: 'he' | 'en' = 'he'): BrowserInfo {
  const isHe = language === 'he';

  const browserConfigs: Record<BrowserType, BrowserInfo> = {
    chrome: {
      browser: 'chrome',
      displayName: 'Chrome',
      supportsInstall: true,
      menuIcon: '⋮',
      menuLocation: isHe
        ? (isDesktop ? 'בפינה הימנית העליונה' : 'למעלה')
        : (isDesktop ? 'in the top-right corner' : 'at the top'),
      installAction: isHe
        ? (isDesktop ? 'התקן אפליקציה' : 'הוסף למסך הבית')
        : (isDesktop ? 'Install app' : 'Add to Home Screen'),
    },
    edge: {
      browser: 'edge',
      displayName: 'Edge',
      supportsInstall: true,
      menuIcon: '⋯',
      menuLocation: isHe ? 'בפינה הימנית העליונה' : 'in the top-right corner',
      installAction: isHe ? 'התקן אתר כאפליקציה' : 'Install site as an app',
    },
    firefox: {
      browser: 'firefox',
      displayName: 'Firefox',
      supportsInstall: false,
      menuIcon: '☰',
      menuLocation: isHe ? 'בפינה הימנית העליונה' : 'in the top-right corner',
      installAction: isHe ? 'לא נתמך - נסו Chrome' : 'Not supported — try Chrome',
    },
    safari: {
      browser: 'safari',
      displayName: 'Safari',
      supportsInstall: true,
      menuIcon: '↑',
      menuLocation: isHe ? 'בתחתית המסך' : 'at the bottom of the screen',
      installAction: isHe ? 'הוסף למסך הבית' : 'Add to Home Screen',
    },
    samsung: {
      browser: 'samsung',
      displayName: 'Samsung Internet',
      supportsInstall: true,
      menuIcon: '☰',
      menuLocation: isHe ? 'למטה' : 'at the bottom',
      installAction: isHe ? 'הוסף לדף הבית' : 'Add to Home Screen',
    },
    opera: {
      browser: 'opera',
      displayName: 'Opera',
      supportsInstall: true,
      menuIcon: '⋮',
      menuLocation: isHe ? 'בפינה הימנית העליונה' : 'in the top-right corner',
      installAction: isHe ? 'הוסף למסך הבית' : 'Add to Home Screen',
    },
    brave: {
      browser: 'brave',
      displayName: 'Brave',
      supportsInstall: true,
      menuIcon: '☰',
      menuLocation: isHe ? 'בפינה הימנית העליונה' : 'in the top-right corner',
      installAction: isHe ? 'התקן אפליקציה' : 'Install app',
    },
    unknown: {
      browser: 'unknown',
      displayName: isHe ? 'דפדפן' : 'Browser',
      supportsInstall: false,
      menuIcon: '⋮',
      menuLocation: isHe ? 'בתפריט' : 'in the menu',
      installAction: isHe ? 'הוסף למסך הבית' : 'Add to Home Screen',
    },
  };
  
  return browserConfigs[browser];
}

/**
 * Hook to get current browser detection
 */
export function useBrowserDetection(isDesktop: boolean = false, language: 'he' | 'en' = 'he'): BrowserInfo {
  const browser = detectBrowser();
  return getBrowserInfo(browser, isDesktop, language);
}
