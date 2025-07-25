document.addEventListener('DOMContentLoaded', () => {
    const newEmailInput = document.getElementById('newEmail');
    const newPasswordInput = document.getElementById('newPassword');
    const waktuInput = document.getElementById('waktu');
    const addUserBtn = document.getElementById('addUserBtn');
    const messageDiv = document.getElementById('message');
    const logoutBtn = document.getElementById('logoutBtn');

    const REGISTER_API_URL = 'http://206.189.93.164:2011/register';

    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    addUserBtn.addEventListener('click', async () => {
        const email = newEmailInput.value;
        const password = newPasswordInput.value;
        const waktu = waktuInput.value;
        
        if (!email || !password || !waktu) {
            showMessage('Semua kolom harus diisi!', 'error');
            return;
        }

        try {
            const response = await fetch(REGISTER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, waktu })
            });
            const data = await response.json();
            
            showMessage(data.msg, data.success ? 'success' : 'error');
            
            if(data.success){
                newEmailInput.value = '';
                newPasswordInput.value = '';
                waktuInput.value = '';
            }
        } catch (error) {
            showMessage('Gagal terhubung ke server.', 'error');
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = type;
    }
});
