import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Car, AlertCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpjEmpresa, setCnpjEmpresa] = useState("");
  const [emailEmpresa, setEmailEmpresa] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // All hooks must be called before any conditional logic
  const { signIn, signUp, user, loading } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Show loading state while auth initializes - CONDITIONAL RENDERING, NOT EARLY RETURN
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(
          email, 
          password, 
          fullName, 
          nomeEmpresa, 
          cnpjEmpresa, 
          emailEmpresa
        );
        
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar sua conta antes de fazer login.",
            duration: 5000,
          });
          
          // Limpar formulário e voltar para modo de login
          setEmail('');
          setPassword('');
          setFullName('');
          setNomeEmpresa('');
          setCnpjEmpresa('');
          setEmailEmpresa('');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo de volta!",
          });
          // Navigate será feito pelo useEffect quando user mudar
        }
      }
    } catch (error: any) {
      setError(error.message || 'Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-primary p-3 rounded-full shadow-blue">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Auto Center Pro</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão Completo</p>
        </div>

        <Card className="shadow-lg border-0 bg-gradient-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Criar Conta" : "Login"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp 
                ? "Digite suas informações para criar uma conta" 
                : "Digite suas credenciais para acessar o sistema"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div className="text-sm font-medium text-foreground">
                      Informações da Empresa
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                      <Input
                        id="nomeEmpresa"
                        placeholder="Ex: Auto Center Silva"
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cnpjEmpresa">CNPJ (opcional)</Label>
                        <Input
                          id="cnpjEmpresa"
                          placeholder="00.000.000/0000-00"
                          value={cnpjEmpresa}
                          onChange={(e) => setCnpjEmpresa(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailEmpresa">Email da Empresa (opcional)</Label>
                        <Input
                          id="emailEmpresa"
                          type="email"
                          placeholder="contato@empresa.com"
                          value={emailEmpresa}
                          onChange={(e) => setEmailEmpresa(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isSignUp ? "Digite seu email" : "admin@autocenter.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
                variant="gradient"
              >
                {isLoading 
                  ? (isSignUp ? "Criando conta..." : "Entrando...") 
                  : (isSignUp ? "Criar Conta" : "Entrar")
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setEmail("");
                  setPassword("");
                  setFullName("");
                  setNomeEmpresa("");
                  setCnpjEmpresa("");
                  setEmailEmpresa("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isSignUp ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Já tem uma conta? Faça login
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Não tem conta? Criar uma
                  </>
                )}
              </Button>
            </div>

            {!isSignUp && import.meta.env.DEV && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Credenciais de teste (dev):</p>
                <p className="font-mono text-xs mt-1">
                  admin@autocenter.com / admin123
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;