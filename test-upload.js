// Test script to debug file upload issue
// This can be run in browser console to test upload directly

async function testFileUpload() {
    // Create a test file
    const testContent = 'test file content';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('path', testFile);
    
    const token = localStorage.getItem('access_token');
    
    console.log('Testing file upload...');
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'None');
    
    try {
        const response = await fetch('/api/files/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // NO Content-Type header - let browser set it
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response content-type:', response.headers.get('content-type'));
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        if (response.ok) {
            const result = JSON.parse(responseText);
            console.log('Upload successful:', result);
            return result;
        } else {
            console.error('Upload failed:', responseText);
            return null;
        }
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// Run the test
testFileUpload();