import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { CheckCircle, Ticket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Success = () => {
  const [searchParams] = useSearchParams();
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('raffle_purchases')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .single();

        if (error) {
          console.error('Erro ao buscar compra:', error);
        } else {
          setPurchase(data);
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Processando sua compra...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              🎉 Compra Realizada com Sucesso!
            </h1>
            <p className="text-xl text-muted-foreground">
              Parabéns! Sua compra foi processada e seus números foram gerados.
            </p>
          </div>

          {purchase && (
            <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] border border-border mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Detalhes da Compra</h2>
                <div className="text-3xl font-bold text-primary">
                  R$ {(purchase.amount / 100).toFixed(2)}
                </div>
                <div className="text-muted-foreground">
                  {purchase.quantity} números comprados
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-bold mb-4 flex items-center">
                  <Ticket className="w-5 h-5 text-primary mr-2" />
                  Seus Números da Sorte:
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {purchase.raffle_numbers.sort((a: number, b: number) => a - b).map((number: number) => (
                    <div
                      key={number}
                      className="bg-gradient-primary text-primary-foreground p-3 rounded-lg text-center font-bold text-sm"
                    >
                      {number.toLocaleString('pt-BR')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                <p className="text-green-800 dark:text-green-200 text-sm text-center">
                  ✅ Pagamento confirmado! Seus números estão ativos na rifa.
                </p>
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <Button 
              onClick={() => navigate('/minhas-rifas')}
              className="btn-hero"
            >
              Ver Minhas Rifas
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>

          <div className="bg-muted rounded-lg p-6 mt-8">
            <h3 className="font-bold mb-3">📧 Próximos Passos:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Você receberá um e-mail de confirmação com seus números</li>
              <li>• Acompanhe o sorteio na data marcada</li>
              <li>• Mantenha seus dados atualizados para contato</li>
              <li>• Boa sorte! 🍀</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Success;