from rest_framework import permissions


class IsRestaurantAccount(permissions.BasePermission):
    """
    Permite acceso solo a usuarios autenticados con cuenta tipo restaurante.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        profile = getattr(user, "profile", None)
        return bool(profile and profile.account_type == "restaurant")


class IsRestaurantOwnerOrAdmin(permissions.BasePermission):
    """
    Permite modificación solo al dueño del restaurante o a un admin del sistema.
    """

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True

        restaurant = getattr(obj, "restaurant", obj)
        return getattr(restaurant, "owner_id", None) == request.user.id


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que solo permite a los propietarios de un objeto editarlo.
    Cualquier otro usuario puede leer el objeto.
    """

    def has_object_permission(self, request, view, obj):
        # Los permisos de lectura están permitidos para cualquier solicitud,
        # así que siempre permitiremos GET, HEAD o OPTIONS.
        if request.method in permissions.SAFE_METHODS:
            return True

        # El permiso de escritura solo se permite al propietario del objeto.
        # Soporta modelos con campo 'user' o 'owner'.
        owner_field = getattr(obj, "user", getattr(obj, "owner", None))
        return owner_field == request.user
