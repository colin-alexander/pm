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
function Overlay() {
    this.el = this.create();
    return this;
}
Overlay.prototype.ovelayElement = function() {
        return this.el;
    }
Overlay.prototype.create = function() {
    this.el = document.createElement('div');
    this.el.classList.add('modal-overlay', 'clearfix', 'hide');
    document.body.append(this.el);
    return this.el;
}
Overlay.prototype.open = function() {
    this.removeFromClasslist('hide');
    this.addToClasslist('opening');
    this.addToClasslist('overflow-y-scroll');
}
Overlay.prototype.close = function() {
    this.addToClasslist('closing');
    this.removeFromClasslist('active');
}
Overlay.prototype.openEvent = function() {
    this.removeFromClasslist('opening');
    this.addToClasslist('active');
}
Overlay.prototype.closeEvent = function() {
    this.removeFromClasslist('closing');
    this.addToClasslist('hide');
}
Overlay.prototype.addEvent = function(type, listener, options) {
    this.el.addEventListener(type, listener, options);
}
Overlay.prototype.addToClasslist = function(s) {
    this.el.classList.add(s);
    return this.el.classList.value;
}
Overlay.prototype.removeFromClasslist = function(s) {
    this.el.classList.remove(s);
    return this.el.classList.value;
}
Overlay.prototype.append = function(element) {
    this.el.append(element);
}

const openedEvent = new CustomEvent('opened');
const closedEvent = new CustomEvent('closed'); 
//window.addEventListener('load', function (e) {
    const overlay = new Overlay();
//});

