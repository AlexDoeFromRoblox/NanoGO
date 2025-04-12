class BlazorLoader {
    constructor() {
        this.progress = 0;
        this.maxProgress = 100;
        this.init();
    }

    async init() {
        this.setupErrorHandling();
        this.startProgressSimulation();

        try {
            await Blazor.start();
            this.hideLoader();
        } catch (error) {
            console.error('Blazor initialization failed:', error);
            this.showError();
        }
    }

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            this.showError();
        });
    }

    startProgressSimulation() {
        const interval = setInterval(() => {
            this.progress += Math.random() * 15;
            if (this.progress >= this.maxProgress) {
                this.progress = this.maxProgress;
                clearInterval(interval);
            }
            this.updateProgress(this.progress);
        }, 300);
    }

    updateProgress(percent) {
        const fill = document.querySelector('.progress-fill');
        const text = document.querySelector('.progress-text');

        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${Math.min(Math.round(percent), 100)}%`;
    }

    hideLoader() {
        const loader = document.getElementById('blazor-loading');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 500);
        }
    }

    showError() {
        const loader = document.getElementById('blazor-loading');
        if (loader) {
            loader.innerHTML = `
                <div class="error-state">
                    <h3>Ошибка загрузки</h3>
                    <p>Попробуйте обновить страницу</p>
                    <button onclick="window.location.reload()">Обновить</button>
                </div>
            `;
        }
    }
}
