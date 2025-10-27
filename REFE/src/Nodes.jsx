// src/CustomNodes.jsx
import React, { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { useReactFlow } from 'reactflow';
import { useCallback } from 'react';
function safeParseJson(text, fallback) {
  try { return text ? JSON.parse(text) : fallback } catch (e) { return fallback }
}

/**
 * Common pattern:
 * - node receives `data` object which includes the node's current config fields
 * - data.updateNode(patch) is a function that merges `patch` into node.data
 *
 * The RuleEditor (below) will inject updateNode into each node when created/loaded.
 */

/* ---------- Set Node ---------- */
// Expects data.values (object) — will send this object to backend set handler
export const SetNode = ({ id, data }) => {
  const jsonText = JSON.stringify(data.values ?? {}, null, 2)
  const [text, setText] = useState(jsonText)
  const [err, setErr] = useState(null)
  const { setNodes } = useReactFlow()

  const apply = useCallback(() => {
    try {
      const parsed = text.trim() ? JSON.parse(text) : {}
      // optional: ensure parsed is an object
      if (parsed !== null && typeof parsed !== 'object') {
        throw new Error('JSON must be an object (e.g. {"key":"value"})')
      }

      setErr(null)

      // update React Flow node data so UI stays in sync
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  values: parsed,
                },
              }
            : node
        )
      )

      // optional external updater (e.g. persist to backend)
      data.updateNode?.({ values: parsed })

      console.log('Set node saved', { values: parsed })
    } catch (e) {
      const msg = e instanceof SyntaxError ? 'Invalid JSON' : e.message ?? 'Failed to save node'
      setErr(msg)
      console.warn('Apply error:', e)
    }
  }, [text, id, data, setNodes])

  return (
    <div style={{ width: 320, padding: 8, borderRadius: 6, background: '#f7fbff', border: '1px solid #d0e6ff' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Set Node</div>
      <div style={{ fontSize: 12, marginBottom: 6 }}>Return a values object to downstream nodes</div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
        placeholder='{"foo": "bar"}'
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => {
            // revert to original values if user wants to reset
            setText(JSON.stringify(data.values ?? {}, null, 2))
            setErr(null)
          }}
          title="Reset to node values"
        >
          Reset
        </button>

        <button onClick={apply}>Save</button>
      </div>

      {err && <div style={{ color: 'crimson', fontSize: 12, marginTop: 6 }}>{err}</div>}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

/* ---------- HTTP Node ---------- */
// Expects data.method, data.url, data.headers (object), data.body (object/null)
export const HttpNode = ({id, data }) => {
  const { setNodes } = useReactFlow();
  const [method, setMethod] = useState(data.method ?? 'GET')
  const [url, setUrl] = useState(data.url ?? '')
  const [headersText, setHeadersText] = useState(JSON.stringify(data.headers ?? {}, null, 2))
  const [bodyText, setBodyText] = useState(data.body ? JSON.stringify(data.body, null, 2) : '')
  const [err, setErr] = useState(null)

const apply = useCallback(() => {
  try {
    // parse JSON fields
    const headers = headersText.trim() ? JSON.parse(headersText) : {};
    const body = bodyText.trim() ? JSON.parse(bodyText) : null;

    // basic url validation
    if (!url || !/^https?:\/\//i.test(url.trim())) {
      throw new Error('Please enter a valid URL starting with http:// or https://');
    }

    setErr(null);

    // update React Flow node data so UI stays in sync
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                method,
                url: url.trim(),
                headers,
                body,
              },
            }
          : node
      )
    );

    // optional external updater (e.g. persist to backend)
    data.updateNode?.({
      method,
      url: url.trim(),
      headers,
      body,
    });

    console.log('Node saved', { method, url: url.trim(), headers, body });
  } catch (e) {
    // give clearer error for JSON vs other errors
    const msg =
      e instanceof SyntaxError
        ? 'Headers or Body JSON invalid'
        : e.message ?? 'Failed to save node';
    setErr(msg);
    console.warn('Apply error:', e);
  }
}, [headersText, bodyText, method, url, id, data, setNodes, setErr]);

  return (
    <div style={{ width: 360, padding: 8, borderRadius: 6, background: '#f6fff7', border: '1px solid #c5f0d0' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>HTTP Node</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          style={{ flex: 1 }}
        />
        <button onClick={apply}>Save</button>
      </div>

      <div style={{ fontSize: 12, marginBottom: 4 }}>Headers (JSON)</div>
      <textarea
        value={headersText}
        onChange={(e) => setHeadersText(e.target.value)}
        rows={3}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
        placeholder='{"Authorization": "Bearer ..."}'
      />

      <div style={{ fontSize: 12, marginTop: 6, marginBottom: 4 }}>Body (JSON) — optional</div>
      <textarea
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        rows={4}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
        placeholder='{"key": "value"}'
      />

      {err && <div style={{ color: 'crimson', fontSize: 12 }}>{err}</div>}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

/* ---------- Function Node ---------- */
// Expects data.expr (a string expression). Backend evals it with provided sandbox.
export const FunctionNode = ({ data }) => {
  const [expr, setExpr] = useState(data.expr ?? "''")

  const apply = () => {
    data.updateNode?.({ expr })
  }

  return (
    <div style={{ width: 360, padding: 8, borderRadius: 6, background: '#fff8f3', border: '1px solid #ffd9c7' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Function Node</div>
      <div style={{ fontSize: 12, marginBottom: 6 }}>
        Python expression evaluated on backend with: inputs, context, meta available.
      </div>
      <textarea
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        rows={6}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
        placeholder={`"{'sum': sum(i.get('value',0) for i in inputs)}"`}
      />
      <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
        <button onClick={apply}>Save</button>
        <div style={{ fontSize: 12, color: '#666' }}>Example: {"{'sum': sum(i.get('value',0) for i in inputs)}"}</div>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
