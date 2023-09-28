/**
 * Constants 
 */ 
const MARQUEE_COMPONENT = 'marquee-component';
const MARQUEE_MOVE = 'marquee-move';
const MARQUEE_SLIDE = 'marquee-slide';
const EVENT_NAME = 'marquee-mount'

const MODE = Object.freeze({
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
})

const DIRECTION = Object.freeze({
    LTR: 'ltr',
    RTL: 'rtl'
});

/**
 * Utility class
 * @class Utility 
 */ 
class Utility {
    /**
     * get element offset
     * @param {HTMLElement} element
     * @returns {{
     *  top: number,
     *  left: number,
     *  right: number,
     *  bottom: number
     * }} offset 
     */ 
    static getElementOffset( element ) {
        if( element instanceof HTMLElement ) {
            return {
                top: element.offsetTop,
                left: element.offsetLeft,
                right: innerWidth - element.offsetLeft - element.clientWidth,
                bottom: innerHeight - element.offsetTop - element.clientHeight
            }
        }
        console.error(`${element} is not a DOM element`);
    }
    /**
     * get elements size
     * @param {HTMLElements[]} elements 
     * @param {'horizontal' | 'vertical'} mode
     * @param {'ltr' | 'rtl'} dir
     * @returns {number} size
     */ 
    static getElementsSize( elements = [], mode = MODE.HORIZONTAL, dir = DIRECTION.LTR ) {
        let size = 0;

        elements.reduce( ( prev, curr ) => {
            if( !prev ) {
                switch( mode ) {
                    case MODE.HORIZONTAL:
                        size = curr.clientWidth;
                        break;
                    case MODE.VERTICAL:
                        size = curr.clientHeight;
                        break;
                }
                return curr
            };

            const prevOffset = Utility.getElementOffset( prev );
            const currOffset = Utility.getElementOffset( curr );

            switch( `${mode}-${dir}` ) {
                case `${MODE.HORIZONTAL}-${DIRECTION.LTR}`:
                    size = curr.clientWidth +  size + ( currOffset.left - prevOffset.left - prev.clientWidth );
                    break;
                case `${MODE.HORIZONTAL}-${DIRECTION.RTL}`:
                    size = curr.clientWidth +  size + ( currOffset.right - prevOffset.right - prev.clientWidth );
                    break;
                case `${MODE.VERTICAL}-${DIRECTION.LTR}`:
                    size = curr.clientHeight +  size + ( currOffset.top - prevOffset.top - prev.clientHeight );
                    break;
                case `${MODE.VERTICAL}-${DIRECTION.RTL}`:
                    size = curr.clientHeight +  size + ( currOffset.bottom - prevOffset.bottom - prev.clientHeight );
                    break;
            }

            return curr
        }, null )

        return size;
    }
    /**
     * get scope size
     * @param {HTMLElement} scope
     * @param {'horizontal' | 'vertical'} mode 
     * @returns {number} size
     */ 
    static getScopeSize( scope, mode = MODE.HORIZONTAL ) {
        if( mode === MODE.HORIZONTAL ) {
            return scope.offsetWidth;
        } else {
            return scope.offsetHeight;
        }
    }

    /**
     * get visible elements 
     * @param {HTMLElement[]} elements
     * @param {'horizontal' | 'vertical'} mode
     * @param {'ltr' | 'rtl'} dir
     * @returns {{
     * visibleElements: HTMLElement[],
     * inVisibleElements: HTMLElement[]
     * }}
     */ 
    static getVisibleElements( elements = [], mode = MODE.HORIZONTAL, dir = DIRECTION.LTR, point = 0 ) {
        const visibleElements = []
        const inVisibleElements = []

        const updateElements = ( isInvisible, element ) => {
            if( isInvisible ) {
                inVisibleElements.push( element );
            } else {
                visibleElements.push( element );
            }
        }

        elements.forEach( el => {
            const offset = Utility.getElementOffset( el );
            switch( `${mode}-${dir}` ) {
                case `${MODE.HORIZONTAL}-${DIRECTION.LTR}`:
                    updateElements( offset.left + el.clientWidth <= point, el)
                    break;
                case `${MODE.HORIZONTAL}-${DIRECTION.RTL}`:
                    updateElements( offset.right + el.clientWidth <= point, el)
                    break;
                case `${MODE.VERTICAL}-${DIRECTION.LTR}`:
                    updateElements( offset.top + el.clientHeight <= point, el)
                    break;
                case `${MODE.VERTICAL}-${DIRECTION.RTL}`:
                    updateElements( offset.bottom + el.clientHeight <= 0, el)
                    break;
            }
        } );

        return {
            visibleElements,
            inVisibleElements
        };
    }
}

/**
 * create wrapper web-component 
 */ 
