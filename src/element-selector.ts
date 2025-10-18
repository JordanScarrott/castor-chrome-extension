export class ElementSelector {
    private static readonly HIGHLIGHT_CLASS = "castor-highlight-element";
    private static readonly LIST_ITEM_HIGHLIGHT_CLASS = "castor-highlight-list-item";
    private lastHoveredElement: HTMLElement | null = null;
    private currentTarget: HTMLElement | null = null;
    private isModifierKeyDown = false;

    constructor() {
        this.injectCss();
    }

    public start(): void {
        document.addEventListener("mouseover", this.handleMouseOver);
        document.addEventListener("click", this.handleClick, {
            capture: true,
            once: true,
        });
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyUp);
    }

    public stop(): void {
        document.removeEventListener("mouseover", this.handleMouseOver);
        document.removeEventListener("click", this.handleClick, {
            capture: true,
        });
        document.removeEventListener("keydown", this.handleKeyDown);
        document.removeEventListener("keyup", this.handleKeyUp);
        if (this.lastHoveredElement) {
            this.lastHoveredElement.classList.remove(
                ElementSelector.HIGHLIGHT_CLASS,
                ElementSelector.LIST_ITEM_HIGHLIGHT_CLASS
            );
        }
    }

    private injectCss(): void {
        const style = document.createElement("style");
        style.textContent = `
            .${ElementSelector.HIGHLIGHT_CLASS} {
                outline: 2px solid blue !important;
                background-color: rgba(0, 0, 255, 0.25) !important;
            }
            .${ElementSelector.LIST_ITEM_HIGHLIGHT_CLASS} {
                outline: 2px dashed #FF6B6B !important;
                background-color: rgba(255, 107, 107, 0.2) !important;
                cursor: pointer !important;
            }
        `;
        document.head.appendChild(style);
    }

    private findListItem = (element: HTMLElement | null): HTMLElement | null => {
        if (!element) {
            return null;
        }

        const listTags = ["LI", "TR", "DD"];
        if (listTags.includes(element.tagName)) {
            return element;
        }

        const parent = element.parentElement;
        if (parent) {
            const children = Array.from(parent.children);
            const sameTagSiblings = children.filter(
                (child) => child.tagName === element.tagName
            );
            if (sameTagSiblings.length > 1) {
                return element;
            }
        }

        const siblings = [];
        let sibling = element.previousElementSibling;
        while (sibling) {
            if (
                sibling.tagName === element.tagName &&
                sibling.className === element.className
            ) {
                siblings.push(sibling);
            }
            sibling = sibling.previousElementSibling;
        }
        sibling = element.nextElementSibling;
        while (sibling) {
            if (
                sibling.tagName === element.tagName &&
                sibling.className === element.className
            ) {
                siblings.push(sibling);
            }
            sibling = sibling.nextElementSibling;
        }

        if (siblings.length >= 2) {
            return element;
        }

        return null;
    };

    private updateHighlight = (): void => {
        if (this.lastHoveredElement) {
            this.lastHoveredElement.classList.remove(
                ElementSelector.HIGHLIGHT_CLASS,
                ElementSelector.LIST_ITEM_HIGHLIGHT_CLASS
            );
        }

        if (!this.currentTarget) {
            return;
        }

        let elementToHighlight: HTMLElement | null = this.currentTarget;
        let highlightClass = ElementSelector.HIGHLIGHT_CLASS;

        if (this.isModifierKeyDown) {
            const listItem = this.findListItem(this.currentTarget);
            if (listItem) {
                elementToHighlight = listItem;
                highlightClass = ElementSelector.LIST_ITEM_HIGHLIGHT_CLASS;
            }
        }

        if (elementToHighlight) {
            elementToHighlight.classList.add(highlightClass);
            this.lastHoveredElement = elementToHighlight;
        }
    };

    private handleMouseOver = (event: MouseEvent): void => {
        this.currentTarget = event.target as HTMLElement;
        this.updateHighlight();
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (event.ctrlKey || event.metaKey) {
            this.isModifierKeyDown = true;
            this.updateHighlight();
        }
    };

    private handleKeyUp = (event: KeyboardEvent): void => {
        if (!event.ctrlKey && !event.metaKey) {
            this.isModifierKeyDown = false;
            this.updateHighlight();
        }
    };

    private handleClick = (event: MouseEvent): void => {
        event.preventDefault();
        event.stopPropagation();

        if (this.lastHoveredElement) {
            const html = this.lastHoveredElement.innerText;
            chrome.runtime.sendMessage({
                type: "ELEMENT_TEXT_SELECTED",
                payload: html,
            });
        }

        this.stop();
    };
}
