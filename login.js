document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const messageDiv = document.getElementById('message');

    const LOGIN_API_URL = 'https://dilx-wa-bug-api.vercel.app/login';

    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage('Email dan password tidak boleh kosong!', 'error');
            return;
        }

        if (email === 'dilx' && password === '1') {
            showMessage('Login admin berhasil, mengalihkan...', 'success');
            sessionStorage.setItem('isAdmin', 'true');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
            return;
        }
        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });
            const data = await response.json();

            if (data.success) {
                showMessage('Login berhasil, mengalihkan...', 'success');
                sessionStorage.setItem('isLoggedIn', 'true');
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                showMessage(data.msg || 'Email atau password salah.', 'error');
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
