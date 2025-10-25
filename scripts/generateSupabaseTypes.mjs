import fs from 'node:fs'
import path from 'node:path'

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to generate types.')
  process.exit(1)
}

async function fetchOpenApi() {
  const url = new URL('/rest/v1/', supabaseUrl)
  url.searchParams.set('apikey', serviceRoleKey)

  const response = await fetch(url, {
    headers: {
      Accept: 'application/openapi+json',
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  if (!response.ok) {
    console.error(`Failed to fetch Supabase OpenAPI schema: ${response.status} ${response.statusText}`)
    const body = await response.text()
    console.error(body)
    process.exit(1)
  }

  return response.json()
}

const jsonTypeDeclaration = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]`

function toTsType(column) {
  if (!column) {
    return 'unknown'
  }

  const { type, format, enum: enumValues, items } = column

  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return enumValues.map(value => JSON.stringify(value)).join(' | ')
  }

  if (type === 'array') {
    const arrayItemType = items ? toTsType(items) : 'unknown'
    return `${arrayItemType}[]`
  }

  if (format) {
    if (format.includes('json')) {
      return 'Json'
    }

    if (format === 'uuid' || format.includes('text') || format.includes('character varying')) {
      return 'string'
    }

    if (format.includes('timestamp') || format.includes('time')) {
      return 'string'
    }

    if (format.includes('numeric') || format.includes('double') || format.includes('decimal')) {
      return 'number'
    }

    if (format.includes('int')) {
      return 'number'
    }

    if (format.includes('bool')) {
      return 'boolean'
    }

    if (format.endsWith('[]') && type !== 'array') {
      const innerFormat = format.slice(0, -2)
      const innerType = toTsType({ type: undefined, format: innerFormat })
      return `${innerType}[]`
    }
  }

  switch (type) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'object':
      return '{ [key: string]: Json | undefined }'
    default:
      return 'unknown'
  }
}

function buildTableBlock(name, definition) {
  const properties = definition?.properties ?? {}
  const requiredColumns = new Set(definition?.required ?? [])
  const sortedColumns = Object.keys(properties).sort()

  const rowLines = []
  const insertLines = []
  const updateLines = []

  for (const columnName of sortedColumns) {
    const column = properties[columnName] ?? {}
    const baseType = toTsType(column)
    const isNullable = !requiredColumns.has(columnName)
    const hasDefault = column.default !== undefined || (column.description?.includes('<pk/>') ?? false)
    const rowType = isNullable ? `${baseType} | null` : baseType
    const insertType = isNullable ? `${baseType} | null` : baseType
    const updateType = rowType
    const insertOptional = isNullable || hasDefault
    const updateOptional = true

    const descriptionComment = column.description
      ? column.description
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .join(' ')
      : undefined

    const formatComment =
      column.format && !column.description?.includes(column.format) ? `format: ${column.format}` : undefined

    const commentParts = [descriptionComment, formatComment].filter(Boolean)
    const comment = commentParts.length ? ` // ${commentParts.join(' | ')}` : ''

    rowLines.push(`        ${columnName}: ${rowType}${comment}`)
    insertLines.push(`        ${columnName}${insertOptional ? '?:' : ':'} ${insertType}${comment}`)
    updateLines.push(`        ${columnName}${updateOptional ? '?:' : ':'} ${updateType}${comment}`)
  }

  const rowBlock = rowLines.length ? rowLines.join('\n') : '        // no columns found'
  const insertBlock = insertLines.length ? insertLines.join('\n') : '        // no columns found'
  const updateBlock = updateLines.length ? updateLines.join('\n') : '        // no columns found'

  return `      ${name}: {
        Row: {
${rowBlock}
        }
        Insert: {
${insertBlock}
        }
        Update: {
${updateBlock}
        }
        Relationships: []
      }`
}

async function generate() {
  const openapi = await fetchOpenApi()
  const definitions = openapi.definitions ?? {}
  const paths = openapi.paths ?? {}

  const tableNames = new Set()

  for (const rawPath of Object.keys(paths)) {
    if (!rawPath || rawPath === '/' || !rawPath.startsWith('/')) continue
    if (rawPath.startsWith('/rpc/')) continue
    const tableCandidate = rawPath.slice(1)
    if (definitions[tableCandidate]) {
      tableNames.add(tableCandidate)
    }
  }

  const sortedTables = Array.from(tableNames).sort()
  const tableBlocks = sortedTables.map(name => buildTableBlock(name, definitions[name]))

  const content = `${jsonTypeDeclaration}

export type Database = {
  public: {
    Tables: {
${tableBlocks.join('\n')}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`

  const targetPath = path.join(process.cwd(), 'src', 'types', 'supabase.ts')
  fs.writeFileSync(targetPath, content)
  console.log(`Supabase types written to ${targetPath}`)
}

generate().catch(error => {
  console.error('Failed to generate Supabase types')
  console.error(error)
  process.exit(1)
})
