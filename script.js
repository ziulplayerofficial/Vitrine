/**
 * ==========================================================================
 * VITRINE CASA E LAR — JAVASCRIPT PURO
 * ==========================================================================
 * Este arquivo controla todas as interações dinâmicas da vitrine:
 * 1. Filtros de categoria por clique (detecta automaticamente os cards no HTML)
 * 2. Busca rápida de produtos em tempo real
 * 3. Modal detalhado com galeria de fotos e slider interativo
 * 4. Efeito de hover suave com troca de foto
 * 5. Alternador de tema visual (Chocolate Quente / Oliva Nobre da logo)
 * 
 * ATENÇÃO: Nenhum produto precisa ser cadastrado aqui!
 * Os produtos são lidos diretamente do HTML da página.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initCategoryFilters();
  initSearch();
  initProductCardEvents();
  initModalAndGallery();
  initThemeSwitcher();
});

/* ==========================================================================
   1. CONFIGURAÇÃO DOS FILTROS DE CATEGORIA
   ========================================================================== */
function initCategoryFilters() {
  const filterElements = document.querySelectorAll('.category-card, .filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  // Atualiza os contadores numéricos nos cards/botões de filtro automaticamente
  updateFilterCounters(productCards);

  filterElements.forEach(element => {
    element.addEventListener('click', () => {
      // Remove a classe 'active' de todos e adiciona no clicado
      filterElements.forEach(el => el.classList.remove('active'));
      element.classList.add('active');

      const targetCategory = element.getAttribute('data-filter') || 'todos';
      filterProductsByCategory(targetCategory);
    });
  });
}

function updateFilterCounters(cards) {
  const counts = { todos: cards.length };

  cards.forEach(card => {
    const cat = (card.getAttribute('data-category') || '').toLowerCase().trim();
    const isOffer = card.getAttribute('data-offer') === 'true' || cat.includes('oferta');
    if (cat) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
    if (isOffer) {
      counts['ofertas'] = (counts['ofertas'] || 0) + 1;
    }
  });

  const filterElements = document.querySelectorAll('.category-card, .filter-btn');
  filterElements.forEach(el => {
    const filter = (el.getAttribute('data-filter') || 'todos').toLowerCase();
    const countBadge = el.querySelector('.category-card-count, .filter-count');
    if (countBadge) {
      const val = counts[filter] !== undefined ? counts[filter] : 0;
      countBadge.textContent = `${val} ${val === 1 ? 'item' : 'itens'}`;
    }
  });
}

function filterProductsByCategory(category) {
  const cards = document.querySelectorAll('.product-card');
  const noProductsMsg = document.getElementById('no-products-msg');
  let visibleCount = 0;

  cards.forEach(card => {
    const cardCat = (card.getAttribute('data-category') || '').toLowerCase().trim();
    const isSpecialOffer = card.getAttribute('data-offer') === 'true';

    let shouldShow = false;

    if (category === 'todos') {
      shouldShow = true;
    } else if (category === 'ofertas') {
      shouldShow = isSpecialOffer || cardCat.includes('oferta');
    } else {
      shouldShow = cardCat === category;
    }

    if (shouldShow) {
      card.style.display = 'flex';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.96)';
      setTimeout(() => {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, 30);
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (noProductsMsg) {
    noProductsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

/* ==========================================================================
   2. BUSCA RÁPIDA DE PRODUTOS
   ========================================================================== */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    const noProductsMsg = document.getElementById('no-products-msg');
    let visibleCount = 0;

    // Se o usuário digitar algo, desmarca os botões de filtro e foca na busca
    if (query.length > 0) {
      const allFilterBtn = document.querySelector('.category-card[data-filter="todos"], .filter-btn[data-filter="todos"]');
      if (allFilterBtn) {
        document.querySelectorAll('.category-card, .filter-btn').forEach(btn => btn.classList.remove('active'));
        allFilterBtn.classList.add('active');
      }
    }

    cards.forEach(card => {
      const name = (card.getAttribute('data-name') || card.querySelector('.product-title')?.textContent || '').toLowerCase();
      const desc = (card.getAttribute('data-description') || card.querySelector('.product-description')?.textContent || '').toLowerCase();
      const cat = (card.getAttribute('data-category') || '').toLowerCase();

      if (name.includes(query) || desc.includes(query) || cat.includes(query)) {
        card.style.display = 'flex';
        card.style.opacity = '1';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noProductsMsg) {
      noProductsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  });
}

/* ==========================================================================
   3. EFEITO DE HOVER & INTERAÇÃO COM OS CARDS
   ========================================================================== */
function initProductCardEvents() {
  // Pré-carrega suavemente as imagens secundárias para transição instantânea
  const secondaryImages = document.querySelectorAll('.product-image-box .img-secondary');
  secondaryImages.forEach(img => {
    if (img && img.src) {
      const preloadImg = new Image();
      preloadImg.src = img.src;
    }
  });

  // Previne que clicar no botão de compra abra o modal de detalhes
  document.querySelectorAll('.product-buttons a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

/* ==========================================================================
   4. MODAL DE PRODUTO & SLIDER DE IMAGENS
   ========================================================================== */
let currentImages = [];
let currentImageIndex = 0;

function initModalAndGallery() {
  const modalBackdrop = document.getElementById('product-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');

  if (!modalBackdrop) return;

  // Delegação de evento: Qualquer clique em um card de produto abre o modal
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    // Não abre se o clique foi direto num botão de link de compra
    if (card && !e.target.closest('.product-buttons')) {
      openProductModal(card);
    }
  });

  // Fechar com botão X
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProductModal);
  }

  // Fechar clicando fora da caixa do modal (no fundo escurecido)
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeProductModal();
    }
  });

  // Fechar pressionando a tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      closeProductModal();
    }
    // Navegar fotos no slider com setas do teclado
    if (modalBackdrop.classList.contains('active')) {
      if (e.key === 'ArrowLeft') navigateSlider(-1);
      if (e.key === 'ArrowRight') navigateSlider(1);
    }
  });

  // Controles do Slider
  if (prevBtn) prevBtn.addEventListener('click', () => navigateSlider(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateSlider(1));
}

