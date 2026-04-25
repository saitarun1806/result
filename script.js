const API = "https://nameless-dawn-298e.database1806.workers.dev";

let studentData = {}, calcData = {}, currentSem = "", adminKey = "";

// LOAD DATA
function loadData(){

  let roll = document.getElementById("roll").value;
  let name = document.getElementById("name").value;

  Promise.all([
    fetch(`${API}/student?roll=${roll}&name=${name}`).then(r=>r.json()),
    fetch(`${API}/calculate?roll=${roll}`).then(r=>r.json())
  ])
  .then(([s,c])=>{

    studentData = s.semesters;
    calcData = c;

    let html = `<h4 class="text-center">${s.name}</h4>
<h5 class="text-center">CGPA: ${c.cgpa} | ${c.finalGrade}</h5>

<div class="text-center my-3">
  <button class="btn btn-dark" onclick="openCgpaModal()">
    Calculate CGPA
  </button>
</div>

<hr>`;

    for(let sem in c.semesters){

      let d = c.semesters[sem];

      html += `
      <div class="col-md-4 mb-3">
        <div class="card p-3 text-center" onclick="openSem('${sem}')">
          <h5>${sem}</h5>
          <div>SGPA: ${d.sgpa}</div>
          <div>Grade: ${d.grade}</div>
          <div>Credits: ${d.credits}</div>
        </div>
      </div>`;
    }

    document.getElementById("result").innerHTML = html;
  });
}

// OPEN SEM
function openSem(sem){

  currentSem = sem;

  let subs = studentData[sem].subjects.map((s,i)=>({
  ...s,
  grade: calcData.semesters[sem]?.subjects?.[i]?.grade || s.grade
}));
  let hasFail = false;

subs.forEach(s=>{
  if(s.grade === "F"){
    hasFail = true;
  }
});

  let html = `<table class="table table-bordered">
  <tr><th>Sub</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th></tr>`;

  subs.forEach(s=>{
    html += `<tr>
      <td>${s.name}</td>
      <td>${s.internal}</td>
      <td>${s.external}</td>
      <td>${s.total}</td>
      <td>${s.grade}</td>
    </tr>`;
  });

  html += `</table>`;
  let total = 0;
subs.forEach(s=> total += Number(s.total || 0));

html += `
<div class="card p-3 mt-3 bg-light">
  <div class="row text-center">
    <div class="col"><b>Total</b><br>${total}</div>
    <div class="col"><b>SGPA</b><br>${calcData.semesters[sem].sgpa}</div>
    <div class="col"><b>Grade</b><br>${calcData.semesters[sem].grade}</div>
  </div>
</div>`;

  modalBody.innerHTML = html;
  const footer = document.querySelector("#subjectModal .modal-footer");

if(hasFail){
  footer.innerHTML = `
    <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button class="btn btn-primary" onclick="openSgpaModal()">Calculate SGPA</button>
    <button class="btn btn-danger" onclick="openManualRequest()">Request Change</button>
  `;
} else {
  footer.innerHTML = `
    <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button class="btn btn-primary" onclick="openSgpaModal()">Calculate SGPA</button>
  `;
}

  new bootstrap.Modal(subjectModal).show();
}

// REQUEST
function openManualRequest(){

  const select = document.getElementById("req_subject");
  select.innerHTML = "";

  // Fill only current semester subjects
  studentData[currentSem].subjects.forEach(s=>{
    select.innerHTML += `
      <option value="${s.code}">
        ${s.name} (${s.code})
      </option>`;
  });

  // Auto-fill roll
  document.getElementById("req_roll").value =
    document.getElementById("roll").value;

  new bootstrap.Modal(document.getElementById("requestModal")).show();
}

