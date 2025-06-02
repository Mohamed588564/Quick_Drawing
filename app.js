require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/geometry/geometryEngine",
], function (
  Map,
  MapView,
  Graphic,
  GraphicsLayer,
  SketchViewModel,
  geometryEngine
) {
  const map = new Map({
    basemap: "hybrid",
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [31.2357, 30.0444],
    zoom: 10,
    constraints: {
      minZoom: 4,
      maxZoom: 20,
    },
  });

  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  const sketchViewModel = new SketchViewModel({
    view: view,
    layer: graphicsLayer,
  });

  let selectedColor = "#ff0000";
  let features = [];

  document.getElementById("color-picker").addEventListener("input", (event) => {
    selectedColor = event.target.value;
  });

  document.getElementById("undo").addEventListener("click", () => {
    if (sketchViewModel.activeTool) {
      sketchViewModel.undo();
    } else {
      alert("مفيش رسم شغال حالياً للتراجع!");
    }
  });

  document.getElementById("redo").addEventListener("click", () => {
    if (sketchViewModel.activeTool) {
      sketchViewModel.redo();
    } else {
      alert("مفيش رسم شغال حالياً لإعادة!");
    }
  });

  document.getElementById("draw-point").addEventListener("click", () => {
    sketchViewModel.create("point");
  });

  document.getElementById("draw-polyline").addEventListener("click", () => {
    sketchViewModel.create("polyline");
  });

  document.getElementById("draw-polygon").addEventListener("click", () => {
    sketchViewModel.create("polygon");
  });

  document.getElementById("edit-graphic").addEventListener("click", () => {
    if (graphicsLayer.graphics.length > 0) {
      const lastGraphic = graphicsLayer.graphics.getItemAt(
        graphicsLayer.graphics.length - 1
      );
      sketchViewModel.update([lastGraphic]);
    } else {
      alert("لا يوجد رسومات للتعديل!");
    }
  });

  document.getElementById("zoom-in").addEventListener("click", () => {
    view.zoom += 1;
  });

  document.getElementById("zoom-out").addEventListener("click", () => {
    view.zoom -= 1;
  });

  document.getElementById("clear-graphics").addEventListener("click", () => {
    graphicsLayer.removeAll();
    features = [];
    document.getElementById("features-list").innerHTML = "";
    document.getElementById("attributes-panel").innerHTML = "";
  });

  sketchViewModel.on("create", (event) => {
    if (event.state === "complete") {
      const graphic = event.graphic;

      if (graphic.geometry.type === "point") {
        graphic.symbol = {
          type: "simple-marker",
          color: selectedColor,
          size: 10,
        };
      } else if (graphic.geometry.type === "polyline") {
        graphic.symbol = {
          type: "simple-line",
          color: selectedColor,
          width: 2,
        };
      } else if (graphic.geometry.type === "polygon") {
        graphic.symbol = {
          type: "simple-fill",
          color: [selectedColor, 0.3],
          outline: {
            color: selectedColor,
            width: 2,
          },
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
        features: graphicsLayer.graphics.map((graphic) => {
          const geometry = graphic.geometry.toJSON();
          const feature = {
            type: "Feature",
            geometry: geometry,
            properties: {},
          };
          return feature;
        }),
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

    const list = document.getElementById("features-list");
    const item = document.createElement("div");
    item.textContent = id;
    item.classList.add("feature-item");
    item.style.cursor = "pointer";
    item.dataset.featureId = id;
    list.appendChild(item);

    item.addEventListener("click", () => {
      showAttributes(graphic);
    });
  }

  function showAttributes(graphic) {
    const panel = document.getElementById("attributes-panel");
    const geom = graphic.geometry;
    let length = 0;
    let area = 0;

    if (geom.type === "polyline") {
      length = geometryEngine.geodesicLength(geom, "meters").toFixed(2);
    } else if (geom.type === "polygon") {
      area = geometryEngine.geodesicArea(geom, "square-meters").toFixed(2);
      length = geometryEngine.geodesicLength(geom, "meters").toFixed(2);
    }

    panel.innerHTML = `
      <p><strong>ID:</strong> ${graphic.attributes.id}</p>
      <p><strong>Type:</strong> ${geom.type}</p>
      <p><strong>Length (m):</strong> ${length}</p>
      <p><strong>Area (m²):</strong> ${area}</p>
    `;
  }
});
