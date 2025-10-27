import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, CheckCircle, XCircle, Clock, FileText, Download, FileDown, Trash2 } from "lucide-react";
import type { Payment, PaymentMode, InsertPayment } from "@shared/schema";
import { exportPaymentsPDF, exportToCSV } from "@/lib/pdfUtils";
import { addDoc, collection, db, doc, getDocs, getDownloadURL, orderBy, query, ref, storage, toDate, updateDoc, uploadBytes, where, deleteDoc } from '@/lib/firebase-compat';

export default function PaymentsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    montant: "",
    date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    mode: "mobile_money" as PaymentMode,
    commentaire: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [userProfile]);

  async function fetchPayments() {
    try {
      const paymentsRef = collection(db, "payments");
      let q = query(paymentsRef, orderBy("createdAt", "desc"));
      
      if (userProfile?.role === "membre") {
        q = query(paymentsRef, where("userId", "==", userProfile.id), orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);
      const paymentsData = snapshot.documents.map((doc) => ({
        id: doc.$id,
        membreId: doc.userId,
        membreNom: doc.userName || "Inconnu",
        montant: doc.amount || 0,
        date: toDate(doc.paymentDate || doc.createdAt) || new Date(),
        mode: doc.paymentType || "autre",
        preuveURL: doc.proofUrl,
        statut: doc.status || "en_attente",
        commentaire: doc.description || "",
        validePar: doc.validatedBy,
        dateValidation: toDate(doc.validatedAt),
        createdAt: toDate(doc.createdAt) || new Date(),
      })) as Payment[];

      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les paiements",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) return;

    setSubmitting(true);

    try {
      let preuveURL = "";
      
      if (proofFile) {
        const storageRef = ref(storage, `preuves/${Date.now()}_${proofFile.name}`);
        await uploadBytes(storageRef, proofFile);
        preuveURL = await getDownloadURL(storageRef);
      }

      const paymentData = {
        userId: userProfile.id,
        userName: userProfile.displayName,
        amount: parseFloat(formData.montant),
        paymentDate: new Date(formData.date).toISOString(),
        paymentType: formData.mode,
        description: formData.commentaire,
        proofUrl: preuveURL,
        status: "en_attente",
        createdAt: new Date().toISOString(),
      };

      await addDoc("payments", paymentData);

      toast({
        title: "Paiement enregistré",
        description: "Votre paiement a été soumis pour validation",
      });

      setDialogOpen(false);
      setFormData({ montant: "", date: new Date().toISOString().split('T')[0], mode: "mobile_money", commentaire: "" });
      setProofFile(null);
      fetchPayments();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function validatePayment(paymentId: string, status: "validé" | "rejeté") {
    if (!userProfile) return;

    try {
      await updateDoc({ collectionId: "payments", id: paymentId }, {
        status: status,
        validatedBy: userProfile.id,
        validatedAt: new Date().toISOString(),
      });

      toast({
        title: status === "validé" ? "Paiement validé" : "Paiement rejeté",
        description: "Le statut a été mis à jour avec succès",
      });

      fetchPayments();
    } catch (error) {
      console.error("Error validating payment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
      });
    }
  }

  async function handleDeletePayment() {
    if (!deletingPaymentId) return;

    try {
      await deleteDoc({ collectionId: "payments", id: deletingPaymentId });

      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès",
      });

      setDeletingPaymentId(null);
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le paiement",
      });
    }
  }

  const canDelete = userProfile && (userProfile.role === "admin" || userProfile.role === "président" || userProfile.role === "secretaire" || userProfile.role === "trésorier" || userProfile.role === "commissaire");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validé":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validé
          </Badge>
        );
      case "rejeté":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  const canValidate = userProfile?.role === "admin" || userProfile?.role === "président" || userProfile?.role === "secretaire" || userProfile?.role === "commissaire";

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
          <h1 className="text-3xl font-bold text-foreground">Paiements</h1>
          <p className="text-muted-foreground">Gestion des cotisations et contributions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => exportPaymentsPDF(payments)}
            disabled={payments.length === 0}
            data-testid="button-export-pdf"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToCSV(payments, "CODET_Paiements", {
              membreNom: "Membre",
              montant: "Montant",
              date: "Date",
              mode: "Mode",
              statut: "Statut"
            })}
            disabled={payments.length === 0}
            data-testid="button-export-csv"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-payment">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Paiement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enregistrer un paiement</DialogTitle>
              <DialogDescription>
                Soumettez votre paiement avec une preuve pour validation
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant">Montant (FCFA)</Label>
                <Input
                  id="montant"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="10000"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  required
                  data-testid="input-montant"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date du paiement</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  data-testid="input-date"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Mode de paiement</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value as PaymentMode })}
                >
                  <SelectTrigger className="h-12" data-testid="select-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="espèces">Espèces</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Preuve de paiement (optionnel)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    data-testid="input-proof"
                    className="h-12"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
                <Input
                  id="commentaire"
                  type="text"
                  placeholder="Notes additionnelles..."
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  data-testid="input-commentaire"
                  className="h-12"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting} data-testid="button-submit-payment">
                  {submitting ? "Enregistrement..." : "Soumettre"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Aucun paiement enregistré</p>
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="hover-elevate" data-testid={`card-payment-${payment.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{payment.membreNom}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {payment.date.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {getStatusBadge(payment.statut)}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="text-xl font-bold text-primary">
                      {payment.montant.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mode</p>
                    <p className="text-sm font-medium capitalize">{payment.mode.replace("_", " ")}</p>
                  </div>
                </div>

                {payment.commentaire && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Note: {payment.commentaire}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {payment.preuveURL && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid="button-view-proof"
                    >
                      <a href={payment.preuveURL} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Voir la preuve
                      </a>
                    </Button>
                  )}

                  {canValidate && payment.statut === "en_attente" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => validatePayment(payment.id, "validé")}
                        data-testid="button-validate"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Valider
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => validatePayment(payment.id, "rejeté")}
                        data-testid="button-reject"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </>
                  )}

                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingPaymentId(payment.id)}
                      data-testid={`button-delete-payment-${payment.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(open) => !open && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le paiement sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-payment">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-payment"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
