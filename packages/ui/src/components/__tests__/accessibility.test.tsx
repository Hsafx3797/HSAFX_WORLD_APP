/**
 * UI Component Accessibility Tests
 * Validates WCAG compliance: ARIA roles, attributes, keyboard navigation.
 *
 * Tests the raw component markup output for correct a11y attributes
 * without requiring jest-axe (which needs a full DOM environment).
 */
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from '../button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '../dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../dropdown-menu';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select';

// ─── DOM render helper ───────────────────────────────────────

let _container: HTMLElement;
let _root: Root;

function renderDOM(element: React.ReactElement): HTMLElement {
  _container = document.createElement('div');
  document.body.appendChild(_container);
  _root = createRoot(_container);
  act(() => { _root.render(element); });
  return _container;
}

function cleanupDOM() {
  if (_root) act(() => { _root.unmount(); });
  _container?.remove();
}

// ─── Button ──────────────────────────────────────────────────

describe('Button accessibility', () => {
  it('should render as a <button> element by default', () => {
    const html = renderToStaticMarkup(React.createElement(Button, null, 'Click'));
    expect(html).toContain('<button');
    expect(html).toContain('Click');
  });

  it('should accept and forward aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Button, { 'aria-label': 'Close dialog' }, 'X'),
    );
    expect(html).toContain('aria-label="Close dialog"');
  });

  it('should include disabled attribute when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Button, { disabled: true }, 'Disabled'),
    );
    expect(html).toContain('disabled');
  });

  it('should set type="button" by default (not submit)', () => {
    const html = renderToStaticMarkup(React.createElement(Button, null, 'Btn'));
    // Should either have type="button" or no type (browser default is submit)
    // Our button should explicitly set type
    expect(html).toMatch(/type="button"/);
  });

  it('should apply loading state accessibly', () => {
    const html = renderToStaticMarkup(
      React.createElement(Button, { loading: true }, 'Loading'),
    );
    // Should still be a button, with disabled
    expect(html).toContain('<button');
    expect(html).toContain('disabled');
  });

  it('should support asChild rendering', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Button,
        { asChild: true },
        React.createElement('a', { href: '/test' }, 'Link'),
      ),
    );
    // Should render as <a> not <button>
    expect(html).toContain('<a');
    expect(html).toContain('href="/test"');
    expect(html).not.toContain('<button');
  });
});

// ─── Tabs accessibility ──────────────────────────────────────