function Preview(callback, options) {
    let _this = this;
    this.callback = callback || function () {
        return;
    };
    this.options = {
        heading: '',
        subheading: '',
        headingLevel: "h2",
        id: "preview",
        placement: 'left',
        image: "https://placehold.co/1920x490",
        innerHtml: ''
    };
    //this.options = options;
    if (options !== undefined) {
        this.updateOptions(options);
    }
    let url = new URL(window.location.toString());
    this.urlParams = new URLSearchParams(url.search);
    this.urlHash = location.hash.length >= 1 ? location.hash : '';
    //this.options.innerHtml = options.innerHtml || '';
    this.overlay = overlay;
    this.modal = this.createElements();
    this.setPlacement();
    this.makeModal();
    overlay.addEvent('click', _this.close.bind(this), false);
    let closeBtns = document.querySelectorAll('.modal-close');
    closeBtns.forEach(function (item, index, array) {
        _this = _this;
        item.addEventListener('click', _this.close.bind(_this), false);
    })
    document.addEventListener("keydown", function (event) {
        focusTrap(event, _this.modal.element);
    });
    this.modal.element.addEventListener('click', function (event) {
        event.stopPropagation();
    });
    this.firstFocusEl = this.options.focusOnOpenElement || this.modal.element;
}
Preview.prototype.updateOptions = function (newOpts) {
    let _this = this;
    let props = Object.getOwnPropertyNames(newOpts);
    for (let i = 0; i < props.length; i++) {
        let prop = props[i];
         _this.options[prop] = newOpts[prop];
    }
}
Preview.prototype.updateContent = function (options) {
    let _this = this;
    _this.updateOptions(options);
    //let props = Object.getOwnPropertyNames(options);
    //for (let i = 0; i < props.length; i++) {
    //    let prop = props[i];
    //    //if (_this.options.hasOwnProperty(prop)) {
    //        _this.options[prop] = options[prop];
    //    //}
    //}
    //this.options = {
    //    id: options.id,
    //    heading: options.heading,
    //    subheading: options.subheading,
    //    headingLevel: options.headingLevel,
    //    innerHtml: options.innerHtml,
    //    placement: options.placement,
    //    sourceElement: options.sourceElement,
    //    focusOnOpenElement: options.focusOnOpenElement,
    //    image: options.image
    //};
    this.setContent();
}
Preview.prototype.setContent = function() {
    let _header = this.modal.header;
    let _img = this.modal.image;
    _header.heading.textContent = this.options.heading;
    if (this.options.subheading !== undefined) {
        if (_header.subheading === undefined) {
            _header.subheading = document.createElement('span');
            _header.heading.className = 'modal-heading';
            _header.container.append(_header.heading);
        }
        _header.subheading.textContent = ' ' + this.options.subheading;
    }
    else {
        let subheadingEl = _header.container.querySelector('.modal-subheading');
        if (subheadingEl !== null) subheadingEl.remove();
        _header.subheading = undefined;
    }
    if (this.options.sourceElement !== undefined) {
        this.modal.body.append(this.options.sourceElement);
    } else {
        let newBody = document.createRange().createContextualFragment(this.options.innerHtml);
        this.modal.body.append(newBody);
    }
    if (this.options.hasOwnProperty('image')) {
        _img.src = this.options.image;
    }
    this.modal.footer.action.href = this.options.url;
    this.modal.footer.action.textContent = 'View ' + this.options.heading + ' >';
}
Preview.prototype.changePlacement = function(placement) {
    let _this = this;
    _this.options.placement = placement;
    this.setPlacement();
}
Preview.prototype.setPlacement = function() {
    //let placementName = '';
    //switch (this.options.placement) {
    //    case Placement.bottom:
    //        placementName = 'bottom';
    //        break;
    //    case Placement.top:
    //        placementName = 'top';
    //        break;
    //    case Placement.left:
    //        placementName = 'left';
    //        break;
    //    case Placement.right:
    //        placementName = 'right';
    //        break;
    //    case Placement.modal:
    //        placementName = 'modal';
    //        break;
    //    case Placement.full:
    //        placementName = 'full';
    //        break;
    //    default :
    //        placementName = 'left';
    //        break;
    //}
    this.modal.element.setAttribute('data-placement', this.options.placement);
}
Preview.prototype.makeModal = function() {
    let _this = this;
    //_this.modal.closeBtn.addEventListener('click', _this.close.bind(this), false);
    _this.setContent();
    overlay.append(_this.modal.element);
    _this.modal.element.classList.add('ready');
    _this.callback(_this.modal.element);
}
Preview.prototype.createElements = function() {
    let modalOuter = document.createElement('div');
    modalOuter.id = this.options.id;
    modalOuter.className = 'modal';
    modalOuter.setAttribute('role', 'dialog');
    modalOuter.setAttribute('aria-modal', 'true');
    modalOuter.setAttribute('aria-labelledby', this.options.id + '-header');
    modalOuter.setAttribute('tabindex', '0');

    let header = document.createElement('div');
    header.className = 'modal-header';
    header.id = this.options.id + '-header';

    let container = document.createElement(this.options.headingLevel);
    container.className = 'modal-heading';

    let heading = document.createElement('span');
    heading.className = 'modal-title';

    let subheading = document.createElement('small');
    if (this.options.subheading !== null) {
        subheading.className = 'modal-subtitle';
        container.append(subheading);
    }
    //console.log(header);
    //console.log(heading);
    //console.log(subheading);
    container.prepend(heading);
    header.prepend(container);

    let footer = document.createElement('div');
    footer.className = 'modal-footer';

    let cancelBtn = document.createElement('button');
    cancelBtn.setAttribute('type', 'buton');
    cancelBtn.setAttribute('aria-label', 'Close preview');
    cancelBtn.classList.add('btn', 'btn-secondary', 'modal-close');
    cancelBtn.textContent = 'Close';

    let actionBtn = document.createElement('a');
    actionBtn.classList.add('btn', 'btn-primary');

    let space = document.createTextNode(' ');

    footer.append(actionBtn);
    footer.append(space);
    footer.append(cancelBtn);

    let img = document.createElement('img');
    img.className = 'modal-img invisible';

    let modalBody = document.createElement('div');
    modalBody.className = 'modal-body';

    let closeBtn = document.createElement('button');
    closeBtn.setAttribute('type', 'buton');
    closeBtn.setAttribute('aria-label', 'Close preview');
    closeBtn.classList.add('close-button', 'modal-close');
    closeBtn.innerHTML = '&times;';
    let x = closeBtn.appendChild(document.createElement('span'));
    x.className = 'visually-hidden';
    x.textContent = 'Close preview';

    modalOuter.append(header);
    modalOuter.append(img);
    modalOuter.append(modalBody);
    modalOuter.append(footer);
    modalOuter.append(closeBtn);
    return {
        element: modalOuter,
        header: {
            element: container,
            container: header,
            heading: heading,
            subheading: subheading
        },
        footer: {
            container: footer,
            cancel: cancelBtn,
            action: actionBtn
        },
        image: img,
        body: modalBody,
        closeBtn: closeBtn
    };
}
Preview.prototype.getInstance = function() {
    return this;
}
Preview.prototype.modalElement = function() {
    return this.modal.element;
}
Preview.prototype.open = function(caller) {
    this.originEl = caller;
    let _this = this;
    overlay.open();
    _this.modal.image.onload = function () {
        _this.modal.image.classList.remove('invisible');
    }
    document.body.classList.add('overflow-y-hidden');
    document.body.classList.remove('overflow-y-scroll');

    _this.urlParams.set('preview', 'open');
    _this.stateObj = {
        modal: 'open'
    };

    _this.timeoutID = window.setTimeout(_this.openEvents.bind(this), 20);

    document.addEventListener('keyup', _this.handleKeyup.bind(this), false);
}
Preview.prototype.close = function(event) {
    if (event !== undefined) {
        event.stopPropagation();
    }
    //console.log('this');
    //console.log(this);
        let _this = this;
    //console.log('_this');
    //console.log(_this);

    let popstateHandler = _this.handlePopstate;

    window.removeEventListener('popstate', popstateHandler);
    overlay.close();
    document.body.classList.add('overflow-y-scroll');
    document.body.classList.remove('overflow-y-hidden');
    _this.timeoutID = window.setTimeout(_this.closeEvents.bind(this), 600);
    _this.urlParams.delete('preview');
    if (_this.urlParams.toString().length > 0) {
        window.history.replaceState(_this.stateObj, '', `${location.pathname}?${_this.urlParams}${_this.urlHash}`);
    } else {
        window.history.replaceState(_this.stateObj, '', `${location.pathname}${_this.urlHash}`);
    }
}
Preview.prototype.openEvents = function() {
    let _this = this;
    overlay.openEvent();
    window.clearTimeout(_this.timeoutID);

        

    window.setTimeout(function () {
        //_this.modal.element.focus();
        _this.firstFocusEl.focus();
        _this.modal.element.dispatchEvent(openedEvent);
    }, 500);

    window.history.pushState(_this.stateObj, '', `${location.pathname}?${_this.urlParams}${_this.urlHash}`);

    window.addEventListener('popstate', _this.handlePopstate.bind(this), false);
}
Preview.prototype.closeEvents = function() {
    let _this = this;
    overlay.closeEvent();
    window.clearTimeout(_this.timeoutID);
    _this.modal.element.dispatchEvent(closedEvent);
    document.removeEventListener('keyup', _this.handleKeyup);
    _this.modal.image.classList.add('invisible');
    
    while (this.modal.body.firstChild) {
        //The list is LIVE so it will re-index each call
        this.modal.body.removeChild(this.modal.body.firstChild);
    }
    _this.originEl.focus();
}
Preview.prototype.handlePopstate = function() {
    this.close();
}
Preview.prototype.handleKeyup = function(event) {
    if (event.key === "Esc" || event.key === "Escape") {
        this.close();
    }
}


