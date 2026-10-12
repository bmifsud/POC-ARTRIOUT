import { test, expect } from '@playwright/test';
import {
  ClickwrapConsent,
  ConsentStore,
  ConsentRecord,
  POLICY_VERSION,
  grantClickwrapConsent,
  revokeClickwrapConsent,
  cameraConsentActive,
  createProtectedCameraStream
} from '../../packages/compliance/src/ClickwrapConsent';

test.describe('ClickwrapConsent Unit & Security Tests', () => {
  let mockStore: ConsentStore;
  let storedRecord: ConsentRecord | null = null;

  test.beforeEach(() => {
    storedRecord = null;
    mockStore = {
      get: async () => storedRecord,
      save: async (record: ConsentRecord) => {
        storedRecord = record;
      }
    };
  });

  test('should manage internal consent state correctly', async () => {
    const consent = new ClickwrapConsent();
    expect(consent.isConsentGranted()).toBe(false);

    consent.grantConsent();
    expect(consent.isConsentGranted()).toBe(true);

    consent.revokeConsent();
    expect(consent.isConsentGranted()).toBe(false);
  });

  test('should synchronize consent state with ConsentStore', async () => {
    const consent = new ClickwrapConsent(mockStore);
    expect(await consent.syncWithStore()).toBe(false);

    await grantClickwrapConsent(mockStore, 'user-123');
    expect(await consent.syncWithStore()).toBe(true);
    expect(consent.isConsentGranted()).toBe(true);

    await revokeClickwrapConsent(mockStore, 'user-123');
    expect(await consent.syncWithStore()).toBe(false);
    expect(consent.isConsentGranted()).toBe(false);
  });

  test('should validate camera consent active status helper', () => {
    const activeRecord: ConsentRecord = {
      id: 'test-id',
      actor: 'user',
      action: 'grant',
      policyVersion: POLICY_VERSION,
      grantedAt: new Date().toISOString()
    };

    expect(cameraConsentActive(activeRecord)).toBe(true);

    const revokedRecord: ConsentRecord = {
      ...activeRecord,
      action: 'revoke'
    };
    expect(cameraConsentActive(revokedRecord)).toBe(false);

    const oldVersionRecord: ConsentRecord = {
      ...activeRecord,
      policyVersion: '0.9.0'
    };
    expect(cameraConsentActive(oldVersionRecord)).toBe(false);
    expect(cameraConsentActive(null)).toBe(false);
  });

  test('should enforce BIPA consent gate before opening camera stream', async () => {
    const consent = new ClickwrapConsent();

    await expect(consent.requestCameraStream()).rejects.toThrow(
      'BIPA Consent Violation: Camera acquisition blocked prior to explicit user consent.'
    );

    await expect(createProtectedCameraStream()).rejects.toThrow(
      'BIPA Consent Violation: Camera acquisition blocked. A valid ClickwrapConsent instance must be provided.'
    );

    let getUserMediaCalled = false;
    const fakeStream = {} as MediaStream;

    // Mock navigator.mediaDevices
    const originalMediaDevices = globalThis.navigator?.mediaDevices;
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...globalThis.navigator,
        mediaDevices: {
          getUserMedia: async () => {
            getUserMediaCalled = true;
            return fakeStream;
          }
        }
      },
      configurable: true,
      writable: true
    });

    consent.grantConsent();
    const stream = await consent.requestCameraStream();
    expect(getUserMediaCalled).toBe(true);
    expect(stream).toBe(fakeStream);

    const protectedStream = await createProtectedCameraStream(consent);
    expect(protectedStream).toBe(fakeStream);

    if (originalMediaDevices) {
      Object.defineProperty(globalThis.navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true
      });
    }
  });

  test('should safely construct modal DOM elements without using innerHTML', async () => {
    // Mock minimal DOM environment for renderModal testing in Node runner
    const elementsCreated: string[] = [];

    class MockElement {
      id = '';
      className = '';
      type = '';
      disabled = false;
      checked = false;
      htmlFor = '';
      textContent = '';
      children: MockElement[] = [];
      style: Record<string, string> & { cssText?: string } = {} as any;
      listeners: Record<string, Function[]> = {};

      constructor(public tagName: string) {
        elementsCreated.push(tagName);
      }

      get firstChild() {
        return this.children[0] || null;
      }

      removeChild(child: MockElement) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
        return child;
      }

      appendChild(child: MockElement) {
        this.children.push(child);
        return child;
      }

      addEventListener(event: string, fn: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
      }

      querySelector(selector: string): MockElement | null {
        if (selector.startsWith('#')) {
          const targetId = selector.slice(1);
          return this.findChildById(targetId);
        }
        return null;
      }

      findChildById(id: string): MockElement | null {
        if (this.id === id) return this;
        for (const child of this.children) {
          const found = child.findChildById(id);
          if (found) return found;
        }
        return null;
      }

      remove() {
        // Mock element removal
      }

      triggerEvent(event: string) {
        const handlers = this.listeners[event] || [];
        for (const handler of handlers) {
          handler();
        }
      }
    }

    const container = new MockElement('div');
    const existingChild = new MockElement('span');
    container.appendChild(existingChild);

    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: (tag: string) => new MockElement(tag)
      },
      configurable: true,
      writable: true
    });

    try {
      const consent = new ClickwrapConsent(mockStore);
      let onGrantedCalled = false;

      const renderPromise = consent.renderModal(container as unknown as HTMLElement, () => {
        onGrantedCalled = true;
      });

      // Verify old children cleared
      expect(container.children.length).toBe(1);
      expect(container.children[0].id).toBe('bipa-consent-modal');

      // Verify created elements use document.createElement
      expect(elementsCreated).toContain('div');
      expect(elementsCreated).toContain('h2');
      expect(elementsCreated).toContain('p');
      expect(elementsCreated).toContain('input');
      expect(elementsCreated).toContain('label');
      expect(elementsCreated).toContain('button');

      // Locate modal elements inside mock tree
      const checkbox = container.querySelector('#bipa-consent-checkbox')!;
      const submitBtn = container.querySelector('#bipa-consent-submit')!;

      expect(checkbox).toBeDefined();
      expect(submitBtn).toBeDefined();
      expect(submitBtn.disabled).toBe(true);

      // Simulate checkbox change
      checkbox.checked = true;
      checkbox.triggerEvent('change');
      expect(submitBtn.disabled).toBe(false);

      // Simulate submit click
      submitBtn.triggerEvent('click');
      await renderPromise;

      expect(consent.isConsentGranted()).toBe(true);
      expect(onGrantedCalled).toBe(true);
      expect(storedRecord?.action).toBe('grant');
    } finally {
      if (originalDocument) {
        Object.defineProperty(globalThis, 'document', {
          value: originalDocument,
          configurable: true
        });
      } else {
        delete (globalThis as any).document;
      }
    }
  });
});
