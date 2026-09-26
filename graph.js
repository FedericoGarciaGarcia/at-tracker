class Graph {
    constructor(container) {
        this.container = container;
        this.data = [];
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    getMonthKey(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
        ].join("-");
    }

    getMonthlySeries() {
        if (this.data.length === 0) {
            return { labels: [], a: [], t: [] };
        }

        let oldest = Infinity;
        for (const entry of this.data) {
            const time = new Date(entry.Date).getTime();
            if (time < oldest) {
                oldest = time;
            }
        }

        const start = new Date(oldest);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setDate(1);
        end.setHours(0, 0, 0, 0);

        const counts = new Map();
        for (
            let cursor = new Date(start);
            cursor <= end;
            cursor.setMonth(cursor.getMonth() + 1)
        ) {
            counts.set(this.getMonthKey(cursor), { a: 0, t: 0 });
        }

        for (const entry of this.data) {
            const date = new Date(entry.Date);
            const key = this.getMonthKey(date);
            const bucket = counts.get(key);
            if (!bucket) {
                continue;
            }
            if (entry.Type === "A") {
                bucket.a += 1;
            } else if (entry.Type === "T") {
                bucket.t += 1;
            }
        }

        const labels = [];
        const a = [];
        const t = [];

        for (const [key, value] of counts) {
            labels.push(key);
            a.push(value.a);
            t.push(value.t);
        }

        return { labels, a, t };
    }

    formatMonthLabel(key) {
        const [year, month] = key.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        const now = new Date();
        const label = date.toLocaleString("en-US", { month: "short" });

        if (year !== now.getFullYear()) {
            return `${label} '${String(year).slice(2)}`;
        }

        return label;
    }

    render() {
        this.container.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "monthly-graph";

        const title = document.createElement("div");
        title.className = "monthly-graph__title";
        title.textContent = "Weekly";

        const legend = document.createElement("div");
        legend.className = "monthly-graph__legend";
        legend.innerHTML = `
            <span class="monthly-graph__legend-item monthly-graph__legend-item--a">A</span>
            <span class="monthly-graph__legend-item monthly-graph__legend-item--t">T</span>
        `;

        const header = document.createElement("div");
        header.className = "monthly-graph__header";
        header.appendChild(title);
        header.appendChild(legend);
        wrapper.appendChild(header);

        const { labels, a, t } = this.getMonthlySeries();

        if (labels.length === 0) {
            const empty = document.createElement("div");
            empty.className = "monthly-graph__empty";
            empty.textContent = "No entries yet";
            wrapper.appendChild(empty);
            this.container.appendChild(wrapper);
            return;
        }

        const width = 320;
        const height = 160;
        const padding = { top: 12, right: 12, bottom: 28, left: 28 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        const maxValue = Math.max(1, ...a, ...t);
        const n = labels.length;

        const xAt = (index) => {
            if (n === 1) {
                return padding.left + plotWidth / 2;
            }
            return padding.left + (index / (n - 1)) * plotWidth;
        };

        const yAt = (value) =>
            padding.top + plotHeight - (value / maxValue) * plotHeight;

        const linePath = (values) =>
            values
                .map(
                    (value, index) =>
                        `${index === 0 ? "M" : "L"} ${xAt(index).toFixed(2)} ${yAt(value).toFixed(2)}`
                )
                .join(" ");

        const areaPath = (values) => {
            const top = linePath(values);
            const lastX = xAt(n - 1).toFixed(2);
            const firstX = xAt(0).toFixed(2);
            const baseY = yAt(0).toFixed(2);
            return `${top} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
        };

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "monthly-graph__svg");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Monthly A and T entry counts");

        const gridSteps = Math.min(4, maxValue);
        for (let step = 0; step <= gridSteps; step++) {
            const value = (maxValue / gridSteps) * step;
            const y = yAt(value);

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("class", "monthly-graph__grid");
            line.setAttribute("x1", String(padding.left));
            line.setAttribute("x2", String(width - padding.right));
            line.setAttribute("y1", y.toFixed(2));
            line.setAttribute("y2", y.toFixed(2));
            svg.appendChild(line);

            if (Number.isInteger(value) || step === gridSteps) {
                const label = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );
                label.setAttribute("class", "monthly-graph__axis-label");
                label.setAttribute("x", String(padding.left - 6));
                label.setAttribute("y", y.toFixed(2));
                label.setAttribute("text-anchor", "end");
                label.setAttribute("dominant-baseline", "middle");
                label.textContent = String(Math.round(value));
                svg.appendChild(label);
            }
        }

        const areaA = document.createElementNS("http://www.w3.org/2000/svg", "path");
        areaA.setAttribute("class", "monthly-graph__area monthly-graph__area--a");
        areaA.setAttribute("d", areaPath(a));
        svg.appendChild(areaA);

        const areaT = document.createElementNS("http://www.w3.org/2000/svg", "path");
        areaT.setAttribute("class", "monthly-graph__area monthly-graph__area--t");
        areaT.setAttribute("d", areaPath(t));
        svg.appendChild(areaT);

        const lineA = document.createElementNS("http://www.w3.org/2000/svg", "path");
        lineA.setAttribute("class", "monthly-graph__line monthly-graph__line--a");
        lineA.setAttribute("d", linePath(a));
        lineA.setAttribute("fill", "none");
        svg.appendChild(lineA);

        const lineT = document.createElementNS("http://www.w3.org/2000/svg", "path");
        lineT.setAttribute("class", "monthly-graph__line monthly-graph__line--t");
        lineT.setAttribute("d", linePath(t));
        lineT.setAttribute("fill", "none");
        svg.appendChild(lineT);

        const labelStep = Math.max(1, Math.ceil(n / 6));
        for (let index = 0; index < n; index++) {
            const showLabel =
                index === 0 || index === n - 1 || index % labelStep === 0;

            if (showLabel) {
                const label = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );
                label.setAttribute("class", "monthly-graph__axis-label");
                label.setAttribute("x", xAt(index).toFixed(2));
                label.setAttribute("y", String(height - 8));
                label.setAttribute("text-anchor", "middle");
                label.textContent = this.formatMonthLabel(labels[index]);
                svg.appendChild(label);
            }

            for (const [values, typeClass] of [
                [a, "monthly-graph__point--a"],
                [t, "monthly-graph__point--t"],
            ]) {
                const point = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );
                point.setAttribute("class", `monthly-graph__point ${typeClass}`);
                point.setAttribute("cx", xAt(index).toFixed(2));
                point.setAttribute("cy", yAt(values[index]).toFixed(2));
                point.setAttribute("r", "3");
                point.setAttribute(
                    "aria-label",
                    `${labels[index]} ${typeClass.endsWith("--a") ? "A" : "T"}: ${values[index]}`
                );
                svg.appendChild(point);
            }
        }

        wrapper.appendChild(svg);
        this.container.appendChild(wrapper);
    }
}
