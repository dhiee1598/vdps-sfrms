export default defineNuxtRouteMiddleware(() => {
  const session = useUserSession();

  if (session.loggedIn.value) {
    return navigateTo('/dashboard');
  }
});
