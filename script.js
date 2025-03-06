// Configuration and State
const backgroundSelect = document.getElementById('background-select')
const materialSelect = document.getElementById('material-select')
const canvas = document.getElementById('canvas')
const wiresContainer = initializeWiresContainer()
let activeConnectionType = null
let connectionStartComponent = null
let connectionStartNode = null // Track specific connection node

// Circuit simulation state
let circuitState = {
	powered: false,
	connections: [],
	components: [],
}

// Connection Types
const connectionTypes = [
	{
		id: 'conductive-thread',
		name: 'Conductive Thread',
		color: 'gray',
		style: {
			stroke: 'gray',
			strokeDasharray: '3,2',
			strokeWidth: 2,
			resistance: 0.5, // Higher resistance for thread
		},
	},
	{
		id: 'conductive-tape',
		name: 'Conductive Tape',
		color: 'silver',
		style: {
			stroke: 'silver',
			strokeDasharray: 'none',
			strokeWidth: 3,
			resistance: 0.2, // Lower resistance for tape
		},
	},
]

// Component Types with Electrical Properties
const componentTypes = {
	battery: {
		name: 'Battery',
		width: 70,
		height: 40,
		voltage: 3.3,
		nodes: [
			{ name: 'positive', x: 70, y: 20, type: 'output' },
			{ name: 'negative', x: 0, y: 20, type: 'output' },
		],
		style: () => {
			return {
				visual: {
					backgroundColor: '#aaaaaa',
					width: '40px',
					height: '20px',
					borderRadius: '2px',
					position: 'relative',
					innerHTML: `
            <div style="position:absolute; right:-4px; top:5px; width:8px; height:10px; background-color:#666; border-radius:0 2px 2px 0;"></div>
            <div style="position:absolute; left:-4px; top:5px; width:8px; height:10px; background-color:#666; border-radius:2px 0 0 2px;"></div>
          `,
				},
				label: 'BATTERY OFF',
			}
		},
		updateVisual: (component) => {
			const state = component.dataset.state
			const batteryColor = state === 'on' ? '#ffcc00' : '#aaaaaa'
			component.querySelector('.component-visual').style.backgroundColor =
				batteryColor
			component.querySelector('.component-label').textContent =
				state === 'on' ? 'ON (3.3V)' : 'OFF (0V)'
		},
	},
	led: {
		name: 'LED',
		width: 50,
		height: 50,
		forwardVoltage: 2.2,
		currentDraw: 0.02,
		nodes: [
			{ name: 'anode', x: 0, y: 25, type: 'input' },
			{ name: 'cathode', x: 50, y: 25, type: 'output' },
		],
		style: () => {
			return {
				visual: {
					backgroundColor: 'gray',
					borderRadius: '50%',
					width: '30px',
					height: '30px',
				},
				label: 'LED OFF',
			}
		},
		updateVisual: (component) => {
			const state = component.dataset.state
			const isOn = state === 'on'
			const ledColor = isOn ? 'yellow' : 'gray'
			const ledGlow = isOn ? '0 0 15px 5px rgba(255, 255, 0, 0.7)' : 'none'

			component.querySelector('.component-visual').style.backgroundColor =
				ledColor
			component.querySelector('.component-visual').style.boxShadow = ledGlow
			component.querySelector('.component-label').textContent = isOn
				? 'ON'
				: 'OFF'
		},
	},
	button: {
		name: 'Button',
		width: 60,
		height: 40,
		nodes: [
			{ name: 'input', x: 0, y: 20, type: 'input' },
			{ name: 'output', x: 60, y: 20, type: 'output' },
		],
		style: () => {
			return {
				visual: {
					backgroundColor: 'red',
					borderRadius: '5px',
					width: '30px',
					height: '20px',
				},
				label: 'OFF',
			}
		},
		updateVisual: (component) => {
			const state = component.dataset.state
			const buttonColor = state === 'on' ? 'green' : 'red'
			component.querySelector('.component-visual').style.backgroundColor =
				buttonColor
			component.querySelector(
				'.component-label'
			).textContent = `${state.toUpperCase()}`
		},
	},
	resistor: {
		name: 'Resistor',
		width: 80,
		height: 30,
		resistance: 220, // 220 Ohm
		nodes: [
			{ name: 'terminal1', x: 0, y: 15, type: 'any' },
			{ name: 'terminal2', x: 80, y: 15, type: 'any' },
		],
		style: () => {
			return {
				visual: {
					backgroundColor: '#FFA500',
					width: '50px',
					height: '15px',
					position: 'relative',
					innerHTML: `
            <div style="position: absolute; width: 4px; height: 100%; background-color: brown; left: 10px;"></div>
            <div style="position: absolute; width: 4px; height: 100%; background-color: black; left: 20px;"></div>
            <div style="position: absolute; width: 4px; height: 100%; background-color: red; left: 30px;"></div>
            <div style="position: absolute; width: 4px; height: 100%; background-color: gold; left: 40px;"></div>
          `,
				},
				label: '220Ω',
			}
		},
		updateVisual: () => {}, // No visual update needed for resistor
	},
}

// Fabric Swatches
const fabricSwatches = [
	{ id: 'cotton', name: 'Cotton', color: '#f5f5dc' },
	{ id: 'felt', name: 'Felt', color: '#ffdae0' },
	{ id: 'linen', name: 'Linen', color: '#faf0e6' },
	{ id: 'silk', name: 'Silk', color: '#b0c4de' },
	{ id: 'denim', name: 'Denim', color: '#6272A4' },
]

// Background Patterns
const backgroundPatterns = [
	{ id: 'blank', name: 'Blank', style: 'background-color: white;' },
	{
		id: 'graph',
		name: 'Graph',
		style: `
      background-image: linear-gradient(#ddd 1px, transparent 1px),
                        linear-gradient(90deg, #ddd 1px, transparent 1px);
      background-size: 20px 20px;
    `,
	},
	{
		id: 'dotted',
		name: 'Dotted',
		style: `
      background-image: radial-gradient(circle, #ddd 2px, transparent 2px);
      background-size: 20px 20px;
    `,
	},
	{
		id: 'grid',
		name: 'Grid',
		style: `
      background-image:
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
      background-size: 10px 10px;
    `,
	},
]

// Initialize Wires Container
function initializeWiresContainer() {
	const container = document.createElement('div')
	container.id = 'wires-container'
	container.style.position = 'absolute'
	container.style.top = '0'
	container.style.left = '0'
	container.style.width = '100%'
	container.style.height = '100%'
	container.style.pointerEvents = 'none'
	container.style.zIndex = '1'
	document
		.getElementById('canvas')
		.insertBefore(container, document.getElementById('canvas').firstChild)
	return container
}

