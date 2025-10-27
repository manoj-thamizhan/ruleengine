# workflows/node_handlers.py
import requests
import json

"""
NODE HANDLERS
- Keep all node execution logic here (backend only).
- Each handler receives: data (node.data), inputs (list), context (dict), meta (dict)
- Must return a JSON-serializable object (dict/list/primitive)
"""

import re
PLACEHOLDER_RE = re.compile(r"\{\{\s*([^}]+?)\s*\}\}")
def _get_from_input(inputs, idx, path_parts):
    try:
        val = inputs[idx]
    except Exception:
        return None
    for p in path_parts:
        if val is None:
            return None
        # support numeric list indices
        if isinstance(val, (list, tuple)) and p.isdigit():
            i = int(p)
            try:
                val = val[i]
                continue
            except Exception:
                return None
        # otherwise dictionary / attribute-like access
        if isinstance(val, dict):
            val = val.get(p)
        else:
            # try attribute access as fallback
            val = getattr(val, p, None)
    return val

def resolve_placeholders(obj, inputs):
    """
    Recursively walk obj (which can be dict/list/str/primitive) and replace
    placeholders of form {{0.foo}} or {{foo}} (when single input).
    - If the entire string equals a single placeholder, return the original value (not str).
    - If placeholder is embedded, convert resolved value to str.
    """
    if isinstance(obj, dict):
        return {k: resolve_placeholders(v, inputs) for k, v in obj.items()}
    if isinstance(obj, list):
        return [resolve_placeholders(v, inputs) for v in obj]
    if isinstance(obj, str):
        # find all placeholders
        matches = list(PLACEHOLDER_RE.finditer(obj))
        if not matches:
            return obj

        # if single match and it spans the whole string -> return raw value
        if len(matches) == 1 and matches[0].span() == (0, len(obj)):
            token = matches[0].group(1).strip()
            parts = token.split('.')
            # determine index
            if parts[0].isdigit():
                idx = int(parts[0])
                path = parts[1:]
            else:
                if len(inputs) == 1:
                    idx = 0
                    path = parts
                else:
                    # ambiguous (no leading index and multiple inputs) -> fail-safe: return original string
                    return obj
            val = _get_from_input(inputs, idx, path)
            # If val is JSON-serializable, return as-is (keep Python type)
            return val

        # else, replace each placeholder within the string with str(value)
        def _repl(m):
            token = m.group(1).strip()
            parts = token.split('.')
            if parts[0].isdigit():
                idx = int(parts[0])
                path = parts[1:]
            else:
                if len(inputs) == 1:
                    idx = 0
                    path = parts
                else:
                    return m.group(0)  # can't resolve
            val = _get_from_input(inputs, idx, path)
            return "" if val is None else str(val)

        return PLACEHOLDER_RE.sub(_repl, obj)

    # primitives (int/float/bool/None) -> return as-is
    return obj


def set_node_handler(data, inputs, context, meta):
    # simply returns provided 'values' dict
    return data.get('values', {})



# def http_node_handler(data, inputs, context, meta):
#     method = (data.get('method') or 'GET').upper()
#     url = data.get('url')
#     if not url:
#         raise ValueError("HTTP node missing 'url' in data")
#     headers = data.get('headers') or {}
#     body = data.get('body')
#     resp = requests.request(method, url, headers=headers, json=body, timeout=15)
#     # try json then text
#     try:
#         return resp.json()
#     except Exception:
#         return resp.text
    
def http_node_handler(data, inputs, context, meta):
    # resolve placeholders in method/url/headers/body using immediate inputs
    # make a shallow copy so we don't mutate original node data
    node_data = data.copy() if isinstance(data, dict) else data

    # resolve method/url/headers/body recursively
    method = node_data.get('method') or 'GET'
    method = resolve_placeholders(method, inputs) or 'GET'
    method = str(method).upper()

    url = node_data.get('url')
    if not url:
        raise ValueError("HTTP node missing 'url' in data")
    url = resolve_placeholders(url, inputs)

    headers = node_data.get('headers') or {}
    headers = resolve_placeholders(headers, inputs) or {}

    body = node_data.get('body')
    body = resolve_placeholders(body, inputs)

    # if body is a string that looks like JSON, try to keep it as JSON by parsing
    # (optional) — safe attempt
    if isinstance(body, str):
        try:
            parsed = json.loads(body)
            body = parsed
        except Exception:
            pass

    resp = requests.request(method, url, headers=headers, json=body, timeout=15)
    try:
        return resp.json()
    except Exception:
        return resp.text

def function_node_handler(data, inputs, context, meta):
    """
    WARNING: this example *evaluates* Python expressions. DO NOT use in production
    with untrusted code. For testing/play, supply expressions that evaluate to a value.
    Example data: {"expr": "{'sum': sum(i.get('value',0) for i in inputs)}"}
    Returns: evaluated result
    """
    expr = data.get('expr', '')
    # very small sandbox: only provide inputs, context, meta; no builtins
    local = {'inputs': inputs, 'context': context, 'meta': meta}
    # For safety in real app: run in separate process or sandbox
    return eval(expr, {"__builtins__": {}}, local)

NODE_HANDLERS = {
    'set': set_node_handler,
    'http': http_node_handler,
    'function': function_node_handler,
}
