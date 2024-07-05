var cal = {
  mon: false, // monday first
  events: null, // events data for current month/year
  sMth: 0, // selected month
  sYear: 0, // selected year
  sDIM: 0, // number of days in selected month
  sF: 0, // first date of the selected month (yyyymmddhhmm)
  sL: 0, // last date of the selected month (yyyymmddhhmm)
  sFD: 0, // first day of the selected month (mon-sun)
  sLD: 0, // last day of the selected month (mon-sun)
  ready: 0, // to track loading

  hMth: null, hYear: null, // month & year
  hCD: null, hCB: null, // calendar days & body
  hFormWrap: null, hForm: null, // event form
  hfID: null, hfStart: null, // event form fields
  hfEnd: null, hfTxt: null,
  hfColor: null, hfBG: null,
  hfDel: null,

  transit: swap => {
    if (document.startViewTransition) { document.startViewTransition(swap); }
    else { swap(); }
  },

  ajax: (req, data, onload) => {
    let form = new FormData();
    for (let [k, v] of Object.entries(data)) { form.append(k, v); }
    console.log(req)
    fetch(req + "cal/", { method: "POST", body: form })
      .then(res => res.text())
      .then(txt => onload(txt))
      .catch(err => console.error(err));
  },

  init: () => {
    cal.hMth = document.getElementById("calMonth");
    cal.hYear = document.getElementById("calYear");
    cal.hCD = document.getElementById("calDays");
    cal.hCB = document.getElementById("calBody");
    cal.hFormWrap = document.getElementById("calForm");
    cal.hForm = cal.hFormWrap.querySelector("form");
    cal.hfID = document.getElementById("evtID");
    cal.hfStart = document.getElementById("evtStart");
    cal.hfEnd = document.getElementById("evtEnd");
    cal.hfTxt = document.getElementById("evtTxt");
    cal.hfColor = document.getElementById("evtColor");
    cal.hfBG = document.getElementById("evtBG");
    cal.hfDel = document.getElementById("evtDel");

    let now = new Date(), nowMth = now.getMonth() + 1;
    for (let [i, n] of Object.entries({
      1: "January", 2: "Febuary", 3: "March", 4: "April",
      5: "May", 6: "June", 7: "July", 8: "August",
      9: "September", 10: "October", 11: "November", 12: "December"
    })) {
      let opt = document.createElement("option");
      opt.value = i;
      opt.innerHTML = n;
      if (i == nowMth) { opt.selected = true; }
      cal.hMth.appendChild(opt);
    }
    cal.hYear.value = parseInt(now.getFullYear());

    cal.hMth.onchange = cal.load;
    cal.hYear.onchange = cal.load;
    document.getElementById("calToday").onclick = () => cal.today();
    document.getElementById("calBack").onclick = () => cal.pshift();
    document.getElementById("calNext").onclick = () => cal.pshift(1);
    document.getElementById("calAdd").onclick = () => cal.show();
    cal.hForm.onsubmit = () => cal.save();
    document.getElementById("evtCX").onclick = () => cal.transit(() => cal.hFormWrap.close());
    cal.hfDel.onclick = cal.del;

    let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (cal.mon) { days.push("Sun"); } else { days.unshift("Sun"); }
    for (let d of days) {
      let cell = document.createElement("div");
      cell.className = "calCell";
      cell.innerHTML = d;
      cal.hCD.appendChild(cell);
    }

    cal.load();
  },

  pshift: forward => {
    cal.sMth = parseInt(cal.hMth.value);
    cal.sYear = parseInt(cal.hYear.value);
    if (forward) { cal.sMth++; } else { cal.sMth--; }
    if (cal.sMth > 12) { cal.sMth = 1; cal.sYear++; }
    if (cal.sMth < 1) { cal.sMth = 12; cal.sYear--; }
    cal.hMth.value = cal.sMth;
    cal.hYear.value = cal.sYear;
    cal.load();
  },

  today: () => {
    let now = new Date(), ny = now.getFullYear(), nm = now.getMonth() + 1;
    if (ny != cal.sYear || (ny == cal.sYear && nm != cal.sMth)) {
      cal.hMth.value = nm;
      cal.hYear.value = ny;
      cal.load();
    }
  },

  load: () => {
    cal.sMth = parseInt(cal.hMth.value);
    cal.sYear = parseInt(cal.hYear.value);
    cal.sDIM = new Date(cal.sYear, cal.sMth, 0).getDate();
    cal.sFD = new Date(cal.sYear, cal.sMth - 1, 1).getDay();
    cal.sLD = new Date(cal.sYear, cal.sMth - 1, cal.sDIM).getDay();
    let m = cal.sMth;
    if (m < 10) { m = "0" + m; }
    cal.sF = parseInt(String(cal.sYear) + String(m) + "010000");
    cal.sL = parseInt(String(cal.sYear) + String(m) + String(cal.sDIM) + "2359");

    cal.ajax("get", { month: cal.sMth, year: cal.sYear }, evt => {
      cal.events = JSON.parse(evt);
      cal.draw();
    });
  },

  draw: () => {
    // note - jan is 0 & dec is 11 in js
    // note - sun is 0 & sat is 6 in js
    let now = new Date(), // current date
      nowMth = now.getMonth() + 1, // current month
      nowYear = parseInt(now.getFullYear()), // current year
      nowDay = cal.sMth == nowMth && cal.sYear == nowYear ? now.getDate() : null;

    let rowA, rowB, rowC, rowMap = {}, rowNum = 1, cell, cellNum = 1,
      rower = () => {
        rowA = document.createElement("div");
        rowB = document.createElement("div");
        rowC = document.createElement("div");
        rowA.className = "calRow";
        rowA.id = "calRow" + rowNum;
        rowB.className = "calRowHead";
        rowC.className = "calRowBack";
        cal.hCB.appendChild(rowA);
        rowA.appendChild(rowB);
        rowA.appendChild(rowC);
      },

      celler = day => {
        cell = document.createElement("div");
        cell.className = "calCell";
        if (day) {
          cell.innerHTML = day;
          cell.classList.add("calCellDay");
          cell.onclick = () => {
            cal.show();
            let d = +day, m = +cal.hMth.value,
              s = `${cal.hYear.value}-${String(m < 10 ? "0" + m : m)}-${String(d < 10 ? "0" + d : d)}T00:00:00`;
            cal.hfStart.value = s;
            cal.hfEnd.value = s;
          };
        }
        rowB.appendChild(cell);
        cell = document.createElement("div");
        cell.className = "calCell";
        if (day === undefined) { cell.classList.add("calBlank"); }
        if (day !== undefined && day == nowDay) { cell.classList.add("calToday"); }
        rowC.appendChild(cell);
      };

    cal.hCB.innerHTML = ""; rower();

    if (cal.mon && cal.sFD != 1) {
      let blanks = cal.sFD == 0 ? 7 : cal.sFD;
      for (let i = 1; i < blanks; i++) { celler(); cellNum++; }
    }
    if (!cal.mon && cal.sFD != 0) {
      for (let i = 0; i < cal.sFD; i++) { celler(); cellNum++; }
    }

    for (let i = 1; i <= cal.sDIM; i++) {
      rowMap[i] = { r: rowNum, c: cellNum };
      celler(i);
      if (cellNum % 7 == 0 && i != cal.sDIM) { rowNum++; rower(); }
      cellNum++;
    }

    if (cal.mon && cal.sLD != 0) {
      let blanks = cal.sLD == 6 ? 1 : 7 - cal.sLD;
      for (let i = 0; i < blanks; i++) { celler(); cellNum++; }
    }
    if (!cal.mon && cal.sLD != 6) {
      let blanks = cal.sLD == 0 ? 6 : 6 - cal.sLD;
      for (let i = 0; i < blanks; i++) { celler(); cellNum++; }
    }

    if (Object.keys(cal.events).length > 0) {
      for (let [id, evt] of Object.entries(cal.events)) {
        let sd = new Date(evt.s), ed = new Date(evt.e);
        if (sd.getFullYear() < cal.sYear) { sd = 1; }
        else { sd = sd.getMonth() + 1 < cal.sMth ? 1 : sd.getDate(); }
        if (ed.getFullYear() > cal.sYear) { ed = cal.sDIM; }
        else { ed = ed.getMonth() + 1 > cal.sMth ? cal.sDIM : ed.getDate(); }

        cell = {}; rowNum = 0;
        for (let i = sd; i <= ed; i++) {
          if (rowNum != rowMap[i]["r"]) {
            cell[rowMap[i]["r"]] = { s: rowMap[i]["c"], e: 0 };
            rowNum = rowMap[i]["r"];
          }
          if (cell[rowNum]) { cell[rowNum]["e"] = rowMap[i]["c"]; }
        }

        for (let [r, c] of Object.entries(cell)) {
          let o = c.s - 1 - ((r - 1) * 7), // event cell offset
            w = c.e - c.s + 1; // event cell width
          rowA = document.getElementById("calRow" + r);
          rowB = document.createElement("div");
          rowB.className = "calRowEvt";
          rowB.innerHTML = cal.events[id]["t"];
          rowB.style.color = cal.events[id]["c"];
          rowB.style.backgroundColor = cal.events[id]["b"];
          rowB.classList.add("w" + w);
          if (o != 0) { rowB.classList.add("o" + o); }
          rowB.onclick = () => cal.show(id);
          rowA.appendChild(rowB);
        }
      }
    }
  },

  show: id => {
    if (id) {
      cal.hfID.value = id;
      cal.hfStart.value = cal.events[id]["s"];
      cal.hfEnd.value = cal.events[id]["e"];
      cal.hfTxt.value = cal.events[id]["t"];
      cal.hfColor.value = cal.events[id]["c"];
      cal.hfBG.value = cal.events[id]["b"];
      cal.hfDel.style.display = "inline-block";
    } else {
      cal.hForm.reset();
      cal.hfID.value = "";
      cal.hfDel.style.display = "none";
    }
    cal.transit(() => cal.hFormWrap.show());
  },

  save: () => {
    // s & e : start & end date
    // c & b : text & background color
    // t : event text
    var data = {
      s: cal.hfStart.value.replace("T", " "),
      e: cal.hfEnd.value.replace("T", " "),
      t: cal.hfTxt.value,
      c: cal.hfColor.value,
      b: cal.hfBG.value
    };
    if (cal.hfID.value != "") { data.id = parseInt(cal.hfID.value); }
    if (new Date(data.s) > new Date(data.e)) {
      alert("Start date cannot be later than end date!");
      return false;
    }

    cal.ajax("save", data, res => {
      if (res == "OK") {
        cal.transit(() => cal.hFormWrap.close());
        cal.load();
      } else { alert(res); }
    });
    return false;
  },

  del: () => {
    if (confirm("Delete Event?")) {
      cal.ajax("delete", { id: parseInt(cal.hfID.value) }, res => {
        if (res == "OK") {
          cal.transit(() => cal.hFormWrap.close());
          cal.load();
        } else { alert(res); }
      });
    }
  }
};
window.onload = cal.init;