function createSidebarComponents() {
	const sidebar = document.querySelector('.sidebar')
	sidebar.innerHTML = '<h2>Components</h2>' // Clear existing content

	// Helper function to create elements
	function createSidebarElement(
		id,
		className,
		type,
		name,
		styles = {},
		isDraggable = true
	) {
		const element = document.createElement('div')
		element.id = id
		element.classList.add('component', ...className.split(' '))
		if (isDraggable) {
			element.setAttribute('draggable', 'true') // Only set draggable for non-connection types
		}
		element.setAttribute('data-type', type)
		element.textContent = name

		Object.entries(styles).forEach(([prop, value]) => {
			element.style[prop] = value
		})

		return element
	}

	// Add Electronic Components (draggable)
	Object.entries(componentTypes).forEach(([typeId, type]) => {
		sidebar.appendChild(
			createSidebarElement(typeId, 'component', typeId, type.name)
		)
	})

	// Add Connection Types (not draggable)
	sidebar.appendChild(document.createElement('h2')).textContent =
		'Connection Types'
	connectionTypes.forEach((connection) => {
		sidebar.appendChild(
			createSidebarElement(
				connection.id,
				'component connection-type',
				'connection',
				connection.name,
				{ backgroundColor: connection.color },
				false // Make connection types non-draggable
			)
		)
	})

	// Add Fabric Swatches (draggable)
	sidebar.appendChild(document.createElement('h2')).textContent =
		'Fabric Swatches'
	fabricSwatches.forEach((fabric) => {
		sidebar.appendChild(
			createSidebarElement(
				fabric.id,
				'component fabric-swatch',
				'fabric',
				fabric.name,
				{ backgroundColor: fabric.color }
			)
		)
	})
}

// Add connection nodes to components
function createConnectionNodes(component) {
	const componentType = component.dataset.type
	const typeConfig = componentTypes[componentType]

	if (!typeConfig || !typeConfig.nodes) return

	// Create connection nodes
	typeConfig.nodes.forEach((nodeConfig) => {
		const nodeElement = document.createElement('div')
		nodeElement.classList.add('connection-node')
		nodeElement.dataset.nodeName = nodeConfig.name
		nodeElement.dataset.nodeType = nodeConfig.type
		nodeElement.dataset.componentId = component.dataset.id

		// Position the node relative to component
		nodeElement.style.position = 'absolute'
		nodeElement.style.left = `${nodeConfig.x - 5}px`
		nodeElement.style.top = `${nodeConfig.y - 5}px`
		nodeElement.style.width = '10px'
		nodeElement.style.height = '10px'
		nodeElement.style.borderRadius = '50%'
		nodeElement.style.backgroundColor = '#ffd700'
		nodeElement.style.border = '1px solid black'
		nodeElement.style.cursor = 'pointer'
		nodeElement.style.zIndex = '10'

		component.appendChild(nodeElement)

		// Add event listeners for connection creation
		nodeElement.addEventListener('mousedown', (e) => {
			e.stopPropagation() // Prevent dragging the component
		})

		nodeElement.addEventListener('click', (e) => {
			e.stopPropagation() // Prevent triggering component click
			handleNodeClick(e)
		})
	})
}

// Handle node clicks for creating connections
function handleNodeClick(event) {
	const node = event.currentTarget

	// If we have an active connection type
	if (activeConnectionType) {
		if (!connectionStartNode) {
			// First node selected
			connectionStartNode = node
			connectionStartComponent = findParentComponent(node)
			node.style.boxShadow = '0 0 0 3px gold'
		} else {
			// Second node selected - create connection
			const endComponent = findParentComponent(node)

			if (connectionStartComponent !== endComponent) {
				createNodeConnection(connectionStartNode, node, activeConnectionType)
			}

			// Reset connection state
			connectionStartNode.style.boxShadow = 'none'
			connectionStartNode = null
			connectionStartComponent = null
		}
	}
}

// Find parent component of a node
function findParentComponent(node) {
	return canvas.querySelector(
		`.dropped-component[data-id="${node.dataset.componentId}"]`
	)
}

// Create Connection Between Component Nodes
function createNodeConnection(startNode, endNode, connectionType) {
	// Find the current connection type configuration
	const connection = connectionTypes.find(
		(type) => type.id === connectionType.id
	)

	// Create a unique connection ID
	const connectionId = `connection_${startNode.dataset.componentId}_${startNode.dataset.nodeName}_${endNode.dataset.componentId}_${endNode.dataset.nodeName}`

	// Check if connection already exists
	if (wiresContainer.querySelector(`#${connectionId}`)) return

	// Create connection container
	const connectionContainer = document.createElement('div')
	connectionContainer.id = connectionId
	connectionContainer.classList.add('component-connection')
	connectionContainer.dataset.fromComponent = startNode.dataset.componentId
	connectionContainer.dataset.fromNode = startNode.dataset.nodeName
	connectionContainer.dataset.toComponent = endNode.dataset.componentId
	connectionContainer.dataset.toNode = endNode.dataset.nodeName
	connectionContainer.dataset.type = connectionType.id

	// Create SVG for connection
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	svg.setAttribute('width', '100%')
	svg.setAttribute('height', '100%')
	svg.style.position = 'absolute'
	svg.style.top = '0'
	svg.style.left = '0'
	svg.style.pointerEvents = 'none'

	// Create path for visual wiring
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
	updateConnectionPath(startNode, endNode, path)

	// Set stroke and visual properties based on connection type
	path.setAttribute('stroke', connection.style.stroke)
	path.setAttribute('stroke-width', connection.style.strokeWidth)
	path.setAttribute('stroke-dasharray', connection.style.strokeDasharray)
	path.setAttribute('fill', 'none')

	// Add path to SVG
	svg.appendChild(path)
	connectionContainer.appendChild(svg)

	// Add to wires container
	wiresContainer.appendChild(connectionContainer)

	// Add to circuit state
	circuitState.connections.push({
		id: connectionId,
		fromComponent: startNode.dataset.componentId,
		fromNode: startNode.dataset.nodeName,
		toComponent: endNode.dataset.componentId,
		toNode: endNode.dataset.nodeName,
		type: connectionType.id,
		resistance: connection.style.resistance || 0.1,
	})

	// Update circuit connections
	updateCircuitConnections()
}

