"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import FlexiRideLoader from "./FlexiRideLoader";

const SAFETY_TIMEOUT_MS = 800; // Auto-hide after 800ms if no route change detected

export default function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerLoader = () => {
    // Clear any existing active timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Defer the state update to avoid React synchronous layout constraints
    // Next.js calls pushState inside useInsertionEffect which forbids synchronous state updates
    setTimeout(() => {
      setLoading(true);
    }, 0);

    // Setup safety fallback auto-hide (in case the button does not trigger redirection)
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, SAFETY_TIMEOUT_MS);
  };

  // Hide loader instantly when the pathname or search parameters change (navigation complete)
  useEffect(() => {
    setLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, searchParams]);

  // Capture all button, anchor, icon, and programmatic navigation clicks instantly
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 1. Intercept all Link/Anchor tag clicks (<a>)
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");

        // Intercept if it's an internal redirecting route and not a same-page hash link
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/#") &&
          !href.includes(":") &&
          targetAttr !== "_blank" &&
          href !== pathname
        ) {
          triggerLoader();
          return;
        }
      }

      // 2. Intercept all Button and Icon element clicks instantly
      const button = target.closest("button");
      const icon = target.closest("svg");
      const isRoleButton = target.closest('[role="button"]');

      if (button || icon || isRoleButton) {
        // Exclude specific helper actions if we want, but letting them trigger loader and auto-expire
        // is extremely robust. We check if they don't look like toggle controls, slide buttons or pagination dots.
        const elem = button || icon || isRoleButton;
        const classes = elem ? String(elem.className) : "";
        const id = elem ? String(elem.id) : "";

        // Avoid triggering loader for simple utility buttons (like carousel arrow buttons or chatbot toggle)
        if (
          classes.includes("carousel-arrow") ||
          classes.includes("slide-nav") ||
          classes.includes("chatbot-toggle") ||
          id.includes("chatbot") ||
          // Don't trigger loader for filter pills, toggles, or form submissions
          (elem as HTMLElement).closest('form') !== null ||
          (elem as HTMLElement).closest('[role="tablist"]') !== null ||
          (elem as HTMLElement).closest('[role="tab"]') !== null
        ) {
          return;
        }

        // Only trigger loader if the button is likely to navigate (has an href child or type="button" without form)
        const hasHrefChild = (elem as HTMLElement).querySelector('a[href]');
        const isNavButton = (elem as HTMLButtonElement).type !== 'submit' && hasHrefChild;
        if (!hasHrefChild && !(elem as HTMLElement).closest('a')) {
          return;
        }
      }
    };

    // Intercept standard browser routing changes (history updates)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      triggerLoader();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      const newUrl = args[2] ? String(args[2]) : "";
      if (newUrl && !newUrl.includes(pathname)) {
        triggerLoader();
      }
      return originalReplaceState.apply(this, args);
    };

    // Intercept browser back/forward buttons
    const handlePopState = () => {
      triggerLoader();
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      
      // Clean restore original browser history hook functions
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [pathname]);

  if (!loading) return null;

  return <FlexiRideLoader fullscreen={true} />;
}
