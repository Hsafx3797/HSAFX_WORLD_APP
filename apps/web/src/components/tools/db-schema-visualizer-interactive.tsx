'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ============== TYPES ==============
interface TableColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  refTable?: string;
  refColumn?: string;
}

interface ParsedTable {
  id: string;
  name: string;
  columns: TableColumn[];
  x: number;
  y: number;
}

interface ControlPoint {
  x: number;
  y: number;
}

interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  // Waypoints for orthogonal routing (user-adjustable)
  waypoints: ControlPoint[];
}

// ============== ICONS ==============
const DatabaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
);

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ZoomInIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const FitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </svg>
);

// ============== CONSTANTS ==============
const EXAMPLE_DBML = `// Example Database Schema
Table users {
  id int [pk, increment]
  username varchar(255) [unique, not null]
  email varchar(255) [unique, not null]
  created_at timestamp [default: \`now()\`]
}

Table posts {
  id int [pk, increment]
  title varchar(255) [not null]
  content text
  user_id int [ref: > users.id]
  created_at timestamp [default: \`now()\`]
}

Table comments {
  id int [pk, increment]
  content text [not null]
  post_id int [ref: > posts.id]
  user_id int [ref: > users.id]
  created_at timestamp [default: \`now()\`]
}

Table tags {
  id int [pk, increment]
  name varchar(100) [unique, not null]
}

Table post_tags {
  post_id int [ref: > posts.id]
  tag_id int [ref: > tags.id]
  
  indexes {
    (post_id, tag_id) [pk]
  }
}`;

const TABLE_COLORS = [
  { border: '#60a5fa', bg: '#1e3a5f', header: '#2563eb' },
  { border: '#4ade80', bg: '#14532d', header: '#16a34a' },
  { border: '#c084fc', bg: '#4c1d95', header: '#9333ea' },
  { border: '#fb923c', bg: '#7c2d12', header: '#ea580c' },
  { border: '#f472b6', bg: '#831843', header: '#ec4899' },
  { border: '#22d3ee', bg: '#164e63', header: '#06b6d4' },
];

// Table dimensions
const TABLE_WIDTH = 220;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 28;
const TABLE_PADDING = 16;

// ============== ORTHOGONAL ROUTING ALGORITHM ==============
// Manhattan/Orthogonal routing - only 90° angles, no curves
function computeOrthogonalPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startSide: 'left' | 'right',
  endSide: 'left' | 'right',
  existingWaypoints?: ControlPoint[]
): ControlPoint[] {
  // If user has set waypoints, use them (but ensure orthogonal)
  if (existingWaypoints && existingWaypoints.length > 0) {
    return existingWaypoints;
  }

  // Auto-compute orthogonal path
  const waypoints: ControlPoint[] = [];
  const MARGIN = 30; // Clearance from tables

  // Determine exit and entry directions
  const exitX = startSide === 'right' ? startX + MARGIN : startX - MARGIN;
  const entryX = endSide === 'right' ? endX + MARGIN : endX - MARGIN;

  // Simple orthogonal routing strategy:
  // 1. Go horizontal from start to mid-X
  // 2. Go vertical to target Y
  // 3. Go horizontal to target

  if (startSide === 'right' && endSide === 'left') {
    // Direct path: right -> left
    const midX = (startX + endX) / 2;
    waypoints.push({ x: midX, y: startY });
    waypoints.push({ x: midX, y: endY });
  } else if (startSide === 'left' && endSide === 'right') {
    // Direct path: left -> right
    const midX = (startX + endX) / 2;
    waypoints.push({ x: midX, y: startY });
    waypoints.push({ x: midX, y: endY });
  } else if (startSide === 'right' && endSide === 'right') {
    // Both exit right - go around
    const farX = Math.max(startX, endX) + MARGIN * 2;
    waypoints.push({ x: farX, y: startY });
    waypoints.push({ x: farX, y: endY });
  } else {
    // Both exit left - go around
    const farX = Math.min(startX, endX) - MARGIN * 2;
    waypoints.push({ x: farX, y: startY });
    waypoints.push({ x: farX, y: endY });
  }

  return waypoints;
}

