// src/pages/auth/AuthPage.tsx
import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../config/supabaseClient'; // Ensure this path is correct
import { useAuth } from '../../contexts/AuthContext';   // Ensure this path is correct
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { session, isLoading } = useAuth(); // Added isLoading from useAuth
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) { // Check !isLoading before redirecting
      navigate('/'); // Redirect to home if already logged in and not loading
    }
  }, [session, isLoading, navigate]);

  // if (isLoading) { // Optional: Show a loader while checking session
  //   return <div>Loading authentication status...</div>;
  // }

  if (session) {
    // Session exists, should be redirected by useEffect.
    // Return null or a loading indicator to prevent brief flash of Auth UI.
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}> {/* Ensure Auth UI takes available width up to maxWidth */}
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']} // Example: Add more providers like 'azure', 'gitlab', etc.
          // redirectTo={window.location.origin + '/'} // Optional: Supabase default is current page. Customize if needed.
          localization={{
            variables: {
              sign_in: {
                email_label: 'Endereço de e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Seu endereço de e-mail',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Endereço de e-mail',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'Seu endereço de e-mail',
                password_input_placeholder: 'Crie uma senha',
                button_label: 'Registrar',
                social_provider_text: 'Registrar com {{provider}}',
                link_text: 'Não tem uma conta? Registrar',
                confirmation_text: 'Verifique seu e-mail para o link de confirmação',
              },
              forgotten_password: {
                email_label: 'Endereço de e-mail',
                email_input_placeholder: 'Seu endereço de e-mail',
                button_label: 'Enviar instruções de redefinição de senha',
                link_text: 'Esqueceu sua senha?',
                confirmation_text: 'Verifique seu e-mail para o link de redefinição',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Sua nova senha',
                button_label: 'Atualizar senha',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AuthPage;
