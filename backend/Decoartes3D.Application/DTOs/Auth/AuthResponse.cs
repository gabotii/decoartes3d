namespace Decoartes3D.Application.DTOs.Auth;

public record AuthResponse(
    int UserId,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string Token,
    DateTime ExpiresAt
);
