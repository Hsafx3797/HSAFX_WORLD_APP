/**
 * Database Schema Visualizer
 * Generate visual representations of database schemas
 */

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  default?: string;
  references?: {
    table: string;
    column: string;
  };
  comment?: string;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface Table {
  name: string;
  schema?: string;
  columns: Column[];
  indexes?: Index[];
  comment?: string;
}

export interface Relationship {
  from: { table: string; column: string };
  to: { table: string; column: string };
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface Schema {
  name: string;
  tables: Table[];
  relationships: Relationship[];
}

export type OutputFormat = 'dbml' | 'mermaid' | 'plantuml' | 'markdown' | 'sql' | 'json';

// Generate DBML (Database Markup Language)
export function toDBML(schema: Schema): string {
  const lines: string[] = [];
  
  // Project info
  lines.push(`// Database Schema: ${schema.name}`);
  lines.push('');
  
  // Tables
  for (const table of schema.tables) {
    const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;
    lines.push(`Table ${tableName} {`);
    
    for (const col of table.columns) {
      let colDef = `  ${col.name} ${col.type}`;
      const attrs: string[] = [];
      
      if (col.primaryKey) attrs.push('pk');
      if (col.unique && !col.primaryKey) attrs.push('unique');
      if (!col.nullable) attrs.push('not null');
      if (col.default) attrs.push(`default: ${col.default}`);
      if (col.references) attrs.push(`ref: > ${col.references.table}.${col.references.column}`);
      
      if (attrs.length > 0) {
        colDef += ` [${attrs.join(', ')}]`;
      }
      
      if (col.comment) {
        colDef += ` // ${col.comment}`;
      }
      
      lines.push(colDef);
    }
    
    if (table.indexes && table.indexes.length > 0) {
      lines.push('');
      lines.push('  indexes {');
      for (const idx of table.indexes) {
        const cols = idx.columns.join(', ');
        const unique = idx.unique ? ' [unique]' : '';
        lines.push(`    (${cols})${unique} [name: "${idx.name}"]`);
      }
      lines.push('  }');
    }
    
    lines.push('}');
    lines.push('');
  }
  
  // Relationships (if not defined inline)
  if (schema.relationships.length > 0) {
    lines.push('// Relationships');
    for (const rel of schema.relationships) {
      const relType = rel.type === 'one-to-one' ? '-' : rel.type === 'one-to-many' ? '<' : '<>';
      lines.push(`Ref: ${rel.from.table}.${rel.from.column} ${relType} ${rel.to.table}.${rel.to.column}`);
    }
  }
  
  return lines.join('\n');
}

// Generate Mermaid ERD
export function toMermaid(schema: Schema): string {
  const lines: string[] = [];
  
  lines.push('erDiagram');
  lines.push('');
  
  // Tables and columns
  for (const table of schema.tables) {
    lines.push(`  ${table.name} {`);
    
    for (const col of table.columns) {
      const pkMark = col.primaryKey ? 'PK' : '';
      const fkMark = col.references ? 'FK' : '';
      const mark = [pkMark, fkMark].filter(Boolean).join(', ');
      
      let colDef = `    ${col.type} ${col.name}`;
      if (mark) colDef += ` ${mark}`;
      if (col.comment) colDef += ` "${col.comment}"`;
      
      lines.push(colDef);
    }
    
    lines.push('  }');
    lines.push('');
  }
  
  // Relationships
  for (const rel of schema.relationships) {
    let relSymbol: string;
    switch (rel.type) {
      case 'one-to-one':
        relSymbol = '||--||';
        break;
      case 'one-to-many':
        relSymbol = '||--o{';
        break;
      case 'many-to-many':
        relSymbol = '}o--o{';
        break;
      default:
        relSymbol = '||--||';
    }
    
    lines.push(`  ${rel.from.table} ${relSymbol} ${rel.to.table} : "${rel.from.column}"`);
  }
  
  return lines.join('\n');
}

// Generate PlantUML
export function toPlantUML(schema: Schema): string {
  const lines: string[] = [];
  
  lines.push('@startuml');
  lines.push('!theme plain');
  lines.push('hide circle');
  lines.push('skinparam linetype ortho');
  lines.push('');
  
  // Tables
  for (const table of schema.tables) {
    lines.push(`entity "${table.name}" {`);
    
    // Primary keys first
    const pkColumns = table.columns.filter(c => c.primaryKey);
    const otherColumns = table.columns.filter(c => !c.primaryKey);
    
    for (const col of pkColumns) {
      lines.push(`  *${col.name} : ${col.type} <<PK>>`);
    }
    
    if (pkColumns.length > 0 && otherColumns.length > 0) {
      lines.push('  --');
    }
    
    for (const col of otherColumns) {
      const nullable = col.nullable ? '' : '*';
      const fk = col.references ? ' <<FK>>' : '';
      lines.push(`  ${nullable}${col.name} : ${col.type}${fk}`);
    }
    
    lines.push('}');
    lines.push('');
  }
  
  // Relationships
  for (const rel of schema.relationships) {
    let relSymbol: string;
    switch (rel.type) {
      case 'one-to-one':
        relSymbol = '||--||';
        break;
      case 'one-to-many':
        relSymbol = '||--o{';
        break;
      case 'many-to-many':
        relSymbol = '}o--o{';
        break;
      default:
        relSymbol = '--';
    }
    
    lines.push(`${rel.from.table} ${relSymbol} ${rel.to.table}`);
  }
  
  lines.push('');
  lines.push('@enduml');
  
  return lines.join('\n');
}

// Generate Markdown documentation
export function toMarkdown(schema: Schema): string {
  const lines: string[] = [];
  
  lines.push(`# Database Schema: ${schema.name}`);
  lines.push('');
  lines.push('## Tables');
  lines.push('');
  
  for (const table of schema.tables) {
    lines.push(`### ${table.name}`);
    if (table.comment) {
      lines.push('');
      lines.push(`> ${table.comment}`);
    }
    lines.push('');
    lines.push('| Column | Type | Nullable | Key | Default | Description |');
    lines.push('|--------|------|----------|-----|---------|-------------|');
    
    for (const col of table.columns) {
      const key = col.primaryKey ? 'PK' : col.references ? 'FK' : col.unique ? 'UQ' : '';
      const defaultVal = col.default || '-';
      const comment = col.comment || '-';
      const nullable = col.nullable ? 'Yes' : 'No';
      
      lines.push(`| ${col.name} | ${col.type} | ${nullable} | ${key} | ${defaultVal} | ${comment} |`);
    }
    
    if (table.indexes && table.indexes.length > 0) {
      lines.push('');
      lines.push('**Indexes:**');
      for (const idx of table.indexes) {
        const unique = idx.unique ? ' (unique)' : '';
        lines.push(`- \`${idx.name}\`: ${idx.columns.join(', ')}${unique}`);
      }
    }
    
    lines.push('');
  }
  
  if (schema.relationships.length > 0) {
    lines.push('## Relationships');
    lines.push('');
    lines.push('| From | To | Type |');
    lines.push('|------|----|----|');
    
    for (const rel of schema.relationships) {
      const from = `${rel.from.table}.${rel.from.column}`;
      const to = `${rel.to.table}.${rel.to.column}`;
      lines.push(`| ${from} | ${to} | ${rel.type} |`);
    }
  }
  
  return lines.join('\n');
}

// Generate SQL DDL
export function toSQL(schema: Schema, dialect: 'postgresql' | 'mysql' | 'sqlite' = 'postgresql'): string {
  const lines: string[] = [];
  
  lines.push(`-- Database Schema: ${schema.name}`);
  lines.push(`-- Dialect: ${dialect}`);
  lines.push('');
  
  for (const table of schema.tables) {
    const tableName = table.schema ? `"${table.schema}"."${table.name}"` : `"${table.name}"`;
    
    if (table.comment) {
      lines.push(`-- ${table.comment}`);
    }
    
    lines.push(`CREATE TABLE ${tableName} (`);
    
    const columnDefs: string[] = [];
    const constraintDefs: string[] = [];
    const pkColumns: string[] = [];
    
    for (const col of table.columns) {
      let colDef = `  "${col.name}" ${mapType(col.type, dialect)}`;
      
      if (!col.nullable) colDef += ' NOT NULL';
      if (col.default) colDef += ` DEFAULT ${col.default}`;
      
      if (col.primaryKey) {
        pkColumns.push(`"${col.name}"`);
      }
      
      if (col.unique && !col.primaryKey) {
        constraintDefs.push(`  CONSTRAINT "${table.name}_${col.name}_unique" UNIQUE ("${col.name}")`);
      }
      
      if (col.references) {
        constraintDefs.push(
          `  CONSTRAINT "${table.name}_${col.name}_fkey" FOREIGN KEY ("${col.name}") ` +
          `REFERENCES "${col.references.table}" ("${col.references.column}")`
        );
      }
      
      columnDefs.push(colDef);
    }
    
    if (pkColumns.length > 0) {
      constraintDefs.unshift(`  CONSTRAINT "${table.name}_pkey" PRIMARY KEY (${pkColumns.join(', ')})`);
    }
    
    const allDefs = [...columnDefs, ...constraintDefs];
    lines.push(allDefs.join(',\n'));
    lines.push(');');
    lines.push('');
    
    // Indexes
    if (table.indexes) {
      for (const idx of table.indexes) {
        const unique = idx.unique ? 'UNIQUE ' : '';
        const cols = idx.columns.map(c => `"${c}"`).join(', ');
        lines.push(`CREATE ${unique}INDEX "${idx.name}" ON ${tableName} (${cols});`);
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

function mapType(type: string, dialect: 'postgresql' | 'mysql' | 'sqlite'): string {
  const typeMap: Record<string, Record<string, string>> = {
    postgresql: {
      'uuid': 'UUID',
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL(10,2)',
      'boolean': 'BOOLEAN',
      'timestamp': 'TIMESTAMP',
      'date': 'DATE',
      'json': 'JSONB',
    },
    mysql: {
      'uuid': 'CHAR(36)',
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INT',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL(10,2)',
      'boolean': 'TINYINT(1)',
      'timestamp': 'DATETIME',
      'date': 'DATE',
      'json': 'JSON',
    },
    sqlite: {
      'uuid': 'TEXT',
      'string': 'TEXT',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'INTEGER',
      'decimal': 'REAL',
      'boolean': 'INTEGER',
      'timestamp': 'TEXT',
      'date': 'TEXT',
      'json': 'TEXT',
    },
  };
  
  const lowerType = type.toLowerCase();
  return typeMap[dialect][lowerType] || type.toUpperCase();
}

// Parse SQL CREATE TABLE statements
export function parseSQL(sql: string): Schema {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  
  // Simple regex-based parser (not comprehensive)
  const tableRegex = /CREATE\s+TABLE\s+(?:"?(\w+)"?\.)?(?:"?(\w+)"?)\s*\(([\s\S]*?)\)\s*;/gi;
  
  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    const schemaName = match[1];
    const tableName = match[2];
    const columnsStr = match[3];
    
    const columns: Column[] = [];
    const columnLines = columnsStr.split(',').map(l => l.trim()).filter(Boolean);
    
    for (const line of columnLines) {
      // Skip constraints
      if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)/i.test(line)) {
        // Parse foreign key constraints for relationships
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\("?(\w+)"?\)\s*REFERENCES\s+"?(\w+)"?\s*\("?(\w+)"?\)/i);
        if (fkMatch) {
          relationships.push({
            from: { table: tableName, column: fkMatch[1] },
            to: { table: fkMatch[2], column: fkMatch[3] },
            type: 'one-to-many',
          });
        }
        continue;
      }
      
      // Parse column definition
      const colMatch = line.match(/^"?(\w+)"?\s+(\w+(?:\([^)]+\))?)\s*(.*)/i);
      if (colMatch) {
        const colName = colMatch[1];
        const colType = colMatch[2];
        const rest = colMatch[3].toUpperCase();
        
        columns.push({
          name: colName,
          type: colType,
          nullable: !rest.includes('NOT NULL'),
          primaryKey: rest.includes('PRIMARY KEY'),
          unique: rest.includes('UNIQUE'),
          default: undefined,
        });
      }
    }
    
    tables.push({
      name: tableName,
      schema: schemaName,
      columns,
    });
  }
  