// Update connection path based on current node positions
function updateConnectionPath(startNode, endNode, path) {
	// Get component positions
	const canvasRect = canvas.getBoundingClientRect()
	const startComponent = findParentComponent(startNode)
	const endComponent = findParentComponent(endNode)

	if (!startComponent || !endComponent) return

	// Calculate absolute positions in the canvas
	const startRect = startNode.getBoundingClientRect()
	const endRect = endNode.getBoundingClientRect()

	// Calculate centers of nodes
	const start = {
		x: startRect.left + startRect.width / 2 - canvasRect.left,
		y: startRect.top + startRect.height / 2 - canvasRect.top,
	}
	const end = {
		x: endRect.left + endRect.width / 2 - canvasRect.left,
		y: endRect.top + endRect.height / 2 - canvasRect.top,
	}

	// Generate a slightly curved path
	const pathData = `M ${start.x} ${start.y}
      C ${start.x + (end.x - start.x) / 3} ${start.y},
        ${start.x + (2 * (end.x - start.x)) / 3} ${end.y},
        ${end.x} ${end.y}`

	path.setAttribute('d', pathData)
}

// Handle Component Click
function handleComponentClick(event) {
	const component = event.currentTarget
	const type = component.dataset.type

	// Only toggle state for interactive components
	if (['button', 'battery'].includes(type)) {
		component.dataset.state = component.dataset.state === 'off' ? 'on' : 'off'

		// Update circuit power state if it's a battery
		if (type === 'battery') {
			circuitState.powered = component.dataset.state === 'on'
		}

		updateComponentVisual(component)
		updateCircuitConnections()
	}
}

// Update Component Visual State
function updateComponentVisual(component) {
	const type = component.dataset.type
	const typeConfig = componentTypes[type]

	if (typeConfig && typeof typeConfig.updateVisual === 'function') {
		typeConfig.updateVisual(component)
	}
}

// Update Circuit Connections
function updateCircuitConnections() {
	// Reset all component states
	document.querySelectorAll('.dropped-component').forEach((component) => {
		if (component.dataset.type === 'led') {
			component.dataset.state = 'off'
			updateComponentVisual(component)
		}

		if (
			component.dataset.type === 'battery' &&
			component.dataset.state === 'on'
		) {
			circuitState.powered = true
		}
	})

	// Mark all connections as inactive
	document.querySelectorAll('.component-connection path').forEach((path) => {
		path.style.opacity = '0.3'
	})

	// If we have no power source, no need to simulate
	if (!circuitState.powered) return

	// Find all battery connections when powered
	const batteries = Array.from(
		document.querySelectorAll(
			'.dropped-component[data-type="battery"][data-state="on"]'
		)
	)

	// For each battery, trace circuit paths
	batteries.forEach((battery) => {
		const batteryId = battery.dataset.id
		traceCircuitFromNode(batteryId, 'positive', [])
	})

	// Update connection visuals based on current flow
	document.querySelectorAll('.component-connection').forEach((connection) => {
		const hasCurrentFlow = connection.dataset.currentFlow === 'true'
		const path = connection.querySelector('path')
		if (path) {
			path.style.opacity = hasCurrentFlow ? '1' : '0.3'

			const connectionType = connection.dataset.type
			const baseStrokeWidth = connectionType === 'conductive-thread' ? 2 : 3

			path.style.strokeWidth = hasCurrentFlow
				? baseStrokeWidth + 1
				: baseStrokeWidth
		}
	})
}

// Trace circuit paths from a node
function traceCircuitFromNode(componentId, nodeName, visitedConnections) {
	// Find all connections from this node
	const connections = Array.from(
		document.querySelectorAll('.component-connection')
	).filter((conn) => {
		return (
			(conn.dataset.fromComponent === componentId &&
				conn.dataset.fromNode === nodeName) ||
			(conn.dataset.toComponent === componentId &&
				conn.dataset.toNode === nodeName)
		)
	})

	connections.forEach((connection) => {
		// Skip already visited connections to prevent loops
		if (visitedConnections.includes(connection.id)) return

		// Mark this connection as visited
		visitedConnections.push(connection.id)

		// Mark connection as having current flow
		connection.dataset.currentFlow = 'true'

		// Find the other end of the connection
		let nextComponentId, nextNodeName

		if (
			connection.dataset.fromComponent === componentId &&
			connection.dataset.fromNode === nodeName
		) {
			nextComponentId = connection.dataset.toComponent
			nextNodeName = connection.dataset.toNode
		} else {
			nextComponentId = connection.dataset.fromComponent
			nextNodeName = connection.dataset.fromNode
		}

		// Get the next component
		const nextComponent = document.querySelector(
			`.dropped-component[data-id="${nextComponentId}"]`
		)
		if (!nextComponent) return

		// Apply logic based on component type
		const componentType = nextComponent.dataset.type

		switch (componentType) {
			case 'button':
				// Only continue if button is pressed
				if (nextComponent.dataset.state === 'on') {
					// Find the other node of the button
					const otherNodeName = nextNodeName === 'input' ? 'output' : 'input'
					traceCircuitFromNode(
						nextComponentId,
						otherNodeName,
						visitedConnections
					)
				}
				break

			case 'led':
				// Check if current is flowing from anode to cathode
				if (nextNodeName === 'anode') {
					nextComponent.dataset.state = 'on'
					updateComponentVisual(nextComponent)
					// Continue tracing from cathode
					traceCircuitFromNode(nextComponentId, 'cathode', visitedConnections)
				}
				break

			case 'resistor':
				// Resistor allows current flow in both directions
				const otherNodeName =
					nextNodeName === 'terminal1' ? 'terminal2' : 'terminal1'
				traceCircuitFromNode(nextComponentId, otherNodeName, visitedConnections)
				break

			case 'battery':
				// Circuit is complete if we entered through negative terminal
				if (
					nextNodeName === 'negative' &&
					nextComponent.dataset.state === 'on'
				) {
					// Circuit is complete!
				}
				break
		}
	})
}

function setupEventListeners() {
	// Drag and drop for components
	document.querySelectorAll('.component').forEach((component) => {
		component.addEventListener('dragstart', (event) => {
			// Prevent dragging for connection types
			if (component.classList.contains('connection-type')) {
				event.preventDefault()
				return
			}
			event.dataTransfer.setData('text', component.id)
		})
	})

	// Connection type selection
	document.querySelector('.sidebar').addEventListener('click', (event) => {
		const connection = event.target.closest('.connection-type')
		if (!connection) return

		// Toggle connection type
		if (activeConnectionType && activeConnectionType.id === connection.id) {
			activeConnectionType = null
			connection.style.boxShadow = 'none'

			// Reset any active node
			if (connectionStartNode) {
				connectionStartNode.style.boxShadow = 'none'
				connectionStartNode = null
				connectionStartComponent = null
			}
		} else {
			// Deselect previous connection type
			document.querySelectorAll('.connection-type').forEach((c) => {
				c.style.boxShadow = 'none'
			})

			activeConnectionType = {
				id: connection.id,
				name: connection.textContent,
			}
			connection.style.boxShadow = '0 0 0 3px blue'
		}
	})

	// Handle background selection
	backgroundSelect.addEventListener('change', (event) => {
		const selectedBackground = event.target.value
		canvas.className = '' // Clear classes
		canvas.classList.add('canvas', selectedBackground)
	})

	// Canvas events
	canvas.addEventListener('dragover', (event) => event.preventDefault())
	canvas.addEventListener('drop', handleComponentDrop)
}

