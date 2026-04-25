let data = JSON.parse(localStorage.getItem("putovka") || "[]");

function save() {
localStorage.setItem("putovka", JSON.stringify(data));
}

function addSection() {
data.push({
date: new Date().toISOString().split('T')[0],
place: "",
arrival: "",
departure: "",
load: "",
break: "",
kmLoad: "",
kmEmpty: "",
calculatedWait: 0,
calculatedDrive: 0
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
calc();
}

function removeSection(i) {
data.splice(i, 1);
render();
}

function parseTime(t) {
if (!t) return 0;
let p = t.split(":");
return parseInt(p[0])*60 + parseInt(p[1]);
}

function diffTime(start, end) {
if (!start || !end) return 0;
let s = parseTime(start);
let e = parseTime(end);
let diff = e - s;
if (diff < 0) diff += 1440;
return diff;
}

function calculateWait(arr, dep, load) {
let total = diffTime(arr, dep);
let l = parseTime(load);
let w = total - l;
return w > 0 ? w : 0;
}

function fmt(min) {
let h = Math.floor(min/60);
let m = min%60;
return h + "h " + m + "m";
}

function calc() {
let totalDrive = 0;
let totalBreak = 0;
let totalLoad = 0;
let totalWait = 0;
let totalKmLoad = 0;
let totalKmEmpty = 0;

for (let i = 0; i < data.length; i++) {
let d = data[i];

```
d.calculatedWait = calculateWait(d.arrival, d.departure, d.load);
totalLoad += parseTime(d.load);
totalWait += d.calculatedWait;
totalBreak += parseTime(d.break);
totalKmLoad += parseInt(d.kmLoad) || 0;
totalKmEmpty += parseInt(d.kmEmpty) || 0;

if (i < data.length - 1) {
  let next = data[i+1];
  let drive = diffTime(d.departure, next.arrival);
  d.calculatedDrive = drive;
  totalDrive += drive;
}
```

}

let totalAll = totalDrive + totalBreak + totalLoad + totalWait;

document.getElementById("summary").innerHTML = ` <b>Souhrn</b><br>
Jízda: ${fmt(totalDrive)}<br>
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
let kmS = parseFloat(document.getElementById("kmStart").value);
let kmE = parseFloat(document.getElementById("kmEnd").value);
let fS = parseFloat(document.getElementById("fuelStart").value);
let fE = parseFloat(document.getElementById("fuelEnd").value);

if (!kmS || !kmE || !fS || !fE) return;

let km = kmE - kmS;
let fuel = fS - fE;

if (km <= 0 || fuel <= 0) return;

let cons = (fuel / km) * 100;

document.getElementById("fuelResult").innerHTML = `   Najeto: ${km} km<br>
  Spotřebováno: ${fuel.toFixed(1)} l<br>   <b>Spotřeba: ${cons.toFixed(1)} l/100 km</b>
  `;
}

function render() {
let html = "";

data.forEach((d, i) => {
html += ` <div class="card"> <b>Úsek ${i+1}</b><br>

```
  Datum:
  <input type="date" value="${d.date}" onchange="update(${i},'date',this.value)">

  Místo:
  <input value="${d.place}" onchange="update(${i},'place',this.value)">

  <div class="row">
    <input type="time" value="${d.arrival}" onchange="update(${i},'arrival',this.value)">
    <input type="time" value="${d.departure}" onchange="update(${i},'departure',this.value)">
  </div>

  Nakládka:
  <input type="time" value="${d.load}" onchange="update(${i},'load',this.value)">

  Čekání:
  <b>${fmt(d.calculatedWait)}</b>

  <hr>

  Jízda:
  <b>${fmt(d.calculatedDrive)}</b>

  Bezp. pauza:
  <input type="time" value="${d.break}" onchange="update(${i},'break',this.value)">

  Km ložené:
  <input type="number" value="${d.kmLoad}" onchange="update(${i},'kmLoad',this.value)">

  Km prázdné:
  <input type="number" value="${d.kmEmpty}" onchange="update(${i},'kmEmpty',this.value)">

  <button onclick="removeSection(${i})">Smazat</button>
</div>
`;
```

});

document.getElementById("sections").innerHTML = html;
save();
calc();
}

// napojení fuel inputů
document.addEventListener("input", calcFuel);

render();
