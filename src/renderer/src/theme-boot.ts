try {
  if (typeof window !== 'undefined') {
    const dark = localStorage.getItem('dark') === '1'
    if (dark) document.documentElement.classList.add('dark')
  }
} catch {}
