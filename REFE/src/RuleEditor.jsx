import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  addEdge, applyNodeChanges, applyEdgeChanges,
  MiniMap, Controls, Background,
    useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import api from './api'
import { SetNode, HttpNode, FunctionNode } from './Nodes'

const nodeTypes = {
  set: SetNode,
  http: HttpNode,
  function: FunctionNode,
}
// ---------- Styles ----------
const wrapperStyle = {
  position: 'fixed',
  top: 0, left: 0,
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
}

const toolbarStyle = {
  position: 'absolute',
  zIndex: 100000,
  left: 16,
  top: 80,
  display: 'flex',
  gap: 8,
}

const buttonStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #ccc',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
}

const sidebarStyle = {
  position: 'absolute',
  top: 50,
  bottom: 0,
  width: 220,
  background: '#f9f9f9',
  boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
  padding: 16,
  zIndex: 20,
}

const sidebarButtonContainer = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 10,
}

const nodeButtonStyle = {
  padding: '8px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 14,
}

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize: 18,
  color: '#666'
}

const initialNodes = [
];

const initialEdges = [
];

export default function RuleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

    const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);

    const onSelectionChange = useCallback(({ nodes: selNodes = [], edges: selEdges = [] }) => {
    setSelectedNodes(selNodes);
    setSelectedEdges(selEdges);
  }, []);

   const run = async () => {
    setShowModal(true)
    setLoading(true)
    try {
      const res = await api.post(`/webhook/${id}/`, { definition: { nodes, edges } })
      setResult(JSON.stringify(res.data, null, 2))
    } catch (e) {
      setResult('Error: ' + (e.response?.data || e.message))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (!id){
      setLoading(false)
      return}
    setLoading(true)
    api.get(`rules/${id}/`)
      .then(res => {
        const rule = res.data
        const def = rule.definition || { nodes: [], edges: [] }

        const normalizedNodes = (def.nodes || []).map(n => ({
          id: String(n.id),
          position: n.position || { x: Math.random() * 400, y: Math.random() * 400 },
          data: n.data || { label: n.data?.label || 'node' },
          type: n.type || 'default'
        }))

        const normalizedEdges = (def.edges || []).map(e => ({
          id: e.id ? String(e.id) : `${e.source}-${e.target}`,
          source: String(e.source),
          target: String(e.target),
          type: e.type || undefined,
        }))

        setNodes(normalizedNodes)
        setEdges(normalizedEdges)
      })
      .catch(err => {
        console.error(err)
        alert('Failed to load rule')
      })
      .finally(() => setLoading(false))
  }, [id])

  const onConnect = useCallback((connection) => setEdges(eds => addEdge(connection, eds)), [])

  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    const nodeIdsToRemove = new Set(selectedNodes.map(n => n.id));
    const edgeIdsToRemove = new Set(selectedEdges.map(e => e.id));

    setNodes(prev => prev.filter(n => !nodeIdsToRemove.has(n.id)));

    setEdges(prev =>
      prev.filter(e => {
        if (edgeIdsToRemove.has(e.id)) return false;
        if (nodeIdsToRemove.has(e.source) || nodeIdsToRemove.has(e.target)) return false;
        return true;
      })
    );

    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [selectedNodes, selectedEdges, setNodes, setEdges]);

      useEffect(() => {
    const handler = (ev) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);



const save = async () => {
  const payload = { definition: { nodes, edges }, name: `Rule ${id || Math.floor(Math.random() * 10000)}` };

  try {
    if (!id) {
      // create new rule if id doesn't exist
      const res = await api.post('rules/', payload);
      alert(`Created new rule: ${payload.name}`);
      const newId = res.data.id;
      alert(`Created new rule: ${payload.name}`);
      navigate(`/editor/${newId}`);
      return res.data;
    }

    // try patch first
    await api.patch(`rules/${id}/`, payload);
    alert('Saved');
  } catch (err1) {
    try {
      // fallback to put
      await api.put(`rules/${id}/`, payload);
      alert('Saved via PUT');
    } catch (err2) {
      console.error(err2);
      alert('Save failed');
    }
  }
}
  const addNode = (type) => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: { x: Math.random() * 600, y: Math.random() * 400 },
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
    }
    setNodes((nds) => [...nds, newNode])
  }


  return (
    <div style={wrapperStyle}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <button onClick={() => navigate(-1)} style={buttonStyle}>Back</button>
        <button onClick={save} style={buttonStyle}>Save</button>
         <button onClick={run} style={{ ...buttonStyle, background: '#28a745', color: '#fff' }}>
          Run
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ ...buttonStyle, backgroundColor: '#007bff', color: '#fff' }}>
          {sidebarOpen ? 'Close' : 'Add Node'}
        </button>
      </div>

      {/* Sidebar */}
      <div style={{
        ...sidebarStyle,
        right: sidebarOpen ? 0 : '-220px',
        transition: 'right 0.3s ease-in-out',
      }}>
        <h4 style={{ margin: '10px 0px', color: '#333' }}>Add Node</h4>
        <div style={sidebarButtonContainer}>
          <button onClick={() => addNode('set')} style={nodeButtonStyle}>Set Node</button>
          <button onClick={() => addNode('http')} style={nodeButtonStyle}>http Node</button>
          <button onClick={() => addNode('function')} style={nodeButtonStyle}>function {`{}`} Node</button>
        </div>
      </div>
 {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
          onClick={() => setShowModal(false)}>
          <pre onClick={e => e.stopPropagation()} style={{
            background: '#fff', padding: 20, borderRadius: 8, maxWidth: '80%', maxHeight: '70%', overflow: 'auto'
          }}>
            {loading ? 'Running...' : result}
          </pre>
        </div>
      )}
      {/* ReactFlow Canvas */}
      {(loading ) ? (
        <div style={loadingStyle}>Loading...</div>
      ) : ( !showModal &&
        (<ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ width: '100%', height: '100%' }}
          selectNodesOnDrag={true}
        elementsSelectable={true}
        >
          <MiniMap />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>)
      )}
    </div>
  )
}

