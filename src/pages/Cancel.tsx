import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Cancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <XCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Compra Cancelada
            </h1>
            <p className="text-xl text-muted-foreground">
              Sua compra foi cancelada. Nenhum valor foi cobrado.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] border border-border mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">O que aconteceu?</h2>
              <p className="text-muted-foreground mb-6">
                O pagamento foi cancelado antes da conclusão. Seus números não foram reservados 
                e nenhuma cobrança foi realizada.
              </p>
              
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-bold mb-3">💡 Dicas para sua próxima compra:</h3>
                <ul className="space-y-2 text-muted-foreground text-left">
                  <li>• Verifique se seus dados de pagamento estão corretos</li>
                  <li>• Certifique-se de ter saldo suficiente no cartão</li>
                  <li>• Tente usar outro método de pagamento se necessário</li>
                  <li>• Entre em contato conosco se precisar de ajuda</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button 
              onClick={() => navigate('/comprar')}
              className="btn-hero"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Cancel;