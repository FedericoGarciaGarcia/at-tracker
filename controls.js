class Controls {
    constructor(container, { onAddEntry, onExport, onImport } = {}) {
        this.container = container;
        this.onAddEntry = onAddEntry;
        this.onExport = onExport;
        this.onImport = onImport;
        this.selectedType = "A";
        this.settingsOpen = false;
        this.render();
    }

    toggleSettings(force) {
        this.settingsOpen =
            typeof force === "boolean" ? force : !this.settingsOpen;
        this.settingsMenu.hidden = !this.settingsOpen;
        this.settingsButton.setAttribute(
            "aria-expanded",
            String(this.settingsOpen)
        );
    }

    formatLocalDateTime(date) {
        const pad = (n) => String(n).padStart(2, "0");
        return [
            date.getFullYear(),
            "-",
            pad(date.getMonth() + 1),
            "-",
            pad(date.getDate()),
            "T",
            pad(date.getHours()),
            ":",
            pad(date.getMinutes()),
        ].join("");
    }

    openModal() {
        this.selectedType = "A";
        this.datetimeInput.value = this.formatLocalDateTime(new Date());
        this.updateTypeButtons();
        this.modal.hidden = false;
        this.datetimeInput.focus();
    }

    closeModal() {
        this.modal.hidden = true;
    }

    updateTypeButtons() {
        for (const button of this.typeButtons) {
            const isSelected = button.dataset.type === this.selectedType;
            button.classList.toggle("modal__type-button--selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        }
    }

    submitEntry() {
        const value = this.datetimeInput.value;
        if (!value) {
            this.datetimeInput.focus();
            return;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            this.datetimeInput.focus();
            return;
        }

        this.onAddEntry?.({
            Date: date.toISOString(),
            Type: this.selectedType,
        });

        this.closeModal();
    }

    render() {
        this.container.innerHTML = "";

        const toolbar = document.createElement("div");
        toolbar.className = "controls";

        const addButton = document.createElement("button");
        addButton.className = "controls__button";
        addButton.type = "button";
        addButton.textContent = "Add entry";
        addButton.setAttribute("aria-label", "Add entry");
        addButton.addEventListener("click", () => this.openModal());

        const settings = document.createElement("div");
        settings.className = "controls__settings";

        const settingsButton = document.createElement("button");
        settingsButton.className = "controls__button controls__button--icon";
        settingsButton.type = "button";
        settingsButton.setAttribute("aria-label", "Settings");
        settingsButton.setAttribute("aria-haspopup", "menu");
        settingsButton.setAttribute("aria-expanded", "false");
        settingsButton.innerHTML = `
            <svg class="controls__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58
                       a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96
                       a7.07 7.07 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42
                       l-.36 2.54c-.6.24-1.15.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.48
                       a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94
                       L2.82 14.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96
                       c.48.39 1.03.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.8a.5.5 0 0 0 .5-.42
                       l.36-2.54c.6-.24 1.15-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32
                       a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5
                       a3.5 3.5 0 0 1 0 7z"
                />
            </svg>
        `;
        settingsButton.addEventListener("click", (event) => {
            event.stopPropagation();
            this.toggleSettings();
        });

        const settingsMenu = document.createElement("div");
        settingsMenu.className = "controls__menu";
        settingsMenu.hidden = true;
        settingsMenu.setAttribute("role", "menu");

        const exportButton = document.createElement("button");
        exportButton.className = "controls__menu-item";
        exportButton.type = "button";
        exportButton.setAttribute("role", "menuitem");
        exportButton.textContent = "Export JSON";
        exportButton.addEventListener("click", () => {
            this.toggleSettings(false);
            this.onExport?.();
        });

        const importButton = document.createElement("button");
        importButton.className = "controls__menu-item";
        importButton.type = "button";
        importButton.setAttribute("role", "menuitem");
        importButton.textContent = "Import JSON";
        importButton.addEventListener("click", () => {
            this.toggleSettings(false);
            this.onImport?.();
        });

        settingsMenu.appendChild(exportButton);
        settingsMenu.appendChild(importButton);
        settings.appendChild(settingsButton);
        settings.appendChild(settingsMenu);

        this.settingsButton = settingsButton;
        this.settingsMenu = settingsMenu;

        document.addEventListener("click", (event) => {
            if (!this.settingsOpen) {
                return;
            }
            if (!settings.contains(event.target)) {
                this.toggleSettings(false);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.settingsOpen) {
                this.toggleSettings(false);
            }
        });

        toolbar.appendChild(addButton);
        toolbar.appendChild(settings);
        this.container.appendChild(toolbar);
        this.container.appendChild(this.createModal());
    }

    createModal() {
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.hidden = true;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "add-entry-title");

        const backdrop = document.createElement("div");
        backdrop.className = "modal__backdrop";
        backdrop.addEventListener("click", () => this.closeModal());

        const dialog = document.createElement("div");
        dialog.className = "modal__dialog";

        const title = document.createElement("h2");
        title.className = "modal__title";
        title.id = "add-entry-title";
        title.textContent = "Add entry";

        const form = document.createElement("form");
        form.className = "modal__form";
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.submitEntry();
        });

        const datetimeField = document.createElement("label");
        datetimeField.className = "modal__field";
        datetimeField.textContent = "Date & time";

        const datetimeInput = document.createElement("input");
        datetimeInput.className = "modal__input";
        datetimeInput.type = "datetime-local";
        datetimeInput.required = true;
        datetimeField.appendChild(datetimeInput);

        const typeField = document.createElement("div");
        typeField.className = "modal__field";

        const typeLabel = document.createElement("span");
        typeLabel.className = "modal__label";
        typeLabel.id = "entry-type-label";
        typeLabel.textContent = "Type";

        const typeGroup = document.createElement("div");
        typeGroup.className = "modal__type-group";
        typeGroup.setAttribute("role", "group");
        typeGroup.setAttribute("aria-labelledby", "entry-type-label");

        this.typeButtons = ["A", "T"].map((type) => {
            const button = document.createElement("button");
            button.className = "modal__type-button";
            button.type = "button";
            button.dataset.type = type;
            button.textContent = type;
            button.addEventListener("click", () => {
                this.selectedType = type;
                this.updateTypeButtons();
            });
            typeGroup.appendChild(button);
            return button;
        });

        typeField.appendChild(typeLabel);
        typeField.appendChild(typeGroup);

        const actions = document.createElement("div");
        actions.className = "modal__actions";

        const cancelButton = document.createElement("button");
        cancelButton.className = "controls__button";
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", () => this.closeModal());

        const submitButton = document.createElement("button");
        submitButton.className = "controls__button controls__button--primary";
        submitButton.type = "submit";
        submitButton.textContent = "Add";

        actions.appendChild(cancelButton);
        actions.appendChild(submitButton);

        form.appendChild(datetimeField);
        form.appendChild(typeField);
        form.appendChild(actions);

        dialog.appendChild(title);
        dialog.appendChild(form);
        modal.appendChild(backdrop);
        modal.appendChild(dialog);

        this.modal = modal;
        this.datetimeInput = datetimeInput;
        this.updateTypeButtons();

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !modal.hidden) {
                this.closeModal();
            }
        });

        return modal;
    }
}