function openManualRequestGlobal(){

  if(Object.keys(studentData).length === 0){
    alert("Load student first");
    return;
  }

  const select = document.getElementById("req_subject");
  select.innerHTML = "";

  for(let sem in studentData){
    studentData[sem].subjects.forEach(s=>{
      select.innerHTML += `
        <option value="${s.code}" data-sem="${sem}">
          ${sem} - ${s.name} (${s.code})
        </option>`;
    });
  }

  document.getElementById("req_roll").value =
    document.getElementById("roll").value;

  new bootstrap.Modal(document.getElementById("requestModal")).show();
}
function openSgpaModal(){

  // 🔥 CLOSE SEMESTER MODAL FIRST
  const semModal = bootstrap.Modal.getInstance(
    document.getElementById("subjectModal")
  );
  if(semModal) semModal.hide();

  let subs = studentData[currentSem].subjects;

  let html = `<table class="table table-bordered">
  <tr>
    <th>Subject</th>
    <th>Internal</th>
    <th>External</th>
  </tr>`;

  subs.forEach((s,i)=>{
    html += `
    <tr>
      <td>${s.name}</td>
      <td><input type="number" class="form-control" id="int_${i}" value="${s.internal}"></td>
      <td><input type="number" class="form-control" id="ext_${i}" value="${s.external}"></td>
    </tr>`;
  });

  html += `</table>`;

  document.getElementById("sgpaBody").innerHTML = html;

  // 🔥 OPEN SGPA MODAL
  new bootstrap.Modal(
    document.getElementById("sgpaModal")
  ).show();
}
function calculateSGPA(){

  let subs = studentData[currentSem].subjects;

  let totalCredits = 0;
  let totalPoints = 0;

  subs.forEach((s,i)=>{

    let internal = Number(document.getElementById(`int_${i}`).value);
    let external = Number(document.getElementById(`ext_${i}`).value);

    let total = internal + external;

    let grade = getGrade(total);
    let point = getPoint(grade);

    let credit = 3; // default (or use credits map if available)

    totalCredits += credit;
    totalPoints += credit * point;
  });

  let sgpa = (totalPoints / totalCredits).toFixed(2);

  document.getElementById("sgpaResult").innerHTML =
    `SGPA: <b>${sgpa}</b>`;
}
function getGrade(mark){
  if(mark >= 91) return "O";
  if(mark >= 81) return "A+";
  if(mark >= 71) return "A";
  if(mark >= 61) return "B+";
  if(mark >= 51) return "B";
  if(mark >= 41) return "C";
  if(mark >= 40) return "P";
  return "F";
}

function getPoint(g){
  return { O:10, "A+":9, A:8, "B+":7, B:6, C:5, P:4, F:0 }[g] || 0;
}
// SUBMIT REQUEST
function submitRequest(){

  const roll = document.getElementById("req_roll").value;
  const select = document.getElementById("req_subject");

  const code = select.value;
  const external = Number(document.getElementById("req_external").value);
  const proof = document.getElementById("req_proof").value;

  if(!roll || !code || !external || !proof){
    alert("Fill all fields");
    return;
  }

  let selectedOption = select.options[select.selectedIndex];
  let sem = selectedOption.getAttribute("data-sem") || currentSem;

  let sub = studentData[sem]?.subjects.find(s=>s.code === code);

  fetch(`${API}/request-change`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      roll,
      sem,
      code,
      internal: Number(sub?.internal || 0),
      external,
      total: Number(sub?.internal || 0) + external,
      result:"P",
      proof
    })
  })
  .then(r=>r.json())
  .then(d=>{

  // Close request modal
  const reqModal = bootstrap.Modal.getInstance(
    document.getElementById("requestModal")
  );
  if(reqModal) reqModal.hide();

  // Clear inputs
  document.getElementById("req_external").value = "";
  document.getElementById("req_proof").value = "";

  // Show success modal
  new bootstrap.Modal(
    document.getElementById("successModal")
  ).show();
});
}

// ADMIN
function openAdminLogin(){
  new bootstrap.Modal(adminModal).show();
}

