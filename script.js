let data = JSON.parse(localStorage.getItem("putovka") || "[]");

function save() {
  localStorage.setItem("putovka", JSON.stringify(data));
}

function addSection() {
  data.push({
    date: new Date().toISOString().split("T")[0],
    place: "",
    arrival: "",
    departure: "",
    load: "",
    break: "",
    kmLoad: "",
    kmEmpty: "",
  });
  render();
}

function clearAll() {
  if (confirm("Opravdu smazat vše?")) {
    data = [];
    save();
    render();
  }
}

function update(i, key, value) {
  data[i][key] = value;
  save();
  render();
}

function removeSection(i) {
  data.splice(i, 1);
  save();
  render();
}

function parseTime(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function diffTime(start, end) {
  if (!start || !end) return 0;
  let diff = parseTime(end) - parseTime(start);
  if (diff < 0) diff += 1440; // přes půlnoc
  return diff;
}

function fmt(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

// Vrátí vypočtené hodnoty pro každý úsek (nezapisuje do data[])
function calcSections() {
  return data.map((d, i) => {
    const waitMin = Math.max(0, diffTime(d.arrival, d.departure) - parseTime(d.load));
    const driveMin = i < data.length - 1
      ? diffTime(d.departure, data[i + 1].arrival)
      : 0;
    const netDriveMin = Math.max(0, driveMin - parseTime(d.break));
    return { waitMin, driveMin, netDriveMin };
  });
}

function calcSummary(sections) {
  let totalDrive = 0, totalBreak = 0, totalLoad = 0, totalWait = 0;
  let totalKmLoad = 0, totalKmEmpty = 0;

  data.forEach((d, i) => {
    totalLoad   += parseTime(d.load);
    totalWait   += sections[i].waitMin;
    totalBreak  += parseTime(d.break);
    totalDrive  += sections[i].driveMin;
    totalKmLoad  += parseInt(d.kmLoad)  || 0;
    totalKmEmpty += parseInt(d.kmEmpty) || 0;
  });

  const totalAll = totalDrive + totalBreak + totalLoad + totalWait;

  document.getElementById("summary").innerHTML = `
    <b>Souhrn</b><br>
    Jízda (hrubá): ${fmt(totalDrive)}<br>
    Pauzy: ${fmt(totalBreak)}<br>
    Nakládka: ${fmt(totalLoad)}<br>
    Čekání: ${fmt(totalWait)}<br>
    <hr>
    <b>Celkem: ${fmt(totalAll)}</b><br><br>
    Km ložené: ${totalKmLoad}<br>
    Km prázdné: ${totalKmEmpty}
  `;
}

function calcFuel() {
  const kmS = parseFloat(document.getElementById("kmStart").value);
  const kmE = parseFloat(document.getElementById("kmEnd").value);
  const fS  = parseFloat(document.getElementById("fuelStart").value);
  const fE  = parseFloat(document.getElementById("fuelEnd").value);

  if (isNaN(kmS) || isNaN(kmE) || isNaN(fS) || isNaN(fE)) return;

  const km   = kmE - kmS;
  const fuel = fS - fE;

  if (km <= 0 || fuel <= 0) return;

  const cons = (fuel / km) * 100;

  document.getElementById("fuelResult").innerHTML = `
    Najeto: ${km} km<br>
    Spotřebováno: ${fuel.toFixed(1)} l<br>
    <b>Spotřeba: ${cons.toFixed(1)} l/100 km</b>
  `;
}

function render() {
  const sections = calcSections();
  calcSummary(sections);

  const html = data.map((d, i) => {
    const { waitMin, driveMin, netDriveMin } = sections[i];
    const isLast = i === data.length - 1;

    return `
      <div class="card">
        <b>Úsek ${i + 1}</b><br>

        Datum:
        <input type="date" value="${d.date}" onchange="update(${i},'date',this.value)">

        Místo:
        <input value="${d.place}" onchange="update(${i},'place',this.value)">

        <div class="row">
          <input type="time" value="${d.arrival}"   onchange="update(${i},'arrival',this.value)"   title="Příjezd">
          <input type="time" value="${d.departure}" onchange="update(${i},'departure',this.value)" title="Odjezd">
        </div>

        Nakládka:
        <input type="time" value="${d.load}" onchange="update(${i},'load',this.value)">

        Čekání: <b>${fmt(waitMin)}</b>
      </div>

      <div class="card">
        ${isLast
          ? `<i>Poslední úsek — jízda se počítá z odjezdu na příjezd následujícího úseku.</i>`
          : `
            Jízda (hrubá): <b>${fmt(driveMin)}</b><br>
            Bezp. pauza:
            <input type="time" value="${d.break}" onchange="update(${i},'break',this.value)">
            Jízda (čistá): <b>${fmt(netDriveMin)}</b>
          `
        }

        Km ložené:
        <input type="number" value="${d.kmLoad}"  onchange="update(${i},'kmLoad',this.value)">

        Km prázdné:
        <input type="number" value="${d.kmEmpty}" onchange="update(${i},'kmEmpty',this.value)">

        <button onclick="removeSection(${i})">Smazat</button>
      </div>
    `;
  }).join("");

  document.getElementById("sections").innerHTML = html;
  save();
}

document.addEventListener("input", calcFuel);

render();