function initTutorialCarousel(container) {
    updateTutorialCarousel(container, 0);
}

function updateTutorialCarousel(container, currentSlide) {
    const element = container;
    if (element) {
        element.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
}

window.initTutorialCarousel = initTutorialCarousel;
window.updateTutorialCarousel = updateTutorialCarousel;