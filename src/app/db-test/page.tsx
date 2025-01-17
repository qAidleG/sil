'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DbTestPage() {
  const [tables, setTables] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTables() {
      try {
        const { data, error } = await supabase
          .from('_tables')
          .select('*')
        
        if (error) throw error
        setTables(data || [])
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchTables()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Status</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl mb-2">Tables:</h2>
        {tables.length === 0 ? (
          <p>No tables found in the database.</p>
        ) : (
          <ul className="list-disc pl-5">
            {tables.map((table, i) => (
              <li key={i}>{JSON.stringify(table)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 