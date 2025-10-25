import { useEffect, useState } from "react";
import { collection, query, getDocs, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, CheckCircle, Clock, UsersRound, MessageSquare, TrendingUp, FolderKanban, Newspaper, BarChart3, LineChart } from "lucide-react";
import type { Statistics } from "@shared/schema";
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<Statistics>({
    totalMembers: 0,
    totalPayments: 0,
    pendingPayments: 0,
    validatedPayments: 0,
    totalAmount: 0,
    totalFamilies: 0,
    totalMessages: 0,
    totalBlogPosts: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          usersSnap,
          paymentsSnap,
          pendingSnap,
          validatedSnap,
          familiesSnap,
          messagesSnap,
          blogSnap,
          projectsSnap,
          activeProjectsSnap,
          completedProjectsSnap,
          budgetSnap,
        ] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "payments")),
          getDocs(query(collection(db, "payments"), where("statut", "==", "en_attente"))),
          getDocs(query(collection(db, "payments"), where("statut", "==", "validé"))),
          getDocs(collection(db, "families")),
          getDocs(query(collection(db, "messages"), orderBy("timestamp", "desc"), limit(100))),
          getDocs(collection(db, "blog")),
          getDocs(collection(db, "projects")),
          getDocs(query(collection(db, "projects"), where("statut", "==", "en_cours"))),
          getDocs(query(collection(db, "projects"), where("statut", "==", "terminé"))),
          getDocs(collection(db, "budget_transactions")),
        ]);

        const totalAmount = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().montant || 0), 0);

        setStats({
          totalMembers: usersSnap.size,
          totalPayments: paymentsSnap.size,
          pendingPayments: pendingSnap.size,
          validatedPayments: validatedSnap.size,
          totalAmount,
          totalFamilies: familiesSnap.size,
          totalMessages: messagesSnap.size,
          totalBlogPosts: blogSnap.size,
          totalProjects: projectsSnap.size,
          activeProjects: activeProjectsSnap.size,
          completedProjects: completedProjectsSnap.size,
        });

        // Projects by status
        const projectsStatusMap: Record<string, number> = {
          "planifié": 0,
          "en_cours": 0,
          "en_pause": 0,
          "terminé": 0,
          "archivé": 0,
        };
        projectsSnap.docs.forEach((doc) => {
          const status = doc.data().statut;
          if (projectsStatusMap[status] !== undefined) {
            projectsStatusMap[status]++;
          }
        });
        const projectsChartData = Object.entries(projectsStatusMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }));
        setProjectsData(projectsChartData);

        // Payments by month (last 6 months)
        const monthlyPayments: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
          monthlyPayments[monthKey] = 0;
        }

        paymentsSnap.docs.forEach((doc) => {
          const data = doc.data();
          const paymentDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
          const monthKey = paymentDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
          if (monthlyPayments[monthKey] !== undefined) {
            monthlyPayments[monthKey] += data.montant || 0;
          }
        });

        const paymentsChartData = Object.entries(monthlyPayments).map(([month, montant]) => ({
          month,
          montant,
        }));
        setPaymentsData(paymentsChartData);

        // Budget by month (last 6 months)
        const monthlyBudget: Record<string, { revenus: number; dépenses: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
          monthlyBudget[monthKey] = { revenus: 0, dépenses: 0 };
        }

        budgetSnap.docs.forEach((doc) => {
          const data = doc.data();
          const transactionDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
          const monthKey = transactionDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
          if (monthlyBudget[monthKey]) {
            if (data.type === "revenu") {
              monthlyBudget[monthKey].revenus += data.montant || 0;
            } else if (data.type === "dépense") {
              monthlyBudget[monthKey].dépenses += data.montant || 0;
            }
          }
        });

        const budgetChartData = Object.entries(monthlyBudget).map(([month, values]) => ({
          month,
          revenus: values.revenus,
          dépenses: values.dépenses,
        }));
        setBudgetData(budgetChartData);

      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Membres",
      value: stats.totalMembers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Projets Actifs",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Paiements Validés",
      value: stats.validatedPayments,
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "En Attente",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Montant Total",
      value: `${stats.totalAmount.toLocaleString()} FCFA`,
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Familles",
      value: stats.totalFamilies,
      icon: UsersRound,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Bienvenue, {userProfile?.displayName} !
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de l'activité du comité CODET
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover-elevate" data-testid={`card-stat-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {stats.totalProjects} projets ({stats.activeProjects} actifs, {stats.completedProjects} terminés)
                  </p>
                  <p className="text-xs text-muted-foreground">Gestion de projets</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {stats.totalPayments} paiements enregistrés
                  </p>
                  <p className="text-xs text-muted-foreground">Gestion des cotisations</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {stats.totalMessages} messages échangés
                  </p>
                  <p className="text-xs text-muted-foreground">Communication interne</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {stats.totalBlogPosts} articles publiés
                  </p>
                  <p className="text-xs text-muted-foreground">Blog et annonces</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accès Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/projects"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-projects"
              >
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-center">Projets</span>
              </a>

              <a
                href="/payments"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-payments"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">Paiements</span>
              </a>

              <a
                href="/chat"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-chat"
              >
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-center">Messagerie</span>
              </a>

              <a
                href="/blog"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-blog"
              >
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Newspaper className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-center">Blog</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Projets par Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsData.map((entry, index) => {
                    const COLORS = ['#60a5fa', '#0A7D33', '#f59e0b', '#10b981', '#6b7280'];
                    return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payments by Month Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Évolution des Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={paymentsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value?.toLocaleString()} FCFA`} />
                <Legend />
                <Line type="monotone" dataKey="montant" name="Montant" stroke="#0A7D33" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Revenue vs Expenses Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Budget: Revenus vs Dépenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${value?.toLocaleString()} FCFA`} />
              <Legend />
              <Bar dataKey="revenus" name="Revenus" fill="#10b981" />
              <Bar dataKey="dépenses" name="Dépenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
