/**
 * Specialized Tools Registry
 * Category: Specialized
 * Subcategory: Visualization, Utility
 */

import type { ToolMetadata } from '../types';

export const specializedTools: ToolMetadata[] = [
  // =====================================================
  // VISUALIZATION TOOLS
  // =====================================================

  {
    id: 'db-schema-visualizer', name: 'Database Schema Visualizer', description: 'Visualize database schema from DBML or SQL DDL to ER diagram', category: 'Specialized', subcategory: 'Visualization', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'file',
    options: [
      {
        name: 'inputFormat', type: 'select', label: 'Input Format', default: 'dbml', options: [
          { value: 'dbml', label: 'DBML (Database Markup Language)' },
          { value: 'postgresql', label: 'PostgreSQL DDL' },
          { value: 'mysql', label: 'MySQL DDL' },
          { value: 'mssql', label: 'SQL Server DDL' },
          { value: 'sqlite', label: 'SQLite DDL' },
        ]
      },
      {
        name: 'outputFormat', type: 'select', label: 'Output Format', default: 'svg', options: [
          { value: 'svg', label: 'SVG (Vector)' },
          { value: 'png', label: 'PNG (Raster)' },
          { value: 'mermaid', label: 'Mermaid ERD Code' },
          { value: 'dot', label: 'Graphviz DOT' },
        ]
      },
      {
        name: 'layout', type: 'select', label: 'Layout Direction', default: 'LR', options: [
          { value: 'LR', label: 'Left to Right' },
          { value: 'TB', label: 'Top to Bottom' },
          { value: 'RL', label: 'Right to Left' },
          { value: 'BT', label: 'Bottom to Top' },
        ]
      },
      {
        name: 'theme', type: 'select', label: 'Theme', default: 'default', options: [
          { value: 'default', label: 'Default' },
          { value: 'forest', label: 'Forest' },
          { value: 'dark', label: 'Dark' },
          { value: 'neutral', label: 'Neutral' },
        ]
      },
      { name: 'showIndexes', type: 'boolean', label: 'Show Indexes', default: true },
      { name: 'showConstraints', type: 'boolean', label: 'Show Constraints', default: true },
      { name: 'showDataTypes', type: 'boolean', label: 'Show Data Types', default: true },
      { name: 'groupBySchema', type: 'boolean', label: 'Group by Schema', default: false },
    ]
  },
  {
    id: 'file-tree-generator', name: 'File Tree Visualizer', description: 'Generate a visual folder tree structure from text input', category: 'Specialized', subcategory: 'Visualization', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      {
        name: 'style', type: 'select', label: 'Tree Style', default: 'ascii', options: [
          { value: 'ascii', label: 'ASCII (├── └──)' },
          { value: 'unicode', label: 'Unicode (┣━━ ┗━━)' },
          { value: 'compact', label: 'Compact (indented)' },
          { value: 'markdown', label: 'Markdown List' },
        ]
      },
      { name: 'showIcons', type: 'boolean', label: 'Show File Icons', default: true },
      { name: 'sortFolders', type: 'boolean', label: 'Folders First', default: true },
      { name: 'showHidden', type: 'boolean', label: 'Show Hidden Files', default: false },
      { name: 'maxDepth', type: 'number', label: 'Max Depth', default: 0, min: 0, max: 20, description: '0 = unlimited' },
      { name: 'rootName', type: 'text', label: 'Root Folder Name', default: '.' },
    ]
  },

  // =====================================================
  // UTILITY TOOLS
  // =====================================================

  {
    id: 'cheque-generator', name: 'Cheque/Check Generator', description: 'Generate printable bank cheques with customizable templates', category: 'Specialized', subcategory: 'Utility', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'client', inputType: 'json', outputType: 'file',
    options: [
      { name: 'payeeName', type: 'text', label: 'Pay to the Order of', required: true, placeholder: 'Recipient Name' },
      { name: 'amount', type: 'number', label: 'Amount', required: true, min: 0.01 },
      {
        name: 'currency', type: 'select', label: 'Currency', default: 'USD', options: [
          { value: 'USD', label: 'US Dollar ($)' },
          { value: 'EUR', label: 'Euro (€)' },
          { value: 'GBP', label: 'British Pound (£)' },
          { value: 'SAR', label: 'Saudi Riyal (ر.س)' },
          { value: 'AED', label: 'UAE Dirham (د.إ)' },
          { value: 'INR', label: 'Indian Rupee (₹)' },
          { value: 'PKR', label: 'Pakistani Rupee (Rs)' },
        ]
      },
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'memo', type: 'text', label: 'Memo/For', placeholder: 'Payment description' },
      { name: 'accountName', type: 'text', label: 'Account Holder Name', required: true },
      { name: 'bankName', type: 'text', label: 'Bank Name', required: true },
      { name: 'accountNumber', type: 'text', label: 'Account Number (masked)', placeholder: '****1234' },
      { name: 'routingNumber', type: 'text', label: 'Routing/Sort Code', placeholder: '123456789' },
      { name: 'chequeNumber', type: 'text', label: 'Cheque Number', placeholder: '001' },
      {
        name: 'template', type: 'select', label: 'Template Style', default: 'standard', options: [
          { value: 'standard', label: 'Standard Bank Cheque' },
          { value: 'business', label: 'Business Cheque' },
          { value: 'personal', label: 'Personal Cheque' },
          { value: 'vintage', label: 'Vintage Style' },
        ]
      },
      {
        name: 'outputFormat', type: 'select', label: 'Output Format', default: 'pdf', options: [
          { value: 'pdf', label: 'PDF (Print Ready)' },
          { value: 'png', label: 'PNG Image' },
          { value: 'svg', label: 'SVG Vector' },
        ]
      },
      { name: 'includeStub', type: 'boolean', label: 'Include Cheque Stub', default: true },
      { name: 'addWatermark', type: 'boolean', label: 'Add NON-NEGOTIABLE Watermark', default: true },
    ]
  },
  {
    id: 'container-tracker', name: 'Shipping Container Tracker', description: 'Track shipping containers across multiple terminals and ports worldwide', category: 'Specialized', subcategory: 'Utility', tier: 'pro', costType: 'coin', coinCost: 10, execution: 'server', inputType: 'text', outputType: 'json',
    options: [
      { name: 'containerNumber', type: 'text', label: 'Container Number', required: true, placeholder: 'ABCD1234567' },
      {
        name: 'carriers', type: 'select', label: 'Shipping Lines to Check', default: 'maersk', options: [
          { value: 'maersk', label: 'Maersk' },
          { value: 'msc', label: 'MSC (Mediterranean Shipping)' },
          { value: 'cma-cgm', label: 'CMA CGM' },
          { value: 'hapag-lloyd', label: 'Hapag-Lloyd' },
          { value: 'evergreen', label: 'Evergreen' },
          { value: 'cosco', label: 'COSCO' },
          { value: 'one', label: 'Ocean Network Express (ONE)' },
          { value: 'yang-ming', label: 'Yang Ming' },
          { value: 'zim', label: 'ZIM' },
          { value: 'hyundai', label: 'Hyundai Merchant Marine' },
        ]
      },
      { name: 'billOfLading', type: 'text', label: 'Bill of Lading (optional)', placeholder: 'BL Number' },
      { name: 'bookingNumber', type: 'text', label: 'Booking Number (optional)', placeholder: 'Booking reference' },
      { name: 'includeHistory', type: 'boolean', label: 'Include Movement History', default: true },
      { name: 'includeVesselInfo', type: 'boolean', label: 'Include Vessel Details', default: true },
      { name: 'includeETA', type: 'boolean', label: 'Include ETA Predictions', default: true },
      {
        name: 'outputDetail', type: 'select', label: 'Output Detail Level', default: 'detailed', options: [
          { value: 'summary', label: 'Summary (location only)' },
          { value: 'standard', label: 'Standard' },
          { value: 'detailed', label: 'Detailed (all events)' },
        ]
      },
    ]
  },
];