// Handle Component Drop
function handleComponentDrop(event) {
	event.preventDefault()
	const componentId = event.dataTransfer.getData('text')
	const component = document.getElementById(componentId)

	// Handle fabric background
	if (component.dataset.type === 'fabric') {
		canvas.style.backgroundColor = component.style.backgroundColor
		canvas.setAttribute('data-fabric-background', component.id)
		return
	}

	// Create dropped component
	const newElement = createDroppedComponent(component, event)
	canvas.appendChild(newElement)
	makeDraggable(newElement)
	newElement.addEventListener('click', handleComponentClick)

	// Add connection nodes
	createConnectionNodes(newElement)

	// Add to circuit state
	circuitState.components.push({
		id: newElement.dataset.id,
		type: newElement.dataset.type,
		state: newElement.dataset.state,
	})
}

// Create Dropped Component
function createDroppedComponent(component, event) {
	const type = component.dataset.type || component.id
	const typeConfig = componentTypes[type] || { width: 50, height: 50 }

	const newElement = document.createElement('div')
	newElement.classList.add('dropped-component')
	newElement.dataset.type = type
	newElement.dataset.state = 'off'
	newElement.dataset.id = Date.now().toString()

	// Position the component
	const canvasRect = canvas.getBoundingClientRect()
	const offsetX = event.clientX - canvasRect.left
	const offsetY = event.clientY - canvasRect.top

	newElement.style.position = 'absolute'
	newElement.style.left = `${offsetX - typeConfig.width / 2}px`
	newElement.style.top = `${offsetY - typeConfig.height / 2}px`
	newElement.style.width = `${typeConfig.width}px`
	newElement.style.height = `${typeConfig.height}px`

	// Create visual representation
	const visual = document.createElement('div')
	visual.classList.add('component-visual')
	newElement.appendChild(visual)

	// Create label
	const label = document.createElement('div')
	label.classList.add('component-label')
	label.textContent = component.textContent
	newElement.appendChild(label)

	// Style based on component type
	styleDroppedComponent(newElement)

	return newElement
}

// Style Dropped Component
function styleDroppedComponent(element) {
	const type = element.dataset.type
	const typeConfig = componentTypes[type]

	// Base component styles
	element.style.backgroundColor = '#f3f3f3'
	element.style.border = '1px solid #ddd'
	element.style.borderRadius = '4px'
	element.style.display = 'flex'
	element.style.flexDirection = 'column'
	element.style.alignItems = 'center'
	element.style.justifyContent = 'center'
	element.style.overflow = 'visible'

	const visual = element.querySelector('.component-visual')
	const label = element.querySelector('.component-label')

	// Style the label
	label.style.fontSize = '10px'
	label.style.fontWeight = 'bold'
	label.style.textAlign = 'center'
	label.style.width = '100%'

	// Apply type-specific styling if available
	if (typeConfig && typeof typeConfig.style === 'function') {
		const style = typeConfig.style()

		// Apply visual styles
		Object.entries(style.visual).forEach(([prop, value]) => {
			visual.style[prop] = value
		})

		// Set label text
		label.textContent = style.label
	}
}

// Make Component Draggable
function makeDraggable(element) {
	let isDragging = false
	let startX, startY, initialLeft, initialTop

	element.addEventListener('mousedown', (e) => {
		if (e.button !== 0 || e.target.classList.contains('connection-node')) return
		isDragging = true
		startX = e.clientX
		startY = e.clientY
		initialLeft = parseInt(element.style.left)
		initialTop = parseInt(element.style.top)
		e.stopPropagation()
	})

	document.addEventListener('mousemove', (e) => {
		if (!isDragging) return

		const dx = e.clientX - startX
		const dy = e.clientY - startY

		const newLeft = initialLeft + dx
		const newTop = initialTop + dy

		const canvasRect = canvas.getBoundingClientRect()
		const maxLeft = canvasRect.width - element.offsetWidth
		const maxTop = canvasRect.height - element.offsetHeight

		element.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`
		element.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`

		// Update connections when dragging
		updateConnections(element)
	})

	document.addEventListener('mouseup', () => {
		if (isDragging) {
			isDragging = false
			updateCircuitConnections()
		}
	})
}

/// Update Connections When Moving Components
function updateConnections(movedComponent) {
	// Find all connections involving this component
	const connections = Array.from(
		document.querySelectorAll('.component-connection')
	).filter((conn) => {
		return (
			conn.dataset.fromComponent === movedComponent.dataset.id ||
			conn.dataset.toComponent === movedComponent.dataset.id
		)
	})

	connections.forEach((connection) => {
		// Get nodes
		const fromComponentId = connection.dataset.fromComponent
		const fromNodeName = connection.dataset.fromNode
		const toComponentId = connection.dataset.toComponent
		const toNodeName = connection.dataset.toNode

		const fromComponent = document.querySelector(
			`.dropped-component[data-id="${fromComponentId}"]`
		)
		const toComponent = document.querySelector(
			`.dropped-component[data-id="${toComponentId}"]`
		)

		if (!fromComponent || !toComponent) return

		const fromNode = fromComponent.querySelector(
			`.connection-node[data-node-name="${fromNodeName}"]`
		)
		const toNode = toComponent.querySelector(
			`.connection-node[data-node-name="${toNodeName}"]`
		)

		if (!fromNode || !toNode) return

		// Update the path
		const path = connection.querySelector('path')
		if (path) {
			updateConnectionPath(fromNode, toNode, path)
		}
	})
}

// Fix for node click handler
function handleNodeClick(event) {
	const node = event.currentTarget

	// If we have an active connection type
	if (activeConnectionType) {
		if (!connectionStartNode) {
			// First node selected
			connectionStartNode = node
			connectionStartComponent = findParentComponent(node)
			node.style.boxShadow = '0 0 0 3px gold'

			// Add visual indicator
			canvas.style.cursor = 'crosshair'
		} else {
			// Second node selected - create connection
			const endComponent = findParentComponent(node)

			// Don't allow connections to the same node
			if (
				connectionStartNode !== node &&
				connectionStartComponent !== endComponent
			) {
				// Check for compatible node types
				const startNodeType = connectionStartNode.dataset.nodeType
				const endNodeType = node.dataset.nodeType

				if (
					startNodeType === 'any' ||
					endNodeType === 'any' ||
					(startNodeType === 'output' && endNodeType === 'input') ||
					(startNodeType === 'input' && endNodeType === 'output')
				) {
					createNodeConnection(connectionStartNode, node, activeConnectionType)
				} else {
					showNotification('Incompatible connection nodes', 'error')
				}
			} else {
				showNotification('Cannot connect a component to itself', 'error')
			}

			// Reset connection state
			connectionStartNode.style.boxShadow = 'none'
			connectionStartNode = null
			connectionStartComponent = null
			canvas.style.cursor = 'default'
		}
	} else {
		showNotification('Please select a connection type first', 'info')
	}
}

