/**
 * Business Intelligence Suite
 * Data warehouse, BI connectors, SQL query builder
 */

export interface DataWarehouseSchema {
  tables: TableDefinition[]
  relationships: Relationship[]
  aggregations: Aggregation[]
}

export interface TableDefinition {
  name: string
  columns: Column[]
  primaryKey: string
  indexes: string[]
}

export interface Column {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  nullable: boolean
}

export interface Relationship {
  from: { table: string; column: string }
  to: { table: string; column: string }
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

export interface Aggregation {
  name: string
  sourceTable: string
  groupBy: string[]
  metrics: AggregationMetric[]
}

export interface AggregationMetric {
  column: string
  function: 'sum' | 'avg' | 'count' | 'min' | 'max'
  alias: string
}

export interface QueryBuilder {
  select(columns: string[]): QueryBuilder
  from(table: string): QueryBuilder
  where(condition: string): QueryBuilder
  groupBy(columns: string[]): QueryBuilder
  orderBy(column: string, direction: 'ASC' | 'DESC'): QueryBuilder
  limit(count: number): QueryBuilder
  build(): string
}

export class BusinessIntelligence {
  private schema: DataWarehouseSchema | null = null

  async createDataWarehouse(): Promise<void> {
    this.schema = {
      tables: [
        {
          name: 'fact_incidents',
          columns: [
            { name: 'incident_id', type: 'string', nullable: false },
            { name: 'event_id', type: 'string', nullable: false },
            { name: 'date_key', type: 'number', nullable: false },
            { name: 'time_key', type: 'number', nullable: false },
            { name: 'incident_type_key', type: 'number', nullable: false },
            { name: 'priority_key', type: 'number', nullable: false },
            { name: 'response_time_minutes', type: 'number', nullable: true },
            { name: 'resolution_time_minutes', type: 'number', nullable: true }
          ],
          primaryKey: 'incident_id',
          indexes: ['event_id', 'date_key', 'incident_type_key']
        }
      ],
      relationships: [],
      aggregations: []
    }
  }

  buildQuery(): QueryBuilder {
    return new SQLQueryBuilder()
  }

  async exportToPowerBI(): Promise<any> {
    // Generate Power BI connector config
    return {
      type: 'postgres',
      connection: process.env.NEXT_PUBLIC_SUPABASE_URL,
      schema: 'public',
      tables: ['incident_logs', 'events', 'analytics_snapshots']
    }
  }

  async exportToTableau(): Promise<any> {
    // Generate Tableau connector config
    return {
      connectionType: 'postgres',
      server: 'db.supabase.co',
      database: 'postgres'
    }
  }
}

class SQLQueryBuilder implements QueryBuilder {
  private query: string[] = []

  select(columns: string[]): QueryBuilder {
    this.query.push(`SELECT ${columns.join(', ')}`)
    return this
  }

  from(table: string): QueryBuilder {
    this.query.push(`FROM ${table}`)
    return this
  }

  where(condition: string): QueryBuilder {
    this.query.push(`WHERE ${condition}`)
    return this
  }

  groupBy(columns: string[]): QueryBuilder {
    this.query.push(`GROUP BY ${columns.join(', ')}`)
    return this
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.query.push(`ORDER BY ${column} ${direction}`)
    return this
  }

  limit(count: number): QueryBuilder {
    this.query.push(`LIMIT ${count}`)
    return this
  }

  build(): string {
    return this.query.join(' ')
  }
}

export const businessIntelligence = new BusinessIntelligence()
