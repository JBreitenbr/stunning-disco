// 1. Beispieldaten im Wide-Format (Kategorien als Keys)
const data = [
  { group: "Januar",   productA: 120, productB: 90,  productC: 40 },
  { group: "Februar",  productA: 150, productB: 120, productC: 55 },
  { group: "März",     productA: 80,  productB: 140, productC: 70 },
  { group: "April",    productA: 200, productB: 70,  productC: 90 },
  { group: "Mai",      productA: 170, productB: 110, productC: 60 }
];

// Die Sub-Kategorien, die gestapelt werden sollen
const keys = ["productA", "productB", "productC"];

// Farben definieren
const color = d3.scaleOrdinal()
  .domain(keys)
  .range(["#4e79a7", "#f28e2c", "#e15759"]);

// Stack-Datenstruktur generieren
const stackedData = d3.stack()
  .keys(keys)(data);

// Container selektieren
const container = d3.select("#chart-container");
const tooltip = d3.select("#tooltip");

// Feste Margins definieren
const margin = { top: 20, right: 30, bottom: 40, left: 70 };
// Die Höhe wird anhand der Zeilenanzahl berechnet, um Quetschung zu vermeiden
const height = data.length * 45 + margin.top + margin.bottom; 

// Initialisiere das SVG einmalig
const svg = container.append("svg")
  .attr("height", height)
  .style("width", "100%");

const chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Achsen-Gruppen vorbereiten
const xAxisG = chartGroup.append("g").attr("class", "axis x-axis");
const yAxisG = chartGroup.append("g").attr("class", "axis y-axis");

// 2. Kernfunktion zum (Wieder-)Zeichnen des Charts bei Breitenänderung
function render() {
  // Aktuelle Breite des Containers ermitteln (Responsiv-Logik)
  const width = parseInt(container.style("width"), 10) - margin.left - margin.right;
  svg.attr("width", width + margin.left + margin.right);

  // X-Skale (Linear für die Werte)
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.productA + d.productB + d.productC)])
    .range([0, width]);

  // Y-Skale (Band für die Gruppen/Kategorien)
  const y = d3.scaleBand()
    .domain(data.map(d => d.group))
    .range([0, height - margin.top - margin.bottom])
    .padding(0.25);

  // Achsen rendern
  xAxisG.attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
    .transition().duration(200)
    .call(d3.axisBottom(x).ticks(Math.max(5, width / 100))); // Dynamische Tick-Anzahl

  yAxisG.transition().duration(200)
    .call(d3.axisLeft(y));

  // Datenbindung für die Stack-Layer
  const layers = chartGroup.selectAll(".layer")
    .data(stackedData, d => d.key);

  const layersEnter = layers.enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key));

  const allLayers = layersEnter.merge(layers);

  // Bars innerhalb der Layer binden
  const bars = allLayers.selectAll("rect")
    .data(d => d, d => d.data.group);

  // Neue Bars hinzufügen
  const barsEnter = bars.enter().append("rect")
    .attr("y", d => y(d.data.group))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", 0); // Start bei Breite 0 für Animation

  // Bestehende und neue Bars aktualisieren (mit responsivem Resize)
  barsEnter.merge(bars)
    .transition().duration(300)
    .attr("y", d => y(d.data.group))
    .attr("x", d => x(d[0]))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", y.bandwidth());

  // Interaktives Tooltip hinzufügen
  barsEnter.merge(bars)
    .on("mouseover", function(event, d) {
      // Herausfinden, welcher Key zu diesem Stack gehört
      const key = d3.select(this.parentNode).datum().key;
      const value = d[1] - d[0];
      
      tooltip.style("opacity", 1)
        .html(`<strong>${d.data.group}</strong><br/>${key}: ${value}`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 15) + "px");
    })
    .on("mouseleave", function() {
      tooltip.style("opacity", 0);
    });

  // Alte Bars entfernen
  bars.exit().remove();
  layers.exit().remove();
}

// 3. Responsive ResizeObserver aktivieren
const resizeObserver = new ResizeObserver(() => {
  render();
});
resizeObserver.observe(document.getElementById("chart-container"));
