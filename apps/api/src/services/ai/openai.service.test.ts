const mockCreate = jest.fn();

// Mock OpenAI before importing the service
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  });
});

import { parseResume, scoreCandidate, generateScreeningSummary } from "./openai.service";

describe("OpenAI AI Pipeline Service", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  describe("parseResume", () => {
    it("should successfully parse a resume on first attempt", async () => {
      const mockResult = {
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1234567890",
        location: "San Francisco, CA",
        extractedSkills: [{ name: "React", years: 3 }],
        totalExperienceYears: 5,
        education: [{ institution: "Stanford University", degree: "MS", field: "CS", year: 2021 }],
        employmentHistory: [{ company: "Tech Corp", role: "Software Engineer", startDate: "2021-01", endDate: "2023-01", description: "Worked on React applications" }],
        seniorityInferred: "MID",
      };

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
        usage: { prompt_tokens: 100, completion_tokens: 150 },
      });

      const res = await parseResume("Mock Resume Text", "candidate-id-uuid");

      expect(res.fullName).toBe("Jane Doe");
      expect(res.seniorityInferred).toBe("MID");
      expect(res.inputTokens).toBe(100);
      expect(res.outputTokens).toBe(150);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("should self-correct and retry if validation fails initially", async () => {
      // First attempt returns invalid data (extractedSkills as a string, violating Zod array requirement)
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ extractedSkills: "not-an-array" }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 20 },
      });

      const mockSuccessResult = {
        fullName: "Jane Doe",
        email: "jane@doe.com",
        phone: null,
        location: null,
        extractedSkills: [],
        totalExperienceYears: 1,
        education: [],
        employmentHistory: [],
        seniorityInferred: "JUNIOR",
      };

      // Second attempt returns valid data
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockSuccessResult) } }],
        usage: { prompt_tokens: 120, completion_tokens: 50 },
      });

      const res = await parseResume("Mock Resume Text", "candidate-id-uuid");

      expect(res.fullName).toBe("Jane Doe");
      expect(res.email).toBe("jane@doe.com");
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("scoreCandidate", () => {
    it("should compute dynamic compatibility score and return structure", async () => {
      const mockResult = {
        score: 85,
        rationale: "Candidate meets all React and styling requirements.",
      };

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
      });

      const res = await scoreCandidate(
        { fullName: "Jane Doe", extractedSkills: [{ name: "React", years: 3 }], totalExperienceYears: 5, employmentHistory: [] },
        { title: "Frontend Engineer", description: "Looking for a React developer", skillRequirements: [{ name: "React", minYears: 2, required: true }], minExperienceYears: 3 },
        "application-id-uuid"
      );

      expect(res.score).toBe(85);
      expect(res.rationale).toContain("React");
    });
  });

  describe("generateScreeningSummary", () => {
    it("should generate narrative summary, strengths, gaps, focus areas", async () => {
      const mockResult = {
        summaryText: "Excellent Frontend engineer with extensive React experience.",
        strengths: ["Strong React background", "5 years experience"],
        gaps: ["No backend database experience"],
        interviewFocusAreas: ["Check system design knowledge"],
      };

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
        usage: { prompt_tokens: 200, completion_tokens: 100 },
      });

      const res = await generateScreeningSummary(
        { fullName: "Jane Doe", extractedSkills: [{ name: "React", years: 3 }], totalExperienceYears: 5 },
        { title: "Frontend Engineer", description: "Looking for a React developer", skillRequirements: [] },
        85,
        "Candidate meets all requirements.",
        "application-id-uuid"
      );

      expect(res.summary_text).toContain("Excellent");
      expect(res.strengths).toContain("Strong React background");
      expect(res.gaps).toContain("No backend database experience");
      expect(res.interview_focus_areas).toContain("Check system design knowledge");
    });
  });
});
