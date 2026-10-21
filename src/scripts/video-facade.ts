// Click-to-load YouTube player: nothing is requested from YouTube until the visitor asks for the video.
// Markup: src/components/content/VideoFacade.astro

export function initVideoFacades() {
  for (const facade of document.querySelectorAll<HTMLElement>('[data-video-facade]')) {
    const button = facade.querySelector('button');
    button?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${facade.dataset.videoId}?autoplay=1&rel=0`;
      iframe.title = facade.dataset.videoTitle ?? '';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'video-facade__player';
      facade.replaceChildren(iframe);
      iframe.focus();
    });
  }
}
