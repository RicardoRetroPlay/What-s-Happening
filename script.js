
// =========================================================================
// !!! ACTION REQUIRED: REPLACE THESE PLACEHOLDERS WITH YOUR API GATEWAY URLs
// =========================================================================
const API_BASE_URL = 'https://8yb68v5fef.execute-api.us-west-2.amazonaws.com/v1';
const SUBSCRIBE_ENDPOINT = `${API_BASE_URL}/subscribe`;
const CREATE_EVENT_ENDPOINT = `${API_BASE_URL}/create-event`;
// The events.json file is hosted on your Amplify/S3 bucket
const EVENTS_DATA_URL = 'https://eventstorage2.s3.us-west-2.amazonaws.com/events.json'; 
// =========================================================================

const statusMessage = document.getElementById('status-message');

/** Displays a temporary success or error message */
function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'error' : 'success';
    statusMessage.classList.remove('hidden');
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}

/** 1. Load and display events from events.json */
async function loadEvents() {
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = ''; // Clear loading message

    try {
        const response = await fetch(EVENTS_DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        if (events.length === 0) {
            eventsContainer.innerHTML = '<p>No upcoming events announced yet.</p>';
            return;
        }

        // Sort events by date (newest first for a simple list)
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <h3>${event.title}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p>${event.description}</p>
            `;
            eventsContainer.appendChild(card);
        });

    } catch (error) {
        eventsContainer.innerHTML = `<p class="error">Failed to load events. Error: ${error.message}</p>`;
        console.error("Error loading events:", error);
    }
}

/** 2. Handle Subscription Form Submission */
document.getElementById('subscribe-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('subscriber-email').value;
    
    try {
        const response = await fetch(SUBSCRIBE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus(data.message || 'Subscription request successful! Check your email to confirm.', false);
            document.getElementById('subscribe-form').reset();
        } else {
            showStatus(data.error || 'Subscription failed.', true);
        }

    } catch (error) {
        showStatus('Network error during subscription.', true);
        console.error("Subscription error:", error);
    }
});

/** 3. Handle Event Creation Form Submission */
document.getElementById('create-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newEvent = {
        title: document.getElementById('event-title').value,
        date: document.getElementById('event-date').value,
        description: document.getElementById('event-description').value
    };

    try {
        const response = await fetch(CREATE_EVENT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvent)
        });

        const data = await response.json();

        if (response.ok) {
            showStatus(data.message || 'Event announced successfully! Subscribers notified.', false);
            document.getElementById('create-event-form').reset();
            // Reload the event list to show the new event
            await loadEvents(); 
        } else {
            showStatus(data.message || 'Failed to announce event.', true);
        }

    } catch (error) {
        showStatus('Network error during event announcement.', true);
        console.error("Event creation error:", error);
    }
});

// Load events when the page initializes
document.addEventListener('DOMContentLoaded', loadEvents);