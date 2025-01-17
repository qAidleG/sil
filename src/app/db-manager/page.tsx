'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TableInfo {
  name: string
  rowCount: number
}

export default function DbManagerPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  async function fetchTables() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (error) throw error

      const tableInfoPromises = (data || []).map(async (table) => {
        const { count } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true })

        return {
          name: table.table_name,
          rowCount: count || 0
        }
      })

      const tableInfo = await Promise.all(tableInfoPromises)
      setTables(tableInfo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTableData(tableName: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100)
      
      if (error) throw error
      setTableData(data || [])
      setSelectedTable(tableName)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            {loading && <p className="text-gray-400">Loading...</p>}
            <ul className="space-y-2">
              {tables.map((table) => (
                <li key={table.name}>
                  <button
                    onClick={() => fetchTableData(table.name)}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedTable === table.name
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {table.name}
                    <span className="float-right text-sm text-gray-400">
                      {table.rowCount} rows
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {tables.length === 0 && !loading && (
              <p className="text-gray-400">No tables found</p>
            )}
          </div>

          {/* Table Data */}
          <div className="col-span-1 md:col-span-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              {selectedTable ? `Data: ${selectedTable}` : 'Select a table'}
            </h2>
            
            {loading && <p className="text-gray-400">Loading data...</p>}
            
            {selectedTable && tableData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      {Object.keys(tableData[0]).map((column) => (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider"
                        >
                          {column}
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