document.getElementById('send-button').addEventListener('click', sendMessage);

function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    console.log(userInput)
    if (userInput === '') return;

    // Display user's message
    displayMessage(userInput, 'user-message');

    // Clear input field
    document.getElementById('user-input').value = '';

    // Send the message to the backend
    fetch('http://localhost:8080/api/home', {
        method: 'POST', // Change this to POST if you want to send user input to Flask
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }), // Send user input as JSON
    })
    .then(response => response.json())
    .then(data => {
        // Display bot's response
        displayMessage(data.response, 'bot-message');
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage('There was an error processing your request.', 'bot-message');
    });
}

function displayMessage(message, className) {
    const messageContainer = document.getElementById('message-container');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);

    // Scroll to the bottom of the chat window
    messageContainer.scrollTop = messageContainer.scrollHeight;
}
