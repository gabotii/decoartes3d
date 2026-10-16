namespace Decoartes3D.Application.DTOs.Materials;

public record MaterialResponse(
    int Id,
    string Name,
    string? Description,
    string? ColorHex,
    bool IsActive,
    DateTime CreatedAt
);
