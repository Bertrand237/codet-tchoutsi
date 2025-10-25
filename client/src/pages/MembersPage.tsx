import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserCog, Mail, Phone, Calendar, Download } from "lucide-react";
import type { User, UserRole } from "@shared/schema";
import { exportToCSV } from "@/lib/pdfUtils";
import { db, doc, getDocs, query, toDate, updateDoc, orderBy } from '@/lib/firebase-compat';

export default function MembersPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("tous");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const canManageMembers = userProfile?.role === "admin" || userProfile?.role === "président";

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const membersRef = "users";
      const q = query(membersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const membersData = snapshot.documents.map((doc) => ({
        id: doc.$id,
        ...doc,
        createdAt: toDate(doc.createdAt) || new Date(),
      })) as User[];

      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les membres",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(userId: string, newRole: UserRole) {
    if (!canManageMembers) return;

    setUpdating(true);

    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
      });

      toast({
        title: "Rôle mis à jour",
        description: "Le rôle du membre a été modifié avec succès",
      });

      setDialogOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error("Error updating member role:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
      });
    } finally {
      setUpdating(false);
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "tous" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: members.length,
    admin: members.filter((m) => m.role === "admin").length,
    président: members.filter((m) => m.role === "président").length,
    membres: members.filter((m) => m.role === "membre").length,
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "président": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "trésorier": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "commissaire": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "membre": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      case "visiteur": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    }
  };

  function handleExportCSV() {
    exportToCSV(filteredMembers, "membres_codet", {
      displayName: "Nom",
      email: "Email",
      role: "Rôle",
      phoneNumber: "Téléphone",
      createdAt: "Date de Création",
    });

    toast({
      title: "Export réussi",
      description: `${filteredMembers.length} membres exportés en CSV`,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Membres</h1>
          <p className="text-muted-foreground">Administration et gestion des utilisateurs du comité</p>
        </div>
        <Button 
          onClick={handleExportCSV} 
          variant="outline" 
          disabled={filteredMembers.length === 0}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <UserCog className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admin}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Président</CardTitle>
            <UserCog className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.président}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.membres}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
                data-testid="input-search-members"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12" data-testid="select-role-filter">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les rôles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="président">Président</SelectItem>
                <SelectItem value="trésorier">Trésorier</SelectItem>
                <SelectItem value="commissaire">Commissaire</SelectItem>
                <SelectItem value="membre">Membre</SelectItem>
                <SelectItem value="visiteur">Visiteur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Liste des membres ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun membre trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Inscription</TableHead>
                    {canManageMembers && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.photoURL} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.displayName}</p>
                            {member.id === userProfile?.id && (
                              <span className="text-xs text-muted-foreground">(Vous)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.phoneNumber ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {member.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {member.createdAt.toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                      {canManageMembers && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setDialogOpen(true);
                            }}
                            data-testid="button-edit-member"
                          >
                            Modifier
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle du membre</DialogTitle>
            <DialogDescription>
              Changez le rôle de {selectedMember?.displayName}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMember.photoURL} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedMember.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.displayName}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Nouveau rôle</Label>
                <Select
                  defaultValue={selectedMember.role}
                  onValueChange={(value) => {
                    if (selectedMember) {
                      setSelectedMember({ ...selectedMember, role: value as UserRole });
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-new-role" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="président">Président</SelectItem>
                    <SelectItem value="trésorier">Trésorier</SelectItem>
                    <SelectItem value="commissaire">Commissaire</SelectItem>
                    <SelectItem value="membre">Membre</SelectItem>
                    <SelectItem value="visiteur">Visiteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedMember && handleUpdateRole(selectedMember.id, selectedMember.role)}
              disabled={updating}
              data-testid="button-submit-role"
            >
              {updating ? "Modification..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