customElements.get( MARQUEE_COMPONENT ) || 
customElements.define( MARQUEE_COMPONENT, class extends HTMLElement {
    /**
     * attributes 
     */ 
    speed = 5;
    mode = MODE.HORIZONTAL; // vertical | horizontal
    direction = DIRECTION.LTR; // ltr | rtl
    /**
     * variables 
     */ 
    wrapper = null;
    scopeSize = 0;
    wrapperSize = 0;
    moveTo = 0;
    point = 0;

    // on mount
    connectedCallback() {
        this.speed = this.getAttribute('speed') || 5;
        this.mode = this.getAttribute('mode') || MODE.HORIZONTAL;
        this.direction = this.getAttribute('dir') || DIRECTION.LTR;

        this.addEventListener(EVENT_NAME, () => {
            this.wrapper = this.querySelector( MARQUEE_MOVE );

            this.style.display = 'block';
            this.style.overflow = 'hidden';

            if( this.mode === 'horizontal' ) {
                this.style.width = `100%`;
                this.style.maxWidth = `${innerWidth}px`;
            } else {
                this.style.height =  this.style.height || `100vh`;
                this.style.maxHeight = `${innerHeight}px`;
            }

            this.scopeSize = Utility.getScopeSize( this, this.mode );
            this.wrapperSize = Utility.getElementsSize( Array.from( this.wrapper.children ), this.mode, this.direction );

            this.#populateElements();
            this.#init();
        })
    }

    #populateElements() {
        const wrapperInnerHTMLUnit = this.wrapper.innerHTML;
        while( this.wrapperSize < this.scopeSize + ( this.scopeSize / 3 ) ) {
            this.wrapper.innerHTML = this.wrapper.innerHTML + wrapperInnerHTMLUnit;
            this.wrapperSize = Utility.getElementsSize( Array.from( this.wrapper.children ), this.mode, this.direction );
        }
    }

    #init() {
        this.moveTo = this.wrapperSize - this.scopeSize;
    
        if( this.mode === MODE.VERTICAL && this.direction === DIRECTION.RTL ) {
            this.moveTo = this.scopeSize - this.wrapperSize;
            this.#moveWrapper( this.moveTo );
        }


        this.#animate();
    }

    #moveWrapper( point ) {
        switch( `${this.mode}-${this.direction}` ) {
            case `${MODE.HORIZONTAL}-${DIRECTION.LTR}`:
                this.wrapper.style.transform = `translateX(-${ Math.ceil(point) }px)`;
                break;
            case `${MODE.HORIZONTAL}-${DIRECTION.RTL}`:
                this.wrapper.style.transform = `translateX(${ Math.ceil(point) }px)`;
                break;
            case `${MODE.VERTICAL}-${DIRECTION.LTR}`:
                this.wrapper.style.transform = `translateY(-${ Math.ceil(point) }px)`;
                break;
            case `${MODE.VERTICAL}-${DIRECTION.RTL}`:
                this.wrapper.style.transform = `translateY(${ Math.ceil(point) }px)`;
                break;
        }
    }

    #shouldAppendElements() {
        if( this.mode === MODE.VERTICAL && this.direction === DIRECTION.RTL ) {
            return this.moveTo + this.point >= 0
        }

        return this.point >= this.moveTo
    }

    #animate() {
        this.point = this.point + Number(this.speed);
        
        if( this.mode === MODE.VERTICAL && this.direction === DIRECTION.RTL ) {
            this.#moveWrapper( this.moveTo +  this.point );
        } else {
            this.#moveWrapper( this.point );
        }
        
        if( this.#shouldAppendElements() ) {
            const { visibleElements, inVisibleElements } = 
            Utility.getVisibleElements( Array.from( this.wrapper.children ), this.mode, this.direction, this.point );

            const visibleSize = Utility.getElementsSize( visibleElements, this.mode, this.direction );

            // append inVisibleElements to the end of the wrapper
            inVisibleElements.forEach( el => {
                this.wrapper.appendChild( el );
            } )

            this.point = visibleSize - this.scopeSize;

            if( this.mode === MODE.VERTICAL && this.direction === DIRECTION.RTL ) {
                this.#moveWrapper( this.moveTo + this.point );
            } else {
                this.#moveWrapper( this.point );
            }

            requestAnimationFrame( () => this.#animate() );
        } else {
            requestAnimationFrame( () => this.#animate() );
        }
    }
} );

/**
 * create move web-component 
 */ 
customElements.get( MARQUEE_MOVE ) ||
customElements.define( MARQUEE_MOVE, class extends HTMLElement {
    /**
     * attributes 
     */
    mode = MODE.HORIZONTAL; // vertical | horizontal
    direction = DIRECTION.LTR; // ltr | rtl
    constructor() {
        super();
        // get parent component attribute
        const parentComponent = this.closest('marquee-component');
        if( parentComponent ) {
            this.mode = parentComponent.getAttribute('mode') || MODE.HORIZONTAL;
            this.direction = parentComponent.getAttribute('dir') || DIRECTION.LTR;

            this.style.display = 'flex';
            if( this.mode === MODE.HORIZONTAL ) {
                this.style.flexDirection = 'row';
            } else {
                this.style.flexDirection = 'column';
            }

            // reverse wrapper children if direction is rtl and mode is vertical
            if( this.mode === MODE.VERTICAL && this.direction === DIRECTION.RTL ) {
                this.style.flexDirection = 'column-reverse';
            }
        }
    }

    // on mount
    connectedCallback() {
        this.addEventListener( EVENT_NAME , () => {
            // dispatch mount event to parent component
            const parentComponent = this.closest( MARQUEE_COMPONENT );
            parentComponent.dispatchEvent( new Event( EVENT_NAME ) );
        }, { once: true })
    }
} );

/**
 * create slide web-component 
 */ 
customElements.get( MARQUEE_SLIDE ) ||
customElements.define( MARQUEE_SLIDE, class extends HTMLElement {
    connectedCallback() {
        const parentMove = this.closest( MARQUEE_MOVE );
        parentMove && parentMove.dispatchEvent( new Event( EVENT_NAME ) );
    }
} );