async function handlePost(endpoint) {
  endpoint += `?user=${g_loggedInUser}`
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
    });

    await response.text().then((body) => {
      alert(body);
    });
  } catch (error) {
    alert(`Request failed: ${error.message}`);
  }
}

async function punchIn() {
  await handlePost('/api/punch/in');
  checkStatus();
}

async function startBreak() {
  await handlePost('/api/punch/break/start');
  checkStatus();
}

async function endBreak() {
  await handlePost('/api/punch/break/end')
  checkStatus();
}

async function punchOut() {
  await handlePost('/api/punch/out');
  checkStatus();
}

async function checkStatus() {
  let url = '/api/punch/status' + `?user=${g_loggedInUser}`;

  const workHours = document.getElementById('workHours').value;
  if (workHours) {
    url += `&hours=${workHours}`;
  }

  try {
    const response = await fetch(url, { method: 'GET' });

    if (response.status === 204) {
      alert('No clock data available.');
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    updateStatusLog(json);
  } catch (error) {
    console.log(error);
    alert(`Error while trying to update status: ${error.message}`);
  }
}


function updateStatusLog(json) {
  const status = document.getElementById('status');
  status.innerHTML = '';

  const currentStatus = document.createElement('li');
  currentStatus.textContent = `Current status: ${json.inOut}`;
  status.appendChild(currentStatus);

  if (json.totalTime) {
    const totalTimeEntry = document.createElement('li');
    totalTimeEntry.textContent = `Total Work Time: ${json.totalTime}`;
    status.appendChild(totalTimeEntry);
  }

  if (json.timeLeft) {
    const timeLeftEntry = document.createElement('li');
    timeLeftEntry.textContent = `Time left: ${json.timeLeft} out of ${json.workHours}`;
    status.appendChild(timeLeftEntry);
  }
}
