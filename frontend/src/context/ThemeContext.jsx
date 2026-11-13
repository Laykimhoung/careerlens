import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';

export const ThemeContext = createContext();

function getCircleClipPaths(cx, cy, maxRadius, viewportWidth, viewportHeight) {
  const toX = (x) => `${(x / viewportWidth) * 100}%`;
  const toY = (y) => `${(y / viewportHeight) * 100}%`;
  const point = `${toX(cx)} ${toY(cy)}`;
  // circle() percentage radii resolve against hypot(w, h) / sqrt(2) of the reference box.
  const toRadius = (r) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  return [
    `circle(0% at ${point})`,
    `circle(${toRadius(maxRadius)} at ${point})`,
  ];
}

function resolveOriginElement(origin) {
  if (!origin) return null;
  if (typeof origin.getBoundingClientRect === 'function') return origin;
  if (origin.current && typeof origin.current.getBoundingClientRect === 'function') {
    return origin.current;
  }
  if (origin.currentTarget && typeof origin.currentTarget.getBoundingClientRect === 'function') {
    return origin.currentTarget;
  }
  if (origin.target && typeof origin.target.getBoundingClientRect === 'function') {
    return origin.target;
  }
  return null;
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const isTransitioningRef = useRef(false);
  const activeAnimRef = useRef(null);

  const cancelAnim = useCallback(() => {
    activeAnimRef.current?.cancel();
    activeAnimRef.current = null;
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      cancelAnim();
      const root = document.documentElement;
      if (root.dataset.magicuiThemeVt !== 'active') return;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty('--magicui-theme-toggle-vt-duration');
      root.style.removeProperty('--magicui-theme-vt-clip-from');
    };
  }, [cancelAnim]);

  const toggleTheme = useCallback(
    (origin, { duration = 400, fromCenter = false } = {}) => {
      const root = document.documentElement;
      if (isTransitioningRef.current || root.dataset.magicuiThemeVt === 'active') {
        return;
      }

      const applyTheme = () => {
        setTheme((prevTheme) => {
          const nextTheme = prevTheme === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme', nextTheme);
          root.setAttribute('data-theme', nextTheme);
          if (document.body) {
            document.body.setAttribute('data-theme', nextTheme);
          }
          return nextTheme;
        });
      };

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (typeof document.startViewTransition !== 'function' || prefersReducedMotion) {
        applyTheme();
        return;
      }

      // innerWidth/innerHeight (not visualViewport): percentages must resolve
      // against the snapshot reference box, which includes classic scrollbars.
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const originEl = fromCenter ? null : resolveOriginElement(origin);

      let x = viewportWidth / 2;
      let y = viewportHeight / 2;
      if (originEl) {
        const { top, left, width, height } = originEl.getBoundingClientRect();
        x = left + width / 2;
        y = top + height / 2;
      }

      const maxRadius = Math.hypot(
        Math.max(x, viewportWidth - x),
        Math.max(y, viewportHeight - y)
      );
      const clipPath = getCircleClipPaths(x, y, maxRadius, viewportWidth, viewportHeight);

      root.dataset.magicuiThemeVt = 'active';
      root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`);
      // Pin the collapsed clip-path via CSS so Firefox does not paint the new
      // theme unclipped between snapshot and the ready.then() JS animation.
      root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

      const cleanup = () => {
        isTransitioningRef.current = false;
        delete root.dataset.magicuiThemeVt;
        root.style.removeProperty('--magicui-theme-toggle-vt-duration');
        root.style.removeProperty('--magicui-theme-vt-clip-from');
        cancelAnim();
      };

      isTransitioningRef.current = true;
      const transition = document.startViewTransition(() => {
        flushSync(applyTheme);
      });

      if (typeof transition?.finished?.finally === 'function') {
        transition.finished.finally(cleanup).catch(() => {});
      } else {
        cleanup();
      }

      const ready = transition?.ready;
      if (ready && typeof ready.then === 'function') {
        ready
          .then(() => {
            const anim = root.animate(
              { clipPath },
              {
                duration,
                easing: 'ease-in-out',
                fill: 'forwards',
                pseudoElement: '::view-transition-new(root)',
              }
            );
            activeAnimRef.current = anim;
          })
          .catch(() => {});
      }
    },
    [cancelAnim]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