// Generate SVG path with orthogonal segments
// Generate SVG path with orthogonal segments
function generateOrthogonalSvgPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  waypoints: ControlPoint[]
): string {
  let path = `M ${startX} ${startY}`;

  // Filter valid waypoints to match the ControlPoint interface and prevent crashes
  const validWaypoints = waypoints.filter(
    (wp) => wp && typeof wp.x === 'number' && typeof wp.y === 'number'
  );

  // First segment: horizontal from start to first waypoint
  if (validWaypoints.length > 0) {
    path += ` H ${validWaypoints[0]!.x}`;

    // Subsequent segments: alternate V and H
    for (let i = 0; i < validWaypoints.length; i++) {
      const wp = validWaypoints[i]!;
      const nextWp = validWaypoints[i + 1];

      // Vertical to this waypoint's Y
      path += ` V ${wp.y}`;

      // Horizontal to next waypoint or end
      if (nextWp) {
        path += ` H ${nextWp.x}`;
      }
    }
  }

  // Final segments to endpoint
  const lastWp = validWaypoints[validWaypoints.length - 1];
  if (lastWp) {
    // From last waypoint Y (which we just drew with V above), go horizontal to endX
    path += ` H ${endX}`;
  } else {
    // No waypoints - direct orthogonal
    path += ` H ${(startX + endX) / 2}`;
    path += ` V ${endY}`;
    path += ` H ${endX}`;
  }

  return path;
}

// ============== MAIN COMPONENT ==============
export interface DbSchemaVisualizerInteractiveProps {
  className?: string;
}

