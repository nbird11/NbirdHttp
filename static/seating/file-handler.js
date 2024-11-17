async function saveChart() {
    try {
        // Create the chart data object
        const chartData = {
            title: document.getElementById('chart-title').textContent,
            seats: seatingChart.map(seat => ({
                x: parseInt(seat.style.left),
                y: parseInt(seat.style.top),
                label: seat.querySelector('span').textContent
            }))
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(chartData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Show the file picker
        const handle = await window.showSaveFilePicker({
            suggestedName: `${chartData.title}.seat`,
            types: [{
                description: 'Seating Chart',
                accept: {
                    'application/json': ['.seat']
                }
            }],
        });

        // Write the file
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Failed to save chart:', err);
            alert('Failed to save the chart. Please try again.');
        }
    }
}

async function loadChart() {
    try {
        // Show the file picker
        const [handle] = await window.showOpenFilePicker({
            types: [{
                description: 'Seating Chart',
                accept: {
                    'application/json': ['.seat']
                }
            }],
            multiple: false
        });

        // Get the file contents
        const file = await handle.getFile();
        const contents = await file.text();
        const chartData = JSON.parse(contents);

        // Clear existing chart
        newChart();

        // Set the title
        document.getElementById('chart-title').textContent = chartData.title;

        // Create all seats
        chartData.seats.forEach(seatData => {
            const seat = createSeat(seatData.x, seatData.y, seatData.label);
            seatingChart.push(seat);
            chartContainer.appendChild(seat);
        });

        // Update groups
        updateGroups();

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Failed to load chart:', err);
            alert('Failed to load the chart. Please try again.');
        }
    }
} 