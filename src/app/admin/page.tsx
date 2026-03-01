import { getDb } from "@/lib/firebase-admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAdminAuthenticated } from "./actions";
import { AdminLogin } from "./admin-login";
import { AdminLogoutButton } from "./admin-logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return <AdminLogin />;
  }

  let completions: Array<{
    id: string;
    email: string;
    petName: string;
    petType: string;
    profile: { profileTitle: string; profileSummary: string };
    createdAt: string;
  }> = [];
  let error = "";

  try {
    const db = getDb();
    const snapshot = await db
      .collection("completions")
      .orderBy("createdAt", "desc")
      .get();

    completions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as typeof completions;
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
    console.error("[admin] Firestore error:", error);
  }

  const total = completions.length;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-1">
            Tous les tests complétés
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-6 py-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-sm text-muted-foreground">tests complétés</p>
            </div>
          </Card>
          <AdminLogoutButton />
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            <p className="font-semibold">Erreur Firestore :</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Profil</TableHead>
                <TableHead>Lien</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun test complété pour le moment.
                  </TableCell>
                </TableRow>
              )}
              {completions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="font-medium">{c.petName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {c.petType === "dog" ? "Chien" : "Chat"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {c.profile?.profileTitle}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/results/${c.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Voir
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
