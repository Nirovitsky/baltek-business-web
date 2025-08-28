/**
 * Scrollbar compensation utility to prevent layout shift when dropdowns open
 * and temporarily hide the body scrollbar.
 */

let scrollbarWidth = 0;

/**
 * Calculate the scrollbar width
 */
function getScrollbarWidth(): number {
  if (scrollbarWidth > 0) return scrollbarWidth;

  // Create a temporary element to measure scrollbar width
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  (outer.style as any).msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  outer.appendChild(inner);

  scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
}

/**
 * Compensate for scrollbar by adding padding when it's hidden
 */
function compensateScrollbar(hide: boolean = true) {
  const root = document.documentElement;
  const body = document.body;
  
  if (hide) {
    const width = getScrollbarWidth();
    root.style.setProperty('--scrollbar-width', `${width}px`);
    body.style.paddingRight = `${width}px`;
    body.style.overflow = 'hidden';
  } else {
    root.style.setProperty('--scrollbar-width', '0px');
    body.style.paddingRight = '';
    body.style.overflow = '';
  }
}

/**
 * Initialize scrollbar compensation
 */
export function initScrollbarCompensation() {
  // Calculate and store scrollbar width on load
  const width = getScrollbarWidth();
  document.documentElement.style.setProperty('--scrollbar-width', `${width}px`);

  // Listen for Radix UI dropdown/select state changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as Element;
        
        // Check if dropdown/select is opening or closing
        if (target.hasAttribute('data-radix-select-viewport') || 
            target.hasAttribute('data-radix-dropdown-menu-content') ||
            target.querySelector('[data-radix-select-viewport]') ||
            target.querySelector('[data-radix-dropdown-menu-content]')) {
          
          const isOpen = target.getAttribute('data-state') === 'open' ||
                        Boolean(target.querySelector('[data-state="open"]'));
          
          // Only compensate if the page actually has a scrollbar
          const hasScrollbar = document.body.scrollHeight > window.innerHeight;
          if (hasScrollbar) {
            compensateScrollbar(isOpen);
          }
        }
      }
    });
  });

  // Observe changes in the document
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['data-state', 'data-radix-select-viewport', 'data-radix-dropdown-menu-content']
  });

  return () => observer.disconnect();
}