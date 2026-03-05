export const getUserIp = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        console.error("Failed to get IP:", e);
        // Fallback to a random ID stored in localStorage if IP fails
        let visitorId = localStorage.getItem('ncc_visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('ncc_visitor_id', visitorId);
        }
        return visitorId;
    }
};
