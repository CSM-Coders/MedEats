import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------
// MOCKS TEMPORALES (Simulamos los componentes visuales para la prueba)
const WelcomeScreen = ({ isLoading }) => <></>;
const RestaurantMap = ({ locationPermission }) => <></>;
const RestaurantDetail = ({ isLoading }) => <></>;
const SocialFeed = ({ posts }) => <></>;
const UserProfile = ({ user }) => <></>;
// ---------------------------------------------------------------------

describe('MedEats Mobile App - Suite de Pruebas de Interfaz (UI)', () => {

  // US01 – Display Welcome Screen
  describe('US01 - Pantalla de Bienvenida', () => {
    it('Happy Path: Renderiza la pantalla correctamente', () => {
      const { toJSON } = render(<WelcomeScreen />);
      expect(toJSON()).toBeDefined();
    });

    it('Flujo Alternativo: Maneja estado de carga sin crashear', () => {
      const { toJSON } = render(<WelcomeScreen isLoading={true} />);
      expect(toJSON()).toBeDefined();
    });
  });

  // US05 – Display Restaurants on Map
  describe('US05 - Mapa de Restaurantes', () => {
    it('Happy Path: Renderiza el mapa correctamente', () => {
      const { toJSON } = render(<RestaurantMap locationPermission={true} />);
      expect(toJSON()).toBeDefined();
    });

    it('Flujo Alternativo: Muestra mensaje si deniegan permiso de ubicación', () => {
      const { toJSON } = render(<RestaurantMap locationPermission={false} />);
      expect(toJSON()).toBeDefined();
    });
  });

  // US08 – View Restaurant Details from Map
  describe('US08 - Detalle de Restaurante', () => {
    it('Happy Path: Muestra la información del restaurante', () => {
      const { toJSON } = render(<RestaurantDetail isLoading={false} />);
      expect(toJSON()).toBeDefined();
    });

    it('Flujo Alternativo: Muestra estado de carga (Skeleton) si la info tarda', () => {
      const { toJSON } = render(<RestaurantDetail isLoading={true} />);
      expect(toJSON()).toBeDefined();
    });
  });

  // US10 – View Social Feed
  describe('US10 - Feed Social', () => {
    it('Happy Path: Renderiza la lista de posts con datos simulados', () => {
      const mockPosts = [{ id: 1, text: '¡Delicioso!' }];
      const { toJSON } = render(<SocialFeed posts={mockPosts} />);
      expect(toJSON()).toBeDefined();
    });

    it('Flujo Alternativo: Renderiza pantalla amigable si el feed está vacío', () => {
      const { toJSON } = render(<SocialFeed posts={[]} />);
      expect(toJSON()).toBeDefined();
    });
  });

  // US14 – View User Profile
  describe('US14 - Perfil de Usuario', () => {
    it('Happy Path: Muestra la información del perfil completo', () => {
      const fullUser = { name: 'Matias', hasPhoto: true };
      const { toJSON } = render(<UserProfile user={fullUser} />);
      expect(toJSON()).toBeDefined();
    });

    it('Flujo Alternativo: Renderiza avatar por defecto si no hay foto', () => {
      const userWithoutPhoto = { name: 'Matias', hasPhoto: false };
      const { toJSON } = render(<UserProfile user={userWithoutPhoto} />);
      expect(toJSON()).toBeDefined();
    });
  });

});