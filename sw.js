const STATIC_CACHE_NAME = 'avocado-static-v5.3.0';
const DYNAMIC_CACHE_NAME = 'avocado-dynamic-v5.3.0';

const APP_SHELL_FILES = [
    './',
    './index.html',
    './css/style.css',
    './manifest.json',
    './data/data.js',
    './data/logo.svg',
    './data/logo-192.png',
    './data/logo-512.png',
    './js/config.js',
    './js/utils.js',
    './js/app/state.js',
    './js/app/main.js',
    './js/core/data_processor.js',
    './js/core/t2_criteria_manager.js',
    './js/core/study_criteria_manager.js',
    './js/services/statistics_service.js',
    './js/services/brute_force_manager.js',
    './js/services/export_service.js',
    './js/services/publication_service.js',
    './js/services/publication_service/publication_helpers.js',
    './js/services/publication_service/generators/title_page_generator.js',
    './js/services/publication_service/generators/abstract_generator.js',
    './js/services/publication_service/generators/introduction_generator.js',
    './js/services/publication_service/generators/methods_generator.js',
    './js/services/publication_service/generators/results_generator.js',
    './js/services/publication_service/generators/discussion_generator.js',
    './js/services/publication_service/generators/references_generator.js',
    './js/services/publication_service/generators/stard_generator.js',
    './js/ui/components/ui_components.js',
    './js/ui/components/table_renderer.js',
    './js/ui/components/chart_renderer.js',
    './js/ui/components/flowchart_renderer.js',
    './js/ui/tabs/data_tab.js',
    './js/ui/tabs/analysis_tab.js',
    './js/ui/tabs/statistics_tab.js',
    './js/ui/tabs/comparison_tab.js',
    './js/ui/tabs/insights_tab.js',
    './js/ui/tabs/publication_tab.js',
    './js/ui/tabs/export_tab.js',
    './js/ui/ui_manager.js',
    './js/ui/event_manager.js',
    './workers/brute_force_worker.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(cache => {
            return cache.addAll(APP_SHELL_FILES);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin && APP_SHELL_FILES.includes(requestUrl.pathname)) {
        event.respondWith(
            caches.open(STATIC_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return response || fetchPromise;
                });
            })
        );
    } else {
        event.respondWith(
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                return fetch(event.request).then(networkResponse => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    return cache.match(event.request);
                });
            })
        );
    }
});
