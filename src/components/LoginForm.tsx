import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import InputMask from 'react-input-mask';

interface LoginData {
  identifier: string;
  password: string;
}

interface FormErrors {
  identifier?: string;
  password?: string;
}

const LoginForm = () => {
  const [loginData, setLoginData] = useState<LoginData>({
    identifier: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  
  const { signIn, signInWithPhone } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10 || digitsOnly.length === 11;
  };

  const detectLoginType = (identifier: string): 'email' | 'phone' => {
    if (identifier.includes('@')) {
      return 'email';
    }
    return 'phone';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const detectedType = detectLoginType(loginData.identifier);

    // Validate identifier
    if (!loginData.identifier.trim()) {
      newErrors.identifier = 'E-mail ou telefone é obrigatório';
    } else if (detectedType === 'email' && !validateEmail(loginData.identifier)) {
      newErrors.identifier = 'Por favor, insira um e-mail válido';
    } else if (detectedType === 'phone' && !validatePhone(loginData.identifier)) {
      newErrors.identifier = 'Por favor, insira um telefone válido';
    }

    // Validate password
    if (!loginData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    
    // Update login type based on identifier
    if (field === 'identifier') {
      setLoginType(detectLoginType(value));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const detectedType = detectLoginType(loginData.identifier);
      let result;

      if (detectedType === 'email') {
        result = await signIn(loginData.identifier, loginData.password);
      } else {
        result = await signInWithPhone(loginData.identifier, loginData.password);
      }

      if (result.error) {
        toast({
          title: "Erro no login",
          description: "E-mail/telefone ou senha incorretos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gradient-primary">
          Entrar
        </CardTitle>
        <CardDescription>
          Entre com seu e-mail ou telefone e senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier (Email or Phone) */}
          <div className="space-y-2">
            <Label htmlFor="identifier">E-mail ou Telefone *</Label>
            {loginType === 'phone' ? (
              <InputMask
                mask="(99) 99999-9999"
                value={loginData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                maskChar=""
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    id="identifier"
                    type="tel"
                    placeholder="(11) 99999-9999 ou seu@email.com"
                    className={errors.identifier ? 'border-destructive' : ''}
                  />
                )}
              </InputMask>
            ) : (
              <Input
                id="identifier"
                type="text"
                value={loginData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                placeholder="(11) 99999-9999 ou seu@email.com"
                className={errors.identifier ? 'border-destructive' : ''}
              />
            )}
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={loginData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Sua senha"
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-hero" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;