(function () {
    const instances = {};

    function normalizeText(value) {
        return (value || '').toLowerCase().trim();
    }

    function collectOptions(select) {
        const groups = [];
        const directOptions = [];

        Array.from(select.children).forEach((child) => {
            if (child.tagName === 'OPTGROUP') {
                const options = Array.from(child.children).map((option) => ({
                    value: option.value,
                    text: option.textContent,
                    disabled: option.disabled
                }));
                groups.push({ label: child.label, options: options });
            } else if (child.tagName === 'OPTION') {
                directOptions.push({
                    value: child.value,
                    text: child.textContent,
                    disabled: child.disabled
                });
            }
        });

        if (directOptions.length > 0) {
            groups.unshift({ label: '', options: directOptions });
        }

        return groups;
    }

    function getSelectedText(select) {
        const selected = select.options[select.selectedIndex];
        return selected ? selected.textContent : '';
    }

    function setupSearchableSelect(config) {
        const select = document.getElementById(config.id);
        if (!select || select.dataset.searchableReady === '1') {
            return;
        }

        const wrapper = select.parentElement;
        if (!wrapper) {
            return;
        }

        const combo = document.createElement('div');
        combo.className = 'integrated-select';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'integrated-select-input';
        input.id = `${config.id}-autocomplete`;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = config.placeholder || 'Select or type to filter...';
        input.setAttribute('aria-label', config.ariaLabel || `${config.id} selector`);
        input.setAttribute('aria-controls', config.id);
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'false');

        const linkedLabel = document.querySelector(`label[for="${config.id}"]`);
        if (linkedLabel) {
            linkedLabel.setAttribute('for', input.id);
        }

        const menu = document.createElement('div');
        menu.className = 'integrated-select-menu';
        menu.setAttribute('role', 'listbox');

        combo.appendChild(input);
        combo.appendChild(menu);
        wrapper.insertBefore(combo, select);
        select.classList.add('searchable-native-select');

        let filteredOptions = [];
        let highlightedIndex = -1;
        let isOpen = false;
        let suppressInputHandler = false;
        let blurTimer = null;

        function syncFromSelect() {
            const selectedText = getSelectedText(select);
            suppressInputHandler = true;
            input.value = selectedText;
            suppressInputHandler = false;
        }

        function closeMenu() {
            isOpen = false;
            menu.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
            highlightedIndex = -1;
        }

        function openMenu() {
            isOpen = true;
            menu.classList.add('active');
            input.setAttribute('aria-expanded', 'true');
        }

        function renderOptions(query) {
            const normalizedQuery = normalizeText(query);
            const groups = collectOptions(select);

            filteredOptions = [];
            menu.innerHTML = '';

            groups.forEach((group) => {
                const groupMatches = normalizedQuery === '' || normalizeText(group.label).includes(normalizedQuery);
                const matches = group.options.filter((option) => {
                    const optionMatches = normalizeText(option.text).includes(normalizedQuery);
                    return normalizedQuery === '' || groupMatches || optionMatches;
                });

                if (matches.length === 0) {
                    return;
                }

                if (group.label) {
                    const groupLabel = document.createElement('div');
                    groupLabel.className = 'integrated-select-group';
                    groupLabel.textContent = group.label;
                    menu.appendChild(groupLabel);
                }

                matches.forEach((option) => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'integrated-select-option';
                    optionElement.textContent = option.text;
                    optionElement.dataset.value = option.value;
                    optionElement.dataset.disabled = option.disabled ? '1' : '0';
                    optionElement.setAttribute('role', 'option');

                    if (option.disabled) {
                        optionElement.classList.add('disabled');
                    } else {
                        optionElement.addEventListener('mousedown', (event) => {
                            event.preventDefault();
                        });
                        optionElement.addEventListener('click', () => {
                            select.value = option.value;
                            syncFromSelect();
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            closeMenu();
                        });
                    }

                    filteredOptions.push(optionElement);
                    menu.appendChild(optionElement);
                });
            });

            if (filteredOptions.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'integrated-select-empty';
                empty.textContent = 'No matches';
                menu.appendChild(empty);
                highlightedIndex = -1;
                return;
            }

            highlightedIndex = filteredOptions.findIndex((item) => item.dataset.value === select.value && item.dataset.disabled !== '1');
            if (highlightedIndex < 0) {
                highlightedIndex = 0;
            }
            highlightCurrent();
        }

        function highlightCurrent() {
            filteredOptions.forEach((item, index) => {
                item.classList.toggle('active', index === highlightedIndex);
            });

            if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                filteredOptions[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }

        function pickHighlighted() {
            if (highlightedIndex < 0 || !filteredOptions[highlightedIndex]) {
                return false;
            }
            const item = filteredOptions[highlightedIndex];
            if (item.dataset.disabled === '1') {
                return false;
            }
            item.click();
            return true;
        }

        input.addEventListener('focus', () => {
            if (blurTimer) {
                clearTimeout(blurTimer);
            }
            input.select();
            renderOptions('');
            openMenu();
        });

        input.addEventListener('click', () => {
            renderOptions('');
            openMenu();
        });

        input.addEventListener('input', () => {
            if (suppressInputHandler) {
                return;
            }
            renderOptions(input.value);
            openMenu();
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!isOpen) {
                    renderOptions('');
                    openMenu();
                    return;
                }
                if (filteredOptions.length > 0) {
                    highlightedIndex = Math.min(filteredOptions.length - 1, highlightedIndex + 1);
                    highlightCurrent();
                }
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!isOpen) {
                    renderOptions('');
                    openMenu();
                    return;
                }
                if (filteredOptions.length > 0) {
                    highlightedIndex = Math.max(0, highlightedIndex - 1);
                    highlightCurrent();
                }
                return;
            }

            if (event.key === 'Enter') {
                if (isOpen) {
                    event.preventDefault();
                    if (pickHighlighted()) {
                        return;
                    }
                }
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                syncFromSelect();
                closeMenu();
            }
        });

        input.addEventListener('blur', () => {
            blurTimer = setTimeout(() => {
                syncFromSelect();
                closeMenu();
            }, 120);
        });

        document.addEventListener('click', (event) => {
            if (!combo.contains(event.target)) {
                syncFromSelect();
                closeMenu();
            }
        });

        select.addEventListener('change', () => {
            syncFromSelect();
        });

        syncFromSelect();
        instances[config.id] = {
            refresh: syncFromSelect
        };
        select.dataset.searchableReady = '1';
    }

    function setupSearchableSelects(configs) {
        configs.forEach((config) => setupSearchableSelect(config));
    }

    function refreshSearchableSelect(id) {
        if (instances[id]) {
            instances[id].refresh();
        }
    }

    window.setupSearchableSelect = setupSearchableSelect;
    window.setupSearchableSelects = setupSearchableSelects;
    window.refreshSearchableSelect = refreshSearchableSelect;
})();
