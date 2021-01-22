const candidateSelectors = [
  'input',
  'select',
  'textarea',
  'a[href]',
  'button',
  '[tabindex]',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])'
]

function isHidden(node) {
    // offsetParent being null will allow detecting cases where an element is invisible or inside an invisible element,
    // as long as the element does not use position: fixed. For them, their visibility has to be checked directly as well.
    return node.offsetParent === null || getComputedStyle(node).visibility === 'hidden'
}

function getAllTabbingElements(parentElem) {
    let tabbableNodes = parentElem.querySelectorAll(candidateSelectors.join(','))
    let onlyTabbable = []
    for (let i = 0; i < tabbableNodes.length; i++) {
        let node = tabbableNodes[i]
        if (
            !node.disabled &&
            getTabindex(node) > -1 &&
            !isHidden(node)
        ) {
            onlyTabbable.push(node)
        }
    }
    return onlyTabbable
}

function focusTrap(event, parentElem) {
    // check if current event keyCode is tab
    if (!event || event.key !== 'Tab') return

    if (!parentElem || !parentElem.contains) {
        if (process && process.env.NODE_ENV === 'development') {
            console.warn('focus-trap-js: parent element is not defined')
        }
        return false
    }

    if (!parentElem.contains(event.target)) {
        return false
    }

    let allTabbingElements = getAllTabbingElements(parentElem)
    let firstFocusableElement = allTabbingElements[0]
    let lastFocusableElement = allTabbingElements[allTabbingElements.length - 1]

    if (event.shiftKey && event.target === firstFocusableElement) {
        lastFocusableElement.focus()
        event.preventDefault()
        return true
    } else if (!event.shiftKey && event.target === lastFocusableElement) {
        firstFocusableElement.focus()
        event.preventDefault()
        return true
    }
    return false
}

function getTabindex(node) {
    let tabindexAttr = parseInt(node.getAttribute('tabindex'), 10)

    if (!isNaN(tabindexAttr)) return tabindexAttr
    // Browsers do not return tabIndex correctly for contentEditable nodes;
    // so if they don't have a tabindex attribute specifically set, assume it's 0.

    if (isContentEditable(node)) return 0
    return node.tabIndex
}

function isContentEditable(node) {
    return node.getAttribute('contentEditable')
}