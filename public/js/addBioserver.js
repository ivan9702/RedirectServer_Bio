var elemInput = document.getElementById('address');
var elemAddBtn = document.getElementById('add');
var elemTbody = document.getElementById('tableBody');
var elemResult = document.getElementById('result');
var originIP = document.location.origin;

function addBioserver(bioserverIP) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', originIP + '/redirect/addBioserver');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({bsIP: bioserverIP}));
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
      var responseObj = JSON.parse(xhr.response);
      if (responseObj.code == 20005) {
        var responseArray = [];
        responseArray.push(elemTbody.rows.length + 1);
        responseArray.push(bioserverIP);
        responseArray.push(responseObj.data.bsId);
        responseArray.push(0);
        responseArray.push(responseObj.data.version);
        addTableRow(elemTbody, responseArray);
      }
      elemResult.textContent = responseObj.message;
    } else {
      elemResult.textContent = 'Connection failure.';
    }
  }
}

function addTableRow(tbody, infoArray) {
  var tr = document.createElement("tr");
  infoArray.forEach(function(element, index) {
    var td = document.createElement("td");
    var txt = document.createTextNode(element);
    if (index === 1) {
      var a = document.createElement('a');
      a.appendChild(txt);
      a.href = element;
      a.target = '_blank';
      td.appendChild(a);
    } else {
      td.appendChild(txt);
    }
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

function onAdd() {
  if (elemInput.value) {
    addBioserver(elemInput.value);
  } else {
    elemResult.textContent = 'Please enter a valid address.';
  }
}

elemAddBtn.addEventListener('click', onAdd);
