import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <h1 className="text-4xl font-bold text-muted-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-6">Página não encontrada</p>
          <Button onClick={() => navigate("/")}>
            Voltar para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