function loadRequests(){

  adminKey = document.getElementById("adminKey").value;

  if(!adminKey){
    alert("Enter admin key");
    return;
  }

  fetch(`${API}/requests`,{
    headers:{ "x-admin-key": adminKey }
  })
  .then(r=>r.json())
  .then(data=>{

    // Close login modal
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById("adminModal"));
    if(modalInstance) modalInstance.hide();

    let html = "<h5 class='mb-3'>Pending Requests</h5>";

    if(!data.length){
      html += "<p>No pending requests</p>";
    }

    data.forEach(r=>{

      if(!r || typeof r !== "object") return;

      html += `
      <div class="card p-3 mb-3 shadow-sm">

        <div class="row">

          <div class="col-md-8">
            <div><b>Roll:</b> ${r.roll}</div>
            <div><b>Subject:</b> ${r.code?.trim()}</div>
            <div><b>Internal:</b> ${r.internal ?? "-"}</div>
            <div><b>External:</b> ${r.external ?? "-"}</div>
            <div><b>Total:</b> ${r.total ?? "-"}</div>
          </div>

          <div class="col-md-4 text-md-end mt-2 mt-md-0">

            ${r.proof ? `
              <a href="${r.proof}" target="_blank"
                class="btn btn-sm btn-outline-primary mb-2 w-100">
                View Proof
              </a>` : ""}

            <button onclick="approve('${r.id}')"
              class="btn btn-success btn-sm w-100 mb-2">
              ✅ Approve
            </button>

            <button onclick="reject('${r.id}')"
              class="btn btn-danger btn-sm w-100">
              ❌ Reject
            </button>

          </div>

        </div>

      </div>`;
    });

    document.getElementById("adminBody").innerHTML = html;

    new bootstrap.Modal(document.getElementById("adminPanel")).show();
  })
  .catch(err=>{
    console.error(err);
    alert("Failed to load requests");
  });
}


function loadApproved(){

  fetch(`${API}/approved`,{
    headers:{ "x-admin-key": adminKey }
  })
  .then(r=>r.json())
  .then(data=>{

    let html = "<h5 class='mb-3'>Approved Requests</h5>";

    if(!data.length){
      html += "<p>No approved records</p>";
    }

    data.forEach(r=>{

      if(!r || typeof r !== "object") return;

      html += `
      <div class="card p-3 mb-2 bg-success text-white">

        <div><b>Roll:</b> ${r.roll}</div>

        <div><b>Subject:</b> ${r.code?.trim()}</div>

        <div><b>Internal:</b> ${r.internal ?? "-"}</div>

        <div><b>External:</b> ${r.external ?? "-"}</div>

        <div><b>Total:</b> ${r.total ?? "-"}</div>

        <div><b>Status:</b> ${r.status}</div>

        ${r.proof ? `<a href="${r.proof}" target="_blank" class="text-white">View Proof</a>` : ""}

      </div>`;
    });

    document.getElementById("adminBody").innerHTML = html;
  });
}

function loadRejected(){

  fetch(`${API}/rejected`,{
    headers:{ "x-admin-key": adminKey }
  })
  .then(r=>r.json())
  .then(data=>{

    let html = "<h5 class='mb-3'>Rejected Requests</h5>";

    if(!data.length){
      html += "<p>No rejected records</p>";
    }

    data.forEach(r=>{

      if(!r || typeof r !== "object") return;

      html += `
      <div class="card p-3 mb-2 bg-danger text-white">

        <div><b>Roll:</b> ${r.roll}</div>

        <div><b>Subject:</b> ${r.code?.trim()}</div>

        <div><b>Internal:</b> ${r.internal ?? "-"}</div>

        <div><b>External:</b> ${r.external ?? "-"}</div>

        <div><b>Total:</b> ${r.total ?? "-"}</div>

        <div><b>Status:</b> ${r.status}</div>

        ${r.proof ? `<a href="${r.proof}" target="_blank" class="text-white">View Proof</a>` : ""}

      </div>`;
    });

    document.getElementById("adminBody").innerHTML = html;
  });
}

