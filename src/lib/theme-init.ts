// Run before first paint in every root layout, including the global 404.
export const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('opskit-theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();
`;
