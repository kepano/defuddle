```json
{
  "title": "Understanding Neural Networks",
  "author": "Jane Smith",
  "site": "Jane Smith",
  "published": ""
}
```

Neural networks are the fundamental building block of modern AI. Let's start with the simplest example: 1 input, 1 parameter, 1 output.

<svg viewBox="0 0 400 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="30" fill="Canvas" stroke="#d97706" stroke-width="2"></circle><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="16" fill="currentColor">2.0</text> <path d="M 80 50 L 320 50" stroke="#94a3b8" stroke-width="2" fill="none"></path><circle cx="350" cy="50" r="30" fill="Canvas" stroke="#16a34a" stroke-width="2"></circle><text x="350" y="50" text-anchor="middle" dominant-baseline="central" font-size="16" fill="currentColor">1.0</text></svg>

The network multiplies the input by the parameter to produce the output.

<svg viewBox="0 0 200 100" width="100%" height="100%" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg"><line stroke="#a1a1aa" x1="20" y1="50" x2="180" y2="50" stroke-width="1.5" stroke-dasharray="4 4"></line><circle fill="#f97316" cx="50" cy="50" r="8"></circle><circle fill="#f59e0b" cx="150" cy="50" r="8"></circle><text style="font-size:14px;font-weight:600" fill="#f59e0b" x="100" y="90" text-anchor="middle">-0.50</text></svg>

Each connection in the network has a weight that determines how strongly the input influences the output.

```python
model = NeuralNetwork(layers=[1, 4, 1])
```

This simple model can be trained to approximate many functions with sufficient layers and parameters.