function openProductModal(card) {
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Lê as informações diretamente dos atributos do card HTML
  const name = card.getAttribute('data-name') || card.querySelector('.product-title')?.textContent || 'Produto';
  const category = card.getAttribute('data-category') || card.querySelector('.product-category')?.textContent || 'Casa & Lar';
  const description = card.getAttribute('data-description') || card.querySelector('.product-description')?.textContent || '';
  const specs = card.getAttribute('data-specs') || '';
  const price = card.getAttribute('data-price') || card.querySelector('.product-price')?.textContent || '';
  const installments = card.getAttribute('data-installments') || card.querySelector('.product-installments')?.textContent || 'em até 3x sem juros';
  const shopeeLink = card.getAttribute('data-shopee') || card.querySelector('.btn-shopee')?.getAttribute('href') || '';
  const tiktokLink = card.getAttribute('data-tiktok') || card.querySelector('.btn-tiktok')?.getAttribute('href') || '';
  const mlLink = card.getAttribute('data-mercadolivre') || card.getAttribute('data-ml') || card.querySelector('.btn-mercadolivre')?.getAttribute('href') || '';

  // Coleta as fotos do produto (foto 1, foto 2 e data-images extras se existirem)
  const img1 = card.querySelector('.img-primary')?.src || '';
  const img2 = card.querySelector('.img-secondary')?.src || '';
  const extraImagesAttr = card.getAttribute('data-images') || '';

  currentImages = [];
  if (img1) currentImages.push(img1);
  if (img2 && img2 !== img1) currentImages.push(img2);

  if (extraImagesAttr) {
    const extras = extraImagesAttr.split(',').map(s => s.trim()).filter(Boolean);
    extras.forEach(url => {
      if (!currentImages.includes(url)) {
        currentImages.push(url);
      }
    });
  }

  // Se por ventura não tiver imagem, adiciona um fallback seguro
  if (currentImages.length === 0) {
    currentImages.push('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80');
  }

  currentImageIndex = 0;

  // Preenche os campos textuais no modal
  const modalCatEl = document.getElementById('modal-category');
  const modalTitleEl = document.getElementById('modal-title');
  const modalDescEl = document.getElementById('modal-desc');
  const modalSpecsEl = document.getElementById('modal-specs-container');
  const modalPriceEl = document.getElementById('modal-price');
  const modalInstallmentsEl = document.getElementById('modal-installments');
  const modalPriceBoxEl = document.getElementById('modal-price-box');

  if (modalCatEl) modalCatEl.textContent = category;
  if (modalTitleEl) modalTitleEl.textContent = name;
  if (modalDescEl) modalDescEl.textContent = description;

  if (modalPriceBoxEl) {
    if (price) {
      modalPriceBoxEl.style.display = 'flex';
      if (modalPriceEl) modalPriceEl.textContent = price;
      if (modalInstallmentsEl) modalInstallmentsEl.textContent = installments;
    } else {
      modalPriceBoxEl.style.display = 'none';
    }
  }

  // Preenche as especificações se existirem
  if (modalSpecsEl) {
    if (specs) {
      modalSpecsEl.style.display = 'flex';
      const items = specs.split('|').map(s => s.trim()).filter(Boolean);
      modalSpecsEl.innerHTML = items.map(item => {
        const parts = item.split(':');
        if (parts.length > 1) {
          return `
            <div class="spec-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span><strong>${parts[0].trim()}:</strong> ${parts.slice(1).join(':').trim()}</span>
            </div>
          `;
        }
        return `
          <div class="spec-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${item}</span>
          </div>
        `;
      }).join('');
    } else {
      modalSpecsEl.style.display = 'none';
    }
  }

  // Preenche os botões de compra (Shopee, TikTok e Mercado Livre)
  // Regra: Mostra apenas se o link existir, sem espaços vazios!
  const shopeeBtn = document.getElementById('modal-btn-shopee');
  const tiktokBtn = document.getElementById('modal-btn-tiktok');
  const mlBtn = document.getElementById('modal-btn-mercadolivre');

  const validShopee = shopeeLink && shopeeLink !== '#' && !shopeeLink.includes('LINK_DA_SHOPEE');
  const validTiktok = tiktokLink && tiktokLink !== '#' && !tiktokLink.includes('LINK_DO_TIKTOK');
  const validMl = mlLink && mlLink !== '#' && !mlLink.includes('LINK_DO_MERCADO_LIVRE');

  if (shopeeBtn) {
    if (validShopee) {
      shopeeBtn.style.display = 'inline-flex';
      shopeeBtn.href = shopeeLink;
    } else {
      shopeeBtn.style.display = 'none';
    }
  }

  if (mlBtn) {
    if (validMl) {
      mlBtn.style.display = 'inline-flex';
      mlBtn.href = mlLink;
    } else {
      mlBtn.style.display = 'none';
    }
  }

  if (tiktokBtn) {
    if (validTiktok) {
      tiktokBtn.style.display = 'inline-flex';
      tiktokBtn.href = tiktokLink;
    } else {
      tiktokBtn.style.display = 'none';
    }
  }

  // Se nenhum link estiver configurado, exibe botão informativo
  const fallbackBtn = document.getElementById('modal-btn-fallback');
  if (fallbackBtn) {
    if (!validShopee && !validTiktok && !validMl) {
      fallbackBtn.style.display = 'inline-flex';
    } else {
      fallbackBtn.style.display = 'none';
    }
  }

  // Monta a galeria e as miniaturas do slider
  buildSliderThumbs();
  updateSliderDisplay();

  // Exibe o modal
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// Atualiza a foto principal exibida no modal
function updateSliderDisplay() {
  const mainImg = document.getElementById('slider-main-img');
  const counter = document.getElementById('slider-counter');
  const thumbs = document.querySelectorAll('.thumb-item');

  if (mainImg && currentImages[currentImageIndex]) {
    mainImg.style.opacity = '0.4';
    mainImg.src = currentImages[currentImageIndex];
    setTimeout(() => {
      mainImg.style.opacity = '1';
    }, 100);
  }

  if (counter) {
    counter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
  }

  thumbs.forEach((thumb, idx) => {
    if (idx === currentImageIndex) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

// Navega entre as fotos (< e >)
function navigateSlider(direction) {
  if (currentImages.length <= 1) return;
  currentImageIndex += direction;
  if (currentImageIndex < 0) {
    currentImageIndex = currentImages.length - 1;
  } else if (currentImageIndex >= currentImages.length) {
    currentImageIndex = 0;
  }
  updateSliderDisplay();
}

// Cria a linha de miniaturas abaixo da foto principal
function buildSliderThumbs() {
  const thumbsContainer = document.getElementById('slider-thumbs');
  if (!thumbsContainer) return;

  thumbsContainer.innerHTML = '';

  if (currentImages.length <= 1) {
    thumbsContainer.style.display = 'none';
    return;
  }

  thumbsContainer.style.display = 'flex';

  currentImages.forEach((imgUrl, index) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${index === currentImageIndex ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${imgUrl}" alt="Miniatura ${index + 1}">`;
    thumb.addEventListener('click', () => {
      currentImageIndex = index;
      updateSliderDisplay();
    });
    thumbsContainer.appendChild(thumb);
  });
}

/* ==========================================================================
   5. TEMA VISUAL FIXO (CHOCOLATE DOURADO)
   ========================================================================== */
function initThemeSwitcher() {
  document.documentElement.removeAttribute('data-theme');
  try {
    localStorage.removeItem('vitrine_theme');
  } catch (e) {}
}
