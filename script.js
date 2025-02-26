// Select the elements
const backgroundSelect = document.getElementById('background-select')
const canvas = document.getElementById('canvas')
const components = document.querySelectorAll('.component')

// Set canvas size (you can adjust this to your preference)
canvas.style.width = '800px' // Set width
canvas.style.height = '600px' // Set height

// Function to update the background class
function updateBackground() {
	canvas.classList.remove('blank', 'graph', 'dotted')
	const selectedBackground = backgroundSelect.value
	canvas.classList.add(selectedBackground)
}

// Add event listener for background selection change
backgroundSelect.addEventListener('change', updateBackground)

// Initialize with the default background
updateBackground()

// Handle dragging and dropping components
components.forEach((component) => {
	component.addEventListener('dragstart', (event) => {
		// Set the data being dragged
		event.dataTransfer.setData('text', event.target.id)
	})
})

// Handle drop event on the canvas
canvas.addEventListener('dragover', (event) => {
	event.preventDefault() // Allow drop
})

// Handle the actual drop on the canvas
canvas.addEventListener('drop', (event) => {
	event.preventDefault()

	// Get the component ID being dragged
	const componentId = event.dataTransfer.getData('text')
	const component = document.getElementById(componentId)

	// Create a new element for the dropped component
	const newElement = document.createElement('div')
	newElement.classList.add('dropped-component')
	newElement.innerText = component.innerText

	// Get the position of the canvas relative to the document
	const canvasRect = canvas.getBoundingClientRect()

	// Calculate the position of the drop relative to the canvas
	const offsetX = event.clientX - canvasRect.left
	const offsetY = event.clientY - canvasRect.top

	// Position the new element relative to the canvas
	newElement.style.position = 'absolute'
	newElement.style.left = `${offsetX - 25}px` // Adjust for element width
	newElement.style.top = `${offsetY - 25}px` // Adjust for element height

	// Add the new element to the canvas
	canvas.appendChild(newElement)

	// Make the dropped component draggable
	makeDraggable(newElement)
})

// Function to make the dropped component draggable
function makeDraggable(element) {
	let offsetX,
		offsetY,
		isDragging = false

	// Add mousedown listener to start dragging
	element.addEventListener('mousedown', (event) => {
		isDragging = true
		offsetX = event.clientX - parseInt(element.style.left)
		offsetY = event.clientY - parseInt(element.style.top)

		// Add mousemove listener to move the element
		document.addEventListener('mousemove', onMouseMove)
	})

	// Mousemove event to move the element while dragging
	function onMouseMove(event) {
		if (!isDragging) return

		// Calculate the new position
		let newX = event.clientX - offsetX
		let newY = event.clientY - offsetY

		// Get the canvas bounds to restrict dragging
		const canvasRect = canvas.getBoundingClientRect()
		const canvasWidth = canvasRect.width
		const canvasHeight = canvasRect.height

		// Restrict new position to be within the canvas bounds
		newX = Math.max(0, Math.min(newX, canvasWidth - element.offsetWidth))
		newY = Math.max(0, Math.min(newY, canvasHeight - element.offsetHeight))

		// Update the position of the element
		element.style.left = `${newX}px`
		element.style.top = `${newY}px`
	}

	// Mouseup event to stop dragging
	document.addEventListener('mouseup', () => {
		isDragging = false
		document.removeEventListener('mousemove', onMouseMove)
	})
}
