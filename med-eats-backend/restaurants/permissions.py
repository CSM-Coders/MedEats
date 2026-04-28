from rest_framework import permissions

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
        owner_field = getattr(obj, 'user', getattr(obj, 'owner', None))
        return owner_field == request.user