// Show notification
function showNotification(message, type = 'info') {
	const notification = document.createElement('div')
	notification.classList.add('notification', `notification-${type}`)
	notification.textContent = message
	notification.style.position = 'fixed'
	notification.style.bottom = '20px'
	notification.style.left = '50%'
	notification.style.transform = 'translateX(-50%)'
	notification.style.padding = '10px 20px'
	notification.style.borderRadius = '5px'
	notification.style.zIndex = '1000'

	// Set style based on type
	if (type === 'error') {
		notification.style.backgroundColor = '#f8d7da'
		notification.style.color = '#721c24'
		notification.style.border = '1px solid #f5c6cb'
	} else if (type === 'success') {
		notification.style.backgroundColor = '#d4edda'
		notification.style.color = '#155724'
		notification.style.border = '1px solid #c3e6cb'
	} else {
		notification.style.backgroundColor = '#d1ecf1'
		notification.style.color = '#0c5460'
		notification.style.border = '1px solid #bee5eb'
	}

	document.body.appendChild(notification)

	// Remove after 3 seconds
	setTimeout(() => {
		notification.style.opacity = '0'
		notification.style.transition = 'opacity 0.5s'
		setTimeout(() => notification.remove(), 500)
	}, 3000)
}

// Create Help Tools
function createHelpTools() {
	// Create help panel
	const helpPanel = document.createElement('div')
	helpPanel.classList.add('help-panel')
	helpPanel.style.position = 'absolute'
	helpPanel.style.top = '10px'
	helpPanel.style.right = '10px'
	helpPanel.style.backgroundColor = 'white'
	helpPanel.style.border = '1px solid #ddd'
	helpPanel.style.borderRadius = '5px'
	helpPanel.style.padding = '15px'
	helpPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'
	helpPanel.style.width = '300px'
	helpPanel.style.display = 'none'
	helpPanel.style.zIndex = '100'

	// Panel content
	helpPanel.innerHTML = `
    <h3 style="margin-top: 0;">E-Textile Circuit Builder Help</h3>
    <h4>Getting Started</h4>
    <ul>
      <li>Drag components from the sidebar to the canvas</li>
      <li>Select a connection type (thread or tape) before connecting</li>
      <li>Click on connection points (gold dots) to create wires</li>
      <li>Click on batteries or buttons to toggle their state</li>
    </ul>
    <h4>Components</h4>
    <ul>
      <li><strong>Battery:</strong> Power source for your circuit</li>
      <li><strong>LED:</strong> Light that turns on when powered</li>
      <li><strong>Button:</strong> Press to complete a circuit</li>
      <li><strong>Resistor:</strong> Limits current flow (220Ω)</li>
    </ul>
    <h4>Tips</h4>
    <ul>
      <li>Right-click components to delete or rotate them</li>
      <li>Components must form a complete circuit to work</li>
      <li>Batteries must be turned ON to power the circuit</li>
    </ul>
    <button id="close-help" style="margin-top: 10px;">Close</button>
  `

	document.body.appendChild(helpPanel)

	// Help toggle button
	const helpButton = document.createElement('button')
	helpButton.id = 'help-button'
	helpButton.textContent = '?'
	helpButton.style.position = 'absolute'
	helpButton.style.top = '10px'
	helpButton.style.right = '10px'
	helpButton.style.width = '30px'
	helpButton.style.height = '30px'
	helpButton.style.borderRadius = '50%'
	helpButton.style.backgroundColor = '#007bff'
	helpButton.style.color = 'white'
	helpButton.style.border = 'none'
	helpButton.style.fontSize = '18px'
	helpButton.style.cursor = 'pointer'
	helpButton.style.zIndex = '99'

	document.body.appendChild(helpButton)

	// Toggle help panel
	helpButton.addEventListener('click', () => {
		helpPanel.style.display =
			helpPanel.style.display === 'none' ? 'block' : 'none'
	})

	// Close button
	document.getElementById('close-help').addEventListener('click', () => {
		helpPanel.style.display = 'none'
	})

	// Tutorial button
	const tutorialButton = document.createElement('button')
	tutorialButton.textContent = 'Show Tutorial'
	tutorialButton.style.position = 'absolute'
	tutorialButton.style.top = '10px'
	tutorialButton.style.right = '50px'
	tutorialButton.style.zIndex = '99'

	document.body.appendChild(tutorialButton)

	tutorialButton.addEventListener('click', showTutorial)
}

