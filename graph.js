class Graph {
    constructor(container) {
        this.container = container;
        this.data = (JSON.parse(localStorage.getItem('entries')) ?? []).map(
            (entry) => (entry.Type === "B" ? { ...entry, Type: "T" } : entry)
        );
        console.log(this.data);

        const now = new Date();
        this.viewYear = now.getUTCFullYear();
        this.viewMonth = now.getUTCMonth();

        this.dateTypes = this.createDateTypes();

        this.render();
    }

    addEntry(entry) {
        this.data.push(entry);
        this.persistAndRender();
    }

    deleteEntry(index) {
        this.data.splice(index, 1);
        this.persistAndRender();
    }

    persistAndRender() {
        this.dateTypes = this.createDateTypes();
        localStorage.setItem("entries", JSON.stringify(this.data));
        this.render();
    }

    getEntriesForDate(date) {
        const key = this.getDateKey(date);
        return this.data
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => this.getDateKey(new Date(entry.Date)) === key)
            .sort(
                (a, b) =>
                    new Date(a.entry.Date).getTime() -
                    new Date(b.entry.Date).getTime()
            );
    }

    formatEntryTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    formatEntryDateLabel(date) {
        return date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        });
    }

    openDayModal(date) {
        const entries = this.getEntriesForDate(date);
        if (entries.length === 0) {
            return;
        }

        this.closeDayModal();

        const modal = document.createElement("div");
        modal.className = "modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "day-entries-title");

        const backdrop = document.createElement("div");
        backdrop.className = "modal__backdrop";
        backdrop.addEventListener("click", () => this.closeDayModal());

        const dialog = document.createElement("div");
        dialog.className = "modal__dialog";

        const title = document.createElement("h2");
        title.className = "modal__title";
        title.id = "day-entries-title";
        title.textContent = this.formatEntryDateLabel(date);

        const list = document.createElement("ul");
        list.className = "modal__entry-list";

        for (const { entry, index } of entries) {
            const item = document.createElement("li");
            item.className = "modal__entry";

            const typeBadge = document.createElement("span");
            typeBadge.className = `modal__entry-type modal__entry-type--${entry.Type.toLowerCase()}`;
            typeBadge.textContent = entry.Type;

            const time = document.createElement("span");
            time.className = "modal__entry-time";
            time.textContent = this.formatEntryTime(entry.Date);

            const deleteButton = document.createElement("button");
            deleteButton.className = "controls__button modal__entry-delete";
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.setAttribute("aria-label", `Delete ${entry.Type} entry at ${time.textContent}`);
            deleteButton.addEventListener("click", () => {
                this.deleteEntry(index);
                const remaining = this.getEntriesForDate(date);
                if (remaining.length === 0) {
                    this.closeDayModal();
                } else {
                    this.openDayModal(date);
                }
            });

            item.appendChild(typeBadge);
            item.appendChild(time);
            item.appendChild(deleteButton);
            list.appendChild(item);
        }

        const actions = document.createElement("div");
        actions.className = "modal__actions";

        const closeButton = document.createElement("button");
        closeButton.className = "controls__button";
        closeButton.type = "button";
        closeButton.textContent = "Close";
        closeButton.addEventListener("click", () => this.closeDayModal());
        actions.appendChild(closeButton);

        dialog.appendChild(title);
        dialog.appendChild(list);
        dialog.appendChild(actions);
        modal.appendChild(backdrop);
        modal.appendChild(dialog);

        this.dayModal = modal;
        this.dayModalKeyHandler = (event) => {
            if (event.key === "Escape") {
                this.closeDayModal();
            }
        };
        document.addEventListener("keydown", this.dayModalKeyHandler);
        document.body.appendChild(modal);
    }

    closeDayModal() {
        if (this.dayModalKeyHandler) {
            document.removeEventListener("keydown", this.dayModalKeyHandler);
            this.dayModalKeyHandler = null;
        }
        if (this.dayModal) {
            this.dayModal.remove();
            this.dayModal = null;
        }
    }

    createDateTypes() {
        const dateTypes = new Map();

        for (const item of this.data) {
            const date = new Date(item.Date);
            const key = this.getDateKey(date);

            if (!dateTypes.has(key)) {
                dateTypes.set(key, new Set());
            }

            dateTypes.get(key).add(item.Type);
        }

        return dateTypes;
    }

    getDateKey(date) {
        return [
            date.getUTCFullYear(),
            String(date.getUTCMonth() + 1).padStart(2, "0"),
            String(date.getUTCDate()).padStart(2, "0")
        ].join("-");
    }

    getMonthLabel() {
        const date = new Date(Date.UTC(this.viewYear, this.viewMonth, 1));
        const monthName = date.toLocaleString("en-US", {
            month: "long",
            timeZone: "UTC"
        });

        const currentYear = new Date().getUTCFullYear();

        if (this.viewYear < currentYear) {
            return `${monthName} ${this.viewYear}`;
        }

        return monthName;
    }

    isCurrentMonth() {
        const now = new Date();
        return (
            this.viewYear === now.getUTCFullYear() &&
            this.viewMonth === now.getUTCMonth()
        );
    }

    shiftMonth(delta) {
        if (delta > 0 && this.isCurrentMonth()) {
            return;
        }

        const date = new Date(Date.UTC(this.viewYear, this.viewMonth + delta, 1));
        this.viewYear = date.getUTCFullYear();
        this.viewMonth = date.getUTCMonth();
        this.render();
    }

    render() {
        this.container.innerHTML = "";

        const days = this.createDays();
        const weekCount = days.length / 7;

        const wrapper = document.createElement("div");
        wrapper.className = "activity-graph";
        wrapper.style.setProperty("--week-count", weekCount);

        /*
         * Month header with navigation
         */
        const header = document.createElement("div");
        header.className = "activity-graph__header";

        const prevButton = document.createElement("button");
        prevButton.className = "activity-graph__nav";
        prevButton.type = "button";
        prevButton.textContent = "‹";
        prevButton.setAttribute("aria-label", "Previous month");
        prevButton.addEventListener("click", () => this.shiftMonth(-1));

        const monthLabel = document.createElement("div");
        monthLabel.className = "activity-graph__month-label";
        monthLabel.textContent = this.getMonthLabel();

        const nextButton = document.createElement("button");
        nextButton.className = "activity-graph__nav";
        nextButton.type = "button";
        nextButton.textContent = "›";
        nextButton.setAttribute("aria-label", "Next month");
        nextButton.disabled = this.isCurrentMonth();
        nextButton.addEventListener("click", () => this.shiftMonth(1));

        header.appendChild(prevButton);
        header.appendChild(monthLabel);
        header.appendChild(nextButton);
        wrapper.appendChild(header);

        /*
         * Day-of-week labels (M T W T F S S)
         */
        const dayLabels = document.createElement("div");
        dayLabels.className = "activity-graph__day-labels";

        const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

        for (const weekday of weekdays) {
            const label = document.createElement("div");
            label.className = "activity-graph__day-label";
            label.textContent = weekday;
            dayLabels.appendChild(label);
        }

        wrapper.appendChild(dayLabels);

        /*
         * Weeks grid
         */
        const grid = document.createElement("div");
        grid.className = "activity-graph__grid";

        for (let week = 0; week < weekCount; week++) {
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const day = days[week * 7 + dayOfWeek];
                const square = document.createElement("div");

                if (
                    day.getUTCFullYear() !== this.viewYear ||
                    day.getUTCMonth() !== this.viewMonth
                ) {
                    grid.appendChild(square);
                    continue;
                }

                square.className = "activity-graph__day";
                square.textContent = day.getUTCDate();

                const types = this.dateTypes.get(
                    this.getDateKey(day)
                );

                if (types?.has("A") && types?.has("T")) {
                    square.classList.add(
                        "activity-graph__day--both"
                    );
                } else if (types?.has("A")) {
                    square.classList.add(
                        "activity-graph__day--a"
                    );
                } else if (types?.has("T")) {
                    square.classList.add(
                        "activity-graph__day--t"
                    );
                }

                if (types?.size) {
                    square.classList.add("activity-graph__day--clickable");
                    square.setAttribute("role", "button");
                    square.tabIndex = 0;
                    square.setAttribute(
                        "aria-label",
                        `View entries for ${this.formatEntryDateLabel(day)}`
                    );
                    const open = () => this.openDayModal(day);
                    square.addEventListener("click", open);
                    square.addEventListener("keydown", (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            open();
                        }
                    });
                }

                grid.appendChild(square);
            }
        }

        wrapper.appendChild(grid);
        this.container.appendChild(wrapper);
    }

    createDays() {
        const firstDay = new Date(Date.UTC(
            this.viewYear,
            this.viewMonth,
            1
        ));

        const lastDay = new Date(Date.UTC(
            this.viewYear,
            this.viewMonth + 1,
            0
        ));

        // Start on Monday.
        const firstWeekday = (firstDay.getUTCDay() + 6) % 7;
        firstDay.setUTCDate(firstDay.getUTCDate() - firstWeekday);

        // End on Sunday.
        const lastWeekday = (lastDay.getUTCDay() + 6) % 7;
        lastDay.setUTCDate(
            lastDay.getUTCDate() + (6 - lastWeekday)
        );

        const days = [];

        for (
            let date = new Date(firstDay);
            date <= lastDay;
            date.setUTCDate(date.getUTCDate() + 1)
        ) {
            days.push(new Date(date));
        }

        return days;
    }
}
