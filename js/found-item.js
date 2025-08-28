function fillReportForm(itemId) {
    // Sample lost items data (in a real application, this would come from a database)
    const lostItems = {
        'wallet-1': {
            type: 'accessories',
            location: 'Central Park Mall',
            description: 'Black leather wallet with brown stitching'
        },
        'backpack-1': {
            type: 'accessories',
            location: 'University Campus',
            description: 'Blue backpack containing laptop and books'
        },
        'passport-1': {
            type: 'documents',
            location: 'Airport Terminal 3',
            description: 'Blue international passport'
        },
        'camera-1': {
            type: 'electronics',
            location: 'City Park',
            description: 'Canon DSLR camera with attached lens'
        },
        'keys-1': {
            type: 'accessories',
            location: 'Shopping Mall',
            description: 'Car keys with distinctive red keychain'
        },
        'sunglasses-1': {
            type: 'accessories',
            location: 'Beach Area',
            description: 'Designer Ray-Ban sunglasses in black case'
        },
        'ring-1': {
            type: 'jewelry',
            location: 'Restaurant',
            description: 'Diamond engagement ring in white gold setting'
        },
        'macbook-1': {
            type: 'electronics',
            location: 'Coffee Shop',
            description: '16-inch Silver MacBook Pro'
        },
        'watch-1': {
            type: 'accessories',
            location: 'Gym',
            description: 'Silver Rolex wristwatch'
        },
        'headphones-1': {
            type: 'electronics',
            location: 'Bus Station',
            description: 'Black wireless headphones'
        },
        'ipad-1': {
            type: 'electronics',
            location: 'Library',
            description: 'iPad Pro with black case'
        },
        'iphone-1': {
            type: 'electronics',
            location: 'Metro Station',
            description: 'iPhone 13 Pro in blue color'
        }
    };


    const item = lostItems[itemId];
    if (item) {
        // Auto-fill the form fields
        document.getElementById('item-type').value = item.type;
        document.getElementById('found-location').value = item.location;
        document.getElementById('item-description').value = item.description;

        // Scroll to the form
        document.querySelector('.report-container').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize the form with today's date and current time
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    
    // Set today's date
    const dateInput = document.getElementById('found-date');
    dateInput.value = today.toISOString().split('T')[0];
    
    // Set current time
    const timeInput = document.getElementById('found-time');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
});