// Show interactive tutorial
function showTutorial() {
	// Create array of tutorial steps
	const tutorialSteps = [
		{
			title: 'Welcome to E-Textile Circuit Builder',
			content:
				"This tutorial will guide you through building your first e-textile circuit. Click 'Next' to continue.",
			target: null,
		},
		{
			title: 'Components Panel',
			content: 'Drag components from this panel to add them to your canvas.',
			target: '.sidebar',
		},
		{
			title: 'Adding a Battery',
			content: "Let's start by adding a battery. Drag it to the canvas.",
			target: '#battery',
		},
		{
			title: 'Adding an LED',
			content: 'Now add an LED to light up your circuit.',
			target: '#led',
		},
		{
			title: 'Connecting Components',
			content:
				'Select a connection type (thread or tape) to connect components.',
			target: '.connection-type',
		},
		{
			title: 'Creating Connections',
			content:
				'Click on the gold connection points to create wires between components.',
			target: '.connection-node',
		},
		{
			title: 'Testing Your Circuit',
			content: 'Click on the battery to turn it ON and power your circuit.',
			target: ".dropped-component[data-type='battery']",
		},
		{
			title: 'Congratulations!',
			content:
				"You've built your first e-textile circuit! Explore more components and create your own designs.",
			target: null,
		},
	]

	let currentStep = 0

	// Create tutorial overlay
	const overlay = document.createElement('div')
	overlay.classList.add('tutorial-overlay')
	overlay.style.position = 'fixed'
	overlay.style.top = '0'
	overlay.style.left = '0'
	overlay.style.width = '100%'
	overlay.style.height = '100%'
	overlay.style.backgroundColor = 'rgba(0,0,0,0.7)'
	overlay.style.zIndex = '500'

	// Create tutorial box
	const tutorialBox = document.createElement('div')
	tutorialBox.classList.add('tutorial-box')
	tutorialBox.style.position = 'fixed'
	tutorialBox.style.bottom = '20px'
	tutorialBox.style.left = '50%'
	tutorialBox.style.transform = 'translateX(-50%)'
	tutorialBox.style.padding = '20px'
	tutorialBox.style.backgroundColor = 'white'
	tutorialBox.style.borderRadius = '5px'
	tutorialBox.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)'
	tutorialBox.style.width = '400px'
	tutorialBox.style.zIndex = '501'

	// Navigation buttons
	const buttonsContainer = document.createElement('div')
	buttonsContainer.style.display = 'flex'
	buttonsContainer.style.justifyContent = 'space-between'
	buttonsContainer.style.marginTop = '15px'

	const prevButton = document.createElement('button')
	prevButton.textContent = 'Previous'
	prevButton.disabled = true

	const nextButton = document.createElement('button')
	nextButton.textContent = 'Next'

	const skipButton = document.createElement('button')
	skipButton.textContent = 'Skip Tutorial'

	buttonsContainer.appendChild(prevButton)
	buttonsContainer.appendChild(skipButton)
	buttonsContainer.appendChild(nextButton)

	// Function to update tutorial content
	function updateTutorialContent() {
		const step = tutorialSteps[currentStep]

		// Update tutorial box content
		tutorialBox.innerHTML = `
      <h3 style="margin-top: 0;">${step.title}</h3>
      <p>${step.content}</p>
    `
		tutorialBox.appendChild(buttonsContainer)

		// Update button states
		prevButton.disabled = currentStep === 0
		nextButton.textContent =
			currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'

		// Highlight target element if specified
		if (step.target) {
			const targetElement = document.querySelector(step.target)
			if (targetElement) {
				const rect = targetElement.getBoundingClientRect()

				// Create highlight effect
				const highlight = document.createElement('div')
				highlight.classList.add('tutorial-highlight')
				highlight.style.position = 'absolute'
				highlight.style.top = `${rect.top - 5}px`
				highlight.style.left = `${rect.left - 5}px`
				highlight.style.width = `${rect.width + 10}px`
				highlight.style.height = `${rect.height + 10}px`
				highlight.style.border = '3px solid #007bff'
				highlight.style.borderRadius = '5px'
				highlight.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.7)'
				highlight.style.zIndex = '499'

				// Remove previous highlight
				const oldHighlight = document.querySelector('.tutorial-highlight')
				if (oldHighlight) oldHighlight.remove()

				document.body.appendChild(highlight)
			}
		} else {
			// Remove highlight if no target
			const oldHighlight = document.querySelector('.tutorial-highlight')
			if (oldHighlight) oldHighlight.remove()
		}
	}

	// Event listeners for navigation
	prevButton.addEventListener('click', () => {
		if (currentStep > 0) {
			currentStep--
			updateTutorialContent()
		}
	})

	nextButton.addEventListener('click', () => {
		if (currentStep < tutorialSteps.length - 1) {
			currentStep++
			updateTutorialContent()
		} else {
			// End tutorial
			overlay.remove()
			tutorialBox.remove()
			const highlight = document.querySelector('.tutorial-highlight')
			if (highlight) highlight.remove()
		}
	})

	skipButton.addEventListener('click', () => {
		overlay.remove()
		tutorialBox.remove()
		const highlight = document.querySelector('.tutorial-highlight')
		if (highlight) highlight.remove()
	})

	// Start tutorial
	document.body.appendChild(overlay)
	document.body.appendChild(tutorialBox)
	updateTutorialContent()
}

// Delete Connection
function deleteConnection(connectionId) {
	const connection = document.getElementById(connectionId)
	if (!connection) return

	// Remove from DOM
	connection.remove()

	// Remove from circuit state
	circuitState.connections = circuitState.connections.filter(
		(conn) => conn.id !== connectionId
	)

	// Update circuit
	updateCircuitConnections()
}

// Delete Component
function deleteComponent(componentId) {
	const component = document.querySelector(
		`.dropped-component[data-id="${componentId}"]`
	)
	if (!component) return

	// Find all connections to this component
	const connectionsToRemove = Array.from(
		document.querySelectorAll('.component-connection')
	).filter((conn) => {
		return (
			conn.dataset.fromComponent === componentId ||
			conn.dataset.toComponent === componentId
		)
	})

	// Remove all connections
	connectionsToRemove.forEach((conn) => {
		deleteConnection(conn.id)
	})

	// Remove component from DOM
	component.remove()

	// Remove from circuit state
	circuitState.components = circuitState.components.filter(
		(comp) => comp.id !== componentId
	)

	// Update circuit
	updateCircuitConnections()
}

// Add Context Menu for Components and Connections
function setupContextMenu() {
	// For components
	document.addEventListener('contextmenu', (event) => {
		const component = event.target.closest('.dropped-component')
		const connection =
			event.target.closest('.component-connection') ||
			event.target.closest('path')

		if (component || connection) {
			event.preventDefault()

			// Remove existing context menu
			const existingMenu = document.querySelector('.context-menu')
			if (existingMenu) existingMenu.remove()

			// Create new context menu
			const menu = document.createElement('div')
			menu.classList.add('context-menu')
			menu.style.position = 'absolute'
			menu.style.left = `${event.clientX}px`
			menu.style.top = `${event.clientY}px`
			menu.style.backgroundColor = 'white'
			menu.style.border = '1px solid #ccc'
			menu.style.borderRadius = '4px'
			menu.style.padding = '5px'
			menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'
			menu.style.zIndex = '100'

			if (component) {
				// Delete option
				const deleteOption = document.createElement('div')
				deleteOption.textContent = 'Delete Component'
				deleteOption.style.padding = '5px 10px'
				deleteOption.style.cursor = 'pointer'
				deleteOption.style.hover = 'background-color: #f0f0f0'

				deleteOption.addEventListener('click', () => {
					deleteComponent(component.dataset.id)
					menu.remove()
				})

				menu.appendChild(deleteOption)

				// Rotate option (if applicable)
				if (['resistor', 'led'].includes(component.dataset.type)) {
					const rotateOption = document.createElement('div')
					rotateOption.textContent = 'Rotate Component'
					rotateOption.style.padding = '5px 10px'
					rotateOption.style.cursor = 'pointer'

					rotateOption.addEventListener('click', () => {
						rotateComponent(component)
						menu.remove()
					})

					menu.appendChild(rotateOption)
				}

				// Add information option
				const infoOption = document.createElement('div')
				infoOption.textContent = 'Component Info'
				infoOption.style.padding = '5px 10px'
				infoOption.style.cursor = 'pointer'

				infoOption.addEventListener('click', () => {
					showComponentInfo(component)
					menu.remove()
				})

				menu.appendChild(infoOption)
			}

			if (connection) {
				// Find the actual connection element
				const connectionElement =
					connection.closest('.component-connection') ||
					connection.parentElement.closest('.component-connection')
				if (!connectionElement) return

				// Delete connection option
				const deleteOption = document.createElement('div')
				deleteOption.textContent = 'Delete Connection'
				deleteOption.style.padding = '5px 10px'
				deleteOption.style.cursor = 'pointer'

				deleteOption.addEventListener('click', () => {
					deleteConnection(connectionElement.id)
					menu.remove()
				})

				menu.appendChild(deleteOption)

				// Connection info option
				const infoOption = document.createElement('div')
				infoOption.textContent = 'Connection Info'
				infoOption.style.padding = '5px 10px'
				infoOption.style.cursor = 'pointer'

				infoOption.addEventListener('click', () => {
					showConnectionInfo(connectionElement)
					menu.remove()
				})

				menu.appendChild(infoOption)
			}

			document.body.appendChild(menu)

			// Close menu when clicking elsewhere
			document.addEventListener(
				'click',
				() => {
					menu.remove()
				},
				{ once: true }
			)
		}
	})
}

