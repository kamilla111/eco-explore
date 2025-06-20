document.addEventListener('DOMContentLoaded', () => {
  const routeList = document.getElementById('route-list');
  const form = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const contactForm = document.getElementById('contact-form');
  const difficultyTabs = document.querySelectorAll('.difficulty-tab');

  let routes = [];
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  // Инициализация приложения
  initApp();

  async function initApp() {
    try {
      routes = await loadRoutes();
      renderRoutes(routes);
      initFavoritesSection();
      initScrollAnimations();
      setupEventListeners();
    } catch (error) {
      console.error('App initialization failed:', error);
      showErrorToast('Ошибка инициализации приложения');
    }
  }

  // Загрузка маршрутов
  async function loadRoutes() {
    try {
      const response = await fetch('./data/routes.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data?.length) {
        showEmptyState();
        throw new Error('Получены пустые данные');
      }
      return data;
    } catch (error) {
      console.error('Ошибка загрузки маршрутов:', error);
      showErrorToast('Не удалось загрузить маршруты. Показаны демо-данные.');
      return getFallbackData();
    }
  }

  function getFallbackData() {
    return [
      {
        "name": "Демо-маршрут",
        "difficulty": "easy",
        "description": "Пример маршрута, показываемый при ошибке загрузки",
        "image": "https://images.unsplash.com/photo-1476231682828-37e571bc172f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
    form.addEventListener('submit', handleSearch);
    contactForm.addEventListener('submit', handleContactSubmit);
    difficultyTabs.forEach(tab => {
      tab.addEventListener('click', () => filterByDifficulty(tab.dataset.difficulty));
    });
  }

  // Поиск маршрутов
  function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.toLowerCase();
    const difficulty = difficultyFilter.value;

    const filtered = routes.filter(route => {
      return (
        route.name.toLowerCase().includes(query) &&
        (difficulty === '' || route.difficulty === difficulty)
      );
    });

    renderRoutes(filtered);
  }

  // Фильтрация по сложности
  function filterByDifficulty(difficulty) {
    difficultyTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    const filtered = difficulty === 'all'
      ? routes
      : routes.filter(route => route.difficulty === difficulty);

    renderRoutes(filtered);
  }

  // Отправка контактной формы
  function handleContactSubmit(e) {
    e.preventDefault();
    showNotification("Спасибо за обращение! Мы свяжемся с вами.");
    contactForm.reset();
  }

  // Рендер маршрутов
  function renderRoutes(routesToRender) {
    routeList.innerHTML = '';

    if (!routesToRender?.length) {
      showEmptyState();
      return;
    }

    routesToRender.forEach(route => {
      const isFavorite = favorites.includes(route.name);
      const card = document.createElement('div');
      card.className = 'route-card';
      card.dataset.difficulty = route.difficulty;
      card.innerHTML = `
        <div class="card-image" style="background-image: url('${route.image}')">
          <span class="difficulty-badge ${route.difficulty}">${translateDifficulty(route.difficulty)}</span>
        </div>
        <div class="card-content">
          <h4>${route.name}</h4>
          <p>${route.description}</p>
          <div class="card-actions">
            <button class="details-btn" onclick="showModal('${route.name}', '${route.description}', '${route.image}')">
              Подробнее
            </button>
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${route.name}', this)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
      routeList.appendChild(card);
    });
  }

  // Показать состояние "Нет данных"
  function showEmptyState() {
    routeList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h4>Маршруты не найдены</h4>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    `;
  }

  // Инициализация раздела "Избранное"
  function initFavoritesSection() {
    const favoritesBtn = document.createElement('li');
    favoritesBtn.innerHTML = '<a href="#favorites" id="favorites-link">Избранное</a>';
    document.querySelector('.nav ul').appendChild(favoritesBtn);

    document.getElementById('favorites-link').addEventListener('click', () => {
      const favoriteRoutes = routes.filter(route => favorites.includes(route.name));
      renderRoutes(favoriteRoutes.length ? favoriteRoutes : []);
      document.getElementById('route-list').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Анимации при скролле
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
      observer.observe(section);
    });
  }

  // Уведомления
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('hide');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  // Перевод сложности
  function translateDifficulty(level) {
    const difficulties = {
      'easy': 'Лёгкий',
      'medium': 'Средний',
      'hard': 'Сложный'
    };
    return difficulties[level] || 'Неизвестно';
  }
});

// Глобальные функции

// Переключение избранного
window.toggleFavorite = function(routeName, button) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const index = favorites.indexOf(routeName);

  if (index === -1) {
    favorites.push(routeName);
    if (button) {
      button.classList.add('active');
      const icon = button.querySelector('svg');
      if (icon) icon.setAttribute('fill', 'currentColor');
    }
    showNotification(`${routeName} добавлен в избранное!`);
  } else {
    favorites.splice(index, 1);
    if (button) {
      button.classList.remove('active');
      const icon = button.querySelector('svg');
      if (icon) icon.setAttribute('fill', 'none');
    }
    showNotification(`${routeName} удален из избранного`, 'info');
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoriteButtons(routeName);
}

// Обновление всех кнопок избранного
function updateFavoriteButtons(routeName) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const isFavorite = favorites.includes(routeName);

  // Обновляем кнопки в карточках
  document.querySelectorAll(`.favorite-btn[onclick*="${routeName}"]`).forEach(btn => {
    btn.classList.toggle('active', isFavorite);
    const icon = btn.querySelector('svg');
    if (icon) icon.setAttribute('fill', isFavorite ? 'currentColor' : 'none');
  });

  // Обновляем кнопку в модальном окне
  const modalBtn = document.querySelector(`.modal-favorite-btn[onclick*="${routeName}"]`);
  if (modalBtn) {
    const icon = modalBtn.querySelector('svg');
    if (icon) icon.setAttribute('fill', isFavorite ? 'currentColor' : 'none');
    modalBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      ${isFavorite ? 'В избранном' : 'В избранное'}
    `;
  }
}

// Модальное окно
window.showModal = function(title, description, image) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const isFavorite = favorites.includes(title);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <div class="modal-image" style="background-image: url('${image}')"></div>
      <div class="modal-body">
        <h2>${title}</h2>
        <p>${description}</p>
        <div class="modal-actions">
          <button class="modal-favorite-btn" onclick="toggleFavorite('${title}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            ${isFavorite ? 'В избранном' : 'В избранное'}
          </button>
          <button class="modal-close-btn">Закрыть</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  modal.querySelector('.close-btn').onclick = () => closeModal(modal);
  modal.querySelector('.modal-close-btn').onclick = () => closeModal(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
}

// Закрытие модального окна
function closeModal(modal) {
  modal.classList.add('fade-out');
  setTimeout(() => {
    document.body.removeChild(modal);
    document.body.style.overflow = '';
  }, 300);
}