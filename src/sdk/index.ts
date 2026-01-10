// SeaMed Tracker - SDK Entry Point
// For embedding in other web applications

import type { EmbeddedConfig } from '@/types';

interface SeaMedInstance {
  destroy: () => void;
}

// SDK will be implemented in a future update
// This is a placeholder for the embedded mode architecture
export function createSeaMedTracker(
  container: HTMLElement | string,
  config: EmbeddedConfig
): SeaMedInstance {
  console.log('SeaMed Tracker SDK initialized with config:', config);
  
  return {
    destroy: () => {
      console.log('SeaMed Tracker destroyed');
    },
  };
}

// Auto-expose to window for script tag usage
if (typeof window !== 'undefined') {
  (window as any).SeaMedTracker = {
    create: createSeaMedTracker,
  };
}

export type { EmbeddedConfig, SeaMedInstance };
