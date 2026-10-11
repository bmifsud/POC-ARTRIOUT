import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { App, AppProps } from './App';

export interface WidgetInitOptions extends AppProps {
  containerId?: string;
  targetElement?: HTMLElement;
}

class NailLabWidgetSDK {
  private root: Root | null = null;

  public init(options: WidgetInitOptions = {}): void {
    const { containerId = 'nail-lab-ar-widget', targetElement, ...appProps } = options;

    let targetContainer = targetElement;
    if (!targetContainer && containerId) {
      targetContainer = document.getElementById(containerId) || undefined;
    }

    if (!targetContainer) {
      targetContainer = document.createElement('div');
      targetContainer.id = containerId;
      document.body.appendChild(targetContainer);
    }

    if (this.root) {
      this.root.unmount();
    }

    this.root = createRoot(targetContainer);
    this.root.render(React.createElement(App, appProps));
  }

  public destroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

export const NailLabWidget = new NailLabWidgetSDK();

if (typeof window !== 'undefined') {
  (window as any).NailLabWidget = NailLabWidget;

  document.addEventListener('DOMContentLoaded', () => {
    const scriptTag = document.querySelector('script[data-nail-lab-widget]');
    if (scriptTag) {
      const containerId = scriptTag.getAttribute('data-container-id') || 'nail-lab-ar-widget';
      const shopType = (scriptTag.getAttribute('data-shop-type') as any) || 'custom';
      NailLabWidget.init({ containerId, shopType });
    }
  });
}
