import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authenticate, AuthRequest } from "./authenticate";

describe("Authentication Middleware", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "supersecret_key_which_is_more_than_32_characters_long";
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("should return 401 when Authorization header is missing", () => {
    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing authorization token",
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid or tampered", () => {
    mockRequest.headers = {
      authorization: "Bearer invalid_token_value",
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token",
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should return 401 when token is expired", () => {
    const expiredToken = jwt.sign(
      { sub: "1", email: "test@example.com", role: "RECRUITER" },
      process.env.JWT_SECRET!,
      { expiresIn: "-1s" }
    );
    mockRequest.headers = {
      authorization: `Bearer ${expiredToken}`,
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Invalid or expired token",
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should add user payload to req.user and call next() on valid token", () => {
    const payload = { sub: "user-id-uuid", email: "test@example.com", role: "RECRUITER" };
    const validToken = jwt.sign(payload, process.env.JWT_SECRET!);
    mockRequest.headers = {
      authorization: `Bearer ${validToken}`,
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.sub).toBe(payload.sub);
    expect(mockRequest.user?.email).toBe(payload.email);
    expect(mockRequest.user?.role).toBe(payload.role);
    expect(nextFunction).toHaveBeenCalled();
  });
});
