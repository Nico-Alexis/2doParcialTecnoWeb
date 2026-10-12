const API_KEY = '4dc5d8179a165a8aa355a7edcc8b12fd'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();

// ============================================================================
// El codigo agregado
// ============================================================================


//Los manejos de Error
const manejarError = (error) => {
    switch (error.message) {
        case 'ERROR_401':
            return 'API Key inválida';
        case 'NETWORK_ERROR':
            return 'Error de conexión';
        default:
            return 'Error al consultar la API';
    }
};

//LAs peticiones a la API
const obtenerSeriesPopulares = async () => {
    const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;
    let respuesta;

    try {
        respuesta = await fetch(url);
    } catch (error) {
        throw new Error('NETWORK_ERROR');
    }

    if (!respuesta.ok) {
        throw new Error(`ERROR_${respuesta.status}`);
    }

    const datos = await respuesta.json();
    return datos.results;
};

const buscarSeriesPorTexto = async (texto) => {
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(texto)}&language=es-ES`;
    let respuesta;

    try {
        respuesta = await fetch(url);
    } catch (error) {
        throw new Error('NETWORK_ERROR');
    }

    if (!respuesta.ok) {
        throw new Error(`ERROR_${respuesta.status}`);
    }

    const datos = await respuesta.json();
    return datos.results;
};

const obtenerDetalleSerie = async (id) => {
    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
    let respuesta;

    try {
        respuesta = await fetch(url);
    } catch (error) {
        throw new Error('NETWORK_ERROR');
    }

    if (!respuesta.ok) {
        throw new Error(`ERROR_${respuesta.status}`);
    }

    return await respuesta.json();
};

//Las tarjetas
const crearTarjetaSerie = (serie) => {
    const article = document.createElement('article');
    article.className = 'serie-card';

    const imagen = serie.poster_path ? IMAGE_URL + serie.poster_path : '';
    const anio = serie.first_air_date ? serie.first_air_date.substring(0, 4) : '';

    article.innerHTML = `
        <div class="serie-card__poster">
            <img class="serie-card__image"
                src="${imagen}"
                alt="${serie.name}"
                ${imagen ? '' : 'style="display:none"'}>
            <span class="serie-card__rating">★ ${serie.vote_average.toFixed(1)}</span>
        </div>
        <div class="serie-card__content">
            <h3 class="serie-card__title">${serie.name}</h3>
            <p class="serie-card__year">Año: ${anio}</p>
        </div>
    `;

    article.addEventListener('click', () => {
        abrirModal(serie.id);
    });

    return article;
};

const mostrarSeries = (series) => {
    seriesGrid.innerHTML = '';

    series.forEach(serie => {
        seriesGrid.appendChild(crearTarjetaSerie(serie));
    });

    resultsCount.textContent = `${series.length} resultados`;
};

//la carga y la busqueda de las series
const cargarSeriesPopulares = async () => {
    mostrarLoading();
    resultsTitle.textContent = 'Series Populares';
    resultsCount.textContent = '';

    try {
        const series = await obtenerSeriesPopulares();
        ocultarLoading();
        mostrarSeries(series);
    } catch (error) {
        mostrarError(manejarError(error));
    }
};

const buscarSeries = async () => {
    const texto = searchInput.value.trim();

    if (texto === '') {
        cargarSeriesPopulares();
        return;
    }

    mostrarLoading();
    resultsTitle.textContent = `Resultados para "${texto}"`;
    resultsCount.textContent = '';

    try {
        const series = await buscarSeriesPorTexto(texto);
        ocultarLoading();
        mostrarSeries(series);
    } catch (error) {
        mostrarError(manejarError(error));
    }
};

//los detalles de la serie
const abrirModal = async (id) => {
    modal.classList.add('modal--show');
    modalBody.innerHTML = '<p>Cargando detalles...</p>';

    try {
        const serie = await obtenerDetalleSerie(id);
        const generos = serie.genres.map(genero => genero.name).join(', ');

        modalBody.innerHTML = `
            <h2 class="modal__title">${serie.name}</h2>
            <p class="modal__subtitle">${serie.original_name}</p>
            <div class="modal__info">
                <span>Temporadas: ${serie.number_of_seasons}</span>
                <span>Episodios: ${serie.number_of_episodes}</span>
                <span>Géneros: ${generos}</span>
                <span>Estado: ${serie.status}</span>
            </div>
            <p class="modal__overview">${serie.overview || 'Sin sinopsis disponible.'}</p>
        `;
    } catch (error) {
        modalBody.innerHTML = `<p>${manejarError(error)}</p>`;
    }
};

const cerrarModal = () => {
    modal.classList.remove('modal--show');
};

//Los eventos de busqueda y los botones
searchInput.addEventListener('keyup', (evento) => {
    if (evento.key === 'Enter') {
        buscarSeries();
    }
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    cargarSeriesPopulares();
});

retryBtn.addEventListener('click', buscarSeries);

modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        cerrarModal();
    }
});

//EL inicio de la web
cargarSeriesPopulares();


