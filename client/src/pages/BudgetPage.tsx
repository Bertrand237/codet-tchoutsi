import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Plus, DollarSign, Calendar, Filter, FileDown, FileText } from "lucide-react";
import type { BudgetTransaction, TransactionType, TransactionCategory } from "@shared/schema";
import { exportBudgetPDF, exportToCSV } from "@/lib/pdfUtils";
import { Timestamp, addDoc, getDocs, query, serverTimestamp, toDate, orderBy } from '@/lib/firebase-compat';

export default function BudgetPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("tous");
  const [categorieFilter, setCategorieFilter] = useState<string>("tous");

  const [formData, setFormData] = useState({
    type: "revenu" as TransactionType,
    montant: "",
    categorie: "cotisations" as TransactionCategory,
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const canManageBudget = userProfile?.role === "admin" || userProfile?.role === "président" || userProfile?.role === "secretaire" || userProfile?.role === "trésorier";

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const transactionsRef = "budget";
      const q = query(transactionsRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);      const transactionsData = snapshot.documents.map((doc) => {
        const data = doc;
        return {
          id: doc.$id,
          ...data,
          date: toDate(data.date),
          createdAt: toDate(data.createdAt),
        };
      }) as BudgetTransaction[];

      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les transactions",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canManageBudget) {
      toast({
        variant: "destructive",
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour ajouter des transactions",
      });
      return;
    }

    setSubmitting(true);

    try {
      const transactionData = {
        type: formData.type,
        montant: parseFloat(formData.montant),
        categorie: formData.categorie,
        description: formData.description,
        date: new Date(new Date(formData.date).toISOString()),
        creePar: userProfile.id,
        creeParNom: userProfile.displayName,
        createdAt: serverTimestamp(),
      };

      await addDoc("budget", transactionData);

      toast({
        title: "Transaction ajoutée",
        description: "La transaction a été enregistrée avec succès",
      });

      setDialogOpen(false);
      setFormData({
        type: "revenu",
        montant: "",
        categorie: "cotisations",
        description: "",
        date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter la transaction",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === "tous" || t.type === typeFilter;
    const matchesCategorie = categorieFilter === "tous" || t.categorie === categorieFilter;
    return matchesType && matchesCategorie;
  });

  const stats = {
    totalRevenus: transactions.filter((t) => t.type === "revenu").reduce((sum, t) => sum + t.montant, 0),
    totalDepenses: transactions.filter((t) => t.type === "dépense").reduce((sum, t) => sum + t.montant, 0),
    solde: 0,
  };
  stats.solde = stats.totalRevenus - stats.totalDepenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion Budgétaire</h1>
          <p className="text-muted-foreground">Suivi des revenus et dépenses du comité</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => exportBudgetPDF(filteredTransactions)}
            disabled={filteredTransactions.length === 0}
            data-testid="button-export-pdf"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredTransactions, "CODET_Budget", {
              type: "Type",
              montant: "Montant",
              categorie: "Catégorie",
              description: "Description",
              date: "Date",
              creeParNom: "Créé par"
            })}
            disabled={filteredTransactions.length === 0}
            data-testid="button-export-csv"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {canManageBudget && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-transaction">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une transaction</DialogTitle>
                <DialogDescription>
                  Enregistrez un revenu ou une dépense pour le comité
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="select-type" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenu">Revenu</SelectItem>
                        <SelectItem value="dépense">Dépense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="montant">Montant (FCFA) *</Label>
                    <Input
                      id="montant"
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                      placeholder="Ex: 50000"
                      className="h-12"
                      data-testid="input-montant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie *</Label>
                    <Select
                      value={formData.categorie}
                      onValueChange={(value: TransactionCategory) => setFormData({ ...formData, categorie: value })}
                    >
                      <SelectTrigger data-testid="select-categorie" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cotisations">Cotisations</SelectItem>
                        <SelectItem value="dons">Dons</SelectItem>
                        <SelectItem value="événements">Événements</SelectItem>
                        <SelectItem value="projets">Projets</SelectItem>
                        <SelectItem value="fonctionnement">Fonctionnement</SelectItem>
                        <SelectItem value="salaires">Salaires</SelectItem>
                        <SelectItem value="fournitures">Fournitures</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-12"
                      data-testid="input-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Détaillez la transaction..."
                      rows={3}
                      data-testid="input-description"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting} data-testid="button-submit-transaction">
                    {submitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenus</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalRevenus.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalDepenses.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
            <div className={`h-10 w-10 rounded-lg ${stats.solde >= 0 ? 'bg-primary/10' : 'bg-orange-100 dark:bg-orange-900/20'} flex items-center justify-center`}>
              <DollarSign className={`h-5 w-5 ${stats.solde >= 0 ? 'text-primary' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.solde >= 0 ? 'text-primary' : 'text-orange-600'}`}>
              {stats.solde.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="revenu">Revenus</SelectItem>
                <SelectItem value="dépense">Dépenses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12" data-testid="select-categorie-filter">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes catégories</SelectItem>
                <SelectItem value="cotisations">Cotisations</SelectItem>
                <SelectItem value="dons">Dons</SelectItem>
                <SelectItem value="événements">Événements</SelectItem>
                <SelectItem value="projets">Projets</SelectItem>
                <SelectItem value="fonctionnement">Fonctionnement</SelectItem>
                <SelectItem value="salaires">Salaires</SelectItem>
                <SelectItem value="fournitures">Fournitures</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucune transaction trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Créé par</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {transaction.date.toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          transaction.type === "revenu"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        }>
                          {transaction.type === "revenu" ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.categorie}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${transaction.type === "revenu" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "revenu" ? "+" : "-"}{transaction.montant.toLocaleString()} FCFA
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.creeParNom}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
