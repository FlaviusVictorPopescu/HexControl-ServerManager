import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@hexbit.ro");
  const [password, setPassword] = useState("hexbit2025");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      nav("/");
    } catch (err: any) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/30 text-primary font-bold">H</div>
          <h1 className="mt-3 text-xl font-bold">Sign in to HexControl</h1>
          <p className="text-sm text-muted-foreground">Use your admin credentials</p>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </div>
      </form>
    </div>
  );
}
