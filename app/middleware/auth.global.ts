export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { user, fetch, loggedIn } = useUserSession();

  const publicRoutes = ['/', '/auth/login'];

  if (user.value) {
    if (publicRoutes.includes(to.path)) {
      switch (user.value.role) {
        case 'admin':
          return navigateTo('/dashboard');
        case 'cashier':
          return navigateTo('/cashier');
      }
    }

    const userRole = user.value.role;

    if (to.path.startsWith('/dashboard') && userRole !== 'admin') {
      return navigateTo('/cashier');
    }

    if (to.path.startsWith('/cashier') && userRole !== 'cashier') {
      return navigateTo('/dashboard');
    }
  }
  else {
    if (!publicRoutes.includes(to.path)) {
      await fetch();
      if (!loggedIn.value) {
        return navigateTo('/auth/login');
      }
    }
  }
});
