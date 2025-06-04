require([
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/BasemapGallery",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Bookmarks",
  "esri/widgets/CoordinateConversion",
  "esri/widgets/Compass",
  "esri/widgets/Fullscreen",
  "esri/widgets/Home",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/Locate",
  "esri/widgets/Measurement",
  "esri/widgets/ScaleBar",
  "esri/widgets/Search",
  "esri/widgets/Sketch",
  "esri/widgets/Track",
  "esri/widgets/Zoom",
  "esri/widgets/Expand",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/geometry/geometryEngine",
  "esri/views/draw/Draw",
], function (
  Map,
  MapView,
  BasemapGallery,
  BasemapToggle,
  Bookmarks,
  CoordinateConversion,
  Compass,
  Fullscreen,
  Home,
  LayerList,
  Legend,
  Locate,
  Measurement,
  ScaleBar,
  Search,
  Sketch,
  Track,
  Zoom,
  Expand,
  Graphic,
  GraphicsLayer,
  SketchViewModel,
  geometryEngine,
  Draw
) {
  const map = new Map({ basemap: "satellite" });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [31.2357, 30.0444],
    zoom: 10,
  });

  const widgets = [
    new Expand({
      view,
      content: new BasemapGallery({ view }),
      group: "top-left",
    }),
    new Expand({ view, content: new Bookmarks({ view }), group: "top-left" }),
    new Expand({ view, content: new LayerList({ view }), group: "top-left" }),
    new Expand({ view, content: new Legend({ view }), group: "top-left" }),
    new Expand({
      view,
      content: new CoordinateConversion({ view }),
      group: "top-left",
    }),
    new Expand({ view, content: new Measurement({ view }), group: "top-left" }),
    new Expand({ view, content: new Sketch({ view }), group: "top-left" }),
    new Expand({ view, content: new Search({ view }), group: "top-left" }),
  ];

  widgets.forEach((widget) => view.ui.add(widget, "top-left"));

  view.ui.add(new Home({ view }), "top-left");
  view.ui.add(new Zoom({ view }), "top-left");
  view.ui.add(new Compass({ view }), "top-left");
  view.ui.add(new Fullscreen({ view }), "top-right");
  view.ui.add(new ScaleBar({ view }), { position: "bottom-left" });
  view.ui.add(new Locate({ view }), "top-left");
  view.ui.add(new Track({ view }), "top-left");
  view.ui.add(
    new BasemapToggle({ view, nextBasemap: "topo-vector" }),
    "bottom-right"
  );

  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  const sketchViewModel = new SketchViewModel({ view, layer: graphicsLayer });

  let selectedColor = "#ff0000";
  let features = [];

  document.getElementById("color-picker").addEventListener("input", (e) => {
    selectedColor = e.target.value;
  });

  document.getElementById("undo").addEventListener("click", () => {
    sketchViewModel.activeTool
      ? sketchViewModel.undo()
      : alert("مفيش رسم شغال حالياً للتراجع!");
  });

  document.getElementById("redo").addEventListener("click", () => {
    sketchViewModel.activeTool
      ? sketchViewModel.redo()
      : alert("مفيش رسم شغال حالياً لإعادة!");
  });

  document
    .getElementById("draw-point")
    .addEventListener("click", () => sketchViewModel.create("point"));
  document
    .getElementById("draw-polyline")
    .addEventListener("click", () => sketchViewModel.create("polyline"));

  document.getElementById("draw-polygon").addEventListener("click", () => {
    const subtype = document.getElementById("subtype-select").value;

    const polygonAction = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
    });

    polygonAction.create("polygon");

    polygonAction.on("create", (event) => {
      if (event.state === "complete") {
        let fillColor;

        switch (subtype) {
          case "residential":
            fillColor = [255, 255, 0, 0.4]; // أصفر
            break;
          case "commercial":
            fillColor = [255, 0, 0, 0.4]; // أحمر
            break;
          case "industrial":
            fillColor = [128, 0, 128, 0.4]; // بنفسجي
            break;
          case "green":
            fillColor = [0, 128, 0, 0.4]; // أخضر
            break;
          default:
            fillColor = [128, 128, 128, 0.4]; // رمادي
        }

        const graphic = new Graphic({
          geometry: event.graphic.geometry,
          symbol: {
            type: "simple-fill",
            color: fillColor,
            outline: {
              color: "grey",
              width: 2,
            },
          },
          attributes: {
            subtype: subtype,
          },
        });

        graphicsLayer.add(graphic);
        addFeature(graphic);
        showAttributes(graphic);
      }
    });
  });

  document.getElementById("edit-graphic").addEventListener("click", () => {
    if (graphicsLayer.graphics.length > 0) {
      sketchViewModel.update([
        graphicsLayer.graphics.getItemAt(graphicsLayer.graphics.length - 1),
      ]);
    } else {
      alert("لا يوجد رسومات للتعديل!");
    }
  });

  document
    .getElementById("zoom-in")
    .addEventListener("click", () => (view.zoom += 1));
  document
    .getElementById("zoom-out")
    .addEventListener("click", () => (view.zoom -= 1));

  document.getElementById("clear-graphics").addEventListener("click", () => {
    graphicsLayer.removeAll();
    features = [];
    document.getElementById("features-list").innerHTML = "";
    document.getElementById("attributes-panel").innerHTML = "";
  });

  sketchViewModel.on("create", (event) => {
    if (event.state === "complete") {
      const graphic = event.graphic;
      const geomType = graphic.geometry.type;

      if (geomType === "point") {
        graphic.symbol = {
          type: "simple-marker",
          color: selectedColor,
          size: 10,
        };
      } else if (geomType === "polyline") {
        graphic.symbol = {
          type: "simple-line",
          color: selectedColor,
          width: 2,
        };
      } else if (geomType === "polygon") {
        graphic.symbol = {
          type: "simple-fill",
          color: [selectedColor, 0.3],
          outline: { color: selectedColor, width: 2 },
        };
      }

      addFeature(graphic);
      showAttributes(graphic);
    }
  });

  document.getElementById("export-geojson").addEventListener("click", () => {
    if (graphicsLayer.graphics.length > 0) {
      const geojson = {
        type: "FeatureCollection",
        features: graphicsLayer.graphics.map((graphic) => ({
          type: "Feature",
          geometry: graphic.geometry.toJSON(),
          properties: {},
        })),
      };

      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "graphics.geojson";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("لا يوجد رسومات للتصدير!");
    }
  });

  function addFeature(graphic) {
    const id = `${graphic.geometry.type}-${features.length + 1}`;
    graphic.attributes = { id };
    features.push(graphic);

    const item = document.createElement("div");
    item.textContent = id;
    item.classList.add("feature-item");
    item.style.cursor = "pointer";
    item.dataset.featureId = id;
    document.getElementById("features-list").appendChild(item);

    item.addEventListener("click", () => showAttributes(graphic));
  }

  function showAttributes(graphic) {
    const geom = graphic.geometry;
    let length = 0,
      area = 0;

    if (geom.type === "polyline") {
      length = geometryEngine.geodesicLength(geom, "meters").toFixed(2);
    } else if (geom.type === "polygon") {
      area = geometryEngine.geodesicArea(geom, "square-meters").toFixed(2);
      length = geometryEngine.geodesicLength(geom, "meters").toFixed(2);
    }

    document.getElementById("attributes-panel").innerHTML = `
      <p><strong>ID:</strong> ${graphic.attributes.id}</p>
      <p><strong>Type:</strong> ${geom.type}</p>
      <p><strong>Length (m):</strong> ${length}</p>
      <p><strong>Area (m²):</strong> ${area}</p>
    `;
  }

  document
    .getElementById("export-table")
    .addEventListener("click", function () {
      const graphics = graphicsLayer.graphics.items;
      if (graphics.length === 0) {
        alert("No drawings to export.");
        return;
      }

      let rows = graphics.map((g, i) => {
        let coords = "";
        const geom = g.geometry;
        if (geom.type === "point")
          coords = `${geom.longitude}, ${geom.latitude}`;
        else coords = JSON.stringify(geom.paths || geom.rings);

        return { id: i + 1, type: geom.type, coordinates: coords };
      });

      let html = `
      <table border="1" style="border-collapse: collapse; margin-top: 10px;">
        <thead><tr><th>#</th><th>Type</th><th>Coordinates</th></tr></thead>
        <tbody>${rows
          .map(
            (row) =>
              `<tr><td>${row.id}</td><td>${row.type}</td><td>${row.coordinates}</td></tr>`
          )
          .join("")}</tbody>
      </table>
    `;
      const win = window.open("", "Table");
      win.document.write(
        `<html><head><title>Exported Data</title></head><body><h2>Drawn Features</h2>${html}</body></html>`
      );
      win.document.close();

      const csv = `ID,Type,Coordinates\n${rows
        .map((r) => `${r.id},${r.type},"${r.coordinates.replace(/"/g, '""')}"`)
        .join("\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "drawn_features.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
});
