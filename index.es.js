import { __ } from 'riot';
import positionController from '@riot-material/position-controller';
import { ripple } from '@riot-material/ripple';

const PAGE_INDEX = Symbol("page-index");

var index = {
  'css': `rm-tabbed-pages,[is="rm-tabbed-pages"]{ white-space: nowrap; overflow: hidden; width: 100%; display: block; font-size: 0; transform: scaleY(1); } rm-tabbed-pages > div:first-child,[is="rm-tabbed-pages"] > div:first-child{ overflow: hidden; display: block; width: 100%; } rm-tabbed-pages > div:first-child > div:first-child,[is="rm-tabbed-pages"] > div:first-child > div:first-child{ display: block; width: 100%; overflow: auto visible; position: relative; user-select: none; text-align: center; } rm-tabbed-pages > div:first-child > div:first-child > div:first-child,[is="rm-tabbed-pages"] > div:first-child > div:first-child > div:first-child{ display: inline-table; font-size: initial; text-align: center; } rm-tabbed-pages:not([centered]) > div:first-child > div:first-child > div:first-child,[is="rm-tabbed-pages"]:not([centered]) > div:first-child > div:first-child > div:first-child,rm-tabbed-pages[centered="false" i] > div:first-child > div:first-child > div:first-child,[is="rm-tabbed-pages"][centered="false" i] > div:first-child > div:first-child > div:first-child{ width: 100%; } rm-tabbed-pages > div:first-child > div:first-child > div:first-child > div,[is="rm-tabbed-pages"] > div:first-child > div:first-child > div:first-child > div{ display: table-cell; overflow: hidden; position: relative; width: 1px; height: 100%; } rm-tabbed-pages > div:first-child > div:first-child > div:first-child > div > button,[is="rm-tabbed-pages"] > div:first-child > div:first-child > div:first-child > div > button{ background-color: transparent; border: 0; padding: 12px 16px; font-size: 16px; line-height: 20px; height: 100%; width: 100%; cursor: pointer; outline: none; color: rgb(0, 0, 0); color: rgb(var(--color-on-background, 0, 0, 0)); } rm-tabbed-pages > div:first-child > div:first-child > div:nth-child(2),[is="rm-tabbed-pages"] > div:first-child > div:first-child > div:nth-child(2){ position: absolute; bottom: 0; left: 0; height: 2px; width: 1px; transition: transform ease-in-out 200ms; transform-origin: left; background: rgb(139, 0, 139); background: rgb(var(--color-primary, 139, 0, 139)); } rm-tabbed-pages > div:nth-child(2) > *,[is="rm-tabbed-pages"] > div:nth-child(2) > *{ display: inline-block; width: 100%; vertical-align: top; transition: transform ease-in-out 200ms; font-size: initial; white-space: initial; }`,

  'exports': {
    onMounted() {
        this._manipulate();
        let width = this.root.getBoundingClientRect().width;
        const frame = () => {
            if (!this.root.isConnected) {
                return;
            }
            const newWidth = this.root.getBoundingClientRect().width;
            if (newWidth !== width) {
                this._updateIndicator(true);
                width = newWidth;
            }
            window.requestAnimationFrame(frame);
        };
        window.requestAnimationFrame(frame);
        positionController(this.root.children[1])
        .setSelectedIndex(this.getSelectedIndex())
        .on("positionchanged", event => this.update({ instant: true }))
        .on("positionapplied", event => {
            if (event.detail.currentIndex === event.detail.previousIndex) {
                this.update({ skipUpdate: true });
            } else {
                this.setSelectedIndex(event.detail.currentIndex);
            }
        });
    },

    onBeforeUpdate() {
        if (this.state.selectedIndex != null) {
            this.state.selectedIndex = Math.round(this.state.selectedIndex);
        }
        if (isNaN(this.state.selectedIndex)) {
            delete this.state.selectedIndex;
        }
    },

    onUpdated() {
        this._manipulate(true);
    },

    _lastHiddenTabsPropValue: undefined,
    _hiddenTabs: [],

    getHiddenTabs() {
        if (this.props.hiddenTabs !== this._lastHiddenTabsPropValue) {
            let newHiddenTabs = [];
            switch (typeof this.props.hiddenTabs) {
                case "string": {
                    if (/^(\W*(\d+)\W*)+$/.test(this.props.hiddenTabs)) {
                        const regex = /(\d+)/g;
                        let match;
                        const hiddenTabs = [];
                        while (match = regex.exec(this.props.hiddenTabs)) {
                            if (match.length === 0) {
                                continue;
                            }
                            hiddenTabs.push(parseInt(match[0], 10));
                        }
                        newHiddenTabs = hiddenTabs.filter(a => a >= 0).sort((a, b) => a > b);
                    }
                    break;
                }
                case "number": {
                    newHiddenTabs = [ this.props.hiddenTabs ];
                    break;
                }
                case "object": {
                    if (Array.isArray(this.props.hiddenTabs)) {
                        newHiddenTabs = this.props.hiddenTabs.filter(item => {
                            return typeof item === "number" && item >= 0;
                        }).sort((a, b) => a > b);
                    }
                    break;
                }
            }
            this._hiddenTabs = newHiddenTabs;
        }
        return this._hiddenTabs;
    },

    _manipulate(update = false) {
        const tabContainer = this.root
            .firstElementChild // SCROLLBAR HIDER
            .firstElementChild // HEADER
            .firstElementChild // TAB CONTAINER
        ;
        const pageContainer = this.root.children[1];

        // restore hidden tabs and set correct view
        this.slots.forEach((slot, index) => {
            let tabButton = null;
            let page;
            if (index >= pageContainer.children.length) {
                page = pageContainer.appendChild(document.createElement("div"));
                page[PAGE_INDEX] = index;
                tabButton = tabContainer.appendChild(document.createElement("div"));
            } else if (index !== (page = pageContainer.children[index])[PAGE_INDEX]) {
                page = pageContainer.insertBefore(document.createElement("div"), pageContainer.children[index]);
                page[PAGE_INDEX] = index;
                tabButton = tabContainer.insertBefore(document.createElement("div"), tabContainer.children[index]);
            }
            // scroll to selected index
            page.style.transition = this.state.instant ? "none" : "";
            page.style.transform = "translateX(-" + ((this.getSelectedIndex() + this.getPosition()) * 100) + "%)";
            page.style.visibility = this.getSelectedIndex() === this._getUpdatedIndexOf(index) ? "visible" : "hidden";
            if (tabButton != null) {
                const button = tabButton.appendChild(document.createElement("button"));
                button.addEventListener("click", event => {
                    this.setSelectedIndex(this._getUpdatedIndexOf(index));
                });
                button.innerText = slot.id;
                ripple(button, { detectLabel: false, color: "currentColor", instantHighlight: true });
            }
        });

        // hide desired tabs
        const hiddenTabs = this.getHiddenTabs();
        for (let i = hiddenTabs.length - 1; i >= 0; i--) {
            const index = hiddenTabs[i];
            if (index >= this.slots.length) {
                continue;
            }
            // removing tab button at hidden index
            tabContainer.removeChild(tabContainer.children[index]);
            // unmount page at hidden index
            const page = pageContainer.children[index];
            const instance = page[__.globals.DOM_COMPONENT_INSTANCE_PROPERTY];
            if (instance != null) {
                instance.unmount(
                    Object.create(this[__.globals.PARENT_KEY_SYMBOL]),
                    this[__.globals.PARENT_KEY_SYMBOL]
                );
            }
            // if (page.nextElementSibling) {
            //     console.log("setting page index of", index);
            //     page.nextElementSibling[PAGE_INDEX] = index;
            // }
            // removing page at hidden index
            pageContainer.removeChild(page);
        }

        // update positionController length
        positionController(this.root.children[1]).setLength(this.getLength());

        // set indicator to correct position and size
        this._updateIndicator(!update || this.state.instant);

        // hide scrollbar, if visible
        const header = this.root
            .firstElementChild // SCROLLBAR HIDER
            .firstElementChild // HEADER
        ;
        const rect = header.getBoundingClientRect();
        header.style.marginBottom = header.clientHeight - rect.height + "px";

        if (!this.state.instant) {
            const selectedIndex = this.getSelectedIndex();
            const slot = this.getSlotAt(selectedIndex);
            const el = pageContainer.children[selectedIndex];
            let instance = el[__.globals.DOM_COMPONENT_INSTANCE_PROPERTY];
            if (instance == null) {
                instance = el[__.globals.DOM_COMPONENT_INSTANCE_PROPERTY] = __.DOMBindings.template(slot.html, slot.bindings);
                instance.mount(
                    el, Object.create(this[__.globals.PARENT_KEY_SYMBOL]),
                    this[__.globals.PARENT_KEY_SYMBOL]
                );
            } else if (update && !this.state.skipUpdate) {
                instance.update(
                    Object.create(this[__.globals.PARENT_KEY_SYMBOL]),
                    this[__.globals.PARENT_KEY_SYMBOL]
                );
            }
        }
        delete this.state.instant;
        delete this.state.skipUpdate;
    },

    _updateIndicator(instant = false) {
        const indicator = this.root
            .firstElementChild // SCROLLBAR HIDER
            .firstElementChild // HEADER
            .children[1]       // INDICATOR
        ;
        indicator.style.transition = instant ? "none" : "";
        indicator.style.transform = `translateX(${ this.getIndicatorLeft() }px) scaleX(${ this.getIndicatorWidth() })`;
    },

    _getUpdatedIndexOf(index) {
        return index - this.getHiddenTabs().filter(a => a < index).length;
    },

    _getRawIndexOf(index) {
        this.getHiddenTabs().some(hidden => {
            if (hidden > index) {
                return true;
            }
            index++;
            return false;
        });
        return index;
    },

    getSlotAt(index) {
        return this.slots[this._getRawIndexOf(index)];
    },

    getLength() {
        return this.slots.length - this.getHiddenTabs().filter(a => a < this.slots.length).length;
    },

    _lastSelectedIndexPropValue: undefined,

    getSelectedIndex() {
        if (this.props.selectedIndex !== this._lastSelectedIndexPropValue) {
            this._lastSelectedIndexPropValue = this.props.selectedIndex;
            const selectedIndex = parseInt(this.props.selectedIndex, 10);
            if (!isNaN(selectedIndex)) {
                this.state.selectedIndex = selectedIndex;
            }
        }
        const length = this.getLength();
        if (this.state.selectedIndex === undefined) {
            this.state.selectedIndex = length > 0 ? 0 : null;
        } else {
            this.state.selectedIndex = length > 0 ?
                Math.max(0, Math.min(this.state.selectedIndex, length - 1)) : null
            ;
        }
        return this.state.selectedIndex;
    },

    setSelectedIndex(index) {
        if (index === this.getSelectedIndex()) {
            return;
        }
        this.update({ selectedIndex: index });
        positionController(this.root.children[1]).setSelectedIndex(this.getSelectedIndex());
    },

    getIndicatorLeft() {
        const selectedIndex = this.getSelectedIndex();
        if (selectedIndex == null) {
            return 0;
        }
        const rect = this.root
            .firstElementChild // SCROLLBAR HIDER
            .firstElementChild // HEADER
            .firstElementChild // TAB CONTAINER
            .children[selectedIndex] // TAB BUTTON
            .getBoundingClientRect()
        ;
        const delta = this.root
            .firstElementChild // SCROLLBAR HIDER
            .firstElementChild // HEADER
            .scrollLeft -
            this.root.getBoundingClientRect().left
        ;
        let left = rect.left + delta;
        const position = this.getPosition();
        if (position !== 0) {
            const index = selectedIndex + (position > 0 ? 1 : -1);
            const rect = this.root
                .firstElementChild // SCROLLBAR HIDER
                .firstElementChild // HEADER
                .firstElementChild // TAB CONTAINER
                .children[index] // TAB BUTTON
                .getBoundingClientRect()
            ;
            left += ((rect.left + delta - left) * Math.abs(position));
        }
        return left;
    },

    getIndicatorWidth() {
        const selectedIndex = this.getSelectedIndex();
        if (selectedIndex == null) {
            return 0;
        }
        let width = this.root
            .firstElementChild // SCROLLBAR HIDER
            .firstElementChild // HEADER
            .firstElementChild // TAB CONTAINER
            .children[selectedIndex] // TAB BUTTON
            .getBoundingClientRect().width
        ;
        const position = this.getPosition();
        if (position !== 0) {
            const index = selectedIndex + (position > 0 ? 1 : -1);
            const rect = this.root
                .firstElementChild // SCROLLBAR HIDER
                .firstElementChild // HEADER
                .firstElementChild // TAB CONTAINER
                .children[index] // TAB BUTTON
                .getBoundingClientRect()
            ;
            width += ((rect.width - width) * Math.abs(position));
        }
        return width;
    },

    getPosition() {
        return positionController(this.root.children[1]).getPosition();
    }
  },

  'template': function(template, expressionTypes, bindingTypes, getComponent) {
    return template(
      '<div style="transform: scaleY(1);"><div><div></div><div></div></div></div><div></div>',
      []
    );
  },

  'name': 'rm-tabbed-pages'
};

export default index;