'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TableInfo {
  name: string
}

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface SortState {
  column: string | null
  ascending: boolean
}

export default function DbManagerPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const [sort, setSort] = useState<SortState>({
    column: null,
    ascending: true
  })
  const [showRelations, setShowRelations] = useState(false)

  // Known tables in your database
  const knownTables = ['Character', 'Series', 'GeneratedImage', 'UserCollection']

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }, [selectedTable, pagination.page, sort, showRelations])

  async function fetchTables() {
    try {
      setLoading(true)
      setError(null)
      const tableInfos = knownTables.map(name => ({ name }))
      setTables(tableInfos)
    } catch (err: any) {
      setError(`Error loading tables: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTableData(tableName: string) {
    try {
      setLoading(true)
      setError(null)

      // Calculate range for pagination
      const from = (pagination.page - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1

      // Build query
      let query = supabase
        .from(tableName)
        .select(showRelations ? `*, Series(*)` : '*', { count: 'exact' })
        .range(from, to)

      // Add sorting if specified
      if (sort.column) {
        query = query.order(sort.column, { ascending: sort.ascending })
      }

      const { data, error, count } = await query

      if (error) throw error

      setTableData(data || [])
      setPagination(prev => ({ ...prev, total: count || 0 }))

    } catch (err: any) {
      setError(`Error loading ${tableName} data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleSort(column: string) {
    setSort(prev => ({
      column,
      ascending: prev.column === column ? !prev.ascending : true
    }))
  }

  function handlePageChange(newPage: number) {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Database Manager
        </h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tables List */}
          <div className="col-span-1 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Tables</h2>
            {loading && !selectedTable && (
              <p className="text-gray-400">Loading tables...</p>
            )}
            <ul className="space-y-2">
              {tables.map((table) => (
                <li key={table.name}>
                  <button
                    onClick={() => {
                      setSelectedTable(table.name)
                      setPagination(prev => ({ ...prev, page: 1 }))
                    }}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedTable === table.name
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {table.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Table Data */}
          <div className="col-span-1 md:col-span-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            {selectedTable && (
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-400">
                  Data: {selectedTable}
                </h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowRelations(!showRelations)}
                    className={`px-3 py-1 rounded ${
                      showRelations 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {showRelations ? 'Hide Relations' : 'Show Relations'}
                  </button>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => setPagination(prev => ({
                      ...prev,
                      pageSize: Number(e.target.value),
                      page: 1
                    }))}
                    className="bg-gray-700 text-gray-300 rounded px-2 py-1"
                  >
                    {[10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>
                        {size} rows
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {loading && selectedTable && (
              <p className="text-gray-400">Loading data...</p>
            )}
            
            {selectedTable && tableData.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        {Object.keys(tableData[0]).map((column) => (
                          <th
                            key={column}
                            onClick={() => handleSort(column)}
                            className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-blue-400"
                          >
                            {column}
                            {sort.column === column && (
                              <span className="ml-2">
                                {sort.ascending ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {tableData.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-700/50">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-4 py-2 text-sm text-gray-300">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-3 py-1 rounded ${
                          pagination.page === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {selectedTable && tableData.length === 0 && !loading && (
              <p className="text-gray-400">No data in this table</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 