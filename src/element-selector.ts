export class ElementSelector {
    private static readonly HIGHLIGHT_CLASS = "castor-highlight-element";
    private static readonly LIST_ITEM_HIGHLIGHT_CLASS = "castor-highlight-list-item";
    private lastHoveredElement: HTMLElement | null = null;
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

    private handleMouseOver = (event: MouseEvent): void => {
        if (this.lastHoveredElement) {
            this.lastHoveredElement.classList.remove(
                ElementSelector.HIGHLIGHT_CLASS,
                ElementSelector.LIST_ITEM_HIGHLIGHT_CLASS
            );
        }

        const target = event.target as HTMLElement;
        if (target) {
            if (this.isModifierKeyDown) {
                const listItem = this.findListItem(target);
                if (listItem) {
                    listItem.classList.add(
                        ElementSelector.LIST_ITEM_HIGHLIGHT_CLASS
                    );
                    this.lastHoveredElement = listItem;
                    return;
                }
            }
            target.classList.add(ElementSelector.HIGHLIGHT_CLASS);
            this.lastHoveredElement = target;
        }
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        this.isModifierKeyDown = event.ctrlKey || event.metaKey;
    };

    private handleKeyUp = (event: KeyboardEvent): void => {
        this.isModifierKeyDown = event.ctrlKey || event.metaKey;
    };

    private handleClick = (event: MouseEvent): void => {
        event.preventDefault();
        event.stopPropagation();

        const target = event.target as HTMLElement;
        if (target) {
            let elementToSend = target;
            if (this.isModifierKeyDown) {
                const listItem = this.findListItem(target);
                if (listItem) {
                    elementToSend = listItem;
                }
            }
            const html = elementToSend.innerText;
            chrome.runtime.sendMessage({
                type: "ELEMENT_TEXT_SELECTED",
                payload: html,
            });
        }

        this.stop();
    };
}
