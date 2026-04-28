from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        # Datos de prueba globales
        self.user_data = {
            "email": "cliente@medeats.com",
            "username": "cliente_med",
            "password": "SecurePassword123!",
        }
        # Creamos el usuario base
        self.user = User.objects.create_user(**self.user_data)

        # URLs
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.profile_url = reverse("my-profile")

    # ---------------------------------------------------------
    # US02 – User Registration
    # ---------------------------------------------------------
    def test_registration_happy_path(self):
        """Happy Path: Registro exitoso devuelve 201 Created"""
        new_user = {
            "email": "nuevo_restaurante@medeats.com",
            "username": "restaurante_nuevo",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.register_url, new_user, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)

    def test_registration_alternative_flow_duplicate_email(self):
        """Flujo Alternativo: Retorna 400 Bad Request si el correo ya existe"""
        duplicate_user = {
            "email": "cliente@medeats.com",  # Correo duplicado
            "username": "otro_usuario",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.register_url, duplicate_user, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------------------------------------------------------
    # US03 – User Login
    # ---------------------------------------------------------
    def test_login_happy_path(self):
        """Happy Path: Genera token JWT al ingresar credenciales correctas"""
        login_data = {
            "username": "cliente_med",  # ¡Cambiado a username!
            "password": "SecurePassword123!",
        }
        response = self.client.post(self.login_url, login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_alternative_flow_wrong_password(self):
        """Flujo Alternativo: Retorna error con clave incorrecta"""
        login_data = {"username": "cliente_med", "password": "ClaveIncorrecta999"}
        response = self.client.post(self.login_url, login_data, format="json")
        # DRF puede retornar 400 o 401 dependiendo del serializador, aceptamos ambos
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED],
        )

    # ---------------------------------------------------------
    # US14 – View User Profile
    # ---------------------------------------------------------
    def test_view_profile_happy_path(self):
        """Happy Path: Muestra datos del usuario si está autenticado"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificamos simplemente que el JSON de respuesta contenga datos
        self.assertTrue(len(response.data) > 0)

    def test_view_profile_alternative_flow_unauthenticated(self):
        """Flujo Alternativo: Bloquea el acceso (401) si no hay token"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
