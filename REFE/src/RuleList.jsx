import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api'

export default function RuleList() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [search,setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    api.get(`rules/?search=${search}`)
      .then(res => { if (mounted) setRules(res.data) })
      .catch(err => { console.error(err); alert('Failed to load rules (check console)') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [search])

  const handleRename = async (e, rule) => {
    e.stopPropagation()
    const newName = window.prompt('Rename rule', rule.name || `Rule ${rule.id}`)
    if (!newName || newName === rule.name) return
    const prev = [...rules]
    setRules(rules.map(r => r.id === rule.id ? { ...r, name: newName } : r)) // optimistic
    try {
      await api.patch(`rules/${rule.id}/`, { name: newName })
    } catch (err) {
      console.error(err)
      alert('Rename failed')
      setRules(prev) // revert
    }
  }

  const handleDelete = async (e, rule) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${rule.name || `Rule ${rule.id}`}"?`)) return
    const prev = [...rules]
    setRules(rules.filter(r => r.id !== rule.id)) // optimistic
    try {
      await api.delete(`rules/${rule.id}/`)
    } catch (err) {
      console.error(err)
      alert('Delete failed')
      setRules(prev) // revert
    }
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <div className="p-6 h-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Rules</h2>
          <div className="flex items-center gap-2">
            <input onChange={(e)=>setSearch(e.target.value)} className="border rounded-lg px-3 py-2 w-64 text-sm" placeholder="Search rules..." />
            <a href='/editor'><button className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">Create</button></a>
          </div>
        </div>

        <div className="flex gap-6 h-full">
          <div className="flex-1 overflow-auto">
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
            {!loading && rules.length === 0 && <div className="text-sm text-gray-500">No rules found</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {rules.map(r => (
                <div
                  key={r.id}
                  className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/editor/${r.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{r.name || `Rule ${r.id}`}</div>
                      <div className="text-xs text-gray-500">ID: {r.id}</div>
                    </div>

                    {/* icons */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* rename (pencil) */}
                      <button
                        onClick={(e) => handleRename(e, r)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Rename"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                        </svg>
                      </button>

                      {/* delete (trash) */}
                      <button
                        onClick={(e) => handleDelete(e, r)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-7 4h10" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mb-2">
                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ''}
                  </div>

                  {/* <div className="text-sm text-gray-600 line-clamp-2">{r.description || 'No description'}</div> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
