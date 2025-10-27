# workflows/runner.py
import traceback
from collections import defaultdict, deque

from .node_handlers import NODE_HANDLERS

def topological_sort_nodes(nodes, edges):
    graph = defaultdict(list)
    indeg = {n['id']: 0 for n in nodes}
    for e in edges:
        s, t = e['source'], e['target']
        graph[s].append(t)
        indeg[t] = indeg.get(t, 0) + 1

    q = deque([nid for nid, d in indeg.items() if d == 0])
    order = []
    while q:
        n = q.popleft()
        order.append(n)
        for nb in graph[n]:
            indeg[nb] -= 1
            if indeg[nb] == 0:
                q.append(nb)
    if len(order) != len(nodes):
        # either cycle or disconnected nodes: still proceed for connected component
        # but for simplicity raise error here
        raise ValueError("Graph has cycles or disconnected nodes; topological sort failed")
    return order

def run_workflow_sync(definition, trigger_payload=None, workflow_id=None):
    nodes = definition.get('nodes', [])
    edges = definition.get('edges', [])

    node_map = {n['id']: n for n in nodes}
    incoming = {n['id']: [] for n in nodes}
    for e in edges:
        incoming[e['target']].append(e['source'])

    try:
        order = topological_sort_nodes(nodes, edges)
    except Exception as exc:
        return {'status': 'error', 'error': str(exc)}

    context = {}   # node_id -> output
    logs = []

    for nid in order:
        node = node_map[nid]
        node_type = node.get('type')
        node_data = node.get('data', {})
        inputs = [context.get(src) for src in incoming.get(nid, [])]

        try:
            handler = NODE_HANDLERS.get(node_type)
            if not handler:
                raise NotImplementedError(f"No handler for node type '{node_type}'")
            result = handler(node_data, inputs, context, meta={'workflow_id': workflow_id, 'node_id': nid, 'trigger': trigger_payload})
            context[nid] = result
            logs.append({'node': nid, 'status': 'ok'})
        except Exception as e:
            tb = traceback.format_exc()
            logs.append({'node': nid, 'status': 'error', 'error': str(e), 'traceback': tb})
            return {'status': 'error', 'logs': logs, 'context': context}
    return {'status': 'success', 'logs': logs, 'context': context}
