import React from "react";
import { render, screen } from "@testing-library/react";
import JobStatusBadge from "./JobStatusBadge";

// Mock the shadcn/ui badge component to avoid Radix UI package conflicts in tests
jest.mock("@/components/ui/badge", () => {
  return {
    Badge: ({ children, className }: any) => <span className={className} data-testid="badge">{children}</span>,
  };
});

describe("JobStatusBadge Component", () => {
  it("renders the correct status label for OPEN status", () => {
    render(<JobStatusBadge status="OPEN" />);
    const element = screen.getByTestId("badge");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("OPEN");
    expect(element.className).toContain("text-green-700");
  });

  it("renders the correct status label for ON_HOLD status", () => {
    render(<JobStatusBadge status="ON_HOLD" />);
    const element = screen.getByTestId("badge");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("ON_HOLD");
    expect(element.className).toContain("text-amber-700");
  });

  it("falls back to DRAFT styling for unknown status values", () => {
    render(<JobStatusBadge status="UNKNOWN_STATUS" />);
    const element = screen.getByTestId("badge");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("UNKNOWN_STATUS");
    expect(element.className).toContain("text-muted-foreground");
  });
});
