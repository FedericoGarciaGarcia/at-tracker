// const data = [
//   { Date: "2026-09-20T12:00:00Z", Type: "A" },
//   { Date: "2026-09-20T18:00:00Z", Type: "T" },

//   { Date: "2026-09-21T09:00:00Z", Type: "A" },
//   { Date: "2026-09-22T09:00:00Z", Type: "T" },
//   { Date: "2026-09-23T09:00:00Z", Type: "A" },
//   { Date: "2026-09-23T20:00:00Z", Type: "A" },
//   { Date: "2026-09-24T10:00:00Z", Type: "T" },
// ];

const graph = new Graph(document.getElementById("graph"));

const calendar = new Calendar(document.getElementById("calendar"), {
  onChange: (data) => {
    graph.setData(data);
  },
});

new Controls(document.getElementById("controls"), {
  onAddEntry: (entry) => {
    calendar.addEntry(entry);
  },
  onExport: () => {
    calendar.exportEntries();
  },
  onImport: () => {
    calendar.importEntries();
  },
});