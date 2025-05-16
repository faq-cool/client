import { ElementHandle, Locator, LocatorScreenshotOptions } from "@playwright/test"
import { EvaluationArgument, PageFunctionOn } from 'playwright-core/types/structs'


type LocatorProxy = {
    [K in keyof Locator as Locator[K] extends (...args: any[]) => any ? K : never]:
    Locator[K] extends (...args: infer A) => any ? (...args: A) => {
        type: string,
        value?: string
    } : never
}


// LOCATOR PROXY
const proxy: Partial<LocatorProxy> = {
    // FILL
    fill: function (value: string, options?: { force?: boolean; noWaitAfter?: boolean; timeout?: number } | undefined) {
        return { type: 'fill', value }
    },

    click: function (options?: { force?: boolean; noWaitAfter?: boolean; timeout?: number } | undefined) {
        return { type: 'click' }
    },

    evaluate: function (pageFunction: PageFunctionOn<HTMLElement | SVGElement, void, unknown>, options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    evaluateHandle: function (pageFunction: PageFunctionOn<HTMLElement | SVGElement, void, unknown>): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    evaluateAll: function (pageFunction: PageFunctionOn<(HTMLElement | SVGElement)[], void, unknown>): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    elementHandle: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    all: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    allInnerTexts: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    allTextContents: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    and: function (locator: Locator): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    ariaSnapshot: function (options?: { ref?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    blur: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    boundingBox: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    check: function (options?: { force?: boolean; noWaitAfter?: boolean; position?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    clear: function (options?: { force?: boolean; noWaitAfter?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    contentFrame: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    count: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    dblclick: function (options?: { button?: 'left' | 'right' | 'middle'; delay?: number; force?: boolean; modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>; noWaitAfter?: boolean; position?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    dispatchEvent: function (type: string, eventInit?: EvaluationArgument | undefined, options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    dragTo: function (target: Locator, options?: { force?: boolean; noWaitAfter?: boolean; sourcePosition?: { x: number; y: number }; targetPosition?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    elementHandles: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    filter: function (options?: { has?: Locator; hasNot?: Locator; hasNotText?: string | RegExp; hasText?: string | RegExp; visible?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    first: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    focus: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    frameLocator: function (selector: string): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getAttribute: function (name: string, options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByAltText: function (text: string | RegExp, options?: { exact?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByLabel: function (text: string | RegExp, options?: { exact?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByPlaceholder: function (text: string | RegExp, options?: { exact?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByRole: function (role: 'img' | 'button' | 'alert' | 'alertdialog' | 'application' | 'article' | 'banner' | 'blockquote' | 'caption' | 'cell' | 'checkbox' | 'code' | 'columnheader' | 'combobox' | 'complementary' | 'contentinfo' | 'definition' | 'deletion' | 'dialog' | 'directory' | 'document' | 'emphasis' | 'feed' | 'figure' | 'form' | 'generic' | 'grid' | 'gridcell' | 'group' | 'heading' | 'insertion' | 'link' | 'list' | 'listbox' | 'listitem' | 'log' | 'main' | 'marquee' | 'math' | 'meter' | 'menu' | 'menubar' | 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'navigation' | 'none' | 'note' | 'option' | 'paragraph' | 'presentation' | 'progressbar' | 'radio' | 'radiogroup' | 'region' | 'row' | 'rowgroup' | 'rowheader' | 'scrollbar' | 'search' | 'searchbox' | 'separator' | 'slider' | 'spinbutton' | 'status' | 'strong' | 'subscript' | 'superscript' | 'switch' | 'tab' | 'table' | 'tablist' | 'tabpanel' | 'term' | 'textbox' | 'time' | 'timer' | 'toolbar' | 'tooltip' | 'tree' | 'treegrid' | 'treeitem', options?: { checked?: boolean; disabled?: boolean; exact?: boolean; expanded?: boolean; includeHidden?: boolean; level?: number; name?: string | RegExp; pressed?: boolean; selected?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByTestId: function (testId: string | RegExp): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByText: function (text: string | RegExp, options?: { exact?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    getByTitle: function (text: string | RegExp, options?: { exact?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    highlight: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    hover: function (options?: { force?: boolean; modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>; noWaitAfter?: boolean; position?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    innerHTML: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    innerText: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    inputValue: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    isChecked: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    isDisabled: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    isEditable: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    isEnabled: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    isHidden: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    isVisible: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    last: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    locator: function (selectorOrLocator: string | Locator, options?: { has?: Locator; hasNot?: Locator; hasNotText?: string | RegExp; hasText?: string | RegExp } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    nth: function (index: number): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    or: function (locator: Locator): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    page: function (): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    press: function (key: string, options?: { delay?: number; noWaitAfter?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    pressSequentially: function (text: string, options?: { delay?: number; noWaitAfter?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    screenshot: function (options?: LocatorScreenshotOptions | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },

    selectOption: function (values: string | ElementHandle<Node> | readonly string[] | { value?: string; label?: string; index?: number } | readonly ElementHandle<Node>[] | readonly { value?: string; label?: string; index?: number }[] | null, options?: { force?: boolean; noWaitAfter?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        return {
            type: 'fill',
            value: values as string
        }
    },

    selectText: function (options?: { force?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    setChecked: function (checked: boolean, options?: { force?: boolean; noWaitAfter?: boolean; position?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    tap: function (options?: { force?: boolean; modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>; noWaitAfter?: boolean; position?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    textContent: function (options?: { timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    type: function (text: string, options?: { delay?: number; noWaitAfter?: boolean; timeout?: number } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
    uncheck: function (options?: { force?: boolean; noWaitAfter?: boolean; position?: { x: number; y: number }; timeout?: number; trial?: boolean } | undefined): { type: string; value?: string } {
        throw new Error('Function not implemented.')
    },
}

export default proxy