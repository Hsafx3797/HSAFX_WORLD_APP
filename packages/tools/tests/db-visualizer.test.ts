import { describe, it, expect, beforeAll } from 'vitest';
import { readJsonInput, readTextInput, writeOutput } from './helpers';
import {
  toDBML,
  toMermaid,
  toPlantUML,
  toMarkdown,
  toSQL,
  parseSQL,
  convertSchema,
  generateSVG,
} from '../src/specialized/db-visualizer';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  default?: string;
  references?: { table: string; column: string };
  comment?: string;
}

interface Index {
  name: string;
  columns: string[];
  unique: boolean;
}

interface Table {
  name: string;
  schema?: string;
  columns: Column[];
  indexes?: Index[];
  comment?: string;
}

interface Relationship {
  from: { table: string; column: string };
  to: { table: string; column: string };
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

interface Schema {
  name: string;
  tables: Table[];
  relationships: Relationship[];
}

let schema: Schema;
let sqlInput: string;

beforeAll(() => {
  schema = readJsonInput<Schema>('db-schema.json');
  sqlInput = readTextInput('sql-schema.sql');
});

// ==================== toDBML ====================

describe('toDBML', () => {
  it('converts schema to DBML format', () => {
    const dbml = toDBML(schema);
    writeOutput('db-visualizer', 'output.dbml', dbml);
    expect(dbml).toContain('Table');
    // Should contain table names from the schema
    for (const table of schema.tables) {
      expect(dbml).toContain(table.name);
    }
  });

  it('includes column definitions', () => {
    const dbml = toDBML(schema);
    // Should contain column names
    for (const table of schema.tables) {
      for (const col of table.columns) {
        expect(dbml).toContain(col.name);
      }
    }
  });
});

// ==================== toMermaid ====================

describe('toMermaid', () => {
  it('converts schema to Mermaid ER diagram', () => {
    const mermaid = toMermaid(schema);
    writeOutput('db-visualizer', 'output.mermaid', mermaid);
    expect(mermaid).toContain('erDiagram');
    for (const table of schema.tables) {
      expect(mermaid).toContain(table.name);
    }
  });

  it('includes relationships', () => {
    const mermaid = toMermaid(schema);
    if (schema.relationships.length > 0) {
      // Mermaid uses special relationship symbols
      expect(mermaid).toMatch(/[\|o\{].*[\|o\}]/);
    }
  });
});

// ==================== toPlantUML ====================

describe('toPlantUML', () => {
  it('converts schema to PlantUML format', () => {
    const puml = toPlantUML(schema);
    writeOutput('db-visualizer', 'output.puml', puml);
    expect(puml).toContain('@startuml');
    expect(puml).toContain('@enduml');
    for (const table of schema.tables) {
      expect(puml).toContain(table.name);
    }
  });
});

// ==================== toMarkdown ====================

describe('toMarkdown', () => {
  it('converts schema to Markdown documentation', () => {
    const md = toMarkdown(schema);
    writeOutput('db-visualizer', 'output.md', md);
    expect(md).toContain('#');
    for (const table of schema.tables) {
      expect(md).toContain(table.name);
    }
  });

  it('includes column type information', () => {
    const md = toMarkdown(schema);
    // Markdown tables should contain column types
    expect(md).toContain('|');
  });
});

// ==================== toSQL ====================

describe('toSQL', () => {
  it('converts schema to PostgreSQL DDL', () => {
    const sql = toSQL(schema, 'postgresql');
    writeOutput('db-visualizer', 'output-postgres.sql', sql);
    expect(sql).toContain('CREATE TABLE');
    for (const table of schema.tables) {
      expect(sql).toContain(table.name);
    }
  });

  it('converts schema to MySQL DDL', () => {
    const sql = toSQL(schema, 'mysql');
    writeOutput('db-visualizer', 'output-mysql.sql', sql);
    expect(sql).toContain('CREATE TABLE');
  });

  it('converts schema to SQLite DDL', () => {
    const sql = toSQL(schema, 'sqlite');
    writeOutput('db-visualizer', 'output-sqlite.sql', sql);
    expect(sql).toContain('CREATE TABLE');
  });

  it('defaults to PostgreSQL', () => {
    const sql = toSQL(schema);
    expect(sql).toContain('CREATE TABLE');
  });
});

// ==================== parseSQL ====================

describe('parseSQL', () => {
  it('parses SQL DDL into Schema object', () => {
    const parsed = parseSQL(sqlInput);
    writeOutput('db-visualizer', 'parsed-schema.json', JSON.stringify(parsed, null, 2));
    expect(parsed).toHaveProperty('tables');
    expect(parsed.tables.length).toBeGreaterThan(0);
  });

  it('extracts table names from SQL', () => {
    const parsed = parseSQL(sqlInput);
    const tableNames = parsed.tables.map((t) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('posts');
    expect(tableNames).toContain('comments');
  });

  it('extracts column info from SQL', () => {
    const parsed = parseSQL(sqlInput);
    const usersTable = parsed.tables.find((t) => t.name === 'users');
    expect(usersTable).toBeDefined();
    expect(usersTable!.columns.length).toBeGreaterThan(0);
    const idCol = usersTable!.columns.find((c) => c.name === 'id');
    expect(idCol).toBeDefined();
  });
});

// ==================== convertSchema ====================

describe('convertSchema', () => {
  it('converts schema to DBML via format string', () => {
    const result = convertSchema(schema, 'dbml');
    expect(result).toContain('Table');
  });

  it('converts schema to mermaid via format string', () => {
    const result = convertSchema(schema, 'mermaid');
    expect(result).toContain('erDiagram');
  });

  it('converts schema to plantuml via format string', () => {
    const result = convertSchema(schema, 'plantuml');
    expect(result).toContain('@startuml');
  });

  it('converts schema to markdown via format string', () => {
    const result = convertSchema(schema, 'markdown');
    expect(result).toContain('#');
  });

  it('converts schema to sql via format string', () => {
    const result = convertSchema(schema, 'sql');
    expect(result).toContain('CREATE TABLE');
  });

  it('converts schema to JSON via format string', () => {
    const result = convertSchema(schema, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('tables');
  });
});

// ==================== generateSVG ====================

describe('generateSVG', () => {
  it('generates SVG diagram of schema', () => {
    const svg = generateSVG(schema);
    writeOutput('db-visualizer', 'schema-diagram.svg', svg);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    // Should contain table names
    for (const table of schema.tables) {
      expect(svg).toContain(table.name);
    }
  });
});
