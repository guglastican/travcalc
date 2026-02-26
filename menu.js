class SiteHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
      <header>
        <div class="header-container">
          <div id="travelCalculatorLogo" class="logo">Travel Calculator</div>
          <button class="menu-toggle" aria-label="Toggle navigation">
            <span class="hamburger"></span>
          </button>
        </div>
        <nav class="main-nav">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/turnaround-time-calculator">Turnaround Calculator</a></li>
            <li><a href="/distance">Distance Calculator</a></li>
            <li><a href="/places">Places</a></li>
          </ul>
        </nav>
      </header>
    `;

        // Mobile menu toggle
        const menuToggle = this.querySelector('.menu-toggle');
        const mainNav = this.querySelector('.main-nav');

        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
    }
}

customElements.define('site-header', SiteHeader);
