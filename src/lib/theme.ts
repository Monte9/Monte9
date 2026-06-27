export const THEMES = ["light", "dark", "sunset"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  sunset: "Sunset",
};

// Swatch colors (bg + accent) for the settings picker previews.
export const THEME_SWATCHES: Record<Theme, { bg: string; accent: string }> = {
  light: { bg: "#ffffff", accent: "#2563eb" },
  dark: { bg: "#0b0d10", accent: "#6aa8ff" },
  sunset: { bg: "#fbf3ea", accent: "#c2410c" },
};

// Globe (WebGL) colors per theme — kept in JS since they drive Three.js
// materials, mirroring the CSS palette roles.
export const GLOBE_COLORS: Record<
  Theme,
  {
    sphere: string;
    border: string;
    cat: { home: string; lived: string; visited: string };
  }
> = {
  light: {
    sphere: "#cfe0f5",
    border: "#5b6b80",
    cat: { home: "#dc2626", lived: "#2563eb", visited: "#16a34a" },
  },
  dark: {
    sphere: "#1b2735",
    border: "#46566b",
    cat: { home: "#f87171", lived: "#60a5fa", visited: "#4ade80" },
  },
  sunset: {
    sphere: "#e3cba6",
    border: "#5c4326",
    cat: { home: "#b91c1c", lived: "#1d4ed8", visited: "#15803d" },
  },
};

export const THEME_KEY = "theme";
export const REDUCE_MOTION_KEY = "reduce-motion";

// Blocking inline script: sets data-theme + data-reduce-motion on <html>
// before first paint so there is no flash of the wrong theme.
export const NO_FOUC_SCRIPT = `(function(){try{
var t=localStorage.getItem('${THEME_KEY}');
if(t!=='light'&&t!=='dark'&&t!=='sunset'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
document.documentElement.setAttribute('data-theme',t);
var r=localStorage.getItem('${REDUCE_MOTION_KEY}');
if(r!=='true'&&r!=='false'){r=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'true':'false';}
document.documentElement.setAttribute('data-reduce-motion',r);
}catch(e){}})();`;

export function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}
