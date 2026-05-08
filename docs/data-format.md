# Data Format Guide

DAG Studio accepts JSON graph data and preserves custom fields. This guide describes the recommended shape and the normalization rules used by the app.

## Recommended Top-Level Shape

The recommended and simplest format is an object keyed by node key:

```json
{
  "Graph": {
    "define": "A graph is a set of vertices and edges.",
    "children": {
      "Tree": "subtype_of",
      "DAG": "subtype_of"
    }
  },
  "Tree": {
    "define": "A tree is a connected acyclic graph.",
    "parents": {
      "Graph": "subtype_of"
    },
    "children": {
      "Binary_Tree": "subtype_of"
    }
  },
  "Binary_Tree": {
    "define": "A tree where each node has at most two children.",
    "parents": {
      "Tree": "subtype_of"
    }
  }
}
```

If you are creating data from scratch, prefer this keyed-object form.

## Field Rules

Each node is just a JSON object. DAG Studio treats only a small set of fields as graph-aware:

- `children`: downstream node references
- `parents`: upstream node references
- `define`: main description shown in the node card and node viewer
- `label`, `title`, `name`: optional display-text fallbacks for the node title
- `type`: optional category used for node color grouping

All other fields are preserved as-is and remain visible in `View Node`.

Example:

```json
{
  "Linear_Space": {
    "label": "Linear Space",
    "define": "A vector space over a field.",
    "parents": {},
    "children": {
      "Affine_Space": "defined_on"
    },
    "aliases": ["vector space"],
    "tags": ["algebra", "geometry"],
    "metadata": {
      "difficulty": "medium",
      "domain": "mathematics"
    }
  }
}
```

## Relationship Forms

Both `children` and `parents` support two shapes.

### Array Form

Use this when you only care about structure:

```json
{
  "A": {
    "children": ["B", "C"]
  },
  "B": {
    "parents": ["A"]
  },
  "C": {
    "parents": ["A"]
  }
}
```

### Object Form

Use this when you also want edge labels:

```json
{
  "A": {
    "children": {
      "B": "subtype_of",
      "C": "depends_on"
    }
  },
  "B": {
    "parents": {
      "A": "subtype_of"
    }
  },
  "C": {
    "parents": {
      "A": "depends_on"
    }
  }
}
```

Object form is usually the better choice because edge labels can be shown in the graph.

## Supported Top-Level Inputs

The keyed-object format is recommended, but two additional input shapes are accepted.

### Array of Nodes

```json
[
  {
    "key": "A",
    "define": "Node A",
    "children": ["B"]
  },
  {
    "key": "B",
    "define": "Node B"
  }
]
```

### Wrapper Object with `nodes`

```json
{
  "nodes": [
    {
      "key": "A",
      "children": ["B"]
    },
    {
      "key": "B"
    }
  ]
}
```

## Relationship Normalization

The app normalizes and synchronizes graph relationships after loading and editing.

That means:

- missing referenced nodes are created automatically
- if `children` points to another node, that node receives the matching `parents` link
- if `parents` points to another node, that node receives the matching `children` link
- duplicate relation keys are removed

You do not need to maintain both directions perfectly by hand, but keeping both sides explicit is still recommended for clarity.

## Rendering Notes

- node title is chosen from `label`, `title`, `name`, or the node key
- node subtitle is derived from `define`
- edge labels come from relation values in `children` or `parents`
- card backgrounds stay neutral for readability, even when `type` color grouping is active

## Node Color Grouping

If a node includes a `type` field, DAG Studio groups nodes by unique `type` value and assigns each category its own accent color.

- nodes with the same `type` share the same accent
- accents affect borders, pins, and active states
- if no nodes define `type`, default styling is used

Example:

```json
{
  "Model_Registry": {
    "type": "data",
    "children": {
      "Online_Inference": "deploys_to"
    }
  },
  "Online_Inference": {
    "type": "service"
  }
}
```

## Minimal Example

```json
{
  "A": {
    "define": "Root node",
    "children": {
      "B": "related_to",
      "C": "related_to"
    }
  },
  "B": {
    "define": "Child node B"
  },
  "C": {
    "define": "Child node C"
  }
}
```

## Recommendations for Data Authors

- use stable, unique keys
- prefer the keyed-object top-level format
- prefer object-form `children` if edge labels matter
- use `define` for the main readable description
- keep additional metadata in custom fields instead of overloading relation fields
- use consistent field naming across shared datasets
