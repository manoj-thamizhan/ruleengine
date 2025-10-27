import React from 'react'
import { Link } from 'react-router-dom'


export default function Header() {
    return (
        <header className="h-16 bg-white border-b sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                    <Link to="/" className="text-lg font-semibold">Rule Engine</Link>
                    {/* <span className="ml-3 text-sm text-gray-500">Design and run your rules</span> */}
                </div>
                <div className="flex items-center gap-3">
                    {/* <button className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm shadow hover:bg-indigo-700">New Rule</button> */}
                    {/* <div className="text-sm text-gray-600">Signed in as <strong className="ml-1">Admin</strong></div> */}
                </div>
            </div>
        </header>
    )
}