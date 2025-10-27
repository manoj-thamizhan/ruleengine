import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import RuleList from './RuleList'
import RuleEditor from './RuleEditor'
import Header from './component/Header'
import Sidebar from './component/Sidebar'
import './index.css'


export default function App() {
  return (
    <div className="h-screen bg-gray-50 text-gray-800">
      <Header />
      {/* <div className="flex"> */}
    
          <main className="bg-white rounded-2xl overflow-hidden">
            <Routes>
              <Route path="/" element={<RuleList />} />
              <Route path="/editor/:id" element={<RuleEditor />} />
              <Route path="/editor/" element={<RuleEditor />} />
            </Routes>
          </main>
      {/* </div> */}
    </div>
  )
}