  return {
    name: 'Parsed Schema',
    tables,
    relationships,
  };
}

// Main conversion function
export function convertSchema(
  schema: Schema,
  format: OutputFormat
): string {
  switch (format) {
    case 'dbml':
      return toDBML(schema);
    case 'mermaid':
      return toMermaid(schema);
    case 'plantuml':
      return toPlantUML(schema);
    case 'markdown':
      return toMarkdown(schema);
    case 'sql':
      return toSQL(schema);
    case 'json':
      return JSON.stringify(schema, null, 2);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

// Generate SVG visualization
export function generateSVG(schema: Schema): string {
  const tableWidth = 250;
  const tableHeaderHeight = 40;
  const columnHeight = 25;
  const padding = 50;
  const tableSpacing = 100;
  
  // Calculate positions
  const tablesPerRow = 3;
  const tablePositions: { table: Table; x: number; y: number; height: number }[] = [];
  
  schema.tables.forEach((table, index) => {
    const row = Math.floor(index / tablesPerRow);
    const col = index % tablesPerRow;
    const height = tableHeaderHeight + (table.columns.length * columnHeight) + 10;
    
    tablePositions.push({
      table,
      x: padding + col * (tableWidth + tableSpacing),
      y: padding + row * (300 + tableSpacing),
      height,
    });
  });
  
  const svgWidth = padding * 2 + Math.min(schema.tables.length, tablesPerRow) * (tableWidth + tableSpacing);
  const rows = Math.ceil(schema.tables.length / tablesPerRow);
  const svgHeight = padding * 2 + rows * (300 + tableSpacing);
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
  
  // Styles
  svg += `
    <defs>
      <style>
        .table-header { fill: #3b82f6; }
        .table-body { fill: white; stroke: #e5e7eb; stroke-width: 1; }
        .table-name { fill: white; font-family: system-ui; font-size: 14px; font-weight: bold; }
        .column-name { fill: #374151; font-family: system-ui; font-size: 12px; }
        .column-type { fill: #6b7280; font-family: system-ui; font-size: 11px; }
        .pk-badge { fill: #fbbf24; }
        .fk-badge { fill: #60a5fa; }
        .relationship { stroke: #9ca3af; stroke-width: 1; fill: none; marker-end: url(#arrow); }
      </style>
      <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
      </marker>
    </defs>
  `;
  
  // Draw tables
  for (const { table, x, y, height } of tablePositions) {
    // Table body
    svg += `<rect x="${x}" y="${y}" width="${tableWidth}" height="${height}" rx="4" class="table-body"/>`;
    
    // Table header
    svg += `<rect x="${x}" y="${y}" width="${tableWidth}" height="${tableHeaderHeight}" rx="4" class="table-header"/>`;
    svg += `<text x="${x + tableWidth / 2}" y="${y + 25}" text-anchor="middle" class="table-name">${table.name}</text>`;
    
    // Columns
    table.columns.forEach((col, colIndex) => {
      const colY = y + tableHeaderHeight + 5 + (colIndex * columnHeight);
      
      // PK/FK badges
      if (col.primaryKey) {
        svg += `<rect x="${x + 5}" y="${colY}" width="20" height="16" rx="2" class="pk-badge"/>`;
        svg += `<text x="${x + 15}" y="${colY + 12}" text-anchor="middle" font-size="9" fill="black">PK</text>`;
      } else if (col.references) {
        svg += `<rect x="${x + 5}" y="${colY}" width="20" height="16" rx="2" class="fk-badge"/>`;
        svg += `<text x="${x + 15}" y="${colY + 12}" text-anchor="middle" font-size="9" fill="white">FK</text>`;
      }
      
      // Column name
      svg += `<text x="${x + 30}" y="${colY + 12}" class="column-name">${col.name}</text>`;
      
      // Column type
      svg += `<text x="${x + tableWidth - 10}" y="${colY + 12}" text-anchor="end" class="column-type">${col.type}</text>`;
    });
  }
  
  // Draw relationships (simple straight lines for now)
  for (const rel of schema.relationships) {
    const fromTable = tablePositions.find(t => t.table.name === rel.from.table);
    const toTable = tablePositions.find(t => t.table.name === rel.to.table);
    
    if (fromTable && toTable) {
      const fromX = fromTable.x + tableWidth;
      const fromY = fromTable.y + tableHeaderHeight + 20;
      const toX = toTable.x;
      const toY = toTable.y + tableHeaderHeight + 20;
      
      svg += `<path d="M${fromX},${fromY} C${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}" class="relationship"/>`;
    }
  }
  
  svg += '</svg>';
  
  return svg;
}