function approve(id){
  fetch(`${API}/approve`,{
    method:"POST",
    headers:{ "Content-Type":"application/json","x-admin-key":adminKey },
    body:JSON.stringify({id})
  }).then(()=>loadRequests());
}

function reject(id){
  fetch(`${API}/reject`,{
    method:"POST",
    headers:{ "Content-Type":"application/json","x-admin-key":adminKey },
    body:JSON.stringify({id})
  }).then(()=>loadRequests());
}
// =======================
// 🔹 REFRESH WHEN ADMIN PANEL CLOSES
// =======================
document.getElementById("adminPanel")
  .addEventListener("hidden.bs.modal", function () {
    location.reload();
  });
  function openCgpaModal(){

  let container = document.getElementById("cgpaSemContainer");
  container.innerHTML = "";

  // set existing CGPA
  document.getElementById("currentCgpa").value = calcData.cgpa || "";

  // add first sem by default
  addSemBlock();

  new bootstrap.Modal(document.getElementById("cgpaModal")).show();
}
let semCount = 0;

function addSemBlock(){

  let container = document.getElementById("cgpaSemContainer");

  let id = Date.now(); // unique id

  let html = `
  <div class="card p-3 mt-3 sem-block" id="sem_${id}">
    
    <div class="d-flex justify-content-between align-items-center">
      <h6 class="mb-2">Semester ${semCount + 1}</h6>
      <button class="btn btn-sm btn-danger"
        onclick="removeSem('${id}')">✖</button>
    </div>

    <div class="row">
      <div class="col">
        <input type="text" class="form-control mb-2"
          placeholder="Sem Name">
      </div>
      <div class="col">
        <input type="number" step="0.01"
          class="form-control mb-2 sgpa"
          placeholder="SGPA">
      </div>
      <div class="col">
        <input type="number"
          class="form-control mb-2 credits"
          placeholder="Credits">
      </div>
    </div>

  </div>`;

  container.insertAdjacentHTML("beforeend", html);
  semCount++;
}
function removeSem(id){

  let el = document.getElementById(`sem_${id}`);
  if(el){
    el.remove();
  }
}
function calculateCGPA(){

  let sgpas = document.querySelectorAll(".sgpa");
  let credits = document.querySelectorAll(".credits");

  let totalCredits = 0;
  let totalPoints = 0;

  for(let i=0; i<sgpas.length; i++){

    let sgpa = Number(sgpas[i].value);
    let credit = Number(credits[i].value);

    if(!sgpa || !credit) continue;

    totalCredits += credit;
    totalPoints += sgpa * credit;
  }

  let cgpa = (totalPoints / totalCredits).toFixed(2);

  document.getElementById("cgpaResult").innerHTML =
    `CGPA: <b>${cgpa}</b>`;

  document.getElementById("totalCredits").innerHTML =
    `Total Credits: <b>${totalCredits}</b>`;
}
function openCgpaModal(){

  let container = document.getElementById("cgpaSemContainer");
  container.innerHTML = "";
  semCount = 0;

  document.getElementById("currentCgpa").value = calcData.cgpa || "";

  for(let sem in calcData.semesters){

    let d = calcData.semesters[sem];

    container.innerHTML += `
    <div class="card p-3 mt-3">
      <h6>${sem}</h6>

      <div class="row">
        <div class="col">
          <input class="form-control mb-2" value="${sem}">
        </div>
        <div class="col">
          <input type="number" step="0.01" class="form-control mb-2 sgpa" value="${d.sgpa}">
        </div>
        <div class="col">
          <input type="number" class="form-control mb-2 credits" value="${d.credits}">
        </div>
      </div>
    </div>`;

    semCount++;
  }

  new bootstrap.Modal(document.getElementById("cgpaModal")).show();
}