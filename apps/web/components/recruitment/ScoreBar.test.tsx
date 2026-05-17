import React from "react";
import { render, screen } from "@testing-library/react";
import ScoreBar from "./ScoreBar";

// Mock the progress bar component to isolate the test from Radix UI DOM operations
jest.mock("@/components/ui/progress", () => {
  return {
    Progress: ({ value, className }: any) => (
      <div data-testid="progress" data-value={value} className={className} />
    ),
  };
});

describe("ScoreBar Component", () => {
  it("renders a strong compatibility score in green (>= 75)", () => {
    render(<ScoreBar value={85} />);
    const scoreText = screen.getByText("85");
    expect(scoreText).toBeInTheDocument();
    expect(scoreText.className).toContain("text-green-600");

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-value", "85");
  });

  it("renders a partial compatibility score in amber (>= 50 and < 75)", () => {
    render(<ScoreBar value={60} />);
    const scoreText = screen.getByText("60");
    expect(scoreText).toBeInTheDocument();
    expect(scoreText.className).toContain("text-amber-600");

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-value", "60");
  });

  it("renders a poor compatibility score in red (< 50)", () => {
    render(<ScoreBar value={35} />);
    const scoreText = screen.getByText("35");
    expect(scoreText).toBeInTheDocument();
    expect(scoreText.className).toContain("text-red-600");

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-value", "35");
  });
});
