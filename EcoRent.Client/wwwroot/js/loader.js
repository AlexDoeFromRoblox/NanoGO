class BlazorLoader {
    constructor() {
        this.loaderElement = document.getElementById('blazor-loading');
        this.progressBar = this.loaderElement?.querySelector('.progress-bar');
        this.progressText = this.loaderElement?.querySelector('.progress-text');
        this.resourcesLoaded = 0;
        this.totalResources = 0;

        console.log('BlazorLoader создан. Начинаем инициализацию.');
        this.initBlazor();
    }

    async initBlazor() {
        try {
            console.log('Начало инициализации Blazor...');
            // Загружаем конфигурацию
            const bootConfig = await this.loadBootConfig();
            console.log('Конфигурация загружена:', bootConfig);

            this.totalResources = Math.max(1, this.countResources(bootConfig)); // Обеспечение корректного значения
            console.log(`Всего ресурсов для загрузки: ${this.totalResources}`);

            // Настройка загрузчика ресурсов
            const resourceLoader = (type, name, uri, integrity) => {
                console.log(`Загрузка ресурса. Тип: ${type}, Имя: ${name}, URI: ${uri}`);
                if (type === 'dotnetjs' || name === 'blazor.boot.json') {
                    return uri; // Системные ресурсы
                }
                return this.loadResourceWithProgress(uri, integrity);
            };

            // Запуск Blazor
            await Blazor.start({ loadBootResource: resourceLoader });
            console.log('Blazor успешно запущен.');

            // Завершение загрузки
            this.finishLoading();
        } catch (error) {
            console.error('Ошибка при инициализации Blazor:', error);
            this.showError(error);
        }
    }

    async loadBootConfig() {
        console.log('Загрузка конфигурации из _framework/blazor.boot.json...');
        const response = await fetch('_framework/blazor.boot.json');
        if (!response.ok) throw new Error('Не удалось загрузить конфигурацию');
        const json = await response.json();
        console.log('Конфигурация успешно загружена.');
        return json;
    }

    countResources(config) {
        if (!config || !config.resources) {
            console.error('Неверная конфигурация ресурсов:', config);
            return 0;
        }

        const assemblyCount = Object.keys(config.resources.assembly || {}).length;
        const pdbCount = Object.keys(config.resources.pdb || {}).length;
        const runtimeCount = Object.keys(config.resources.runtime || {}).length;
        const satelliteCount = Object.keys(config.resources.satelliteResources || {}).length;

        console.log(`Ресурсы: Assembly - ${assemblyCount}, PDB - ${pdbCount}, Runtime - ${runtimeCount}, Satellite - ${satelliteCount}`);
        return assemblyCount + pdbCount + runtimeCount + satelliteCount;
    }

    async loadResourceWithProgress(uri, integrity) {
        this.resourcesLoaded++;
        console.log(`Начата загрузка ресурса: ${uri}, Integrity: ${integrity}`);

        try {
            const response = await fetch(uri, { integrity });
            if (!response.ok) throw new Error(`HTTP ${response.status} при загрузке ${uri}`);

            const contentLength = parseInt(response.headers.get('content-length')) || 100000;
            let loaded = 0;

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Тело ответа не поддерживает поток.');

            const stream = new ReadableStream({
                start: (controller) => {
                    console.log(`Чтение данных из ресурса ${uri} начато.`);

                    const read = async () => {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                controller.close();
                                console.log(`Загрузка ресурса ${uri} завершена.`);
                                break;
                            }
                            loaded += value.length;
                            this.updateProgress(loaded, contentLength); // Исправлено
                            controller.enqueue(value);
                            console.log(`Загружено ${loaded}/${contentLength} байт для ${uri}`);
                        }
                    };

                    read().catch((error) => {
                        console.error(`Ошибка чтения ресурса ${uri}:`, error);
                        controller.error(error);
                    });
                },
                cancel(reason) {
                    console.error(`Отмена загрузки ресурса ${uri}: ${reason}`);
                }
            });


            return new Response(stream, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText
            });
        } catch (error) {
            console.error(`Ошибка загрузки ресурса ${uri}:`, error);
            return uri; // Возврат URI для повторной попытки
        }
    }

    updateProgress(loaded, total) {
        if (!this.progressBar || !this.progressText) {
            console.warn('Элементы прогресса не найдены.');
            return;
        }

        const fileRatio = loaded / total;
        const globalProgress = this.resourcesLoaded / this.totalResources;
        const totalProgress = Math.min(99, (globalProgress + fileRatio / this.totalResources) * 100);

        console.log(`Обновление прогресса: загружено ${loaded} из ${total}, общий прогресс: ${totalProgress.toFixed(0)}%.`);
        this.progressBar.style.width = `${totalProgress.toFixed(0)}%`;
        this.progressText.textContent = `${totalProgress.toFixed(0)}%`;
    }

    finishLoading() {
        console.log('Загрузка завершена. Скрытие элемента загрузчика.');
        this.updateProgress(100, 100);
        if (this.loaderElement) {
            setTimeout(() => {
                this.loaderElement.style.transition = 'opacity 0.5s ease-out';
                this.loaderElement.style.opacity = '0';
                setTimeout(() => {
                    this.loaderElement.remove();
                    console.log('Элемент загрузчика удалён.');
                }, 500);
            }, 500);
        } else {
            console.warn('Элемент загрузчика не найден.');
        }
    }

    showError(error) {
        console.error('Ошибка запуска Blazor:', error);
        if (this.loaderElement) {
            this.loaderElement.innerHTML = `
                <div class="error-message">
                    <h2>Ошибка загрузки</h2>
                    <p>${error.message || 'Не удалось загрузить приложение'}</p>
                    <button onclick="window.location.reload()">⟳ Обновить страницу</button>
                </div>
            `;
        } else {
            console.error('Элемент загрузчика для отображения ошибки не найден.');
        }
    }
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM полностью загружен. Инициализация BlazorLoader...');
    new BlazorLoader();
});
