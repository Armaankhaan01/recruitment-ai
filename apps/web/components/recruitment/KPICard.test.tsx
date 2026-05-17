import React from "react";
import { render, screen } from "@testing-library/react";
import KPICard from "./KPICard";

// Mock the shadcn/ui Card primitives to keep tests simple and performant
jest.mock("@/components/ui/card", () => {
  return {
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
    CardTitle: ({ children, className }: any) => <h3 data-testid="card-title" className={className}>{children}</h3>,
    CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  };
});

describe("KPICard Component", () => {
  it("renders basic title and value information", () => {
    render(<KPICard title="Total Requisitions" value={12} />);

    expect(screen.getByTestId("card-title")).toHaveTextContent("Total Requisitions");
    expect(screen.getByTestId("card-content")).toHaveTextContent("12");
  });

  it("displays custom descriptions when provided", () => {
    render(<KPICard title="Time-to-Fill" value="18 days" description="Average across all closed jobs" />);

    expect(screen.getByText("Average across all closed jobs")).toBeInTheDocument();
  });

  it("applies correct green color overlay for positive UP trends", () => {
    render(<KPICard title="Applications" value={345} trend="up" />);

    const trendText = screen.getByText("↑");
    expect(trendText).toBeInTheDocument();
    expect(trendText.className).toContain("text-green-600");
  });

  it("applies correct red color overlay for negative DOWN trends", () => {
    render(<KPICard title="Interview Dropouts" value={14} trend="down" />);

    const trendText = screen.getByText("↓");
    expect(trendText).toBeInTheDocument();
    expect(trendText.className).toContain("text-red-600");
  });

  it("applies muted color overlay for NEUTRAL trends", () => {
    render(<KPICard title="Offer Acceptance" value="88%" trend="neutral" />);

    const trendText = screen.getByText("→");
    expect(trendText).toBeInTheDocument();
    expect(trendText.className).toContain("text-muted-foreground");
  });
});
