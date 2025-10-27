import React from 'react'
import { Link } from 'react-router-dom'


export default function Sidebar() {
    return (
        <aside className="w-80 p-4">
            <div className="sticky top-20">
                <div className="mb-4 text-sm text-gray-500">Navigation</div>
                <nav className="space-y-2">
                    <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-gray-50">All Rules</Link>
                    <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Drafts</Link>
                    <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Runs</Link>
                </nav>
            </div>
        </aside>
    )
}