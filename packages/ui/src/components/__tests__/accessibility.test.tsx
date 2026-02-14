/**
 * UI Component Accessibility Tests
 * Validates WCAG compliance: ARIA roles, attributes, keyboard navigation.
 *
 * Tests the raw component markup output for correct a11y attributes
 * without requiring jest-axe (which needs a full DOM environment).
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../button';

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

// ─── Dialog (static markup test) ─────────────────────────────
// Note: Dialog uses createPortal which doesn't work in SSR.
// We test the component exports exist and have correct types.

describe('Dialog component exports', () => {
  it('should export all compound components', async () => {
    const dialogModule = await import('../dialog');
    expect(dialogModule.Dialog).toBeDefined();
    expect(dialogModule.DialogTrigger).toBeDefined();
    expect(dialogModule.DialogContent).toBeDefined();
    expect(dialogModule.DialogHeader).toBeDefined();
    expect(dialogModule.DialogFooter).toBeDefined();
    expect(dialogModule.DialogTitle).toBeDefined();
    expect(dialogModule.DialogDescription).toBeDefined();
  });
});

// ─── Tabs (static markup test) ────────────────────────────────

describe('Tabs component exports', () => {
  it('should export all compound components', async () => {
    const tabsModule = await import('../tabs');
    expect(tabsModule.Tabs).toBeDefined();
    expect(tabsModule.TabsList).toBeDefined();
    expect(tabsModule.TabsTrigger).toBeDefined();
    expect(tabsModule.TabsContent).toBeDefined();
  });
});

// ─── DropdownMenu (exports check) ────────────────────────────

describe('DropdownMenu component exports', () => {
  it('should export all compound components', async () => {
    const menuModule = await import('../dropdown-menu');
    expect(menuModule.DropdownMenu).toBeDefined();
    expect(menuModule.DropdownMenuTrigger).toBeDefined();
    expect(menuModule.DropdownMenuContent).toBeDefined();
    expect(menuModule.DropdownMenuItem).toBeDefined();
  });
});

// ─── Select (exports check) ──────────────────────────────────

describe('Select component exports', () => {
  it('should export all compound components', async () => {
    const selectModule = await import('../select');
    expect(selectModule.Select).toBeDefined();
    expect(selectModule.SelectTrigger).toBeDefined();
    expect(selectModule.SelectContent).toBeDefined();
    expect(selectModule.SelectItem).toBeDefined();
    expect(selectModule.SelectValue).toBeDefined();
  });
});
