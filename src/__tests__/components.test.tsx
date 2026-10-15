import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Card";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";

describe("LinguaAbierta Components", () => {
  describe("Button", () => {
    it("renders with default variant", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
    });
    it("applies variant classes", () => {
      const { rerender } = render(<Button variant="success">Success</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-success");
      rerender(<Button variant="error">Error</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-error");
    });
    it("shows loading state", () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole("button", { name: /cargando/i })).toBeDisabled();
    });
  });

  describe("Card", () => {
    it("renders with default variant", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });
    it("renders compound components", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });
  });

  describe("Input", () => {
    it("renders with label", () => {
      render(<Input label="Email" type="email" placeholder="you@example.com" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
    it("shows error state", () => {
      render(<Input label="Password" type="password" error="Invalid password" />);
      expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
    });
  });

  describe("Toast", () => {
    it("renders with variant", () => {
      render(<Toast variant="success" title="Guardado" description="Cambios guardados" />);
      expect(screen.getByText(/guardado/i)).toBeInTheDocument();
    });
  });

  describe("Badge", () => {
    it("renders with variant", () => {
      render(<Badge variant="success" dot>En linea</Badge>);
      expect(screen.getByText(/en linea/i)).toBeInTheDocument();
    });
  });

  describe("Avatar", () => {
    it("renders with fallback", () => {
      render(<Avatar fallback="JB" status="online" size="lg" />);
      expect(screen.getByText(/jb/i)).toBeInTheDocument();
    });
  });
});