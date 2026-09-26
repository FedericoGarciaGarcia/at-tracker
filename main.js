// const data = [
//   { Date: "2026-09-20T12:00:00Z", Type: "A" },
//   { Date: "2026-09-20T18:00:00Z", Type: "T" },

//   { Date: "2026-09-21T09:00:00Z", Type: "A" },
//   { Date: "2026-09-22T09:00:00Z", Type: "T" },
//   { Date: "2026-09-23T09:00:00Z", Type: "A" },
//   { Date: "2026-09-23T20:00:00Z", Type: "A" },
//   { Date: "2026-09-24T10:00:00Z", Type: "T" },
// ];

const graph = new Graph(
  document.getElementById("graph"),
);

new Controls(document.getElementById("controls"), {
  onAddEntry: (entry) => {
    graph.addEntry(entry);
  },
});