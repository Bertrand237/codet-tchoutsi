import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Configuration des couleurs CODET
const CODET_GREEN = "#0A7D33";
const CODET_DARK_GREEN = "#065020";

// Helper pour ajouter l'en-tête CODET
function addCODETHeader(doc: jsPDF, title: string) {
  // En-tête avec couleur verte CODET
  doc.setFillColor(CODET_GREEN);
  doc.rect(0, 0, 210, 35, "F");
  
  // Titre blanc centré
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CODET", 105, 15, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Comité de Développement Tchoutsi", 105, 23, { align: "center" });
  
  // Sous-titre du rapport
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 31, { align: "center" });
  
  // Retour au texte noir
  doc.setTextColor(0, 0, 0);
}

// Helper pour ajouter le pied de page
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `CODET - ${new Date().toLocaleDateString("fr-FR")} - Page ${pageNumber}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );
}

// Export rapport de paiements
export function exportPaymentsPDF(payments: any[]) {
  const doc = new jsPDF();
  
  addCODETHeader(doc, "Rapport des Paiements");
  
  // Statistiques
  const totalPaiements = payments.length;
  const montantTotal = payments.reduce((sum, p) => sum + (p.montant || 0), 0);
  const valides = payments.filter(p => p.statut === "validé").length;
  const enAttente = payments.filter(p => p.statut === "en_attente").length;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = 45;
  
  doc.text(`Période: ${new Date().toLocaleDateString("fr-FR")}`, 14, yPos);
  yPos += 7;
  doc.text(`Total paiements: ${totalPaiements}`, 14, yPos);
  yPos += 7;
  doc.text(`Montant total: ${montantTotal.toLocaleString("fr-FR")} FCFA`, 14, yPos);
  yPos += 7;
  doc.text(`Validés: ${valides} | En attente: ${enAttente}`, 14, yPos);
  yPos += 10;
  
  // Tableau des paiements
  const tableData = payments.map(p => [
    p.membreNom || "N/A",
    `${(p.montant || 0).toLocaleString("fr-FR")} FCFA`,
    p.date ? new Date(p.date).toLocaleDateString("fr-FR") : "N/A",
    p.mode || "N/A",
    p.statut === "validé" ? "Validé" : p.statut === "en_attente" ? "En attente" : "Rejeté"
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Membre", "Montant", "Date", "Mode", "Statut"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: CODET_GREEN,
      textColor: 255,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35, halign: "right" },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 }
    }
  });
  
  addFooter(doc, 1);
  
  doc.save(`CODET_Paiements_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export rapport de budget
export function exportBudgetPDF(transactions: any[]) {
  const doc = new jsPDF();
  
  addCODETHeader(doc, "Rapport Budgétaire");
  
  // Statistiques
  const revenus = transactions.filter(t => t.type === "revenu").reduce((sum, t) => sum + (t.montant || 0), 0);
  const depenses = transactions.filter(t => t.type === "dépense").reduce((sum, t) => sum + (t.montant || 0), 0);
  const solde = revenus - depenses;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = 45;
  
  doc.text(`Période: ${new Date().toLocaleDateString("fr-FR")}`, 14, yPos);
  yPos += 7;
  doc.text(`Total revenus: ${revenus.toLocaleString("fr-FR")} FCFA`, 14, yPos);
  yPos += 7;
  doc.text(`Total dépenses: ${depenses.toLocaleString("fr-FR")} FCFA`, 14, yPos);
  yPos += 7;
  
  // Solde en couleur
  doc.setFont("helvetica", "bold");
  if (solde >= 0) {
    doc.setTextColor(10, 125, 51); // Vert
  } else {
    doc.setTextColor(220, 38, 38); // Rouge
  }
  doc.text(`Solde: ${solde.toLocaleString("fr-FR")} FCFA`, 14, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  yPos += 10;
  
  // Tableau des transactions
  const tableData = transactions.map(t => [
    t.date ? new Date(t.date.seconds ? t.date.seconds * 1000 : t.date).toLocaleDateString("fr-FR") : "N/A",
    t.type === "revenu" ? "Revenu" : "Dépense",
    t.categorie || "N/A",
    t.description || "N/A",
    `${(t.montant || 0).toLocaleString("fr-FR")} FCFA`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Type", "Catégorie", "Description", "Montant"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: CODET_GREEN,
      textColor: 255,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 70 },
      4: { cellWidth: 30, halign: "right" }
    }
  });
  
  addFooter(doc, 1);
  
  doc.save(`CODET_Budget_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export rapport de projets
export function exportProjectsPDF(projects: any[]) {
  const doc = new jsPDF();
  
  addCODETHeader(doc, "Rapport des Projets");
  
  // Statistiques
  const total = projects.length;
  const actifs = projects.filter(p => p.statut === "en_cours").length;
  const termines = projects.filter(p => p.statut === "terminé").length;
  const budgetTotal = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = 45;
  
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, yPos);
  yPos += 7;
  doc.text(`Total projets: ${total}`, 14, yPos);
  yPos += 7;
  doc.text(`En cours: ${actifs} | Terminés: ${termines}`, 14, yPos);
  yPos += 7;
  doc.text(`Budget total: ${budgetTotal.toLocaleString("fr-FR")} FCFA`, 14, yPos);
  yPos += 10;
  
  // Tableau des projets
  const tableData = projects.map(p => [
    p.titre || "N/A",
    p.statut || "N/A",
    p.priorite || "N/A",
    `${(p.budget || 0).toLocaleString("fr-FR")} FCFA`,
    `${p.progression || 0}%`,
    p.responsableNom || "N/A"
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Titre", "Statut", "Priorité", "Budget", "Prog.", "Responsable"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: CODET_GREEN,
      textColor: 255,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 35 }
    }
  });
  
  addFooter(doc, 1);
  
  doc.save(`CODET_Projets_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export CSV générique
export function exportToCSV(data: any[], filename: string, headers: { [key: string]: string }) {
  if (data.length === 0) {
    return;
  }
  
  // Créer les en-têtes
  const csvHeaders = Object.keys(headers).join(",");
  
  // Créer les lignes
  const csvRows = data.map(item => {
    return Object.keys(headers).map(key => {
      let value = item[key];
      
      // Gérer les dates Firestore
      if (value && typeof value === 'object' && value.seconds) {
        value = new Date(value.seconds * 1000).toLocaleDateString("fr-FR");
      } else if (value instanceof Date) {
        value = value.toLocaleDateString("fr-FR");
      }
      
      // Échapper les guillemets et virgules
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value || "";
    }).join(",");
  });
  
  // Combiner tout
  const csv = [csvHeaders, ...csvRows].join("\n");
  
  // Télécharger
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
