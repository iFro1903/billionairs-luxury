export const config = {
    runtime: 'edge'
};

// SHA-1 hash function for Edge Runtime
async function sha1(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file');
        
        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get Cloudinary credentials from environment
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'd8s8a93z';
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!apiKey || !apiSecret) {
            return new Response(JSON.stringify({ error: 'Cloudinary credentials not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64File = btoa(binary);
        const dataURI = `data:${file.type};base64,${base64File}`;

        // Generate timestamp and signature
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = await sha1(`timestamp=${timestamp}${apiSecret}`);

        // Upload to Cloudinary
        const uploadData = new FormData();
        uploadData.append('file', dataURI);
        uploadData.append('timestamp', timestamp.toString());
        uploadData.append('signature', signature);
        uploadData.append('api_key', apiKey);

        const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            {
                method: 'POST',
                body: uploadData
            }
        );

        if (!cloudinaryResponse.ok) {
            const errorText = await cloudinaryResponse.text();
            console.error('Cloudinary error:', errorText);
            return new Response(JSON.stringify({ error: 'Upload failed', details: errorText }), {
                status: cloudinaryResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await cloudinaryResponse.json();

        return new Response(JSON.stringify({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ 
            error: 'Upload failed', 
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
