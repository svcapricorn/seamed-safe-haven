// SailMed Tracker - SDK Entry Point
// For embedding in other web applications

import type { EmbeddedConfig } from '@/types';

interface SailMedInstance {
  destroy: () => void;
}

// SDK will be implemented in a future update
// This is a placeholder for the embedded mode architecture
export function createSailMedTracker(
  container: HTMLElement | string,
  config: EmbeddedConfig
): SailMedInstance {
  console.log('SailMed Tracker SDK initialized with config:', config);
  
  return {
    destroy: () => {
      console.log('SailMed Tracker destroyed');
    },
  };
}

// Auto-expose to window for script tag usage
if (typeof window !== 'undefined') {
  (window as any).SailMedTracker = {
    create: createSailMedTracker,
  };
}

export type { EmbeddedConfig, SailMedInstance };