// Show component information
function showComponentInfo(component) {
	const componentType = component.dataset.type
	const componentId = component.dataset.id
	const typeConfig = componentTypes[componentType]

	const infoPanel = document.createElement('div')
	infoPanel.classList.add('info-panel')
	infoPanel.style.position = 'fixed'
	infoPanel.style.top = '50%'
	infoPanel.style.left = '50%'
	infoPanel.style.transform = 'translate(-50%, -50%)'
	infoPanel.style.backgroundColor = 'white'
	infoPanel.style.border = '1px solid #ccc'
	infoPanel.style.borderRadius = '5px'
	infoPanel.style.padding = '20px'
	infoPanel.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)'
	infoPanel.style.zIndex = '200'
	infoPanel.style.maxWidth = '400px'

	// Basic component info
	let infoHTML = `
    <h3>${typeConfig.name} Information</h3>
    <p><strong>ID:</strong> ${componentId}</p>
    <p><strong>Type:</strong> ${componentType}</p>
    <p><strong>State:</strong> ${component.dataset.state.toUpperCase()}</p>
  `

	// Add component-specific info
	switch (componentType) {
		case 'battery':
			infoHTML += `
        <p><strong>Voltage:</strong> ${
					component.dataset.state === 'on' ? '3.3V' : '0V'
				}</p>
        <p><strong>Type:</strong> Coin Cell (CR2032)</p>
        <p><strong>Info:</strong> Powers your circuit. Click to toggle ON/OFF.</p>
      `
			break
		case 'led':
			infoHTML += `
        <p><strong>Forward Voltage:</strong> 2.2V</p>
        <p><strong>Current Draw:</strong> 20mA</p>
        <p><strong>Info:</strong> Lights up when a complete circuit is formed.</p>
      `
			break
		case 'button':
			infoHTML += `
        <p><strong>Type:</strong> Momentary push button</p>
        <p><strong>Info:</strong> Click to toggle between pressed and released states.</p>
      `
			break
		case 'resistor':
			infoHTML += `
        <p><strong>Resistance:</strong> 220Ω</p>
        <p><strong>Color Code:</strong> Red-Red-Brown-Gold</p>
        <p><strong>Info:</strong> Limits current to protect LEDs and other components.</p>
      `
			break
	}

	// Close button
	infoHTML += `<button id="close-info-panel" style="margin-top: 15px;">Close</button>`

	infoPanel.innerHTML = infoHTML
	document.body.appendChild(infoPanel)

	// Close panel event
	document.getElementById('close-info-panel').addEventListener('click', () => {
		infoPanel.remove()
	})
}

// Show connection information
function showConnectionInfo(connection) {
	const connectionType = connection.dataset.type
	const fromComponentId = connection.dataset.fromComponent
	const toComponentId = connection.dataset.toComponent

	// Get connection type details
	const typeConfig = connectionTypes.find((t) => t.id === connectionType)

	// Get component details
	const fromComponent = document.querySelector(
		`.dropped-component[data-id="${fromComponentId}"]`
	)
	const toComponent = document.querySelector(
		`.dropped-component[data-id="${toComponentId}"]`
	)

	if (!fromComponent || !toComponent || !typeConfig) return

	const fromType = fromComponent.dataset.type
	const toType = toComponent.dataset.type

	const infoPanel = document.createElement('div')
	infoPanel.classList.add('info-panel')
	infoPanel.style.position = 'fixed'
	infoPanel.style.top = '50%'
	infoPanel.style.left = '50%'
	infoPanel.style.transform = 'translate(-50%, -50%)'
	infoPanel.style.backgroundColor = 'white'
	infoPanel.style.border = '1px solid #ccc'
	infoPanel.style.borderRadius = '5px'
	infoPanel.style.padding = '20px'
	infoPanel.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)'
	infoPanel.style.zIndex = '200'
	infoPanel.style.maxWidth = '400px'

	infoPanel.innerHTML = `
    <h3>Connection Information</h3>
    <p><strong>Type:</strong> ${typeConfig.name}</p>
    <p><strong>Resistance:</strong> ${typeConfig.style.resistance} Ω/inch</p>
    <p><strong>From:</strong> ${componentTypes[fromType].name} (${
		fromComponent.dataset.id
	})</p>
    <p><strong>To:</strong> ${componentTypes[toType].name} (${
		toComponent.dataset.id
	})</p>
    <p><strong>Current Flow:</strong> ${
			connection.dataset.currentFlow === 'true' ? 'Yes' : 'No'
		}</p>
    <p><strong>Info:</strong> ${
			connectionType === 'conductive-thread'
				? 'Thread is flexible but has higher resistance than tape.'
				: 'Tape has lower resistance but less flexibility than thread.'
		}</p>
    <button id="close-info-panel" style="margin-top: 15px;">Close</button>
  `

	document.body.appendChild(infoPanel)

	// Close panel event
	document.getElementById('close-info-panel').addEventListener('click', () => {
		infoPanel.remove()
	})
}

// Rotate Component
function rotateComponent(component) {
	const currentRotation = parseInt(component.dataset.rotation || '0')
	const newRotation = (currentRotation + 90) % 360

	component.dataset.rotation = newRotation
	component.style.transform = `rotate(${newRotation}deg)`

	// Update connections after rotation
	updateConnections(component)
}

