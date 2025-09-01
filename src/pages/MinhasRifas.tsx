import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Ticket, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Purchase {
  id: string;
  quantity: number;
  amount: number;
  raffle_numbers: number[];
  status: string;
  created_at: string;
  stripe_session_id: string;
}

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'paid':
      return { text: '✅ Confirmado', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    case 'pending':
      return { text: '⏳ Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    case 'failed':
      return { text: '❌ Falhou', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    default:
      return { text: '⏳ Processando', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
  }
};

const MinhasRifas = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('raffle_purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setPurchases(data || []);
      } catch (error) {
        console.error('Erro ao buscar compras:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas rifas.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user, toast]);

  // Agrupa apenas os números de compras pagas/confirmadas
  const confirmedPurchases = purchases.filter(purchase => purchase.status === 'paid');
  const allNumbers = confirmedPurchases.flatMap(purchase => purchase.raffle_numbers).sort((a, b) => a - b);
  const totalNumbers = allNumbers.length;
  const totalSpent = confirmedPurchases.reduce((sum, purchase) => sum + (purchase.amount / 100), 0);
  
  // Números pendentes
  const pendingPurchases = purchases.filter(purchase => purchase.status === 'pending');
  const pendingNumbers = pendingPurchases.flatMap(purchase => purchase.raffle_numbers).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando suas rifas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Minhas <span className="text-gradient-primary">Rifas</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Visualize todos os números que você comprou
            </p>
          </div>

          {/* Resumo */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-elegant)] border border-border text-center">
              <Ticket className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground">{totalNumbers}</div>
              <div className="text-muted-foreground">Números Confirmados</div>
              {pendingNumbers.length > 0 && (
                <div className="text-sm text-yellow-600 mt-1">
                  +{pendingNumbers.length} pendentes
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-elegant)] border border-border text-center">
              <CreditCard className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground">R$ {totalSpent.toFixed(2)}</div>
              <div className="text-muted-foreground">Total Investido</div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-elegant)] border border-border text-center">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground">{purchases.length}</div>
              <div className="text-muted-foreground">Compras Realizadas</div>
            </div>
          </div>

          {purchases.length > 0 ? (
            <>
              {/* Números Confirmados */}
              {totalNumbers > 0 && (
                <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] border border-border mb-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Ticket className="w-6 h-6 text-green-600 mr-3" />
                    Seus Números Confirmados ({totalNumbers})
                  </h2>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {allNumbers.map((number, index) => (
                      <div
                        key={`confirmed-${number}-${index}`}
                        className="bg-gradient-primary text-primary-foreground p-3 rounded-lg text-center font-bold text-sm"
                      >
                        {number.toLocaleString('pt-BR')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Números Pendentes */}
              {pendingNumbers.length > 0 && (
                <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] border border-border mb-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Ticket className="w-6 h-6 text-yellow-600 mr-3" />
                    Números Pendentes de Pagamento ({pendingNumbers.length})
                  </h2>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      ⚠️ Estes números serão confirmados após a aprovação do pagamento
                    </p>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {pendingNumbers.map((number, index) => (
                      <div
                        key={`pending-${number}-${index}`}
                        className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-center font-bold text-sm border border-yellow-300 dark:border-yellow-700"
                      >
                        {number.toLocaleString('pt-BR')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de compras */}
              <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] border border-border">
                <h2 className="text-2xl font-bold mb-6">Histórico de Compras</h2>
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    const statusDisplay = getStatusDisplay(purchase.status);
                    <div
                      key={purchase.id}
                      className="bg-muted rounded-lg p-6 border border-border"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {purchase.quantity} número{purchase.quantity > 1 ? 's' : ''} comprado{purchase.quantity > 1 ? 's' : ''}
                          </h3>
                          <p className="text-muted-foreground">
                            {new Date(purchase.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            R$ {(purchase.amount / 100).toFixed(2)}
                          </div>
                          <div className={`text-sm px-3 py-1 rounded-full inline-block ${statusDisplay.className}`}>
                            {statusDisplay.text}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-4">
                        <h4 className="font-medium mb-2">
                          Números desta compra:
                          {purchase.status === 'pending' && (
                            <span className="text-yellow-600 text-sm ml-2">(Aguardando pagamento)</span>
                          )}
                        </h4>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
                          {purchase.raffle_numbers.sort((a, b) => a - b).map((number) => (
                            <div
                              key={number}
                              className={`p-2 rounded text-center text-xs font-medium ${
                                purchase.status === 'paid' 
                                  ? 'bg-gradient-secondary text-secondary-foreground' 
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700'
                              }`}
                            >
                              {number.toLocaleString('pt-BR')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Ticket className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Você ainda não possui rifas
              </h2>
              <p className="text-muted-foreground mb-8">
                Compre seus números da sorte e participe da rifa do Porsche Taycan 2025!
              </p>
              <a
                href="/comprar"
                className="btn-hero inline-block"
              >
                🛒 Comprar Rifas
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Wrapping with ProtectedRoute
const MinhasRifasProtected = () => (
  <ProtectedRoute>
    <MinhasRifas />
  </ProtectedRoute>
);

export default MinhasRifasProtected;