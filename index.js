function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object'
          ? child
          : createTextElement(child)
      )
    }
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function createDom(fiber) {
  const newElement = fiber.type == 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type)

  Object.keys(fiber.props)
    .filter(key => key !== 'children')
    .forEach(name => {
      newElement[name] = fiber.props[name]
    })

  return newElement
}

const commitRoot = () => {
  commitWork(wipRoot.child)
  wipRoot = null
}

const commitWork = fiber => {
  if (!fiber) return
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const render = (element, container) => {
  wipRoot = nextUnitOfWork = {
    dom: container,
    props: {
      children: [element]
    }
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null

const workLoop = deadline => {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) commitRoot()

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

const performUnitOfWork = fiber => {
  if (!fiber.dom) fiber.dom = createDom(fiber)
  if (fiber.parent) fiber.parent.dom.appendChild(fiber.dom)

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }

    if (index === 0) fiber.child = newFiber
    else prevSibling.sibling = newFiber

    prevSibling = newFiber
    index++
  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

const Didact = {
  createElement,
  render
}

/** @jsx Didact.createElement */
const element = (
  <div id='foo'>
    <div id='bar'>
      <a>baa</a>
    </div>
    <a>bar</a>
    <b />
  </div>
)

const container = document.getElementById('root')
Didact.render(element, container)