// Export Circuit as JSON
function exportCircuit() {
	const exportData = {
		components: circuitState.components.map((component) => {
			const componentElement = document.querySelector(
				`.dropped-component[data-id="${component.id}"]`
			)
			return {
				id: component.id,
				type: component.type,
				state: component.state,
				position: {
					left: parseInt(componentElement.style.left),
					top: parseInt(componentElement.style.top),
				},
				rotation: componentElement.dataset.rotation || '0',
			}
		}),
		connections: circuitState.connections,
		background: canvas.getAttribute('data-fabric-background') || 'blank',
		pattern: backgroundSelect.value,
	}

	const dataStr = JSON.stringify(exportData, null, 2)
	const blob = new Blob([dataStr], { type: 'application/json' })
	const url = URL.createObjectURL(blob)

	const a = document.createElement('a')
	a.href = url
	a.download = 'circuit-design.json'
	a.click()

	URL.revokeObjectURL(url)

	showNotification('Circuit exported successfully!', 'success')
}

// Import Circuit from JSON
function importCircuit(jsonData) {
	try {
		const circuitData = JSON.parse(jsonData)

		// Clear existing circuit
		wiresContainer.innerHTML = ''
		document
			.querySelectorAll('.dropped-component')
			.forEach((comp) => comp.remove())

		// Reset circuit state
		circuitState = {
			powered: false,
			connections: [],
			components: [],
		}

		// Set background
		if (circuitData.background) {
			const fabricElement = document.getElementById(circuitData.background)
			if (fabricElement) {
				canvas.style.backgroundColor = fabricElement.style.backgroundColor
				canvas.setAttribute('data-fabric-background', circuitData.background)
			}
		}

		if (circuitData.pattern) {
			backgroundSelect.value = circuitData.pattern
			canvas.className = ''
			canvas.classList.add('canvas', circuitData.pattern)
		}

		// Create components
		circuitData.components.forEach((compData) => {
			const componentType = document.getElementById(compData.type)
			if (!componentType) return

			// Create new element
			const newElement = createDroppedComponent(componentType, {
				clientX:
					canvas.getBoundingClientRect().left +
					compData.position.left +
					componentTypes[compData.type].width / 2,
				clientY:
					canvas.getBoundingClientRect().top +
					compData.position.top +
					componentTypes[compData.type].height / 2,
			})

			// Set ID and state
			newElement.dataset.id = compData.id
			newElement.dataset.state = compData.state

			// Set position directly
			newElement.style.left = `${compData.position.left}px`
			newElement.style.top = `${compData.position.top}px`

			// Apply rotation if any
			if (compData.rotation) {
				newElement.dataset.rotation = compData.rotation
				newElement.style.transform = `rotate(${compData.rotation}deg)`
			}

			// Add to DOM
			canvas.appendChild(newElement)
			makeDraggable(newElement)
			newElement.addEventListener('click', handleComponentClick)

			// Add connection nodes
			createConnectionNodes(newElement)

			// Update visual
			updateComponentVisual(newElement)

			// Add to circuit state
			circuitState.components.push({
				id: compData.id,
				type: compData.type,
				state: compData.state,
			})
		})

		// Create connections
		circuitData.connections.forEach((connData) => {
			const fromNode = document.querySelector(
				`.dropped-component[data-id="${connData.fromComponent}"] .connection-node[data-node-name="${connData.fromNode}"]`
			)
			const toNode = document.querySelector(
				`.dropped-component[data-id="${connData.toComponent}"] .connection-node[data-node-name="${connData.toNode}"]`
			)

			if (fromNode && toNode) {
				const connectionType =
					connectionTypes.find((type) => type.id === connData.type) ||
					connectionTypes[0]
				createNodeConnection(fromNode, toNode, { id: connectionType.id })
			}
		})

		// Update circuit
		updateCircuitConnections()

		return true
	} catch (error) {
		console.error('Error importing circuit:', error)
		return false
	}
}

// Create UI Controls
function createUIControls() {
	const controlsContainer = document.createElement('div')
	controlsContainer.classList.add('controls-container')
	controlsContainer.style.position = 'absolute'
	controlsContainer.style.bottom = '10px'
	controlsContainer.style.right = '10px'
	controlsContainer.style.display = 'flex'
	controlsContainer.style.gap = '10px'

	// Export button
	const exportButton = document.createElement('button')
	exportButton.textContent = 'Export Circuit'
	exportButton.addEventListener('click', exportCircuit)
	controlsContainer.appendChild(exportButton)

	// Import button
	const importButton = document.createElement('button')
	importButton.textContent = 'Import Circuit'
	importButton.addEventListener('click', () => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json'

		input.addEventListener('change', (e) => {
			const file = e.target.files[0]
			if (!file) return

			const reader = new FileReader()
			reader.onload = (e) => {
				const result = importCircuit(e.target.result)
				if (result) {
					alert('Circuit imported successfully!')
				} else {
					alert('Error importing circuit.')
				}
			}
			reader.readAsText(file)
		})

		input.click()
	})
	controlsContainer.appendChild(importButton)

	// Clear button
	const clearButton = document.createElement('button')
	clearButton.textContent = 'Clear Canvas'
	clearButton.addEventListener('click', () => {
		if (confirm('Are you sure you want to clear the canvas?')) {
			wiresContainer.innerHTML = ''
			document
				.querySelectorAll('.dropped-component')
				.forEach((comp) => comp.remove())
			circuitState = {
				powered: false,
				connections: [],
				components: [],
			}
		}
	})
	controlsContainer.appendChild(clearButton)

	document.body.appendChild(controlsContainer)
}

// Initialize patterns and materials
function initializeDropdowns() {
	// Add background patterns
	backgroundPatterns.forEach((pattern) => {
		const option = document.createElement('option')
		option.value = pattern.id
		option.textContent = pattern.name
		backgroundSelect.appendChild(option)
	})

	// Apply default pattern style
	const styleTag = document.createElement('style')
	let patternsCSS = ''

	backgroundPatterns.forEach((pattern) => {
		patternsCSS += `.${pattern.id} { ${pattern.style} }\n`
	})

	styleTag.textContent = patternsCSS
	document.head.appendChild(styleTag)

	// Materials dropdown
	const materials = [
		{ id: 'thread', name: 'Conductive Thread' },
		{ id: 'tape', name: 'Conductive Tape' },
	]

	materials.forEach((material) => {
		const option = document.createElement('option')
		option.value = material.id
		option.textContent = material.name
		materialSelect.appendChild(option)
	})
}

// Initialize the application
function init() {
	createSidebarComponents()
	setupEventListeners()
	setupContextMenu()
	initializeDropdowns()
	createUIControls()

	// Set default background
	canvas.classList.add('blank')

	// Apply CSS to connection nodes
	const nodeStyle = document.createElement('style')
	nodeStyle.textContent = `
    .connection-node {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .connection-node:hover {
      transform: scale(1.2);
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
    }
  `
	document.head.appendChild(nodeStyle)
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init)
