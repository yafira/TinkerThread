// Configuration and State
const backgroundSelect = document.getElementById('background-select')
const canvas = document.getElementById('canvas')
const wiresContainer = initializeWiresContainer()
let activeThread = null
let threadStartComponent = null

// Fabric Swatches
const fabricSwatches = [
	{ id: 'cotton', name: 'Cotton', color: '#f5f5dc' },
	{ id: 'felt', name: 'Felt', color: '#a0522d' },
	{ id: 'linen', name: 'Linen', color: '#faf0e6' },
	{ id: 'silk', name: 'Silk', color: '#b0c4de' },
	{ id: 'denim', name: 'Denim', color: '#1560bd' },
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
	canvas.insertBefore(container, canvas.firstChild)
	return container
}

// Create Fabric Swatches
function createFabricSwatches() {
	const sidebar = document.querySelector('.sidebar')
	const fabricHeader = document.createElement('h2')
	fabricHeader.textContent = 'Fabric Swatches'
	sidebar.appendChild(fabricHeader)

	fabricSwatches.forEach((fabric) => {
		const swatch = document.createElement('div')
		swatch.id = fabric.id
		swatch.classList.add('component', 'fabric-swatch')
		swatch.setAttribute('draggable', 'true')
		swatch.setAttribute('data-type', 'fabric')
		swatch.textContent = fabric.name
		swatch.style.backgroundColor = fabric.color
		sidebar.appendChild(swatch)
	})
}

// Background Update
function updateBackground() {
	const fabricBackground = canvas.getAttribute('data-fabric-background')
	if (!fabricBackground) {
		canvas.classList.remove('blank', 'graph', 'dotted')
		canvas.classList.add(backgroundSelect.value)
	}
}

// Component Handling
function handleComponentDrop(event) {
	event.preventDefault()
	const componentId = event.dataTransfer.getData('text')
	const component = document.getElementById(componentId)

	if (component.dataset.type === 'fabric') {
		handleFabricBackground(component)
		return
	}

	const newElement = createDroppedComponent(component)
	canvas.appendChild(newElement)
	makeDraggable(newElement)
	newElement.addEventListener('click', handleComponentClick)
	updateCircuitConnections()
}

function handleFabricBackground(component) {
	canvas.style.backgroundColor = component.style.backgroundColor
	canvas.setAttribute('data-fabric-background', component.id)
}

function createDroppedComponent(component) {
	const newElement = document.createElement('div')
	newElement.classList.add('dropped-component')
	newElement.dataset.type = component.getAttribute('data-type') || component.id
	newElement.dataset.state = 'off'
	newElement.dataset.id = Date.now()
	newElement.innerText = component.innerText

	styleDroppedComponent(newElement)
	positionDroppedComponent(newElement)

	return newElement
}

function styleDroppedComponent(element) {
	const styleMap = {
		led: () => {
			element.style.backgroundColor = 'gray'
			element.style.borderRadius = '50%'
			element.innerText = 'LED OFF'
		},
		button: () => {
			element.style.backgroundColor = 'red'
			element.innerText = 'BUTTON'
		},
		thread: () => {
			element.style.backgroundColor = 'gold'
			element.classList.add('thread-tool')
			element.innerText = 'THREAD'
		},
	}

	const styler = styleMap[element.dataset.type]
	if (styler) styler()
}

function positionDroppedComponent(element) {
	const canvasRect = canvas.getBoundingClientRect()
	const offsetX = event.clientX - canvasRect.left
	const offsetY = event.clientY - canvasRect.top

	element.style.position = 'absolute'
	element.style.left = `${offsetX - 25}px`
	element.style.top = `${offsetY - 25}px`
}

function handleComponentClick(event) {
	const component = event.currentTarget

	if (activeThread && component !== activeThread) {
		handleThreadConnection(component)
		return
	}

	const clickHandlers = {
		button: toggleButtonState,
		'thread-tool': toggleThreadMode,
	}

	const handler =
		clickHandlers[component.dataset.type] ||
		(component.classList.contains('thread-tool') && toggleThreadMode)

	if (handler) handler(component)
}

function toggleButtonState(button) {
	button.dataset.state = button.dataset.state === 'off' ? 'on' : 'off'
	button.style.backgroundColor = button.dataset.state === 'on' ? 'green' : 'red'
	button.innerText = `BUTTON ${button.dataset.state.toUpperCase()}`
	updateCircuitConnections()
}

function toggleThreadMode(threadTool) {
	activeThread = activeThread === threadTool ? null : threadTool
	threadTool.style.boxShadow = activeThread ? '0 0 0 3px blue' : 'none'
}

function handleThreadConnection(component) {
	if (!threadStartComponent) {
		threadStartComponent = component
		component.style.boxShadow = '0 0 0 3px gold'
	} else {
		createThreadConnection(threadStartComponent, component)
		threadStartComponent.style.boxShadow = 'none'
		threadStartComponent = null
	}
}

// Setup Event Listeners
function setupEventListeners() {
	backgroundSelect.addEventListener('change', updateBackground)

	document.querySelectorAll('.component').forEach((component) => {
		component.addEventListener('dragstart', (event) => {
			event.dataTransfer.setData('text', component.id)
		})
	})

	canvas.addEventListener('dragover', (event) => event.preventDefault())
	canvas.addEventListener('drop', handleComponentDrop)
}

// Initialize Application
function initApp() {
	createFabricSwatches()
	setupEventListeners()
	updateBackground()
	console.log('Soft Circuit Simulator Initialized')
}

document.addEventListener('DOMContentLoaded', initApp)