describe('Tabs accessibility', () => {
  afterEach(cleanupDOM);

  it('should render tablist, tab, and tabpanel ARIA roles', () => {
    renderDOM(
      React.createElement(Tabs, { defaultValue: 'a' },
        React.createElement(TabsList, null,
          React.createElement(TabsTrigger, { value: 'a' }, 'Tab A'),
          React.createElement(TabsTrigger, { value: 'b' }, 'Tab B'),
        ),
        React.createElement(TabsContent, { value: 'a' }, 'Panel A'),
        React.createElement(TabsContent, { value: 'b' }, 'Panel B'),
      ),
    );
    expect(_container.querySelector('[role="tablist"]')).toBeTruthy();
    expect(_container.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(_container.querySelector('[role="tabpanel"]')).toBeTruthy();
  });

  it('should mark active tab with aria-selected="true"', () => {
    renderDOM(
      React.createElement(Tabs, { defaultValue: 'a' },
        React.createElement(TabsList, null,
          React.createElement(TabsTrigger, { value: 'a' }, 'Tab A'),
          React.createElement(TabsTrigger, { value: 'b' }, 'Tab B'),
        ),
        React.createElement(TabsContent, { value: 'a' }, 'Panel A'),
      ),
    );
    const tabs = _container.querySelectorAll('[role="tab"]');
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');
  });

  it('should link tab to panel via aria-controls', () => {
    renderDOM(
      React.createElement(Tabs, { defaultValue: 'a' },
        React.createElement(TabsList, null,
          React.createElement(TabsTrigger, { value: 'a' }, 'Tab A'),
        ),
        React.createElement(TabsContent, { value: 'a' }, 'Panel A'),
      ),
    );
    const tab = _container.querySelector('[role="tab"]');
    const panelId = tab!.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(_container.querySelector(`#${panelId}`)).toBeTruthy();
  });

  it('should label tabpanel with aria-labelledby referencing its tab', () => {
    renderDOM(
      React.createElement(Tabs, { defaultValue: 'a' },
        React.createElement(TabsList, null,
          React.createElement(TabsTrigger, { value: 'a' }, 'Tab A'),
        ),
        React.createElement(TabsContent, { value: 'a' }, 'Panel A'),
      ),
    );
    const panel = _container.querySelector('[role="tabpanel"]');
    const labelledBy = panel!.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(_container.querySelector(`#${labelledBy}`)).toBeTruthy();
  });
});

// ─── Dialog accessibility ────────────────────────────────────

describe('Dialog accessibility', () => {
  afterEach(cleanupDOM);

  it('should render trigger as a button', () => {
    renderDOM(
      React.createElement(Dialog, null,
        React.createElement(DialogTrigger, null, 'Open'),
      ),
    );
    const trigger = _container.querySelector('button');
    expect(trigger).toBeTruthy();
    expect(trigger!.textContent).toBe('Open');
  });

  it('should render dialog with role="dialog" and aria-modal when open', () => {
    renderDOM(
      React.createElement(Dialog, { open: true },
        React.createElement(DialogContent, null,
          React.createElement(DialogTitle, null, 'Test Title'),
          React.createElement(DialogDescription, null, 'Test Desc'),
        ),
      ),
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.getAttribute('aria-modal')).toBe('true');
  });

  it('should link dialog to title via aria-labelledby', () => {
    renderDOM(
      React.createElement(Dialog, { open: true },
        React.createElement(DialogContent, null,
          React.createElement(DialogTitle, null, 'My Title'),
        ),
      ),
    );
    const dialog = document.querySelector('[role="dialog"]');
    const titleId = dialog!.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)?.textContent).toBe('My Title');
  });
});

// ─── DropdownMenu accessibility ──────────────────────────────

describe('DropdownMenu accessibility', () => {
  afterEach(cleanupDOM);

  it('should render trigger with aria-haspopup="menu"', () => {
    renderDOM(
      React.createElement(DropdownMenu, null,
        React.createElement(DropdownMenuTrigger, null, 'Menu'),
        React.createElement(DropdownMenuContent, null,
          React.createElement(DropdownMenuItem, null, 'Item'),
        ),
      ),
    );
    const trigger = _container.querySelector('[aria-haspopup="menu"]');
    expect(trigger).toBeTruthy();
    expect(trigger!.getAttribute('aria-expanded')).toBe('false');
  });

  it('should export all compound components', async () => {
    const menuModule = await import('../dropdown-menu');
    expect(menuModule.DropdownMenu).toBeDefined();
    expect(menuModule.DropdownMenuTrigger).toBeDefined();
    expect(menuModule.DropdownMenuContent).toBeDefined();
    expect(menuModule.DropdownMenuItem).toBeDefined();
  });
});

// ─── Select accessibility ────────────────────────────────────

describe('Select accessibility', () => {
  afterEach(cleanupDOM);

  it('should render trigger with role="combobox"', () => {
    renderDOM(
      React.createElement(Select, { defaultValue: 'a' },
        React.createElement(SelectTrigger, null,
          React.createElement(SelectValue, null),
        ),
        React.createElement(SelectContent, null,
          React.createElement(SelectItem, { value: 'a' }, 'Option A'),
          React.createElement(SelectItem, { value: 'b' }, 'Option B'),
        ),
      ),
    );
    const trigger = _container.querySelector('[role="combobox"]');
    expect(trigger).toBeTruthy();
    expect(trigger!.getAttribute('aria-expanded')).toBe('false');
  });

  it('should export all compound components', async () => {
    const selectModule = await import('../select');
    expect(selectModule.Select).toBeDefined();
    expect(selectModule.SelectTrigger).toBeDefined();
    expect(selectModule.SelectContent).toBeDefined();
    expect(selectModule.SelectItem).toBeDefined();
    expect(selectModule.SelectValue).toBeDefined();
  });
});
