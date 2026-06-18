class NoCacheAPIMiddleware:
    """Empêche le navigateur de mettre en cache les réponses de l'API.

    Sans cet en-tête, certains navigateurs réutilisent une réponse GET déjà
    mise en cache (ex: /api/client/reservations/) même après une reconnexion
    avec un compte différent dans le même onglet, car la requête a la même
    URL — seul l'en-tête Authorization change, ce qui n'invalide pas le cache
    par défaut.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
        return response