export function DbSchemaVisualizerInteractive({ className }: DbSchemaVisualizerInteractiveProps) {
  const [schema, setSchema] = React.useState(EXAMPLE_DBML);
  const [tables, setTables] = React.useState<ParsedTable[]>([]);
  const [relationships, setRelationships] = React.useState<Relationship[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Canvas state
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  // Drag state
  const [draggingTable, setDraggingTable] = React.useState<string | null>(null);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Waypoint editing
  const [draggingWaypoint, setDraggingWaypoint] = React.useState<{
    relId: string;
    index: number;
  } | null>(null);
  const [editingRelation, setEditingRelation] = React.useState<string | null>(null);

  // Hover/Selection state - cascade highlighting
  const [hoveredTable, setHoveredTable] = React.useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = React.useState<{
    table: string;
    column: string;
  } | null>(null);
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null);
  const [hoveredRelation, setHoveredRelation] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // ============== PARSING ==============
  const parseDbml = (dbml: string): { tables: ParsedTable[]; relationships: Relationship[] } => {
    const tableRegex = /Table\s+(\w+)\s*\{([^}]+)\}/g;
    const parsedTables: ParsedTable[] = [];
    const parsedRelationships: Relationship[] = [];

    let match;
    let index = 0;

    while ((match = tableRegex.exec(dbml)) !== null) {
      const name = match[1]!;
      const body = match[2]!;
      const columns: TableColumn[] = [];

      body.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('indexes')) return;

        const parts = trimmed.split(/\s+/);
        const colName = parts[0];
        if (!colName || colName === '(' || colName.startsWith('(')) return;

        const colType = parts[1] || 'unknown';
        const isPk =
          trimmed.toLowerCase().includes('[pk') || trimmed.toLowerCase().includes('primary');
        const isFk = trimmed.includes('ref:');

        let refTable: string | undefined;
        let refColumn: string | undefined;

        const refMatch = trimmed.match(/ref:\s*[><-]\s*(\w+)\.(\w+)/);
        if (refMatch) {
          refTable = refMatch[1];
          refColumn = refMatch[2];

          // Only push if we have valid table and column references
          if (refTable && refColumn) {
            parsedRelationships.push({
              id: `${name}.${colName}->${refTable}.${refColumn}`,
              fromTable: name,
              fromColumn: colName,
              toTable: refTable,
              toColumn: refColumn,
              waypoints: [], // Will be auto-computed
            });
          }
        }

        columns.push({ name: colName, type: colType, isPk, isFk, refTable, refColumn });
      });

      if (columns.length > 0) {
        const cols = 3;
        const tableHeight = columns.length * ROW_HEIGHT + HEADER_HEIGHT + TABLE_PADDING;
        const padding = 60;

        const col = index % cols;
        const row = Math.floor(index / cols);

        parsedTables.push({
          id: name,
          name,
          columns,
          x: col * (TABLE_WIDTH + padding) + padding,
          y: row * (tableHeight + padding) + padding,
        });

        index++;
      }
    }

    return { tables: parsedTables, relationships: parsedRelationships };
  };

  // ============== GENERATE ==============
  const handleGenerate = async () => {
    if (!schema.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { tables: parsedTables, relationships: parsedRels } = parseDbml(schema);

      if (parsedTables.length === 0) {
        throw new Error('No valid tables found in schema. Make sure your DBML syntax is correct.');
      }

      setTables(parsedTables);
      setRelationships(parsedRels);
      setSelectedTable(null);
      setHoveredTable(null);
      setHoveredColumn(null);
      setEditingRelation(null);

      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse schema');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============== GET COLUMN ANCHOR POSITION (Pixel-accurate) ==============
  const getColumnAnchorPosition = (
    table: ParsedTable,
    columnName: string,
    side: 'left' | 'right'
  ): { x: number; y: number } | null => {
    const colIndex = table.columns.findIndex((c) => c.name === columnName);
    if (colIndex === -1) return null;

    // Calculate exact Y position: table top + header + (colIndex * rowHeight) + (rowHeight / 2)
    const y = table.y + HEADER_HEIGHT + colIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
    const x = side === 'left' ? table.x : table.x + TABLE_WIDTH;

    return { x, y };
  };

  // ============== COMPUTE RELATIONSHIP PATH ==============
  const computeRelationshipPath = (
    rel: Relationship
  ): {
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    waypoints: ControlPoint[];
    startSide: 'left' | 'right';
    endSide: 'left' | 'right';
  } | null => {
    const fromTable = tables.find((t) => t.id === rel.fromTable);
    const toTable = tables.find((t) => t.id === rel.toTable);
    if (!fromTable || !toTable) return null;

    // Determine which side to connect from based on table positions
    const fromCenter = fromTable.x + TABLE_WIDTH / 2;
    const toCenter = toTable.x + TABLE_WIDTH / 2;

    let startSide: 'left' | 'right';
    let endSide: 'left' | 'right';

    if (fromCenter < toCenter) {
      // From table is to the left
      startSide = 'right';
      endSide = 'left';
    } else if (fromCenter > toCenter) {
      // From table is to the right
      startSide = 'left';
      endSide = 'right';
    } else {
      // Tables are vertically aligned
      startSide = 'right';
      endSide = 'right';
    }

    // Get pixel-accurate anchor positions
    const startPos = getColumnAnchorPosition(fromTable, rel.fromColumn, startSide);
    const endPos = getColumnAnchorPosition(toTable, rel.toColumn, endSide);
    if (!startPos || !endPos) return null;

    // Compute or use existing waypoints
    const waypoints = computeOrthogonalPath(
      startPos.x,
      startPos.y,
      endPos.x,
      endPos.y,
      startSide,
      endSide,
      rel.waypoints.length > 0 ? rel.waypoints : undefined
    );

    const path = generateOrthogonalSvgPath(startPos.x, startPos.y, endPos.x, endPos.y, waypoints);

    return {
      path,
      startX: startPos.x,
      startY: startPos.y,
      endX: endPos.x,
      endY: endPos.y,
      waypoints,
      startSide,
      endSide,
    };
  };

  // ============== HIGHLIGHTING LOGIC ==============
  const getHighlightedRelations = (): Set<string> => {
    const highlighted = new Set<string>();

    // Directly hovered relation
    if (hoveredRelation) {
      highlighted.add(hoveredRelation);
    }

    // Cascade from hovered column
    if (hoveredColumn) {
      relationships.forEach((rel) => {
        if (
          (rel.fromTable === hoveredColumn.table && rel.fromColumn === hoveredColumn.column) ||
          (rel.toTable === hoveredColumn.table && rel.toColumn === hoveredColumn.column)
        ) {
          highlighted.add(rel.id);
        }
      });
    }

    // Cascade from hovered/selected table
    const activeTable = hoveredTable || selectedTable;
    if (activeTable) {
      relationships.forEach((rel) => {
        if (rel.fromTable === activeTable || rel.toTable === activeTable) {
          highlighted.add(rel.id);
        }
      });
    }

    return highlighted;
  };

  const getHighlightedTables = (): Set<string> => {
    const highlighted = new Set<string>();

    if (hoveredTable) highlighted.add(hoveredTable);
    if (selectedTable) highlighted.add(selectedTable);

    // Cascade from relation
    if (hoveredRelation) {
      const rel = relationships.find((r) => r.id === hoveredRelation);
      if (rel) {
        highlighted.add(rel.fromTable);
        highlighted.add(rel.toTable);
      }
    }

    // Cascade from column hover
    if (hoveredColumn) {
      highlighted.add(hoveredColumn.table);
      relationships.forEach((rel) => {
        if (rel.fromTable === hoveredColumn.table && rel.fromColumn === hoveredColumn.column) {
          highlighted.add(rel.toTable);
        }
        if (rel.toTable === hoveredColumn.table && rel.toColumn === hoveredColumn.column) {
          highlighted.add(rel.fromTable);
        }
      });
    }

    return highlighted;
  };

  const getHighlightedColumns = (): Set<string> => {
    const highlighted = new Set<string>();

    if (hoveredColumn) {
      highlighted.add(`${hoveredColumn.table}.${hoveredColumn.column}`);
    }

    // Cascade from relation
    if (hoveredRelation) {
      const rel = relationships.find((r) => r.id === hoveredRelation);
      if (rel) {
        highlighted.add(`${rel.fromTable}.${rel.fromColumn}`);
        highlighted.add(`${rel.toTable}.${rel.toColumn}`);
      }
    }

    return highlighted;
  };

  // ============== DRAG HANDLERS ==============
  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    setDraggingTable(tableId);
    setSelectedTable(tableId);
    setDragStart({
      x: e.clientX / zoom - table.x,
      y: e.clientY / zoom - table.y,
    });
  };

  const handleWaypointMouseDown = (e: React.MouseEvent, relId: string, index: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    setDraggingWaypoint({ relId, index });
    setEditingRelation(relId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTable) {
      const newX = e.clientX / zoom - dragStart.x;
      const newY = e.clientY / zoom - dragStart.y;

      setTables((prev) =>
        prev.map((t) => (t.id === draggingTable ? { ...t, x: newX, y: newY } : t))
      );

      // Clear waypoints for affected relationships to trigger re-routing
      setRelationships((prev) =>
        prev.map((r) =>
          r.fromTable === draggingTable || r.toTable === draggingTable ? { ...r, waypoints: [] } : r
        )
      );
    } else if (draggingWaypoint) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      setRelationships((prev) =>
        prev.map((r) => {
          if (r.id !== draggingWaypoint.relId) return r;
          const newWaypoints = [...r.waypoints];
          newWaypoints[draggingWaypoint.index] = { x, y };
          return { ...r, waypoints: newWaypoints };
        })
      );
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
    setDraggingWaypoint(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-table]')) return;
    if ((e.target as HTMLElement).closest('[data-waypoint]')) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setSelectedTable(null);
    setEditingRelation(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.25, Math.min(3, z + delta)));
    }
  };

  // ============== ZOOM CONTROLS ==============
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleFit = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // ============== EXPORT ==============
  const handleDownloadSvg = () => {
    if (tables.length === 0) return;
    const svg = generateExportSvg();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db-schema.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateExportSvg = (): string => {
    const padding = 40;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    tables.forEach((t) => {
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);
      maxX = Math.max(maxX, t.x + TABLE_WIDTH);
      const tableHeight = t.columns.length * ROW_HEIGHT + HEADER_HEIGHT + TABLE_PADDING;
      maxY = Math.max(maxY, t.y + tableHeight);
    });

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: #0f172a;">`;

    svg += `<defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/>
            </marker>
        </defs>`;

    // Draw relationships
    relationships.forEach((rel) => {
      const computed = computeRelationshipPath(rel);
      if (!computed) return;

      // Offset the path
      const adjustedPath = computed.path
        .replace(
          /M\s*(\d+\.?\d*)\s+(\d+\.?\d*)/,
          (_, x, y) => `M ${parseFloat(x) + offsetX} ${parseFloat(y) + offsetY}`
        )
        .replace(/H\s*(\d+\.?\d*)/g, (_, x) => `H ${parseFloat(x) + offsetX}`)
        .replace(/V\s*(\d+\.?\d*)/g, (_, y) => `V ${parseFloat(y) + offsetY}`);

      svg += `<path d="${adjustedPath}" stroke="#64748b" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>`;
    });

    // Draw tables
    tables.forEach((table, index) => {
      const x = table.x + offsetX;
      const y = table.y + offsetY;
      const tableHeight = table.columns.length * ROW_HEIGHT + HEADER_HEIGHT + TABLE_PADDING;
      const color = TABLE_COLORS[index % TABLE_COLORS.length]!;

      svg += `<g>
                <rect x="${x}" y="${y}" width="${TABLE_WIDTH}" height="${tableHeight}" rx="8" fill="#1e293b" stroke="${color.border}" stroke-width="2"/>
                <rect x="${x}" y="${y}" width="${TABLE_WIDTH}" height="${HEADER_HEIGHT}" rx="8" fill="${color.header}"/>
                <rect x="${x}" y="${y + HEADER_HEIGHT - 8}" width="${TABLE_WIDTH}" height="8" fill="${color.header}"/>
                <text x="${x + TABLE_WIDTH / 2}" y="${y + 26}" text-anchor="middle" fill="white" font-weight="600" font-size="14" font-family="system-ui">${table.name}</text>`;

      table.columns.forEach((col, i) => {
        const colY = y + HEADER_HEIGHT + 8 + i * ROW_HEIGHT;
        const icon = col.isPk ? '🔑' : col.isFk ? '🔗' : '';
        const xOffset = icon ? 28 : 12;

        if (icon) {
          svg += `<text x="${x + 12}" y="${colY + 14}" font-size="10">${icon}</text>`;
        }
        svg += `<text x="${x + xOffset}" y="${colY + 14}" fill="#e2e8f0" font-size="12" font-family="monospace">${col.name}</text>`;
        svg += `<text x="${x + TABLE_WIDTH - 12}" y="${colY + 14}" text-anchor="end" fill="#94a3b8" font-size="11" font-family="monospace">${col.type}</text>`;
      });

      svg += `</g>`;
    });

    svg += `</svg>`;
    return svg;
  };

  const handleDownloadPng = () => {
    if (tables.length === 0) return;
    const svg = generateExportSvg();
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'db-schema.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  };

  // ============== KEYBOARD SHORTCUTS ==============
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTable(null);
        setEditingRelation(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleFit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ============== COMPUTED HIGHLIGHTS ==============
  const highlightedRelations = getHighlightedRelations();
  const highlightedTables = getHighlightedTables();
  const highlightedColumns = getHighlightedColumns();

  // ============== RENDER ==============
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <DatabaseIcon />
        <h2 className="text-lg font-semibold">Interactive Schema Visualizer</h2>
        <span className="text-xs text-muted-foreground ml-2">Orthogonal Routing</span>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Editor panel */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium">Schema (DBML)</span>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !schema.trim()}
              className="gap-2"
            >
              <PlayIcon />
              {isGenerating ? 'Parsing...' : 'Generate'}
            </Button>
          </div>
          <div className="flex-1 min-h-100">
            <Textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder="Enter your DBML schema here..."
              className="min-h-350 w-full resize-none border-0 rounded-none font-mono text-sm bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-2 flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium">
              Diagram
              {tables.length > 0 && (
                <span className="text-muted-foreground ml-2">
                  ({tables.length} tables, {relationships.length} relations)
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
                <ZoomOutIcon />
              </Button>
              <span className="text-xs w-12 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
                <ZoomInIcon />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFit}>
                <FitIcon />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadSvg}
                disabled={tables.length === 0}
                className="h-7"
              >
                <DownloadIcon />
                <span className="ml-1">SVG</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPng}
                disabled={tables.length === 0}
                className="h-7"
              >
                <DownloadIcon />
                <span className="ml-1">PNG</span>
              </Button>
            </div>
          </div>

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden bg-slate-900 relative min-h-125"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isPanning ? 'grabbing' : draggingTable ? 'move' : 'grab' }}
          >
            {/* Grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
                backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                backgroundPosition: `${offset.x}px ${offset.y}px`,
              }}
            />

            {error ? (
              <div className="flex items-center justify-center h-full">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-md">
                  {error}
                </div>
              </div>
            ) : tables.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <DatabaseIcon />
                  <p className="mt-2">Enter your DBML schema and click Generate</p>
                  <p className="text-xs mt-1">Orthogonal routing with 90° angles only</p>
                </div>
              </div>
            ) : (
              <div
                ref={canvasRef}
                className="absolute"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                }}
              >
                {/* SVG for relationships */}
                <svg
                  className="absolute top-0 left-0"
                  style={{ width: '3000px', height: '2000px', overflow: 'visible' }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                    <marker
                      id="arrow-hl"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
                    </marker>
                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {relationships.map((rel) => {
                    const computed = computeRelationshipPath(rel);
                    if (!computed) return null;

                    const isHighlighted = highlightedRelations.has(rel.id);
                    const isEditing = editingRelation === rel.id;

                    return (
                      <g key={rel.id}>
                        {/* Hit area */}
                        <path
                          d={computed.path}
                          stroke="transparent"
                          strokeWidth="20"
                          fill="none"
                          className="cursor-pointer"
                          style={{ pointerEvents: 'stroke' }}
                          onMouseEnter={() => setHoveredRelation(rel.id)}
                          onMouseLeave={() => setHoveredRelation(null)}
                          onClick={() =>
                            setEditingRelation(rel.id === editingRelation ? null : rel.id)
                          }
                        />
                        {/* Visible path */}
                        <path
                          d={computed.path}
                          stroke={isHighlighted ? '#60a5fa' : '#64748b'}
                          strokeWidth={isHighlighted ? 3 : 2}
                          fill="none"
                          markerEnd={isHighlighted ? 'url(#arrow-hl)' : 'url(#arrow)'}
                          filter={isHighlighted ? 'url(#glow)' : undefined}
                          style={{ pointerEvents: 'none', transition: 'all 0.2s ease' }}
                        />

                        {/* Waypoint handles (when editing) */}
                        {isEditing &&
                          computed.waypoints.map((wp, i) => (
                            <g key={i} data-waypoint>
                              <circle
                                cx={wp.x}
                                cy={wp.y}
                                r="8"
                                fill="#1e293b"
                                stroke="#60a5fa"
                                strokeWidth="2"
                                className="cursor-move"
                                onMouseDown={(e) => handleWaypointMouseDown(e, rel.id, i)}
                              />
                              <circle
                                cx={wp.x}
                                cy={wp.y}
                                r="3"
                                fill="#60a5fa"
                                style={{ pointerEvents: 'none' }}
                              />
                            </g>
                          ))}

                        {/* Anchor points */}
                        {isEditing && (
                          <>
                            <circle
                              cx={computed.startX}
                              cy={computed.startY}
                              r="5"
                              fill="#4ade80"
                              stroke="#1e293b"
                              strokeWidth="2"
                            />
                            <circle
                              cx={computed.endX}
                              cy={computed.endY}
                              r="5"
                              fill="#f472b6"
                              stroke="#1e293b"
                              strokeWidth="2"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Tables */}
                {tables.map((table, index) => {
                  const color = TABLE_COLORS[index % TABLE_COLORS.length]!;
                  const isTableHighlighted = highlightedTables.has(table.id);
                  const isSelected = selectedTable === table.id;
                  const tableHeight =
                    table.columns.length * ROW_HEIGHT + HEADER_HEIGHT + TABLE_PADDING;

                  return (
                    <div
                      key={table.id}
                      data-table={table.id}
                      className={cn(
                        'absolute rounded-lg border-2 select-none transition-shadow duration-200',
                        (isTableHighlighted || isSelected) && 'shadow-lg'
                      )}
                      style={{
                        left: table.x,
                        top: table.y,
                        width: TABLE_WIDTH,
                        borderColor: color.border,
                        background: '#1e293b',
                        cursor: draggingTable === table.id ? 'move' : 'grab',
                        boxShadow: isTableHighlighted
                          ? `0 0 20px ${color.border}40, 0 0 40px ${color.border}20`
                          : undefined,
                      }}
                      onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                      onMouseEnter={() => setHoveredTable(table.id)}
                      onMouseLeave={() => setHoveredTable(null)}
                    >
                      {/* Header */}
                      <div
                        className="px-3 py-2 rounded-t-md font-semibold text-white text-center"
                        style={{ background: color.header }}
                      >
                        {table.name}
                      </div>

                      {/* Columns */}
                      <div className="p-2 space-y-0.5">
                        {table.columns.map((col, colIdx) => {
                          const isColHighlighted = highlightedColumns.has(
                            `${table.id}.${col.name}`
                          );

                          return (
                            <div
                              key={col.name}
                              className={cn(
                                'flex items-center justify-between px-2 py-1 rounded text-sm transition-colors',
                                colIdx % 2 === 0 && 'bg-slate-800/50',
                                isColHighlighted && 'bg-primary/20 ring-1 ring-primary/50'
                              )}
                              onMouseEnter={() =>
                                setHoveredColumn({ table: table.id, column: col.name })
                              }
                              onMouseLeave={() => setHoveredColumn(null)}
                            >
                              <div className="flex items-center gap-1.5">
                                {col.isPk && (
                                  <span className="text-xs" title="Primary Key">
                                    🔑
                                  </span>
                                )}
                                {col.isFk && (
                                  <span className="text-xs" title="Foreign Key">
                                    🔗
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    'font-mono',
                                    isColHighlighted ? 'text-primary' : 'text-slate-200'
                                  )}
                                >
                                  {col.name}
                                </span>
                              </div>
                              <span className="font-mono text-xs text-slate-400">{col.type}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Relation tooltip */}
            {hoveredRelation && (
              <div className="absolute bottom-4 left-4 p-2 bg-card border border-border rounded-lg shadow-lg text-sm">
                {(() => {
                  const rel = relationships.find((r) => r.id === hoveredRelation);
                  if (!rel) return null;
                  return (
                    <>
                      <span className="font-mono text-primary">
                        {rel.fromTable}.{rel.fromColumn}
                      </span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="font-mono text-primary">
                        {rel.toTable}.{rel.toColumn}
                      </span>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Edit mode indicator */}
            {editingRelation && (
              <div className="absolute top-4 left-4 p-2 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary">
                Editing relation • Drag waypoints to adjust • Click elsewhere to exit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Supported format:{' '}
          <a
            href="https://dbml.dbdiagram.io/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DBML (Database Markup Language)
          </a>
        </p>
        <p>Drag tables • Hover columns for cascade highlight • Click relations to edit waypoints</p>
      </div>
    </div>
  );
}

export default DbSchemaVisualizerInteractive;
