export class ElementSelector {
    private static readonly HIGHLIGHT_CLASS = "castor-highlight-element";
    private lastHoveredElement: HTMLElement | null = null;

    constructor() {
        this.injectCss();
    }

    public start(): void {
        document.addEventListener("mouseover", this.handleMouseOver);
        document.addEventListener("click", this.handleClick, {
            capture: true,
            once: true,
        });
    }

    public stop(): void {
        document.removeEventListener("mouseover", this.handleMouseOver);
        document.removeEventListener("click", this.handleClick, {
            capture: true,
        });
        if (this.lastHoveredElement) {
            this.lastHoveredElement.classList.remove(
                ElementSelector.HIGHLIGHT_CLASS
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
        `;
        document.head.appendChild(style);
    }

    private handleMouseOver = (event: MouseEvent): void => {
        if (this.lastHoveredElement) {
            this.lastHoveredElement.classList.remove(
                ElementSelector.HIGHLIGHT_CLASS
            );
        }

        const target = event.target as HTMLElement;
        if (target) {
            target.classList.add(ElementSelector.HIGHLIGHT_CLASS);
            this.lastHoveredElement = target;
        }
    };

    private handleClick = (event: MouseEvent): void => {
        event.preventDefault();
        event.stopPropagation();

        const target = event.target as HTMLElement;
        if (target) {
            const html = target.innerText;
            chrome.runtime.sendMessage({
                type: "ELEMENT_TEXT_SELECTED",
                payload: html,
            });
        }

        this.stop();
    };
}
